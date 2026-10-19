import { Metadata } from "next";
import TopupClient from "./TopupClient";

export const metadata: Metadata = {
  title: "เติมเงิน PromptPay — 753BC Hub",
  description: "ระบบเติมเงินกระเป๋าตังค์คอมมูนิตี้ 753BC ผ่าน PromptPay QR code และระบบตรวจสอบสลิปอัตโนมัติ",
};

export default function TopupPage() {
  return <TopupClient />;
}
