import type { Metadata } from "next";
import RulesClient from "./RulesClient";

export const metadata: Metadata = {
  title: "กฎระเบียบ & AI วิเคราะห์สถานการณ์ — 753BC Community Hub",
  description:
    "คู่มือข้อบังคับ กฎระเบียบประจำเซิร์ฟเวอร์ และมาตรฐานการทำงานของทีมงาน 753BC พร้อมระบบ AI วิเคราะห์กฎอัตโนมัติด้วย Gemini",
  openGraph: {
    title: "กฎระเบียบ & AI วิเคราะห์สถานการณ์ — 753BC Community Hub",
    description:
      "คู่มือข้อบังคับ กฎระเบียบประจำเซิร์ฟเวอร์ และมาตรฐานการทำงานของทีมงาน 753BC พร้อมระบบ AI วิเคราะห์กฎอัตโนมัติด้วย Gemini",
  },
};

export default function RulesPage() {
  return <RulesClient />;
}
