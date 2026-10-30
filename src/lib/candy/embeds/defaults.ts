import { EmbedTemplatePayload } from "./schema";
import { CANDY_THEME } from "../constants";

export const DEFAULT_THEME = {
  color: CANDY_THEME.DEFAULT_COLOR,
  decoLine: CANDY_THEME.DECO_LINE,
  divider: CANDY_THEME.DIVIDER_LINE,
};

export function buildThemedPage(params: {
  title?: string;
  h1: string;
  chip?: string;
  h3?: string;
  diffLines?: string[];
  extraLines?: string[];
  footerText?: string;
  color?: string;
  fields?: { name: string; value: string; inline: boolean }[];
}) {
  const lines: string[] = [];
  lines.push(`# ${params.h1}`);
  if (params.chip) {
    lines.push(`\`${params.chip}\``);
  }
  lines.push("");

  if (params.h3) {
    lines.push(`### ${params.h3}`);
  }

  if (params.diffLines && params.diffLines.length > 0) {
    lines.push("```diff");
    for (const d of params.diffLines) {
      lines.push(d);
    }
    lines.push("```");
  }

  if (params.extraLines && params.extraLines.length > 0) {
    for (const el of params.extraLines) {
      lines.push(el);
    }
  }

  lines.push("");
  lines.push(DEFAULT_THEME.decoLine);
  lines.push(DEFAULT_THEME.divider);

  return {
    color: params.color || DEFAULT_THEME.color,
    title: params.title,
    description: lines.join("\n"),
    fields: params.fields || [],
    footer: params.footerText ? { text: params.footerText } : undefined,
  };
}

export const DEFAULT_EMBED_TEMPLATES: Record<string, EmbedTemplatePayload> = {
  candy_drop: {
    pages: [
      buildThemedPage({
        title: "🎃 ลูกอมหล่นแล้ว! — Trick or Treat",
        h1: "🍬 ลูกอม {amount} ลูก",
        chip: "ต้องอยู่ในห้องพูดคุยเสียงเท่านั้นถึงจะเก็บได้",
        h3: "เงื่อนไขและวิธีรับ:",
        diffLines: [
          "+ ต้องกำลังอยู่ในห้องพูดคุยเสียง (Voice Channel)",
          "+ กดปุ่ม 'เก็บลูกอม' ด้านล่างให้ไวที่สุด",
          "- ไม่อยู่ในห้องเสียง = ระบบจะปฏิเสธการเก็บทันที",
          "+ 1 ลูกอม มีมูลค่าเท่ากับเงินจริง 1 บาท",
        ],
        extraLines: ["หมดเวลาเก็บ: {expiresR} • สุ่มดรอปในห้อง #{channel}"],
        footerText: "สิทธิ์การเก็บ {claimedCount}/{maxClaimers} คน • #{dropShortId}",
      }),
    ],
    pager: { enabled: false, prevLabel: "◀ ย้อนกลับ", nextLabel: "ถัดไป ▶", prevStyle: "secondary", nextStyle: "primary", disableAtEdges: true },
    buttons: [
      [
        { id: "claim", label: "เก็บลูกอม", emoji: "🍬", style: "success", action: "claim" },
      ],
    ],
    allowedMentions: "NONE",
  },

  candy_drop_claimed: {
    pages: [
      buildThemedPage({
        title: "🎃 เก็บลูกอมเรียบร้อยแล้ว! — Trick or Treat",
        h1: "🍬 ลูกอม {amount} ลูก ถูกเก็บแล้ว",
        chip: "มีผู้เล่นได้รับลูกอมรอบนี้ครบถ้วนแล้ว",
        h3: "ผลการเก็บลูกอม:",
        diffLines: [
          "+ ยินดีด้วยกับผู้ที่เก็บได้ทันเวลา!",
          "+ ยอดลูกอมถูกบันทึกลงกระเป๋าเรียบร้อย",
        ],
        extraLines: ["ผู้ได้รับลูกอม: {winners}"],
        footerText: "ดรอปเสร็จสมบูรณ์ • #{dropShortId}",
      }),
    ],
    pager: { enabled: false, prevLabel: "◀ ย้อนกลับ", nextLabel: "ถัดไป ▶", prevStyle: "secondary", nextStyle: "primary", disableAtEdges: true },
    buttons: [
      [
        { id: "claim_done", label: "ถูกเก็บไปแล้ว", emoji: "✨", style: "secondary", action: "none", disabled: true },
      ],
    ],
    allowedMentions: "NONE",
  },

  candy_drop_expired: {
    pages: [
      buildThemedPage({
        title: "🎃 ลูกอมละลายไปแล้ว... — หมดเวลา",
        h1: "🍬 ดรอปนี้หมดเวลาแล้ว",
        chip: "ไม่มีใครมาเก็บลูกอมภายในเวลาที่กำหนด",
        h3: "สถานะ:",
        diffLines: [
          "- หมดเวลาเก็บตามที่กำหนดแล้ว",
          "+ ยอดงบประมาณถูกนำกลับเข้ากองกลางสำหรับดรอปรอบถัดไป",
        ],
        extraLines: ["เก็บได้ทัน: {claimedCount}/{maxClaimers} คน"],
        footerText: "ดรอปหมดอายุ • #{dropShortId}",
      }),
    ],
    pager: { enabled: false, prevLabel: "◀ ย้อนกลับ", nextLabel: "ถัดไป ▶", prevStyle: "secondary", nextStyle: "primary", disableAtEdges: true },
    buttons: [
      [
        { id: "claim_exp", label: "หมดเวลา", emoji: "⌛", style: "secondary", action: "none", disabled: true },
      ],
    ],
    allowedMentions: "NONE",
  },

  candy_claim_success: {
    ephemeral: true,
    pages: [
      buildThemedPage({
        title: "🎃 ยินดีด้วย! คุณได้รับลูกอมแล้ว",
        h1: "+{amount} 🍬 ลูกอมเข้ากระเป๋า",
        chip: "ตรวจสอบเงื่อนไขห้องเสียงผ่านเรียบร้อย",
        h3: "สรุปยอดของคุณ:",
        diffLines: [
          "+ ยอดลูกอมปัจจุบัน: {balance} ลูก",
          "+ มูลค่าเงินสด: ฿{baht} บาท (อัตรา 1:1)",
          "+ ยืนยันจากห้องเสียง: #{voiceChannel}",
        ],
        extraLines: ["สามารถสะสมเพื่อแลกเงินจริงเมื่อถึงเวลาเปิดแลก"],
        footerText: "753BC Trick or Treat Event • บันทึกลง Ledger สำเร็จ",
      }),
    ],
    pager: { enabled: false, prevLabel: "◀ ย้อนกลับ", nextLabel: "ถัดไป ▶", prevStyle: "secondary", nextStyle: "primary", disableAtEdges: true },
    buttons: [
      [
        { id: "check_balance", label: "เช็คกระเป๋า", emoji: "👛", style: "primary", action: "balance" },
        { id: "check_lb", label: "ดูอันดับ", emoji: "🏆", style: "secondary", action: "leaderboard" },
      ],
    ],
    allowedMentions: "USER_ONLY",
  },

  candy_err_not_in_voice: {
    ephemeral: true,
    pages: [
      buildThemedPage({
        title: "❌ เก็บลูกอมไม่ได้ — ไม่อยู่ในห้องเสียง",
        h1: "คุณยังไม่ได้เข้าห้องพูดคุยเสียง",
        chip: "กติกา: ต้องอยู่ในห้องเสียงเท่านั้นถึงจะเก็บได้",
        h3: "สิ่งที่ต้องทำ:",
        diffLines: [
          "- คุณไม่ได้เชื่อมต่อ Voice Channel ใด ๆ ในเซิร์ฟเวอร์",
          "+ ให้เชื่อมต่อเข้าห้องพูดคุยเสียงก่อน",
          "+ แล้วกดเก็บลูกอมใหม่อีกครั้งถ้ายังไม่หมดเวลา",
        ],
        extraLines: ["ห้องเสียงทุกห้องที่เปิดพูดคุยสามารถใช้รับสิทธิ์ได้"],
        footerText: "ไม่เสียสิทธิ์หรือลูกอมใด ๆ จากการกดผิด",
      }),
    ],
    pager: { enabled: false, prevLabel: "◀ ย้อนกลับ", nextLabel: "ถัดไป ▶", prevStyle: "secondary", nextStyle: "primary", disableAtEdges: true },
    buttons: [],
    allowedMentions: "USER_ONLY",
  },

  candy_err_voice_afk: {
    ephemeral: true,
    pages: [
      buildThemedPage({
        title: "❌ เก็บลูกอมไม่ได้ — อยู่ในห้อง AFK",
        h1: "ห้อง AFK ไม่อนุญาตให้รับลูกอม",
        chip: "ต้องอยู่ในห้องพูดคุยเสียงทั่วไปเท่านั้น",
        h3: "เงื่อนไข:",
        diffLines: [
          "- ห้อง AFK ถูกยกเว้นจากกิจกรรมเพื่อความยุติธรรม",
          "+ กรุณาย้ายไปยังห้องพูดคุยเสียงปกติ",
        ],
        footerText: "753BC Fair Play Protection",
      }),
    ],
    pager: { enabled: false, prevLabel: "◀ ย้อนกลับ", nextLabel: "ถัดไป ▶", prevStyle: "secondary", nextStyle: "primary", disableAtEdges: true },
    buttons: [],
    allowedMentions: "USER_ONLY",
  },

  candy_err_voice_not_allowed: {
    ephemeral: true,
    pages: [
      buildThemedPage({
        title: "❌ เก็บลูกอมไม่ได้ — ห้องเสียงนี้ไม่เข้าร่วม",
        h1: "ห้องเสียงไม่อยู่ในรายการที่อนุญาต",
        chip: "กรุณาย้ายไปยังห้องเสียงหลักของเซิร์ฟเวอร์",
        h3: "คำแนะนำ:",
        diffLines: [
          "- ห้องเสียงปัจจุบันไม่ได้เปิดรับกิจกรรม",
          "+ ย้ายไปห้องเสียงส่วนกลางที่เปิดรับ",
        ],
      }),
    ],
    pager: { enabled: false, prevLabel: "◀ ย้อนกลับ", nextLabel: "ถัดไป ▶", prevStyle: "secondary", nextStyle: "primary", disableAtEdges: true },
    buttons: [],
    allowedMentions: "USER_ONLY",
  },

  candy_err_voice_deafened: {
    ephemeral: true,
    pages: [
      buildThemedPage({
        title: "❌ เก็บลูกอมไม่ได้ — ปิดหูฟัง (Deafened)",
        h1: "ตรวจพบการปิดเสียงหูฟัง",
        chip: "กติกา: ต้องเปิดรับฟังเสียงในห้องขณะร่วมกิจกรรม",
        h3: "สิ่งที่ต้องแก้ไข:",
        diffLines: [
          "- มีการปิดเสียงหูฟัง (Server Deaf หรือ Self Deaf)",
          "+ กรุณาเปิดเสียงหูฟังเพื่อร่วมกิจกรรม",
        ],
      }),
    ],
    pager: { enabled: false, prevLabel: "◀ ย้อนกลับ", nextLabel: "ถัดไป ▶", prevStyle: "secondary", nextStyle: "primary", disableAtEdges: true },
    buttons: [],
    allowedMentions: "USER_ONLY",
  },

  candy_err_voice_too_short: {
    ephemeral: true,
    pages: [
      buildThemedPage({
        title: "❌ เก็บลูกอมไม่ได้ — เพิ่งเข้าห้องเสียง",
        h1: "ต้องอยู่ในห้องเสียงอย่างน้อย {minVoiceSeconds} วินาที",
        chip: "ระบบป้องกันการกระโดดเข้าห้องแล้วกดทันที",
        h3: "ระยะเวลารอ:",
        diffLines: [
          "- คุณเพิ่งเชื่อมต่อห้องเสียงเข้ามา",
          "+ รออีกประมาณ {remainingVoiceSec} วินาทีแล้วกดใหม่",
        ],
      }),
    ],
    pager: { enabled: false, prevLabel: "◀ ย้อนกลับ", nextLabel: "ถัดไป ▶", prevStyle: "secondary", nextStyle: "primary", disableAtEdges: true },
    buttons: [],
    allowedMentions: "USER_ONLY",
  },

  candy_err_too_late: {
    ephemeral: true,
    pages: [
      buildThemedPage({
        title: "❌ ช้าไปนิดเดียว!",
        h1: "มีผู้เล่นเก็บไปก่อนแล้ว",
        chip: "ลูกอมดรอปนี้มีผู้เก็บครบตามโควตาแล้ว",
        h3: "อย่าเพิ่งยอมแพ้:",
        diffLines: [
          "- สิทธิ์ในดรอปนี้เต็มแล้ว",
          "+ รอสุ่มดรอปครั้งถัดไปในห้องข้อความ",
        ],
        footerText: "อยู่ในห้องเสียงรอได้เลย ดรอปมีต่อเนื่องตลอดกิจกรรม",
      }),
    ],
    pager: { enabled: false, prevLabel: "◀ ย้อนกลับ", nextLabel: "ถัดไป ▶", prevStyle: "secondary", nextStyle: "primary", disableAtEdges: true },
    buttons: [],
    allowedMentions: "USER_ONLY",
  },

  candy_err_already_claimed: {
    ephemeral: true,
    pages: [
      buildThemedPage({
        title: "❌ คุณเก็บดรอปนี้ไปแล้ว",
        h1: "ได้รับลูกอมรอบนี้ไปแล้วนะ",
        chip: "ผู้เล่น 1 คนสามารถเก็บได้ 1 ครั้งต่อ 1 ดรอป",
        h3: "ข้อแนะนำ:",
        diffLines: [
          "- ไม่สามารถเก็บดรอปเดียวกันซ้ำได้",
          "+ แบ่งปันให้เพื่อนคนอื่นบ้างนะ!",
        ],
      }),
    ],
    pager: { enabled: false, prevLabel: "◀ ย้อนกลับ", nextLabel: "ถัดไป ▶", prevStyle: "secondary", nextStyle: "primary", disableAtEdges: true },
    buttons: [],
    allowedMentions: "USER_ONLY",
  },

  candy_err_blocked: {
    ephemeral: true,
    pages: [
      buildThemedPage({
        title: "🚫 ระงับสิทธิ์การร่วมกิจกรรม",
        h1: "บัญชีของคุณถูกระงับสิทธิ์",
        chip: "หากมีข้อสงสัยโปรดติดต่อทีมงานผ่าน Ticket",
        h3: "รายละเอียด:",
        diffLines: [
          "- ตรวจพบพฤติกรรมผิดปกติ หรือคำสั่งจากผู้ดูแล",
          "- ไม่สามารถเก็บหรือขอแลกรางวัลได้ในขณะนี้",
        ],
      }),
    ],
    pager: { enabled: false, prevLabel: "◀ ย้อนกลับ", nextLabel: "ถัดไป ▶", prevStyle: "secondary", nextStyle: "primary", disableAtEdges: true },
    buttons: [],
    allowedMentions: "USER_ONLY",
  },

  candy_err_event_not_running: {
    ephemeral: true,
    pages: [
      buildThemedPage({
        title: "⚠️ กิจกรรมยังไม่เปิดให้เล่น",
        h1: "กิจกรรมยังไม่เริ่ม หรือหยุดชั่วคราว",
        chip: "ติดตามประกาศช่วงเวลาเริ่มกิจกรรมได้ในห้องประกาศ",
        h3: "ช่วงเวลากิจกรรม:",
        diffLines: [
          "+ 30 ต.ค. 23:30 - 31 ต.ค. 00:30 น.",
          "- ไม่อยู่ในช่วงเวลาที่เปิดดรอป",
        ],
      }),
    ],
    pager: { enabled: false, prevLabel: "◀ ย้อนกลับ", nextLabel: "ถัดไป ▶", prevStyle: "secondary", nextStyle: "primary", disableAtEdges: true },
    buttons: [],
    allowedMentions: "USER_ONLY",
  },

  candy_err_cap_reached: {
    ephemeral: true,
    pages: [
      buildThemedPage({
        title: "🏆 ถึงเพดานลูกอมสูงสุดแล้ว",
        h1: "คุณเก็บครบเพดาน {cap} ลูกแล้ว!",
        chip: "ยอดสะสมของคุณถึงขีดจำกัดสูงสุดของกิจกรรมแล้ว",
        h3: "สถานะ:",
        diffLines: [
          "+ คุณเก็บได้ถึงเพดานสูงสุดแล้ว ยอดเยี่ยมมาก!",
          "- ไม่สามารถรับลูกอมเพิ่มได้อีก เพื่อกระจายรางวัลให้ผู้เล่นท่านอื่น",
        ],
      }),
    ],
    pager: { enabled: false, prevLabel: "◀ ย้อนกลับ", nextLabel: "ถัดไป ▶", prevStyle: "secondary", nextStyle: "primary", disableAtEdges: true },
    buttons: [
      [{ id: "cap_bal", label: "ดูยอดคงเหลือ", emoji: "👛", style: "primary", action: "balance" }],
    ],
    allowedMentions: "USER_ONLY",
  },

  candy_err_cooldown: {
    ephemeral: true,
    pages: [
      buildThemedPage({
        title: "⏳ รอสักครู่ (Cooldown)",
        h1: "กดถี่เกินไป กรุณารอสักครู่",
        chip: "ระบบชะลอการกดซ้ำเพื่อความเสถียร",
        h3: "ระยะเวลา:",
        diffLines: ["- รอประมาณ {cooldownSec} วินาทีแล้วลองใหม่อีกครั้ง"],
      }),
    ],
    pager: { enabled: false, prevLabel: "◀ ย้อนกลับ", nextLabel: "ถัดไป ▶", prevStyle: "secondary", nextStyle: "primary", disableAtEdges: true },
    buttons: [],
    allowedMentions: "USER_ONLY",
  },

  candy_err_generic: {
    ephemeral: true,
    pages: [
      buildThemedPage({
        title: "⚠️ เกิดข้อผิดพลาด",
        h1: "ไม่สามารถดำเนินการได้",
        chip: "ระบบบันทึกข้อผิดพลาดไว้เรียบร้อยแล้ว",
        h3: "สาเหตุ:",
        diffLines: ["- {error}"],
      }),
    ],
    pager: { enabled: false, prevLabel: "◀ ย้อนกลับ", nextLabel: "ถัดไป ▶", prevStyle: "secondary", nextStyle: "primary", disableAtEdges: true },
    buttons: [],
    allowedMentions: "USER_ONLY",
  },

  candy_balance: {
    ephemeral: true,
    pages: [
      buildThemedPage({
        title: "🍬 กระเป๋าลูกอมของคุณ — Trick or Treat",
        h1: "ยอดคงเหลือ: {balance} ลูกอม",
        chip: "มูลค่า ฿{baht} บาท (อัตรา 1:1)",
        h3: "สถิติการเล่น:",
        diffLines: [
          "+ สะสมได้ทั้งหมด: {totalEarned} ลูก",
          "+ จำนวนครั้งที่เก็บได้: {claimCount} ครั้ง",
          "+ อันดับของคุณในเซิร์ฟ: #{rank}",
          "+ สถานะการแลกเงิน: {redeemStatus}",
        ],
        extraLines: ["ลูกอมทุกเม็ดสามารถแลกเปลี่ยนเป็นเงินจริงตามประกาศ"],
        footerText: "753BC Wallet Telemetry • 1 Candy = 1 THB",
      }),
    ],
    pager: { enabled: false, prevLabel: "◀ ย้อนกลับ", nextLabel: "ถัดไป ▶", prevStyle: "secondary", nextStyle: "primary", disableAtEdges: true },
    buttons: [
      [
        { id: "b_lb", label: "ดูอันดับทั้งหมด", emoji: "🏆", style: "secondary", action: "leaderboard" },
        { id: "b_hist", label: "ดูประวัติ", emoji: "📜", style: "secondary", action: "history" },
        { id: "b_rdm", label: "ขอแลกเงิน", emoji: "💸", style: "success", action: "redeem" },
      ],
    ],
    allowedMentions: "USER_ONLY",
  },

  candy_leaderboard: {
    pages: [
      buildThemedPage({
        title: "🏆 กระดานผู้นำยอดเก็บลูกอม — Top 10",
        h1: "Top 10 Candy Hunters",
        chip: "อัปเดตแบบเรียลไทม์จากระบบกิจกรรม",
        h3: "อันดับผู้ล่าสูงสุด:",
        extraLines: [
          "```",
          "{rows}",
          "```",
          "อันดับของคุณ: **#{rank}**",
        ],
        footerText: "753BC Trick or Treat Leaderboard",
      }),
    ],
    pager: { enabled: false, prevLabel: "◀ ย้อนกลับ", nextLabel: "ถัดไป ▶", prevStyle: "secondary", nextStyle: "primary", disableAtEdges: true },
    buttons: [
      [
        { id: "lb_bal", label: "ดูกระเป๋าฉัน", emoji: "🍬", style: "primary", action: "balance" },
        { id: "lb_rules", label: "อ่านกติกา", emoji: "📖", style: "secondary", action: "rules" },
      ],
    ],
    allowedMentions: "NONE",
  },

  candy_history: {
    ephemeral: true,
    pages: [
      buildThemedPage({
        title: "📜 ประวัติการรับและแลกลูกอม",
        h1: "ประวัติรายการล่าสุด",
        chip: "ตรวจสอบความโปร่งใสผ่านระบบ Ledger",
        h3: "10 รายการล่าสุด:",
        extraLines: [
          "```",
          "{rows}",
          "```",
        ],
        footerText: "ข้อมูลบัญชีแยกประเภทแบบตรวจสอบได้",
      }),
    ],
    pager: { enabled: false, prevLabel: "◀ ย้อนกลับ", nextLabel: "ถัดไป ▶", prevStyle: "secondary", nextStyle: "primary", disableAtEdges: true },
    buttons: [],
    allowedMentions: "USER_ONLY",
  },

  candy_rules: {
    pages: [
      // หน้า 1: ภาพรวม
      buildThemedPage({
        title: "กติกา 1/5 — ภาพรวมกิจกรรม Trick or Treat",
        h1: "ภาพรวมกิจกรรม Trick or Treat",
        chip: "เปลี่ยนลูกอมให้เป็นเงินจริง 1 ลูกอม = 1 บาท",
        h3: "สาระสำคัญ:",
        diffLines: [
          "+ กิจกรรมรันผ่านระบบบอทเฉพาะของเซิร์ฟเวอร์ 753BC",
          "+ ลูกอมจะสุ่มดรอปตามห้องข้อความที่กำหนดอย่างต่อเนื่อง",
          "+ อัตราแลกเปลี่ยน: 1 ลูกอม = เงินจริง 1 บาท",
          "+ กิจกรรมมีระยะเวลา 1 ชั่วโมงเต็ม (30 ต.ค. 23:30 - 31 ต.ค. 00:30)",
        ],
        footerText: "หน้า 1/5 • ภาพรวมกิจกรรมและเวลา",
      }),
      // หน้า 2: วิธีรับลูกอม
      buildThemedPage({
        title: "กติกา 2/5 — วิธีการรับลูกอม",
        h1: "วิธีการรับลูกอมจากห้องข้อความ",
        chip: "ระบบสุ่มดรอปแบบเรียลไทม์",
        h3: "ขั้นตอนการเก็บ:",
        diffLines: [
          "+ สังเกตห้องข้อความที่มีกิจกรรมดรอปสุ่มขึ้นมา",
          "+ หน้าต่างดรอปจะมีปุ่ม 'เก็บลูกอม' สีเขียวปรากฏขึ้น",
          "+ กดปุ่มให้ไวที่สุดก่อนลูกอมจะหมดเวลาหรือมีคนแย่งไป",
          "- ดรอปแต่ละครั้งมีอายุ 45 วินาที หากไม่มีใครเก็บจะละลายหายไป",
        ],
        footerText: "หน้า 2/5 • วิธีการกดรับลูกอม",
      }),
      // หน้า 3: เงื่อนไขห้องเสียง (สำคัญสุด)
      buildThemedPage({
        title: "กติกา 3/5 — เงื่อนไขห้องพูดคุยเสียง (สำคัญ)",
        h1: "ต้องอยู่ในห้องพูดคุยเสียงเท่านั้น!",
        chip: "เงื่อนไขหลักที่บอทใช้ตรวจสอบอัตโนมัติ",
        h3: "ข้อกำหนดเข้มงวด:",
        diffLines: [
          "+ ผู้กดต้องกำลังเชื่อมต่ออยู่ใน Voice Channel ของเซิร์ฟเวอร์",
          "+ ต้องอยู่ในห้องเสียงมาแล้วไม่ต่ำกว่า 10 วินาที",
          "- หากไม่อยู่ในห้องเสียง จะกดไม่สำเร็จทุกกรณี",
          "- ห้อง AFK ไม่นับและไม่สามารถใช้รับลูกอมได้",
        ],
        footerText: "หน้า 3/5 • เงื่อนไข Voice Channel",
      }),
      // หน้า 4: การแลกเงินจริง
      buildThemedPage({
        title: "กติกา 4/5 — การแลกลูกอมเป็นเงินจริง",
        h1: "ขั้นตอนการแลกเงินจริง",
        chip: "1 ลูกอม = 1 บาท เข้าบัญชีพร้อมเพย์",
        h3: "รายละเอียดการแลก:",
        diffLines: [
          "+ รายละเอียดการแลกเงินจะประกาศอย่างเป็นทางการก่อนเริ่มกิจกรรม",
          "+ สามารถกดขอแลกได้ผ่านคำสั่ง /candy redeem หรือหน้า Dashboard",
          "+ โอนเงินจริงเข้าพร้อมเพย์โดยทีมงานผู้ดูแล",
          "+ ตรวจสอบยอดและสถานะการโอนได้ตลอดเวลา",
        ],
        footerText: "หน้า 4/5 • การแลกเงินและช่องทางรับเงิน",
      }),
      // หน้า 5: ข้อห้ามและการตัดสิน
      buildThemedPage({
        title: "กติกา 5/5 — ข้อห้ามและการตัดสิทธิ์",
        h1: "ข้อห้ามและการรักษาความยุติธรรม",
        chip: "ระบบมี Telemetry ตรวจจับความผิดปกติ",
        h3: "บทลงโทษและการตัดสิน:",
        diffLines: [
          "- ห้ามใช้บอท, สคริปต์, หรือมาโครในการช่วยกดเก็บลูกอม",
          "- ห้ามปั๊มข้อความเพื่อดึงดรอปลงห้องอย่างผิดธรรมชาติ",
          "- ตรวจพบเจตนาทุจริต ยึดยอดลูกอมและแบนจากกิจกรรมทันที",
          "+ การตัดสินของทีมงานผู้ดูแล 753BC ถือเป็นที่สิ้นสุด",
        ],
        footerText: "หน้า 5/5 • กติกาครบถ้วน พร้อมเริ่มกิจกรรมได้เลย",
      }),
    ],
    pager: {
      enabled: true,
      prevLabel: "◀ ย้อนกลับ",
      nextLabel: "ถัดไป ▶",
      prevStyle: "secondary",
      nextStyle: "primary",
      disableAtEdges: true,
    },
    buttons: [],
    allowedMentions: "NONE",
  },

  candy_panel_main: {
    pages: [
      buildThemedPage({
        title: "🎃 753BC TRICK OR TREAT — ศูนย์กิจกรรม",
        h1: "กิจกรรม Trick or Treat 🍬",
        chip: "1 ลูกอม = เงินจริง 1 บาท • เริ่ม 30 ต.ค. 23:30 น.",
        h3: "เมนูลัดสำหรับผู้เล่น:",
        diffLines: [
          "+ ดูกระเป๋าเพื่อเช็คยอดลูกอมและมูลค่าบาท",
          "+ ดูกระดานผู้นำเพื่อลุ้นเป็นผู้ล่าลูกอมอันดับ 1",
          "+ อ่านกติกาเพื่อทำความเข้าใจเงื่อนไขห้องเสียง",
          "+ แลกเงินรางวัลเข้าบัญชีพร้อมเพย์",
        ],
        extraLines: ["เข้าร่วมห้องพูดคุยเสียงเพื่อพร้อมเก็บลูกอมทันทีที่มีการดรอป!"],
        footerText: "753BC Community Event Hub",
      }),
    ],
    pager: { enabled: false, prevLabel: "◀ ย้อนกลับ", nextLabel: "ถัดไป ▶", prevStyle: "secondary", nextStyle: "primary", disableAtEdges: true },
    buttons: [
      [
        { id: "hub_bal", label: "เช็คยอดของฉัน", emoji: "🍬", style: "primary", action: "balance" },
        { id: "hub_lb", label: "กระดานผู้นำ", emoji: "🏆", style: "secondary", action: "leaderboard" },
      ],
      [
        { id: "hub_rules", label: "อ่านกติกา", emoji: "📖", style: "secondary", action: "rules" },
        { id: "hub_rdm", label: "แลกเงินรางวัล", emoji: "💸", style: "success", action: "redeem" },
      ],
    ],
    allowedMentions: "NONE",
  },

  candy_redeem_info: {
    ephemeral: true,
    pages: [
      buildThemedPage({
        title: "💸 ข้อมูลการแลกลูกอมเป็นเงินจริง",
        h1: "อัตรา 1 ลูกอม = 1 บาท",
        chip: "แลกเงินเข้าบัญชีพร้อมเพย์ (PromptPay)",
        h3: "เงื่อนไขการแลก:",
        diffLines: [
          "+ ขั้นต่ำในการขอแลก: {minRedeem} ลูกอม",
          "+ สามารถขอแลกได้ 1 คำขอในเวลาเดียวกัน",
          "+ แอดมินจะทำการตรวจสอบและโอนเงินพร้อมแนบสลิป",
        ],
        extraLines: ["สามารถกดขอแลกเงินได้โดยตรงผ่านปุ่มด้านล่าง"],
        footerText: "753BC Redemption System",
      }),
    ],
    pager: { enabled: false, prevLabel: "◀ ย้อนกลับ", nextLabel: "ถัดไป ▶", prevStyle: "secondary", nextStyle: "primary", disableAtEdges: true },
    buttons: [
      [
        { id: "do_redeem", label: "เปิดฟอร์มแลกเงิน", emoji: "💸", style: "success", action: "redeem" },
      ],
    ],
    allowedMentions: "USER_ONLY",
  },

  candy_redeem_closed: {
    ephemeral: true,
    pages: [
      buildThemedPage({
        title: "⏳ ระบบแลกเงินยังไม่เปิดให้บริการ",
        h1: "ยังไม่ถึงเวลาเปิดแลกเงิน",
        chip: "รายละเอียดการแลกจะแจ้งก่อนเริ่มกิจกรรม",
        h3: "คำแนะนำ:",
        diffLines: [
          "+ คุณสามารถสะสมลูกอมไว้ในกระเป๋าก่อนได้",
          "+ ระบบแลกเงินจะเปิดตามประกาศของทีมงาน",
        ],
        footerText: "ติดตามข่าวสารในห้องประกาศ",
      }),
    ],
    pager: { enabled: false, prevLabel: "◀ ย้อนกลับ", nextLabel: "ถัดไป ▶", prevStyle: "secondary", nextStyle: "primary", disableAtEdges: true },
    buttons: [],
    allowedMentions: "USER_ONLY",
  },

  candy_redeem_submitted: {
    ephemeral: true,
    pages: [
      buildThemedPage({
        title: "✅ ส่งคำขอแลกเงินเรียบร้อยแล้ว",
        h1: "ขอแลก ฿{baht} บาท ({amount} ลูกอม)",
        chip: "ยอดลูกอมถูก Hold ไว้ระหว่างรอการโอน",
        h3: "ข้อมูลการรับเงิน:",
        diffLines: [
          "+ ช่องทาง: พร้อมเพย์",
          "+ บัญชี/เบอร์: {payoutTarget}",
          "+ ชื่อบัญชี: {accountName}",
          "+ รหัสอ้างอิง: #{redemptionId}",
        ],
        extraLines: ["ทีมงานจะดำเนินการโอนและอัปเดตสลิปให้ทราบในระบบ"],
        footerText: "คำขออยู่ระหว่างรอดำเนินการ",
      }),
    ],
    pager: { enabled: false, prevLabel: "◀ ย้อนกลับ", nextLabel: "ถัดไป ▶", prevStyle: "secondary", nextStyle: "primary", disableAtEdges: true },
    buttons: [],
    allowedMentions: "USER_ONLY",
  },

  candy_redeem_approved: {
    pages: [
      buildThemedPage({
        title: "✅ คำขอแลกเงินได้รับการอนุมัติ",
        h1: "อนุมัติคำขอแลก ฿{baht} บาท",
        chip: "กำลังเข้าสู่ขั้นตอนการโอนเงิน",
        h3: "รายละเอียด:",
        diffLines: [
          "+ รหัสคำขอ: #{redemptionId}",
          "+ กำลังดำเนินการโอนเงินเข้าบัญชีของคุณ",
        ],
      }),
    ],
    pager: { enabled: false, prevLabel: "◀ ย้อนกลับ", nextLabel: "ถัดไป ▶", prevStyle: "secondary", nextStyle: "primary", disableAtEdges: true },
    buttons: [],
    allowedMentions: "USER_ONLY",
  },

  candy_redeem_paid: {
    pages: [
      buildThemedPage({
        title: "🎉 โอนเงินรางวัลเรียบร้อยแล้ว!",
        h1: "โอนสำเร็จ ฿{baht} บาท",
        chip: "ยอดเงินเข้าบัญชีเรียบร้อยแล้ว",
        h3: "รายละเอียดการชำระเงิน:",
        diffLines: [
          "+ รหัสคำขอ: #{redemptionId}",
          "+ จำนวน: ฿{baht} บาท",
          "+ หลักฐานการโอน: ตรวจสอบได้ในลิงก์สลิป",
        ],
        extraLines: ["ขอบคุณที่ร่วมสนุกกับกิจกรรม 753BC Trick or Treat!"],
        footerText: "การแลกเงินเสร็จสมบูรณ์",
      }),
    ],
    pager: { enabled: false, prevLabel: "◀ ย้อนกลับ", nextLabel: "ถัดไป ▶", prevStyle: "secondary", nextStyle: "primary", disableAtEdges: true },
    buttons: [],
    allowedMentions: "USER_ONLY",
  },

  candy_redeem_rejected: {
    pages: [
      buildThemedPage({
        title: "❌ คำขอแลกเงินถูกปฏิเสธ",
        h1: "คืนลูกอม {amount} ลูก เข้ากระเป๋าแล้ว",
        chip: "ไม่สามารถทำรายการได้เนื่องจากข้อมูลไม่ถูกต้อง",
        h3: "เหตุผลการปฏิเสธ:",
        diffLines: [
          "- เหตุผล: {reason}",
          "+ ยอดลูกอมถูกคืนกลับเข้ากระเป๋าของคุณแล้ว",
          "+ กรุณาตรวจสอบข้อมูลและส่งคำขอใหม่อีกครั้ง",
        ],
        footerText: "รหัสคำขอ: #{redemptionId}",
      }),
    ],
    pager: { enabled: false, prevLabel: "◀ ย้อนกลับ", nextLabel: "ถัดไป ▶", prevStyle: "secondary", nextStyle: "primary", disableAtEdges: true },
    buttons: [],
    allowedMentions: "USER_ONLY",
  },

  candy_event_start: {
    pages: [
      buildThemedPage({
        title: "🎃 เริ่มต้นกิจกรรม TRICK OR TREAT แล้ว!",
        h1: "กิจกรรมเปิดให้เก็บลูกอมแล้ว! 🍬",
        chip: "งบประมาณรวม ฿{budgetTotal} บาท (1 ลูกอม = 1 บาท)",
        h3: "เตรียมตัวให้พร้อม:",
        diffLines: [
          "+ เชื่อมต่อเข้าห้องพูดคุยเสียงเพื่อรับสิทธิ์เก็บ",
          "+ เฝ้าห้องข้อความที่มีการดรอปอย่างต่อเนื่อง",
          "+ ระยะเวลากิจกรรม 1 ชั่วโมงเต็ม",
        ],
        extraLines: ["เริ่มเวลา: {startsAt} • สิ้นสุดเวลา: {endsAt}"],
        footerText: "753BC Special Community Event",
      }),
    ],
    pager: { enabled: false, prevLabel: "◀ ย้อนกลับ", nextLabel: "ถัดไป ▶", prevStyle: "secondary", nextStyle: "primary", disableAtEdges: true },
    buttons: [
      [
        { id: "st_hub", label: "ศูนย์กิจกรรม", emoji: "🎃", style: "primary", action: "balance" },
        { id: "st_rules", label: "อ่านกติกา", emoji: "📖", style: "secondary", action: "rules" },
      ],
    ],
    allowedMentions: "NONE",
  },

  candy_event_pause: {
    pages: [
      buildThemedPage({
        title: "⏸️ กิจกรรมหยุดชั่วคราว",
        h1: "พักกิจกรรมชั่วคราว",
        chip: "ระบบดรอปหยุดทำงานชั่วคราว",
        h3: "สาเหตุ:",
        diffLines: [
          "- {reason}",
          "+ กรุณารอประกาศการเปิดดำเนินกิจกรรมต่อ",
        ],
      }),
    ],
    pager: { enabled: false, prevLabel: "◀ ย้อนกลับ", nextLabel: "ถัดไป ▶", prevStyle: "secondary", nextStyle: "primary", disableAtEdges: true },
    buttons: [],
    allowedMentions: "NONE",
  },

  candy_event_resume: {
    pages: [
      buildThemedPage({
        title: "▶️ กิจกรรมเปิดให้เล่นต่อแล้ว!",
        h1: "เปิดรับลูกอมต่อแล้ว! 🍬",
        chip: "ระบบเริ่มสุ่มดรอปตามปกติ",
        h3: "ข้อมูลเพิ่มเติม:",
        diffLines: [
          "+ {reason}",
          "+ เข้าห้องเสียงแล้วลุยต่อได้เลย!",
        ],
      }),
    ],
    pager: { enabled: false, prevLabel: "◀ ย้อนกลับ", nextLabel: "ถัดไป ▶", prevStyle: "secondary", nextStyle: "primary", disableAtEdges: true },
    buttons: [],
    allowedMentions: "NONE",
  },

  candy_event_end: {
    pages: [
      buildThemedPage({
        title: "🏁 สิ้นสุดกิจกรรม TRICK OR TREAT",
        h1: "จบกิจกรรมเรียบร้อยแล้ว ขอบคุณทุกคน!",
        chip: "ยอดลูกอมที่แจกไปทั้งหมด: {totalClaimed} ลูกอม",
        h3: "สรุปผลงาน:",
        diffLines: [
          "+ จำนวนการดรอปทั้งหมด: {totalDrops} ครั้ง",
          "+ ยอดเงินที่แจกออกไป: ฿{totalClaimed} บาท",
          "+ ระบบแลกเงินยังคงเปิดให้แลกได้ตามเงื่อนไข",
        ],
        extraLines: [
          "### 🏆 ผู้ล่าลูกอมสูงสุด:",
          "```",
          "{topRows}",
          "```",
        ],
        footerText: "753BC Event Completed",
      }),
    ],
    pager: { enabled: false, prevLabel: "◀ ย้อนกลับ", nextLabel: "ถัดไป ▶", prevStyle: "secondary", nextStyle: "primary", disableAtEdges: true },
    buttons: [
      [
        { id: "end_rdm", label: "แลกลูกอมของฉัน", emoji: "💸", style: "success", action: "redeem" },
        { id: "end_lb", label: "ดูอันดับทั้งหมด", emoji: "🏆", style: "secondary", action: "leaderboard" },
      ],
    ],
    allowedMentions: "NONE",
  },

  candy_admin_status: {
    ephemeral: true,
    pages: [
      buildThemedPage({
        title: "⚙️ สถานะระบบกิจกรรม (Admin)",
        h1: "สถานะ: {status}",
        chip: "ข้อมูล Telemetry ฝั่งบอทและฐานข้อมูล",
        h3: "งบประมาณและดรอป:",
        diffLines: [
          "+ งบรวม: ฿{budgetTotal}",
          "+ แจกไปแล้ว: ฿{budgetClaimed}",
          "+ จองในดรอปที่เปิดอยู่: ฿{budgetReserved}",
          "+ ดรอปที่เกิดขึ้น: {dropsCount} ครั้ง",
        ],
      }),
    ],
    pager: { enabled: false, prevLabel: "◀ ย้อนกลับ", nextLabel: "ถัดไป ▶", prevStyle: "secondary", nextStyle: "primary", disableAtEdges: true },
    buttons: [],
    allowedMentions: "USER_ONLY",
  },

  candy_admin_ok: {
    ephemeral: true,
    pages: [
      buildThemedPage({
        title: "✅ การดำเนินการสำเร็จ (Admin)",
        h1: "สำเร็จ",
        diffLines: ["+ {message}"],
      }),
    ],
    pager: { enabled: false, prevLabel: "◀ ย้อนกลับ", nextLabel: "ถัดไป ▶", prevStyle: "secondary", nextStyle: "primary", disableAtEdges: true },
    buttons: [],
    allowedMentions: "USER_ONLY",
  },

  candy_admin_error: {
    ephemeral: true,
    pages: [
      buildThemedPage({
        title: "❌ ข้อผิดพลาด (Admin)",
        h1: "คำสั่งล้มเหลว",
        diffLines: ["- {message}"],
      }),
    ],
    pager: { enabled: false, prevLabel: "◀ ย้อนกลับ", nextLabel: "ถัดไป ▶", prevStyle: "secondary", nextStyle: "primary", disableAtEdges: true },
    buttons: [],
    allowedMentions: "USER_ONLY",
  },
};
