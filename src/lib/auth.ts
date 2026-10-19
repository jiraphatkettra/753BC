import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";
import { isDiscordAdmin } from "@/lib/admin";
import { checkGuildMember, getDiscordAvatarUrl } from "@/lib/discord";
import { prisma } from "@/lib/prisma";

const isHttps = Boolean(
  (process.env.AUTH_URL || process.env.NEXTAUTH_URL)?.startsWith("https://")
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret:
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "build_fallback_secret_753bc_at_least_32_chars_long",
  trustHost: true,
  useSecureCookies: isHttps,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      issuer: "https://discord.com",
      authorization: {
        params: {
          scope: "identify email guilds guilds.members.read",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "discord" && profile) {
        const discordId = profile.id as string;
        const username = (profile.username as string) || (user.name as string) || "Discord User";
        const displayName = (profile.global_name as string) || username;
        const avatarUrl = getDiscordAvatarUrl(
          discordId,
          profile.avatar as string | null,
          profile.discriminator as string | undefined
        );

        // Sync or record user in database if PostgreSQL is available
        try {
          await prisma.$executeRawUnsafe(
            `
            INSERT INTO "users" ("id", "discordId", "username", "displayName", "avatar", "email", "role", "isActive", "balance", "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, $6, 'MEMBER'::"UserRole", true, 0, NOW(), NOW())
            ON CONFLICT ("discordId") 
            DO UPDATE SET 
              "username" = EXCLUDED."username",
              "displayName" = EXCLUDED."displayName",
              "avatar" = EXCLUDED."avatar",
              "email" = COALESCE(EXCLUDED."email", "users"."email"),
              "updatedAt" = NOW()
          `,
            `usr_${discordId.slice(-8)}_${Date.now().toString().slice(-4)}`,
            discordId,
            username,
            displayName,
            avatarUrl,
            user.email || null
          );
        } catch (dbErr) {
          // If DB insert fails (e.g. offline/read-only pooler), still allow sign-in to proceed gracefully
          console.warn("Notice: Database sync skipped on sign-in:", dbErr);
        }
      }
      return true;
    },

    async jwt({ token, user, account, profile }) {
      // Initial sign-in setup
      if (account?.provider === "discord" && profile) {
        const discordId = profile.id as string;
        token.id = user.id;
        token.discordId = discordId;
        token.username = (profile.username as string) || user.name || "Discord User";
        token.displayName = (profile.global_name as string) || token.username;
        token.avatar = getDiscordAvatarUrl(
          discordId,
          profile.avatar as string | null,
          profile.discriminator as string | undefined
        );
        token.isAdmin = isDiscordAdmin(discordId);

        // Fetch Discord Guild Member Roles
        try {
          const memberData = await checkGuildMember(discordId);
          if (memberData) {
            token.roles = memberData.roles;
          } else {
            token.roles = [];
          }
        } catch {
          token.roles = [];
        }
      }

      // Re-verify admin status on token refresh
      if (token.discordId) {
        token.isAdmin = isDiscordAdmin(token.discordId as string);
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) || (token.sub as string);
        session.user.discordId = token.discordId as string;
        session.user.username = token.username as string;
        session.user.displayName = token.displayName as string;
        session.user.avatar = token.avatar as string;
        session.user.roles = (token.roles as string[]) || [];
        session.user.isAdmin = Boolean(token.isAdmin);

        // Keep name and image in sync for standard NextAuth components
        session.user.name = token.displayName as string || token.username as string;
        session.user.image = token.avatar as string;
      }
      return session;
    },
  },
});
