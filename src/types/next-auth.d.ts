import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      discordId: string;
      username?: string | null;
      displayName?: string | null;
      avatar?: string | null;
      roles: string[];
      isAdmin: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    discordId?: string;
    username?: string | null;
    displayName?: string | null;
    avatar?: string | null;
    roles?: string[];
    isAdmin?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    discordId?: string;
    username?: string | null;
    displayName?: string | null;
    avatar?: string | null;
    roles?: string[];
    isAdmin?: boolean;
  }
}
