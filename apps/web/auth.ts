// https://github.com/nextauthjs/next-auth/issues/10568
// https://github.com/nextauthjs/next-auth/discussions/9950
import NextAuth, { NextAuthResult, User } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { ZodError } from "zod";
import { signInSchema } from "./lib/zod";

const authConfig = {
  providers: [
    Credentials({
      // You can specify which fields should be submitted, by adding keys to the `credentials` object.
      // e.g. domain, username, password, 2FA token, etc.
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        try {
          let user = null;

          const { email, password } =
            await signInSchema.parseAsync(credentials);

          // logic to salt and hash password
          // const pwHash = saltAndHashPassword(password);

          // // logic to verify if the user exists
          // user = await getUserFromDb(email, pwHash);
          user = {
            email: email,
            password: password,
          };

          console.log("Authorize : ", user);

          if (!user) {
            throw new Error("Invalid credentials.");
          }

          // return JSON object with the user data
          return user;
        } catch (error) {
          if (error instanceof ZodError) {
            // Return `null` to indicate that the credentials are invalid
            return null;
          }
        }
        return null;
      },
    }),
  ],
  callbacks: {
    session({ session, token, user }) {
      // `session.user.address` is now a valid property, and will be type-checked
      // in places like `useSession().data.user` or `auth().user`
      console.log(session);

      return {
        ...session,
        user: {
          ...session.user,
          // address: user.address,
        },
      };
    },
  },
};

const nextAuth = NextAuth(authConfig);

export const auth: NextAuthResult["auth"] = nextAuth.auth;
export const signIn: NextAuthResult["signIn"] = nextAuth.signIn;
export const { handlers, signOut } = nextAuth;
