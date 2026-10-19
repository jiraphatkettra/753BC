import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createPresignedSlipUploadUrl } from "@/lib/r2";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "กรุณาเข้าสู่ระบบก่อนดำเนินการ" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { fileName, contentType, fileSize } = body;

    if (!fileName || !contentType || !fileSize) {
      return NextResponse.json(
        { error: "BAD_REQUEST", message: "ข้อมูลไฟล์ไม่ครบถ้วน" },
        { status: 400 }
      );
    }

    const presigned = await createPresignedSlipUploadUrl({
      userId: session.user.id,
      fileName,
      contentType,
      fileSize,
    });

    return NextResponse.json(presigned);
  } catch (err: any) {
    console.error("Presign upload error:", err);
    return NextResponse.json(
      { error: "PRESIGN_ERROR", message: err.message || "ไม่สามารถสร้าง URL อัปโหลดได้" },
      { status: 400 }
    );
  }
}
