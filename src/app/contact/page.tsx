import { Metadata } from "next";
import ContactClient from "./ContactClient";

export const metadata: Metadata = {
  title: "ติดต่อสตาฟ & แจ้งเรื่อง (Web Ticket) — 753BC Hub",
  description:
    "ระบบเปิดคำร้องและติดต่อทีมงานผู้ดูแลเซิร์ฟเวอร์ 753BC ผ่าน Web Ticket พร้อมช่องทางการติดต่อโดยตรงใน Discord",
};

export default function ContactPage() {
  return <ContactClient />;
}
