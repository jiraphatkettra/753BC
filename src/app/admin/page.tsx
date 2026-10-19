import { Metadata } from "next";
import AdminClient from "./AdminClient";

export const metadata: Metadata = {
  title: "ศูนย์ควบคุมแอดมิน (Admin Portal) — 753BC Hub",
  description: "ระบบบริหารจัดการคอมมูนิตี้ 753BC: จัดการกิจกรรม ตรวจสอบสลิป ปรับยอดเงินสมาชิก และตั้งค่าบัญชี",
};

export default function AdminPage() {
  return <AdminClient />;
}
