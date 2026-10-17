/**
 * Admin Access Control Utility for 753BC Platform
 * Reads authorized Discord User IDs from process.env.ADMIN_DISCORD_IDS
 */

export function getAdminDiscordIds(): string[] {
  const raw = process.env.ADMIN_DISCORD_IDS || "";
  return raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export function isDiscordAdmin(discordId?: string | null): boolean {
  if (!discordId) return false;
  const adminIds = getAdminDiscordIds();
  return adminIds.includes(discordId.trim());
}
