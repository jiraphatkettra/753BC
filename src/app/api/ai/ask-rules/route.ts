import { NextRequest, NextResponse } from "next/server";
import { FULL_RULES_TEXT } from "@/config/rules";

// รวบรวม Gemini API Keys ทั้งหมดที่มีใน Environment สำหรับทำ Auto-Failover
function getGeminiApiKeys(): string[] {
  const keys: string[] = [];

  // 1. ตรวจสอบ GEMINI_API_KEYS (รองรับคั่นด้วยจุลภาค เช่น "key1,key2,key3,key4")
  if (process.env.GEMINI_API_KEYS) {
    const list = process.env.GEMINI_API_KEYS.split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 0);
    keys.push(...list);
  }

  // 2. ตรวจสอบตัวแปรแยกรายตัว GEMINI_API_KEY_1 ถึง GEMINI_API_KEY_4
  const numberedKeys = [
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4,
    process.env.GEMINI_API_KEY,
  ];

  for (const k of numberedKeys) {
    if (k && k.trim().length > 0 && !keys.includes(k.trim())) {
      keys.push(k.trim());
    }
  }

  return keys;
}

const SYSTEM_INSTRUCTION = `คุณคือ AI ผู้ช่วยตรวจสอบกฎระเบียบประจำเซิร์ฟเวอร์ 753BC Discord

เป้าหมายการสื่อสาร (สำคัญมาก: สรุปเข้าใจง่าย สไตล์มนุษย์คุยกัน ไม่วกไปวนมา ไม่เขียนเหมือนแบบฟอร์มราชการ):
1. ตอบแบบเป็นธรรมชาติ สุภาพ กระชับ อ่านเข้าใจได้ทันทีภายใน 5 วินาที
2. สรุปใจความสำคัญทันทีในประโยคแรก (Bottom-line Upfront):
   - ถ้าไม่ผิดกฎ หรือไม่มีกฎห้าม: ตอบตรงๆ ชัดเจน เช่น "ไม่ผิดกฎครับ เซิร์ฟเวอร์ 753BC ไม่มีกฎข้อไหนห้ามเรื่องนี้โดยเฉพาะ..."
   - ถ้าผิดกฎ: ฟันธงสั้นๆ ชัดเจน เช่น "ผิดกฎครับ เข้าข่าย [ชื่อข้อ/เลขข้อ]..."
3. ตามด้วยข้อย่อยสั้นๆ 1-3 บรรทัด (เฉพาะเรื่องสำคัญที่ควรรู้ เช่น ข้อควรระวัง กฎข้ออื่นที่ต้องระวัง หรือบทลงโทษถ้าผิดจริง):
   - ใช้ bullet "•" สั้นกระชับ
4. กฎเหล็ก:
   - ยึดตามกฎจริงของ 753BC เท่านั้น ห้ามมโนหรือแต่งกฎขึ้นมาเองเด็ดขาด ถ้าไม่มีกฎห้ามก็ต้องบอกว่าไม่มีกฎ
   - ห้ามใช้อิโมจิเด็ดขาด (NO EMOJIS)
   - ห้ามพูดคำเดิมซ้ำๆ วนไปวนมา และไม่ต้องใส่หัวข้อจำพวก [ผลการวินิจฉัย] [ข้อกฎที่เกี่ยวข้อง] [บทลงโทษ] แบบราชการ ให้สรุปเนื้อๆ เน้นๆ

${FULL_RULES_TEXT}
`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, history } = body;

    if (!question || typeof question !== "string" || question.trim().length === 0) {
      return NextResponse.json(
        { error: "กรุณาระบุคำถามหรือสถานการณ์ที่ต้องการตรวจสอบ" },
        { status: 400 }
      );
    }

    const apiKeys = getGeminiApiKeys();

    if (apiKeys.length === 0) {
      return NextResponse.json(
        {
          error:
            "ยังไม่ได้กำหนด GEMINI_API_KEYS ในไฟล์ .env กรุณาเพิ่ม Gemini API Token อย่างน้อย 1-4 ตัว",
          fallbackText:
            "[ระบบแจ้งเตือน]: ยังไม่ได้ตั้งค่า GEMINI_API_KEYS ในระบบ กรุณาใส่ API Key ในไฟล์ .env เพื่อเปิดใช้งานระบบวิเคราะห์กฎอัตโนมัติ",
        },
        { status: 503 }
      );
    }

    // เตรียม Messages สำหรับ Gemini API
    const contents: any[] = [];

    if (Array.isArray(history)) {
      for (const h of history) {
        if (h.role === "user" || h.role === "model") {
          contents.push({
            role: h.role,
            parts: [{ text: h.text }],
          });
        }
      }
    }

    // เพิ่มคำถามปัจจุบัน
    contents.push({
      role: "user",
      parts: [{ text: question.trim() }],
    });

    const payload = {
      system_instruction: {
        parts: [{ text: SYSTEM_INSTRUCTION }],
      },
      contents: contents,
      generationConfig: {
        temperature: 0.2, // ให้ภาษาเป็นธรรมชาติ ลื่นไหล ไม่ประดิษฐ์คำเกินไป
        topP: 0.8,
        maxOutputTokens: 1500,
      },
    };

    let lastError = "";
    let successfulKeyIndex = -1;

    // ระบบ Multi-Key & Multi-Model Auto Failover:
    // ใช้โมเดล gemini-3.5-flash และ gemini-3.5-flash-lite ซึ่งมีโควตาพร้อมใช้งานและตอบได้รวดเร็ว
    const modelsToTry = [
      "gemini-3.5-flash",
      "gemini-3.5-flash-lite",
      "gemini-3.8-flash",
    ];

    for (let i = 0; i < apiKeys.length; i++) {
      const currentKey = apiKeys[i];
      for (const modelName of modelsToTry) {
        try {
          const modelEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${currentKey}`;

          const res = await fetch(modelEndpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });

          if (res.ok) {
            const data = await res.json();
            const candidate = data.candidates?.[0];
            const text = candidate?.content?.parts?.[0]?.text;

            if (text) {
              successfulKeyIndex = i + 1;
              return NextResponse.json({
                answer: text,
                keyUsedIndex: successfulKeyIndex,
                totalKeys: apiKeys.length,
                modelUsed: modelName,
              });
            }
          }

          const errorData = await res.json().catch(() => ({}));
          lastError = `Token #${i + 1} (${modelName} - ${res.status}): ${
            errorData?.error?.message || res.statusText
          }`;

          console.warn(`[Gemini Failover]: ${lastError}`);
        } catch (err: any) {
          lastError = `Token #${i + 1} (${modelName}) network error: ${err.message}`;
          console.warn(`[Gemini Network Error]: ${lastError}`);
        }
      }
    }

    // หาก Token ทุกตัวถูกใช้จนหมดโควต้าแล้ว
    return NextResponse.json(
      {
        error: `ระบบได้พยายามเชื่อมต่อ Gemini API ครบทั้ง ${apiKeys.length} Token แล้ว แต่ทุก Token โควต้าเต็มหรือเกิดข้อผิดพลาด (${lastError})`,
        fallbackText:
          "ขออภัยครับ ขณะนี้ Token ของ Gemini API ทั้งหมดในระบบถูกใช้งานจนเต็มโควต้าชั่วคราว กรุณาลองใหม่อีกครั้งในภายหลัง หรือตรวจสอบข้อความกฎด้านล่างด้วยตนเอง",
      },
      { status: 429 }
    );
  } catch (error: any) {
    console.error("API /api/ai/ask-rules error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ: " + (error?.message || "Unknown error") },
      { status: 500 }
    );
  }
}
