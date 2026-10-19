/**
 * 753BC Discord Bot Service
 * Integrates directly with Discord REST API v10 using the bot token.
 */

export interface DiscordChannel {
  id: string;
  name: string;
  type: number; // 0 = GUILD_TEXT, 5 = GUILD_ANNOUNCEMENT
  parentId?: string;
  position?: number;
}

export interface DiscordRole {
  id: string;
  name: string;
  color: string;
  position: number;
}

export interface EmbedField {
  id?: string;
  name: string;
  value: string;
  inline?: boolean;
}

export interface DiscordEmbedPayload {
  title?: string;
  url?: string;
  description?: string;
  color?: number | string;
  author?: {
    name: string;
    icon_url?: string;
    url?: string;
  };
  thumbnail?: {
    url: string;
  };
  image?: {
    url: string;
  };
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
  footer?: {
    text: string;
    icon_url?: string;
  };
  timestamp?: string;
}

function getBotToken(): string {
  const token = (process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN || "").trim();
  if (!token) {
    throw new Error("DISCORD_BOT_TOKEN หรือ DISCORD_TOKEN ยังไม่ได้ตั้งค่าใน .env");
  }
  return token.replace(/^["']|["']$/g, "");
}

function getGuildId(): string {
  const guildId = (process.env.DISCORD_GUILD_ID || "").trim();
  if (!guildId) {
    throw new Error("DISCORD_GUILD_ID ยังไม่ได้ตั้งค่าใน .env");
  }
  return guildId.replace(/^["']|["']$/g, "");
}

/**
 * Fetch text channels from the Discord guild
 */
export async function fetchGuildChannels(): Promise<DiscordChannel[]> {
  const token = getBotToken();
  const guildId = getGuildId();

  const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
    headers: {
      Authorization: `Bot ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("fetchGuildChannels error:", res.status, errorText);
    throw new Error(`Failed to fetch channels: ${res.statusText}`);
  }

  const channels: any[] = await res.json();
  return channels
    .filter((c) => c.type === 0 || c.type === 5)
    .map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      parentId: c.parent_id,
      position: c.position,
    }))
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
}

/**
 * Fetch roles from the Discord guild
 */
export async function fetchGuildRoles(): Promise<DiscordRole[]> {
  const token = getBotToken();
  const guildId = getGuildId();

  const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
    headers: {
      Authorization: `Bot ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("fetchGuildRoles error:", res.status, errorText);
    throw new Error(`Failed to fetch roles: ${res.statusText}`);
  }

  const rawRoles: any[] = await res.json();
  return rawRoles
    .filter((r) => r.id !== guildId)
    .map((r) => ({
      id: r.id,
      name: r.name,
      color: r.color ? `#${r.color.toString(16).padStart(6, "0")}` : "#ffffff",
      position: r.position,
    }))
    .sort((a, b) => b.position - a.position);
}

/**
 * Format color into integer for Discord Embed
 */
export function parseColorToInt(color: number | string | undefined): number {
  if (typeof color === "number") return color;
  if (!color) return 0x070809;
  const hex = color.replace("#", "").trim();
  const parsed = parseInt(hex, 16);
  return isNaN(parsed) ? 0x070809 : parsed;
}

/**
 * Get native Discord Interactive Button Components for /panel commands
 */
export function getPanelComponents(panelKey: string): any[] | undefined {
  switch (panelKey) {
    case "ticket_panel":
      return [
        {
          type: 1, // ActionRow
          components: [
            {
              type: 2, // Button
              style: 1, // Primary (Blurple)
              custom_id: "ticket_create",
              label: "เปิดทิกเก็ตติดต่อทีมงาน • Open Ticket",
              emoji: { name: "📩" },
            },
          ],
        },
      ];
    case "shop_panel":
      return [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 1,
              custom_id: "panel_shop_browse",
              label: "เลือกซื้อยศ • Browse Roles",
              emoji: { name: "🛒" },
            },
            {
              type: 2,
              style: 2, // Secondary (Gray)
              custom_id: "panel_wallet_balance",
              label: "กระเป๋าเงิน • My Wallet",
              emoji: { name: "💳" },
            },
            {
              type: 2,
              style: 2,
              custom_id: "panel_wallet_topup",
              label: "วิธีเติมเงิน • Top Up Info",
              emoji: { name: "💸" },
            },
          ],
        },
      ];
    case "attendance_panel":
      return [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 3, // Success (Green)
              custom_id: "panel_att_in",
              label: "เข้างาน • Clock In",
              emoji: { name: "🟢" },
            },
            {
              type: 2,
              style: 4, // Danger (Red)
              custom_id: "panel_att_out",
              label: "ออกงาน • Clock Out",
              emoji: { name: "🔴" },
            },
            {
              type: 2,
              style: 2,
              custom_id: "panel_att_status",
              label: "บันทึกของฉัน • My Status",
              emoji: { name: "📊" },
            },
          ],
        },
      ];
    case "leave_panel":
      return [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 1,
              custom_id: "panel_leave_request",
              label: "ยื่นคำขอลางาน • Request Leave",
              emoji: { name: "📝" },
            },
            {
              type: 2,
              style: 2,
              custom_id: "panel_leave_status",
              label: "เช็คสถานะใบลา • My Requests",
              emoji: { name: "🔍" },
            },
          ],
        },
      ];
    case "moderation_panel":
      return [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 4,
              custom_id: "panel_warn_create",
              label: "ออกใบเตือน / ลงโทษ • Warn Member",
              emoji: { name: "⚠️" },
            },
            {
              type: 2,
              style: 2,
              custom_id: "panel_warn_check",
              label: "ประวัติการเตือน • Check Warnings",
              emoji: { name: "🔍" },
            },
          ],
        },
      ];
    case "admin_hub_panel":
      return [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 2,
              custom_id: "panel_admin_staff",
              label: "รายชื่อทีมงาน • Staff List",
              emoji: { name: "👥" },
            },
            {
              type: 2,
              style: 2,
              custom_id: "panel_admin_leaves",
              label: "คำขอลารออนุมัติ • Pending Leaves",
              emoji: { name: "⏳" },
            },
            {
              type: 2,
              style: 2,
              custom_id: "panel_admin_backup",
              label: "สำรองข้อมูลเซิร์ฟเวอร์ • Backup Server",
              emoji: { name: "💾" },
            },
          ],
        },
      ];
    case "mamomi_nitro":
      return [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 1,
              custom_id: "store_nitro_buy",
              label: "สั่งซื้อสินค้า",
              emoji: { name: "🛒" },
            },
            {
              type: 2,
              style: 3,
              custom_id: "store_nitro_benefits",
              label: "ประโยชน์ไนโตร",
              emoji: { name: "💎" },
            },
            {
              type: 2,
              style: 2,
              custom_id: "panel_wallet_balance",
              label: "เช็คยอดเงิน",
              emoji: { name: "ℹ️" },
            },
          ],
        },
      ];
    case "mamomi_boost":
      return [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 3,
              custom_id: "store_boost_topup",
              label: "เติมเครดิต",
              emoji: { name: "💸" },
            },
            {
              type: 2,
              style: 2,
              custom_id: "panel_wallet_balance",
              label: "เช็คเครดิต",
              emoji: { name: "👁️" },
            },
            {
              type: 2,
              style: 2,
              custom_id: "store_boost_terms",
              label: "เงื่อนไขสินค้า",
              emoji: { name: "🛡️" },
            },
          ],
        },
      ];
    case "mamomi_auto_system":
      return [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 3,
              custom_id: "panel_wallet_topup",
              label: "เติมเงิน",
              emoji: { name: "💸" },
            },
            {
              type: 2,
              style: 1,
              custom_id: "quest_free_points",
              label: "รับพ้อยฟรี",
              emoji: { name: "🎁" },
            },
            {
              type: 2,
              style: 2,
              custom_id: "panel_wallet_balance",
              label: "เช็คยอดเงิน",
              emoji: { name: "ℹ️" },
            },
          ],
        },
      ];
    default:
      return undefined;
  }
}

/**
 * Send an embed message to a Discord channel
 */
export async function sendDiscordEmbed(
  channelId: string,
  embedPayload: DiscordEmbedPayload,
  content?: string,
  components?: any[]
): Promise<{ id: string; channel_id: string }> {
  const token = getBotToken();

  const discordEmbed: any = {
    color: parseColorToInt(embedPayload.color),
  };

  if (embedPayload.title) {
    discordEmbed.title = embedPayload.title;
    if (embedPayload.url) discordEmbed.url = embedPayload.url;
  }

  if (embedPayload.description) {
    discordEmbed.description = embedPayload.description;
  }

  if (embedPayload.author?.name) {
    discordEmbed.author = {
      name: embedPayload.author.name,
      icon_url: embedPayload.author.icon_url || undefined,
      url: embedPayload.author.url || undefined,
    };
  }

  if (embedPayload.thumbnail?.url) {
    discordEmbed.thumbnail = { url: embedPayload.thumbnail.url };
  }

  if (embedPayload.image?.url) {
    discordEmbed.image = { url: embedPayload.image.url };
  }

  if (embedPayload.footer?.text) {
    discordEmbed.footer = {
      text: embedPayload.footer.text,
      icon_url: embedPayload.footer.icon_url || undefined,
    };
  }

  if (embedPayload.timestamp) {
    discordEmbed.timestamp = embedPayload.timestamp;
  }

  if (embedPayload.fields && embedPayload.fields.length > 0) {
    discordEmbed.fields = embedPayload.fields.map((f) => ({
      name: f.name,
      value: f.value,
      inline: Boolean(f.inline),
    }));
  }

  const payloadBody: any = {
    content: content || undefined,
    embeds: [discordEmbed],
  };

  if (components && components.length > 0) {
    payloadBody.components = components;
  }

  const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bot ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payloadBody),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const message = errorBody.message || `${res.status} ${res.statusText}`;
    throw new Error(`Discord API Error: ${message}`);
  }

  return await res.json();
}
