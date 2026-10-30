/**
 * Discord API Helper Utility
 * Interacts with Discord API v10 for Guild Membership, Roles, and Avatars
 */

export interface DiscordGuildMember {
  roles: string[];
  nick: string | null;
  avatar: string | null;
  joined_at: string;
  user?: {
    id: string;
    username: string;
    global_name: string | null;
    avatar: string | null;
  };
}

export async function checkGuildMember(userId: string): Promise<DiscordGuildMember | null> {
  const botToken = process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;

  if (!botToken || !guildId || !userId) {
    return null;
  }

  try {
    const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${userId}`, {
      headers: {
        Authorization: `Bot ${botToken}`,
      },
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    if (!res.ok) {
      if (res.status === 404) {
        // User is not a member of the guild
        return null;
      }
      console.warn(`Discord API error [${res.status}]:`, await res.text());
      return null;
    }

    const data: DiscordGuildMember = await res.json();
    return data;
  } catch (err) {
    console.error("Failed to fetch Discord guild member:", err);
    return null;
  }
}

export function getDiscordAvatarUrl(userId: string, avatarHash?: string | null, discriminator = "0"): string {
  if (avatarHash) {
    const format = avatarHash.startsWith("a_") ? "gif" : "png";
    return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.${format}?size=256`;
  }
  const defaultIndex = parseInt(discriminator, 10) % 5 || 0;
  return `https://cdn.discordapp.com/embed/avatars/${defaultIndex}.png`;
}

export interface DiscordGuildChannel {
  id: string;
  name: string;
  type: number;
  parent_id?: string | null;
  position?: number;
}

export async function fetchGuildChannels(): Promise<DiscordGuildChannel[]> {
  const botToken = process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;

  if (!botToken || !guildId) {
    return [];
  }

  try {
    const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
      headers: {
        Authorization: `Bot ${botToken}`,
      },
      next: { revalidate: 30 },
    });

    if (!res.ok) {
      console.warn(`Discord API channels error [${res.status}]:`, await res.text());
      return [];
    }

    const data: DiscordGuildChannel[] = await res.json();
    return data;
  } catch (err) {
    console.error("Failed to fetch Discord guild channels:", err);
    return [];
  }
}

/**
 * Send Direct Message (DM) to a Discord user via Discord Bot REST API
 */
export async function sendDiscordDirectMessage(
  userId: string,
  message: { content?: string; embeds?: any[] }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const botToken = process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN;
  if (!botToken || !userId) {
    return { success: false, error: "Missing botToken or userId" };
  }

  try {
    // 1. Create or get existing DM channel with recipient
    const dmRes = await fetch("https://discord.com/api/v10/users/@me/channels", {
      method: "POST",
      headers: {
        Authorization: `Bot ${botToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ recipient_id: userId }),
    });

    if (!dmRes.ok) {
      const errText = await dmRes.text();
      console.warn(`[Discord DM] Failed to create DM channel with ${userId}:`, errText);
      return { success: false, error: errText };
    }

    const dmChannel = await dmRes.json();
    const channelId = dmChannel.id;

    // 2. Post the DM message to the channel
    const msgRes = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bot ${botToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    if (!msgRes.ok) {
      const errText = await msgRes.text();
      console.warn(`[Discord DM] Failed to send message to DM channel ${channelId}:`, errText);
      return { success: false, error: errText };
    }

    const msgData = await msgRes.json();
    return { success: true, messageId: msgData.id };
  } catch (err: any) {
    console.error(`[Discord DM] Exception sending DM to ${userId}:`, err);
    return { success: false, error: err.message };
  }
}

/**
 * Notify user in Discord DM when Admin confirms redemption payout
 */
export async function sendCandyPayoutDMNotification(params: {
  discordId: string;
  amount: number;
  bahtAmount: number;
  payoutTarget: string;
  accountName?: string | null;
  redemptionId: string;
  paidAt: Date;
}): Promise<{ success: boolean; error?: string }> {
  const embed = {
    title: "💸 ยืนยันการโอนเงินรางวัลสำเร็จ — 753BC Trick or Treat",
    description: `สวัสดีครับ <@${params.discordId}>!\nทางทีมงาน **753BC** ได้ดำเนินการโอนเงินรางวัลจากกิจกรรม **เปลี่ยนลูกอมให้เป็นเงิน (Trick or Treat)** เข้าบัญชีของคุณเรียบร้อยแล้ว`,
    color: 0x10b981, // Emerald Green
    fields: [
      {
        name: "🍬 จำนวนลูกอมที่แลก",
        value: `**${params.amount.toLocaleString()}** ลูก`,
        inline: true,
      },
      {
        name: "💵 ยอดเงินที่โอน",
        value: `**฿${params.bahtAmount.toLocaleString()}** บาท`,
        inline: true,
      },
      {
        name: "อัตราแลกเปลี่ยน",
        value: "1 ลูกอม = 1 บาท",
        inline: true,
      },
      {
        name: "📱 บัญชีพร้อมเพย์",
        value: `\`${params.payoutTarget}\``,
        inline: true,
      },
      {
        name: "👤 ชื่อบัญชีผู้รับ",
        value: params.accountName || "ไม่ระบุชื่อ",
        inline: true,
      },
      {
        name: "🔖 รหัสคำขอแลกเงิน",
        value: `\`#${params.redemptionId.slice(-8)}\``,
        inline: true,
      },
    ],
    footer: {
      text: "753BC Community • ขอขอบคุณที่ร่วมสนุกในกิจกรรม Trick or Treat!",
    },
    timestamp: params.paidAt.toISOString(),
  };

  return sendDiscordDirectMessage(params.discordId, {
    content: `🔔 <@${params.discordId}> แอดมินได้ทำการโอนเงินรางวัลกิจกรรม Trick or Treat ให้คุณเรียบร้อยแล้ว! ตรวจสอบรายละเอียดด้านล่าง:`,
    embeds: [embed],
  });
}


