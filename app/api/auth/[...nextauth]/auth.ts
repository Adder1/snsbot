import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile, trigger, user }) {
      // 로그인 시 처리
      if (trigger === "signIn" && account && profile) {
        try {
          console.log("SignIn Profile:", profile);
          
          if (!profile.sub) {
            console.error("No profile.sub found");
            return token;
          }

          const dbUser = await prisma.user.upsert({
            where: { id: profile.sub },
            update: {
              name: profile.name,
              email: profile.email,
              image: profile.picture,
            },
            create: {
              id: profile.sub,
              name: profile.name,
              email: profile.email ?? "",
              image: profile.picture,
            },
          });

          console.log("DB User:", dbUser);

          // 토큰에 사용자 정보 명시적으로 추가
          token.id = dbUser.id;
          token.email = dbUser.email;
          token.name = dbUser.name;
          token.image = dbUser.image;
          token.hasNickname = !!dbUser.nickname;
        } catch (error) {
          console.error("Error in jwt callback:", error);
        }
      }

      // 기존 토큰 정보 유지
      return {
        ...token,
        id: token.id || user?.id,
      };
    },

    async session({ session, token }) {
      // 토큰 정보를 세션에 명시적으로 추가
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.image as string;
        session.user.hasNickname = token.hasNickname as boolean;
      }

      console.log("Session in callback:", JSON.stringify(session, null, 2));
      return session;
    },
    async redirect({ url, baseUrl }) {
      // 절대 URL인 경우
      if (url.startsWith(baseUrl)) return url;
      // 상대 URL인 경우
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      return baseUrl;
    },
  },
  events: {
    async signIn({ user, account, profile }) {
      if (!user.email || !profile?.sub) return;

      try {
        const dbUser = await prisma.user.findUnique({
          where: { id: profile.sub },
        });

        if (!dbUser?.nickname) {
          // 닉네임이 없는 경우의 처리는 클라이언트에서 수행
          return;
        }
      } catch (error) {
        console.error("Error in signIn event:", error);
      }
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
}; 