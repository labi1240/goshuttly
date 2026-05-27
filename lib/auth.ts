import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { organization } from "better-auth/plugins/organization";
import { prisma } from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    },
  },
  plugins: [
    // Multi-tenant orgs back our ShuttleCompany + Operator model.
    // Defaults: roles are "owner" | "admin" | "member"; teams disabled.
    // TODO: configure custom roles to match OperatorRole exactly
    // (OWNER/MANAGER/DISPATCHER/FINANCE) once the operator-invite UI lands.
    organization(),
  ],
});

export type Session = typeof auth.$Infer.Session;
