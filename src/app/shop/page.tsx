import { Metadata } from "next";
import ShopClient from "./ShopClient";

export const metadata: Metadata = {
  title: "ร้านค้า & ยศคอมมูนิตี้ — 753BC Hub",
  description:
    "เลือกซื้อยศพิเศษ สิทธิประโยชน์ และไอเทมดิจิทัลประจำเซิร์ฟเวอร์ 753BC พร้อมระบบสุ่มรางวัลและกล่องเสี่ยงทาย",
};

export default function ShopPage() {
  return <ShopClient />;
}
