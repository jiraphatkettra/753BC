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
