import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      hasNickname?: boolean | null;
    };
  }

  interface Profile {
    email_verified?: boolean;
    email?: string;
    name?: string;
    picture?: string;
  }
} 