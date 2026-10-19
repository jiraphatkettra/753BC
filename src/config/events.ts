export interface EventReward {
  label: string;
  value: string;
  subtext?: string;
  isGrand?: boolean;
}

export interface CommunityEvent {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  badge: string;
  status: "active" | "upcoming" | "ended";
  statusLabel: string;
  startDate: string;
  endDate: string;
  periodText: string;
  image: string;
  location: string;
  summary: string;
  description: string;
  rewards: EventReward[];
  highlights: string[];
  rules: string[];
  howToJoin: string[];
  discordUrl: string;
  featured: boolean;
}

export const COMMUNITY_EVENTS: CommunityEvent[] = [
  {
    id: "promo-753bc-oct-2026",
    slug: "promo-discord-753bc",
    title: "กิจกรรม โปรโมทดิสคอร์ด 753 BC",
    tagline: "PROMO CAMPAIGN // HALLOWEEN SPECIAL",
    badge: "EVENT 01",
    status: "active",
    statusLabel: "กำลังดำเนินอยู่",
    startDate: "2026-10-15",
    endDate: "2026-10-31",
    periodText: "15 ตุลาคม - 31 ตุลาคม",
    image: "/event-promo.png",
    location: "753BC Discord Server (#กิจกรรม-events)",
    summary:
      "ชวนเพื่อนเข้าร่วมคอมมูนิตี้ 753BC สะสมยอด Invite ชิงเงินรางวัลและยศสุดพิเศษต้อนรับเทศกาลฮาโลวีน",
    description:
      "กิจกรรมพิเศษสำหรับสมาชิกชาว 753BC ทุกท่าน ร่วมเป็นส่วนหนึ่งในการขยายครอบครัวคอมมูนิตี้ เพียงสร้างลิงก์เชิญเพื่อนเข้าร่วมเซิร์ฟเวอร์ สะสมยอดเชิญสูงสุดเพื่อชิงรางวัลเงินสดและยศพิเศษประจำเซิร์ฟเวอร์ ทุกคนที่เข้าร่วมจะได้รับยศพิเศษเป็นที่ระลึก!",
    rewards: [
      {
        label: "อันดับ 1",
        value: "150 บาท",
        subtext: "เงินสดโอนเข้าบัญชี / พร้อมเพย์",
        isGrand: true,
      },
      {
        label: "อันดับ 2",
        value: "50 บาท",
        subtext: "เงินสดโอนเข้าบัญชี / พร้อมเพย์",
        isGrand: false,
      },
      {
        label: "ทุกคนที่เข้าร่วม",
        value: "ยศสุดพิเศษ",
        subtext: "ยศ Exclusive ประจำกิจกรรม Halloween",
        isGrand: false,
      },
    ],
    highlights: [
      "ชิงรางวัลเงินสดโอนจริง รวม 200+ บาท",
      "ทุกคนที่ร่วมโปรโมทได้รับยศพิเศษในดิสคอร์ด",
      "ระบบนับสถิติ Invite อัตโนมัติโปร่งใส ตรวจสอบได้ตลอด 24 ชม.",
    ],
    rules: [
      "ต้องสร้างลิงก์ Invite ส่วนตัวจากเซิร์ฟเวอร์ 753BC",
      "ห้ามใช้บอท, แอคเคาท์ปลอม (Fake Accounts) หรือสแปมในดิสคอร์ดอื่น",
      "ผู้ถูกเชิญต้องอยู่ในเซิร์ฟเวอร์จนถึงวันสิ้นสุดกิจกรรมเพื่อให้นับแต้มสมบูรณ์",
      "การตัดสินของทีมงาน 753BC ถือเป็นที่สิ้นสุด",
    ],
    howToJoin: [
      "เข้าสู่เซิร์ฟเวอร์ 753BC Discord",
      "ไปที่ช่อง #กิจกรรม-events หรือสร้างลิงก์เชิญ (Invite Link)",
      "แชร์ลิงก์ให้เพื่อนๆ หรือชวนเข้ามาร่วมพูดคุย",
      "ตรวจสอบอันดับคะแนนสะสมผ่านคำสั่งบอทในห้องกิจกรรม",
    ],
    discordUrl: "https://discord.gg/6zcbZ47b5t",
    featured: true,
  },
  {
    id: "trick-or-treat-candy-to-money",
    slug: "trick-or-treat-candy-to-money",
    title: "Trick or Treat — เปลี่ยนลูกอมให้เป็นเงิน",
    tagline: "CHANGE CANDY TO MONEY // SPECIAL NIGHT",
    badge: "EVENT 02",
    status: "upcoming",
    statusLabel: "เร็วๆ นี้",
    startDate: "2026-10-31",
    endDate: "2026-10-31",
    periodText: "31 ตุลาคม (เที่ยงคืนเป็นต้นไป)",
    image: "/event-trickortreat.png",
    location: "753BC Discord Server (#trick-or-treat)",
    summary:
      "สะสมลูกอมจากกิจกรรมและห้องเสียงในดิสคอร์ด แล้วนำมาแลกเปลี่ยนเป็นเงินสดจริงในคืนปล่อยผี!",
    description:
      "เทศกาลฮาโลวีนปีนี้ 753BC เตรียมเซอร์ไพรส์ครั้งใหญ่! ลูกอม (Candy) ที่คุณสะสมได้จากการพูดคุยในห้องเสียง ร่วมกิจกรรม และมินิเกมในดิสคอร์ด สามารถนำมาแลกเปลี่ยนเป็นเงินสดจริงได้ในคืนวันฮาโลวีน เริ่มต้นเที่ยงคืนตรงวันที่ 31 ตุลาคมเป็นต้นไป!",
    rewards: [
      {
        label: "เรทการแลก",
        value: "เปลี่ยนลูกอมเป็นเงินสด",
        subtext: "อัตราแลกเปลี่ยนพิเศษเฉพาะคืนวันงาน",
        isGrand: true,
      },
      {
        label: "กิจกรรมเสริม",
        value: "มินิเกมชิงรางวัล",
        subtext: "เกมตอบคำถาม & กิจกรรมปล่อยผีในห้องเสียง",
        isGrand: false,
      },
      {
        label: "สิทธิพิเศษ",
        value: "ยศ Halloween Night",
        subtext: "ปลดล็อกไอคอนและสีชื่อพิเศษ",
        isGrand: false,
      },
    ],
    highlights: [
      "เปลี่ยนคะแนนกิจกรรม (Candy) เป็นเงินจริง โอนตรงผ่านพร้อมเพย์",
      "จัดเต็มกิจกรรมและมินิเกมตลอดคืนวันฮาโลวีน 31 ต.ค.",
      "เปิดห้องเสียงพิเศษ Voice Party รวมสมาชิก 753BC",
    ],
    rules: [
      "สมาชิกต้องมีคะแนนลูกอม (Candy) สะสมในบัญชีดิสคอร์ด",
      "ระบบจะเปิดรับแลกเปลี่ยนตั้งแต่เวลา 00:00 น. (คืนวันที่ 31 ต.ค.) เป็นต้นไป",
      "จำกัดสิทธิ์การแลกตามเงื่อนไขที่ทีมงานกำหนดในวันงาน",
      "ต้องยืนยันตัวตนในดิสคอร์ดเพื่อรับโอนเงินรางวัล",
    ],
    howToJoin: [
      "เข้าร่วมเซิร์ฟเวอร์ดิสคอร์ด 753BC",
      "ร่วมพูดคุยในห้องเสียงหรือทำภารกิจเพื่อสะสมลูกอม (Candy)",
      "สแกน QR Code หรือคลิกเข้าร่วมห้อง #trick-or-treat",
      "รอประกาศเปิดระบบแลกเงินในคืนวันที่ 31 ตุลาคม เที่ยงคืนตรง",
    ],
    discordUrl: "https://discord.gg/6zcbZ47b5t",
    featured: true,
  },
];
