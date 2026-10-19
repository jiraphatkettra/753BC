export interface RoleTier {
  id: string;
  role: string;
  hours: number;
  badge: string;
  description: string;
}

export interface CommunityConfig {
  name: string;
  guildId: string;
  leaderboard: {
    roles: RoleTier[];
  };
  discordInviteUrl: string;
  topup: {
    minAmount: number;
    maxAmount: number;
    presets: number[];
    promptPayId: string;
    accountName: string;
    bankName: string;
  };
}

export const COMMUNITY_CONFIG: CommunityConfig = {
  name: "753BC",
  guildId: process.env.DISCORD_GUILD_ID || "1549749097412431896",
  discordInviteUrl: process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || "https://discord.gg/6zcbZ47b5t",
  leaderboard: {
    roles: [
      {
        id: "trainee",
        role: "Trainee Member",
        hours: 5,
        badge: "LVL_01",
        description: "เริ่มต้นสะสมเวลาพูดคุยในห้องเสียง 753BC",
      },
      {
        id: "active",
        role: "Active Speaker",
        hours: 20,
        badge: "LVL_02",
        description: "สมาชิกที่มีบทบาทประจำห้องเสียง",
      },
      {
        id: "veteran",
        role: "Voice Veteran",
        hours: 50,
        badge: "LVL_03",
        description: "นักสนทนาตัวยง ปลดล็อกสิทธิพิเศษดิสคอร์ด",
      },
      {
        id: "elite",
        role: "Elite Vocalist",
        hours: 100,
        badge: "LVL_04",
        description: "สมาชิกระดับสูง มีสัญลักษณ์พิเศษข้างชื่อ",
      },
      {
        id: "mythic",
        role: "Mythic Sovereign",
        hours: 250,
        badge: "LVL_05",
        description: "ตำนานแห่ง 753BC พร้อมสิทธิเข้าร่วมห้อง VIP",
      },
    ],
  },
  topup: {
    minAmount: 20,
    maxAmount: 50000,
    presets: [50, 100, 200, 500, 1000],
    promptPayId: process.env.PROMPTPAY_ID || process.env.NEXT_PUBLIC_PROMPTPAY_ID || "0954268212",
    accountName: process.env.PROMPTPAY_ACCOUNT_NAME || process.env.NEXT_PUBLIC_PROMPTPAY_ACCOUNT_NAME || "นายจิรภัทร เกตุตรา",
    bankName: process.env.PROMPTPAY_BANK_NAME || "พร้อมเพย์ (PromptPay QR)",
  },
};
