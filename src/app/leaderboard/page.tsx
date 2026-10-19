import { Metadata } from "next";
import LeaderboardClient from "./LeaderboardClient";

export const metadata: Metadata = {
  title: "จัดอันดับห้องเสียง — 753BC Hub",
  description: "กระดานจัดอันดับห้องเสียงอย่างเป็นทางการของ 753BC สถิติชั่วโมงการพูดคุยและระดับยศดิสคอร์ด",
};

export default function LeaderboardPage() {
  return <LeaderboardClient />;
}
