import dotenv from "dotenv";
import path from "path";

// Load from root .env or local .env
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });
dotenv.config();

export const ENV = {
  BOT_TOKEN: (process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN || "").trim().replace(/^["']|["']$/g, ""),
  CLIENT_ID: (process.env.DISCORD_CLIENT_ID || "").trim().replace(/^["']|["']$/g, ""),
  GUILD_ID: (process.env.DISCORD_GUILD_ID || "").trim().replace(/^["']|["']$/g, ""),
  ADMIN_DISCORD_IDS: (process.env.ADMIN_DISCORD_IDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean),
  ADMIN_ROLE_IDS: (process.env.CANDY_ADMIN_ROLE_IDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean),
  DATABASE_URL: process.env.DATABASE_URL || "",
};

export function validateEnv() {
  if (!ENV.BOT_TOKEN) {
    throw new Error("Missing DISCORD_BOT_TOKEN or DISCORD_TOKEN in environment");
  }
  if (!ENV.GUILD_ID) {
    throw new Error("Missing DISCORD_GUILD_ID in environment");
  }
  if (!ENV.CLIENT_ID) {
    throw new Error("Missing DISCORD_CLIENT_ID in environment");
  }
}

export function isUserAdmin(userId: string, userRoles: string[] = []): boolean {
  if (ENV.ADMIN_DISCORD_IDS.includes(userId)) return true;
  if (ENV.ADMIN_ROLE_IDS.some((roleId) => userRoles.includes(roleId))) return true;
  return false;
}

