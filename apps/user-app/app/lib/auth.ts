import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import db from "@repo/db/client";
import { User } from "next-auth";
// interface User extends User{
//   phone: string;
// }
export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        phone: { label: "Phone number", type: "text", placeholder: "1231231231" },
        password: { label: "Password", type: "password" },
      },
      type: "credentials",
      async authorize(
        credentials: Record<"phone" | "password", string> | undefined,
      ): Promise<User | null> {
        if (!credentials?.phone || !credentials?.password) {
          return null;
        }

        const existingUser = await db.user.findUnique({
          where: {
            number: credentials.phone,
          },
        });

        if (existingUser) {
          const passwordValidation = await bcrypt.compare(
            credentials.password,
            existingUser.password
          );

          if (passwordValidation) {
            return {
              id: existingUser.id.toString(),
              name: existingUser.name ?? undefined,
              email: existingUser.email ?? undefined,
            };
          }
          return null;
        }
        try {
          const hasedpass= await bcrypt.hash(credentials.password,10);
          const user= await db.user.create({
            data:{
              number: credentials.phone,password: hasedpass
            }
          })
          const userbal= await db.balance.create({
            data:{amount:0,locked:0,userId:user.id
            }
          })
          return {
            id:user.id.toString(),
            name:user.name,
            email:user.number
            };
        } catch (error) {
          console.log(error);
        }
        return null;

      },
    }),
  ],
  secret: process.env.JWT_SECRET || "secret",
  callbacks: {
    async session({ token, session }:any) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }

      return session;
    },
  },
};
