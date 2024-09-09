import Credentials from "next-auth/providers/credentials";
import NextAuth from "next-auth";
import axios from "axios";
// Your own logic for dealing with plaintext password strings; be careful!
import type { NextAuthConfig } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { baseUrl } from "./utils/constants";


async function refreshAccessToken(token: any) {
  try {
    const url = ""
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
    })

    const refreshedTokens = await response.json()

    if (!response.ok) {
      throw refreshedTokens
    }

    return {
      ...token,
      access_token: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refresh_token: refreshedTokens.refresh_token ?? token.refreshToken, // Fall back to old refresh token
    }
  } catch (error) {
    console.log(error)

    return {
      ...token,
      error: "RefreshAccessTokenError",
    }
  }
}


export default {
  providers: [
    Credentials({
      // You can specify which fields should be submitted, by adding keys to the credentials object.
      // e.g. domain, username, password, 2FA token, etc.
      credentials: {
        email: { label: "email", type: "email", required: true },
        password: { label: "password", type: "password", required: true },
      },
      authorize: async (credentials) => {
        let user = null;

        const res = await axios.post(
          baseUrl + `auth/login`,
          {
            email: credentials.email,
            password: credentials.password,
          }
        );


        if (res.status === 200) {
          return user = res.data;
        } else {
          return user;

        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // profile(profile) {
      //   return {
      //     id: profile.sub,
      //     given_name: profile.given_name,
      //     family_name: profile.family_name,
      //     email: profile.email,
      //     image: profile.picture,
      //   };
      // },
    }),

  ],
  session: {
    strategy: "jwt",
    maxAge: 15 * 60,
    updateAge: 10 * 60
  },
  callbacks: {
    jwt: async ({ token, user, profile, session, account, trigger }) => {
      if (trigger === "update") {
        token.hascompany = session?.hascompany
      } else {
        if (!profile) {
          if (user) {
            token.id = user?.id;
            token.access_token = (user as any)?.accessToken;
            token.refresh_token = (user as any)?.refreshToken;
            token.hascompany = (user as any)?.hascompany;
            token.companyId = (user as any)?.companyId;
          }

        } else {
          try {
            const res = await axios.post(process.env.BASEURL! + "auth/google", {
              firstname: profile?.given_name,
              lastname: profile?.family_name,
              email: profile?.email,
              googleId: account?.providerAccountId,
            });

            console.log(res.data?.data, "data")


            if (res.status === 200 || res.status === 201) {
              token.access_token = res.data?.data?.token?.accessToken;
              token.refresh_token = res.data?.data?.token?.refreshToken;
              token.hascompany = res.data?.data?.token?.hascompany;
              token.companyId = res.data?.data?.token?.companyId;
              token.role = res.data?.data?.token?.role;
            }
          } catch (error) {
            console.error("Error fetching tokens from your API:", error);
          }
        }
      }


      return token;
    },
    session: async ({ session, token }) => {
      return {
        ...session,
        user: {
          ...session?.user,
          access_token: token?.access_token!,
          refresh_token: token?.refresh_token!,
          hascompany: token?.hascompany!,
          companyId: token?.companyId!,
          role:token?.role
        }
      }
    },
  },
  secret: process.env.AUTH_SECRET!,
  pages: {
    // signIn: "/login",
  },
} satisfies NextAuthConfig;
