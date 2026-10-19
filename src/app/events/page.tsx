import type { Metadata } from "next";
import EventsClient from "./EventsClient";

export const metadata: Metadata = {
  title: "กิจกรรม & อีเวนต์ — 753BC Community Hub",
  description:
    "รวมกิจกรรม การแข่งขัน และอีเวนต์พิเศษชิงเงินรางวัลและยศพิเศษประจำเซิร์ฟเวอร์ดิสคอร์ด 753BC",
  openGraph: {
    title: "กิจกรรม & อีเวนต์ — 753BC Community Hub",
    description:
      "รวมกิจกรรม การแข่งขัน และอีเวนต์พิเศษชิงเงินรางวัลและยศพิเศษประจำเซิร์ฟเวอร์ดิสคอร์ด 753BC",
    images: ["/event-promo.png"],
  },
};

export default function EventsPage() {
  return <EventsClient />;
}
