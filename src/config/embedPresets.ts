/**
 * 753BC Guild UI Embed Presets & Schema
 * Modeled after references in D:\WebUseLynn\guild_ui_bot_embed and LynnBot /panel commands
 */

export interface EmbedFieldItem {
  id: string;
  name: string;
  value: string;
  inline: boolean;
}

export interface EmbedConfig {
  key: string;
  category: "panel" | "store" | "boost" | "system" | "rules" | "ticket" | "attendance" | "leave" | "moderation" | "custom";
  name: string;
  description: string;
  channelId?: string;
  author: {
    enabled: boolean;
    name: string;
    iconUrl: string;
    url?: string;
  };
  title: {
    enabled: boolean;
    text: string;
    url?: string;
  };
  descriptionText: {
    enabled: boolean;
    text: string;
  };
  color: {
    enabled: boolean;
    hex: string;
  };
  thumbnail: {
    enabled: boolean;
    url: string;
  };
  image: {
    enabled: boolean;
    url: string; // Poster URL customizable by Admin
  };
  fields: {
    enabled: boolean;
    items: EmbedFieldItem[];
  };
  footer: {
    enabled: boolean;
    text: string;
    iconUrl: string;
  };
  timestamp: {
    enabled: boolean;
  };
}

export const DEFAULT_EMBED_PRESETS: Record<string, EmbedConfig> = {
  // ==========================================
  // 1. /PANEL INTERACTIVE PANELS (BOT PERSISTENT PANELS)
  // ==========================================

  ticket_panel: {
    key: "ticket_panel",
    category: "panel",
    name: "🎫 /panel ticket · ศูนย์ช่วยเหลือ & เปิดตั๋ว (Ticket Support)",
    description: "แผงสำหรับเปิด Ticket ในห้องช่วยเหลือ สมาชิกกดปุ่มเพื่อคุยกับทีมงานส่วนตัว",
    author: {
      enabled: true,
      name: "753BC Support Desk",
      iconUrl: "https://cdn.discordapp.com/emojis/1105478431871213598.webp?size=96&quality=lossless",
    },
    title: {
      enabled: true,
      text: "📩  TICKET SUPPORT • ศูนย์บริการช่วยเหลือ & ติดต่อทีมงาน",
    },
    descriptionText: {
      enabled: true,
      text: "หากคุณพบปัญหา แจ้งปัญหาการสั่งซื้อยศ ติดต่อทีมงาน หรือต้องการสอบถามข้อมูลเพิ่มเติม\nสามารถกดปุ่มด้านล่างเพื่อเปิดห้องสนทนาส่วนตัว (Private Ticket) ได้ทันที\n\n> 🔒 **ความเป็นส่วนตัว:** มีเฉพาะคุณและทีมผู้ดูแลเท่านั้นที่มองเห็นห้องสนทนานี้\n\n-# ทีมงานพร้อมให้ความช่วยเหลือและตอบกลับอย่างรวดเร็วที่สุดตลอด 24 ชั่วโมง",
    },
    color: {
      enabled: true,
      hex: "#10b981",
    },
    thumbnail: {
      enabled: false,
      url: "",
    },
    image: {
      enabled: false,
      url: "",
    },
    fields: {
      enabled: true,
      items: [
        {
          id: "f1",
          name: "⏱️ เวลาให้บริการ",
          value: "ทีมงานพร้อมดูแลและตอบกลับตลอด 24 ชั่วโมง",
          inline: true,
        },
        {
          id: "f2",
          name: "📌 คำแนะนำ",
          value: "กรุณาเตรียมหลักฐานหรือข้อความอธิบายปัญหาไว้ล่วงหน้า",
          inline: true,
        },
      ],
    },
    footer: {
      enabled: true,
      text: "LynnBot Operations System • Ticket Helpdesk",
      iconUrl: "",
    },
    timestamp: {
      enabled: true,
    },
  },

  shop_panel: {
    key: "shop_panel",
    category: "panel",
    name: "🛒 /panel shop · ร้านค้ายศ & กระเป๋าเงิน (Shop & Wallet)",
    description: "แผงร้านค้ายศและบริการ ให้สมาชิกกดดูรายการยศ ตรวจสอบยอดเงิน และดูวิธีเติมเงิน",
    author: {
      enabled: true,
      name: "LynnBot Role Shop",
      iconUrl: "https://cdn.discordapp.com/emojis/1105478431871213598.webp?size=96&quality=lossless",
    },
    title: {
      enabled: true,
      text: "🛒  SERVER SHOP & WALLET • ร้านค้ายศและบริการ",
    },
    descriptionText: {
      enabled: true,
      text: "เลือกซื้อยศพิเศษและสิทธิประโยชน์เพื่อร่วมสนับสนุนเซิร์ฟเวอร์\nชำระเงินผ่านกระเป๋าเงิน (Wallet) พร้อมระบบมอบยศให้อัตโนมัติ 24 ชม.\n\n> 💎 **ระบบการซื้อ:** เลือกดูรายการยศ ตรวจสอบราคา และกดยืนยันชำระเงินได้อย่างปลอดภัย\n\n-# สามารถตรวจสอบยอดเงินคงเหลือของคุณได้ตลอดเวลาผ่านปุ่มด้านล่าง",
    },
    color: {
      enabled: true,
      hex: "#2997ff",
    },
    thumbnail: {
      enabled: false,
      url: "",
    },
    image: {
      enabled: false,
      url: "",
    },
    fields: {
      enabled: true,
      items: [
        {
          id: "f1",
          name: "⚡ มอบยศอัตโนมัติ",
          value: "ระบบจะให้ยศใน Discord ทันทีหลังชำระเงินสำเร็จ",
          inline: true,
        },
        {
          id: "f2",
          name: "💳 ช่องทางการชำระ",
          value: "ตัดยอดจาก Wallet หรือเติมเงินผ่านพร้อมเพย์",
          inline: true,
        },
      ],
    },
    footer: {
      enabled: true,
      text: "LynnBot Operations System • Shop & Economy",
      iconUrl: "",
    },
    timestamp: {
      enabled: true,
    },
  },

  attendance_panel: {
    key: "attendance_panel",
    category: "panel",
    name: "⏰ /panel attendance · ตอกบัตรเข้า-ออกงาน (Attendance Station)",
    description: "แผงสำหรับสตาฟและทีมงานกดบันทึกเวลาเข้าเวรและออกเวร พร้อมมอบยศ On-Duty อัตโนมัติ",
    author: {
      enabled: true,
      name: "LynnBot Attendance Station",
      iconUrl: "https://cdn.discordapp.com/emojis/1105478431871213598.webp?size=96&quality=lossless",
    },
    title: {
      enabled: true,
      text: "⏱️  ATTENDANCE STATION • ระบบลงเวลาปฏิบัติงาน",
    },
    descriptionText: {
      enabled: true,
      text: "บันทึกเวลาการเข้าและออกเวรสำหรับทีมงาน LynnBot\nระบบจะทำการบันทึกและซิงค์สถิติเข้าสู่ Web Dashboard อัตโนมัติ\n\n> 🟢 **สถานะระบบ:** พร้อมใช้งาน (Active) • 24/7 Time Tracking\n\n-# กรุณากดปุ่มเพื่อบันทึกเวลาตามจริง การทำงานของปุ่มจะแสดงผลแบบส่วนตัว (Ephemeral)",
    },
    color: {
      enabled: true,
      hex: "#30d158",
    },
    thumbnail: {
      enabled: false,
      url: "",
    },
    image: {
      enabled: false,
      url: "",
    },
    fields: {
      enabled: true,
      items: [
        {
          id: "f1",
          name: "📋 กฎการเข้าเวร",
          value: "กดเข้างานเมื่อพร้อมปฏิบัติหน้าที่ และกดออกงานทุกครั้งหลังจบกะ",
          inline: false,
        },
      ],
    },
    footer: {
      enabled: true,
      text: "LynnBot Operations System • Attendance Station",
      iconUrl: "",
    },
    timestamp: {
      enabled: true,
    },
  },

  leave_panel: {
    key: "leave_panel",
    category: "panel",
    name: "🏖️ /panel leave · ยื่นคำขอลางาน (Staff Leave System)",
    description: "แผงยื่นใบลาสำหรับทีมงาน รองรับลาป่วย ลากิจ และลาพักร้อน พร้อมระบบแจ้งเตือนแอดมิน",
    author: {
      enabled: true,
      name: "LynnBot Staff Operations",
      iconUrl: "",
    },
    title: {
      enabled: true,
      text: "📝  STAFF LEAVE SYSTEM • ระบบยื่นคำขอลางาน",
    },
    descriptionText: {
      enabled: true,
      text: "บริการยื่นใบลาสำหรับทีมงานและบุคลากรทุกฝ่าย\nรองรับการลาป่วย (Sick), ลากิจ (Personal) และลาพักร้อน (Vacation)\n\n> 📌 **การดำเนินการ:** เมื่อยื่นคำขอ ระบบจะส่งให้หัวหน้างานพิจารณา และแจ้งเตือนผลผ่าน DM\n\n-# สมาชิกสามารถยื่นคำขอใหม่ หรือตรวจสอบสถานะใบลาเดิมได้จากปุ่มด้านล่าง",
    },
    color: {
      enabled: true,
      hex: "#ff9f0a",
    },
    thumbnail: {
      enabled: false,
      url: "",
    },
    image: {
      enabled: false,
      url: "",
    },
    fields: {
      enabled: false,
      items: [],
    },
    footer: {
      enabled: true,
      text: "LynnBot Operations System • Staff Leave Service",
      iconUrl: "",
    },
    timestamp: {
      enabled: true,
    },
  },

  moderation_panel: {
    key: "moderation_panel",
    category: "panel",
    name: "⚖️ /panel moderation · แผงควบคุมความประพฤติ (Discipline Hub)",
    description: "แผงศูนย์กลางบันทึกการตักเตือน ลงโทษความผิด และดูแลความเรียบร้อยของเซิร์ฟเวอร์",
    author: {
      enabled: true,
      name: "LynnBot Moderation & Security",
      iconUrl: "",
    },
    title: {
      enabled: true,
      text: "⚖️  DISCIPLINE & MODERATION • แผงควบคุมความประพฤติ & ลงโทษสมาชิก",
    },
    descriptionText: {
      enabled: true,
      text: "ศูนย์กลางบันทึกการตักเตือน ลงโทษความผิด และดูแลความเรียบร้อยของเซิร์ฟเวอร์\nทีมงานสามารถกดปุ่มด้านล่างเพื่อออกใบเตือน หรือตรวจสอบประวัติการลงโทษของสมาชิกได้ทันที\n\n> ⚠️ **เกณฑ์การลงโทษอัตโนมัติ (Escalation Rules):**\n> • เตือนสะสม **3 ครั้ง**: ระงับการส่งข้อความ 1 ชั่วโมง (Timeout 1h)\n> • เตือนสะสม **5 ครั้ง**: เตะออกจากเซิร์ฟเวอร์ทันที (Kick)\n\n-# ทุกการเตือนจะถูกบันทึกลงสู่ระบบ Dashboard และส่ง DM แจ้งเตือนผู้กระทำผิดอัตโนมัติ",
    },
    color: {
      enabled: true,
      hex: "#ff453a",
    },
    thumbnail: {
      enabled: false,
      url: "",
    },
    image: {
      enabled: false,
      url: "",
    },
    fields: {
      enabled: false,
      items: [],
    },
    footer: {
      enabled: true,
      text: "LynnBot Operations System • Security & Discipline",
      iconUrl: "",
    },
    timestamp: {
      enabled: true,
    },
  },

  admin_hub_panel: {
    key: "admin_hub_panel",
    category: "panel",
    name: "🛡️ /panel admin-hub · แผงควบคุมด่วนทีมงาน (Staff Control Hub)",
    description: "ศูนย์รวมคำสั่งปฏิบัติการด่วนสำหรับแอดมินในห้อง Staff เช่น เช็ครายชื่อทีมงาน และสำรองข้อมูล",
    author: {
      enabled: true,
      name: "LynnBot Staff Operations",
      iconUrl: "",
    },
    title: {
      enabled: true,
      text: "🛡️  STAFF CONTROL HUB • แผงควบคุมด่วนสำหรับทีมงาน",
    },
    descriptionText: {
      enabled: true,
      text: "ศูนย์รวมคำสั่งปฏิบัติการด่วนสำหรับแอดมินและผู้ดูแลเซิร์ฟเวอร์\nเข้าถึงข้อมูลและสั่งการระบบได้ทันทีโดยไม่ต้องพิมพ์คำสั่ง Slash Command\n\n> 🔒 **สิทธิ์การเข้าถึง:** เจ้าหน้าที่และผู้ดูแลเซิร์ฟเวอร์เท่านั้น (Staff Only)\n\n-# ทุกการกระทำจะถูกบันทึกลง Audit Logs และส่งซิงค์เข้า Dashboard",
    },
    color: {
      enabled: true,
      hex: "#64d2ff",
    },
    thumbnail: {
      enabled: false,
      url: "",
    },
    image: {
      enabled: false,
      url: "",
    },
    fields: {
      enabled: false,
      items: [],
    },
    footer: {
      enabled: true,
      text: "LynnBot Operations System • Staff Operations",
      iconUrl: "",
    },
    timestamp: {
      enabled: true,
    },
  },

  wallet_panel: {
    key: "wallet_panel",
    category: "panel",
    name: "💳 Wallet Panel · กระเป๋าเงินดิจิทัล & วิธีเติมเงิน",
    description: "แผงแสดงยอดเงินดิจิทัลส่วนบุคคล และปุ่มเช็คยอด / เติมเงินผ่าน PromptPay",
    author: {
      enabled: true,
      name: "LynnBot Digital Wallet",
      iconUrl: "https://cdn.discordapp.com/emojis/1105478431871213598.webp?size=96&quality=lossless",
    },
    title: {
      enabled: true,
      text: "💳  DIGITAL WALLET • กระเป๋าเงินดิจิทัลและวิธีเติมเงิน",
    },
    descriptionText: {
      enabled: true,
      text: "ยินดีต้อนรับสู่ระบบกระเป๋าเงินดิจิทัลประจำเซิร์ฟเวอร์\nคุณสามารถเติมเงินเข้ากระเป๋าเพื่อใช้ซื้อยศหรือบริการต่างๆ ได้อย่างรวดเร็ว\n\n> 🔹 **เช็คยอดเงิน:** ดูยอดเงินคงเหลือและประวัติการทำธุรกรรม\n> 🔹 **เติมเงิน:** สแกน QR Code พร้อมเพย์ ยอดเงินเข้ากระเป๋าอัตโนมัติ",
    },
    color: {
      enabled: true,
      hex: "#2997ff",
    },
    thumbnail: {
      enabled: false,
      url: "",
    },
    image: {
      enabled: false,
      url: "",
    },
    fields: {
      enabled: false,
      items: [],
    },
    footer: {
      enabled: true,
      text: "LynnBot Operations System • Wallet",
      iconUrl: "",
    },
    timestamp: {
      enabled: true,
    },
  },

  // ==========================================
  // 2. STORE & GUILD UI POSTERS (FROM guild_ui_bot_embed)
  // ==========================================

  mamomi_nitro: {
    key: "mamomi_nitro",
    category: "store",
    name: "⚡ MΛMØMI STØRE · Discord Nitro (ID PASS)",
    description: "ป้ายเมนูสั่งซื้อ Discord Nitro รายเดือน / รายปี ระบบ ID PASS ปลอดภัย 100%",
    author: {
      enabled: true,
      name: "MΛMØMI STØRE",
      iconUrl: "https://cdn.discordapp.com/emojis/1105478431871213598.webp?size=96&quality=lossless",
    },
    title: {
      enabled: true,
      text: "⚡ DISCORD NITRO · ปลดล็อกทุกฟีเจอร์ใช้งานเต็มรูปแบบ",
    },
    descriptionText: {
      enabled: true,
      text: "**ระบบ ID PASS** ใช้งานง่าย สะดวก รวดเร็ว\n\n🛡️ มั่นใจ ปลอดภัย ไม่เสี่ยง ปลอดภัย 100%\n⚡ ใช้งานง่าย ระบบ ID PASS\n⏱️ ต่ออายุได้ต่อเนื่อง ไม่ต้องเปลี่ยนบัญชี\n🎧 หากมีปัญหา เราช่วยดูแล 24 ชม.",
    },
    color: {
      enabled: true,
      hex: "#ffffff",
    },
    thumbnail: {
      enabled: false,
      url: "",
    },
    image: {
      enabled: true,
      url: "", // Admin can paste their custom poster image URL here!
    },
    fields: {
      enabled: true,
      items: [
        {
          id: "f1",
          name: "📅 รายเดือน",
          value: "```fix\n165.- บาท\n```\n• ใช้งานต่อเนื่องทุกเดือน",
          inline: true,
        },
        {
          id: "f2",
          name: "📅 รายปี",
          value: "```fix\n1650.- บาท\n```\n• คุ้มค่ากว่า ประหยัดกว่า",
          inline: true,
        },
      ],
    },
    footer: {
      enabled: true,
      text: "© Mamomi Store · All Rights Reserved",
      iconUrl: "",
    },
    timestamp: {
      enabled: true,
    },
  },

  mamomi_boost: {
    key: "mamomi_boost",
    category: "boost",
    name: "🚀 MΛMØMI BØØST · บริการเม็ดบูสต์",
    description: "ป้ายเรทราคาบูสต์เซิร์ฟเวอร์ Discord 1 เดือน / 3 เดือน พร้อมแสดงยอดคงเหลือ",
    author: {
      enabled: true,
      name: "MΛMØMI BØØST",
      iconUrl: "https://cdn.discordapp.com/emojis/1105478431871213598.webp?size=96&quality=lossless",
    },
    title: {
      enabled: true,
      text: "🚀 DISCORD SERVER BOOST · บริการเม็ดบูสต์เซิร์ฟเวอร์",
    },
    descriptionText: {
      enabled: true,
      text: "บริการเพิ่มเลเวลเซิร์ฟเวอร์ Discord บูสต์แท้ คุณภาพสูง ปลอดภัย 100%\n\n> 💎 **Fast & Reliable Boost Delivery System**",
    },
    color: {
      enabled: true,
      hex: "#f43f5e",
    },
    thumbnail: {
      enabled: false,
      url: "",
    },
    image: {
      enabled: true,
      url: "",
    },
    fields: {
      enabled: true,
      items: [
        {
          id: "f1",
          name: "🔮 บูสต์ 1 เดือน",
          value: "```fix\n9 บาท / เม็ด\n```",
          inline: true,
        },
        {
          id: "f2",
          name: "🔘 เหลือจำนวน",
          value: "```yaml\n82 บูสต์\n```",
          inline: true,
        },
        {
          id: "f3",
          name: "💬 บูสต์ไปแล้ว",
          value: "```yaml\n29,238 บูสต์\n```",
          inline: true,
        },
        {
          id: "f4",
          name: "🔮 บูสต์ 3 เดือน",
          value: "```fix\n25 บาท / เม็ด\n```",
          inline: true,
        },
        {
          id: "f5",
          name: "🔘 เหลือจำนวน",
          value: "```yaml\n192 บูสต์\n```",
          inline: true,
        },
        {
          id: "f6",
          name: "💬 บูสต์ไปแล้ว",
          value: "```yaml\n5,808 บูสต์\n```",
          inline: true,
        },
      ],
    },
    footer: {
      enabled: true,
      text: "© MAMOMI STORE , All Rights Reserved",
      iconUrl: "",
    },
    timestamp: {
      enabled: true,
    },
  },

  mamomi_auto_system: {
    key: "mamomi_auto_system",
    category: "system",
    name: "💠 MAMOMI AUTO SYSTEM · เควส & HypeSquad",
    description: "ระบบอัตโนมัติ ทำเควสดิสคอร์ด Orbs และบริการตรา HypeSquad 24 ชั่วโมง",
    author: {
      enabled: true,
      name: "MAMOMI QUEST & AUTOMATION",
      iconUrl: "",
    },
    title: {
      enabled: true,
      text: "💠 MAMOMI AUTO SYSTEM · บริการอัตโนมัติ 24/7",
    },
    descriptionText: {
      enabled: true,
      text: "ภารกิจสะสม **Discord Orbs** & บริการตรา **HypeSquad 24/7**\n\n```diff\n+ บอทออนไลน์ตลอด 24. ชั่วโมง\n+ บริการทำเควสดิสคอร์ด Free - 5฿\n+ บริการทำตรา HypeSquad Free\n```\n\n🔒 `ระบบปลอดภัย 100% · ไม่บันทึก Token ลงฐานข้อมูล`",
    },
    color: {
      enabled: true,
      hex: "#8b5cf6",
    },
    thumbnail: {
      enabled: false,
      url: "",
    },
    image: {
      enabled: true,
      url: "",
    },
    fields: {
      enabled: false,
      items: [],
    },
    footer: {
      enabled: true,
      text: "© MAMOMI STORE , All Rights Reserved",
      iconUrl: "",
    },
    timestamp: {
      enabled: true,
    },
  },

  terms_warranty: {
    key: "terms_warranty",
    category: "rules",
    name: "🛡️ เงื่อนไขสินค้าและการรับประกัน",
    description: "เงื่อนไขการรับประกันสินค้า นโยบายการเคลม และข้อแนะนำสำคัญสำหรับลูกค้า",
    author: {
      enabled: true,
      name: "MΛMØMI BØØST GUARANTEE",
      iconUrl: "",
    },
    title: {
      enabled: true,
      text: "🛡️ เงื่อนไขสินค้าและการรับประกัน",
    },
    descriptionText: {
      enabled: true,
      text: "บูสต์เซิร์ฟเวอร์ทุกแพ็กเกจมีประกัน แจ้งเคลมได้ที่ **#เปิดตั๋ว** ทันที\n\n**ระยะเวลาการรับประกัน:**\n• บูสต์ 1 เดือน : รับประกัน 15-31 วัน\n• บูสต์ 3 เดือน : รับประกัน 70-92 วัน",
    },
    color: {
      enabled: true,
      hex: "#eab308",
    },
    thumbnail: {
      enabled: false,
      url: "",
    },
    image: {
      enabled: true,
      url: "",
    },
    fields: {
      enabled: true,
      items: [
        {
          id: "f1",
          name: "เงื่อนไขการเคลมบูสต์",
          value: "✅ **เคลมได้**: บูสต์หลุดโดยที่บัญชีบูสต์ยังอยู่ในเซิร์ฟเวอร์\n⛔ **เคลมไม่ได้**: บัญชีบูสต์ออกจากเซิร์ฟเวอร์หรือถูกเตะออก",
          inline: false,
        },
        {
          id: "f2",
          name: "⚠️ ข้อแนะนำสำคัญของทางร้าน",
          value: "1. ปิดบอทเตะผู้ใช้ไม่มีโปรไฟล์ (Alt/Raid Guard) ชั่วคราวขณะบูสต์\n2. แนะนำให้บันทึกประวัติการเข้าร่วมเซิร์ฟเวอร์เพื่อตรวจสอบย้อนหลัง",
          inline: false,
        },
      ],
    },
    footer: {
      enabled: true,
      text: "© MAMOMI STORE · Customer Protection Policy",
      iconUrl: "",
    },
    timestamp: {
      enabled: true,
    },
  },

  // ==========================================
  // 3. BOT NOTIFICATION & EVENT EMBEDS
  // ==========================================

  ticket_welcome: {
    key: "ticket_welcome",
    category: "ticket",
    name: "🎟️ ข้อความต้อนรับในห้องทิกเก็ต (Ticket Welcome)",
    description: "Embed ข้อความแรกที่จะแสดงในห้องทิกเก็ตส่วนตัวเมื่อสมาชิกกดเปิดตั๋ว",
    author: {
      enabled: true,
      name: "753BC Ticket Support",
      iconUrl: "",
    },
    title: {
      enabled: true,
      text: "🎫 ยินดีต้อนรับสู่ห้องติดต่อทีมงานส่วนตัว",
    },
    descriptionText: {
      enabled: true,
      text: "สวัสดี {user} ขอบคุณที่ติดต่อเรา\nกรุณาแจ้งรายละเอียดปัญหาหรือคำถามที่คุณต้องการความช่วยเหลือ\n\n> เจ้าหน้าที่จะเข้ามารับเคสและให้บริการโดยเร็วที่สุด",
    },
    color: {
      enabled: true,
      hex: "#10b981",
    },
    thumbnail: {
      enabled: false,
      url: "",
    },
    image: {
      enabled: false,
      url: "",
    },
    fields: {
      enabled: false,
      items: [],
    },
    footer: {
      enabled: true,
      text: "LynnBot Operations System • Ticket Desk",
      iconUrl: "",
    },
    timestamp: {
      enabled: true,
    },
  },

  attendance_clockin: {
    key: "attendance_clockin",
    category: "attendance",
    name: "🟢 แจ้งเตือนตอกบัตรเข้างานสำเร็จ (Clock In)",
    description: "Embed แจ้งเตือนเมื่อสตาฟกดปุ่มเข้างานสำเร็จ",
    author: {
      enabled: true,
      name: "Attendance Station",
      iconUrl: "",
    },
    title: {
      enabled: true,
      text: "🟢 บันทึกเวลาเข้างานสำเร็จ (CLOCK IN)",
    },
    descriptionText: {
      enabled: true,
      text: "{user} ได้ทำการลงเวลาเข้าเวรเรียบร้อยแล้ว\n\n• **เวลาเข้างาน:** {time}\n• **สถานะยศ:** {role_status}",
    },
    color: {
      enabled: true,
      hex: "#30d158",
    },
    thumbnail: {
      enabled: false,
      url: "",
    },
    image: {
      enabled: false,
      url: "",
    },
    fields: {
      enabled: false,
      items: [],
    },
    footer: {
      enabled: true,
      text: "LynnBot Attendance Station",
      iconUrl: "",
    },
    timestamp: {
      enabled: true,
    },
  },

  moderation_warn_member: {
    key: "moderation_warn_member",
    category: "moderation",
    name: "⚠️ ใบเตือนส่งตรงถึงสมาชิกใน DM (Warn Member)",
    description: "Embed แจ้งเตือนข้อหาและความผิดที่ส่งเข้ากล่องข้อความส่วนตัวของสมาชิก",
    author: {
      enabled: true,
      name: "Community Security Warning",
      iconUrl: "",
    },
    title: {
      enabled: true,
      text: "⚠️ คุณได้รับการแจ้งเตือนความผิด (Official Warning)",
    },
    descriptionText: {
      enabled: true,
      text: "เรียนคุณ {target_user}\nคุณได้รับการตักเตือนเนื่องจากละเมิดกฎของเซิร์ฟเวอร์\n\n• **เหตุผล:** {reason}\n• **มาตรการที่ใช้:** {action}\n• **จำนวนครั้งที่เตือนสะสม:** {warn_count} ครั้ง",
    },
    color: {
      enabled: true,
      hex: "#ff453a",
    },
    thumbnail: {
      enabled: false,
      url: "",
    },
    image: {
      enabled: false,
      url: "",
    },
    fields: {
      enabled: false,
      items: [],
    },
    footer: {
      enabled: true,
      text: "LynnBot Security System",
      iconUrl: "",
    },
    timestamp: {
      enabled: true,
    },
  },
};
