import type { Metadata } from "next";

import { AuthEntry } from "@/components/auth-entry";

export const metadata: Metadata = {
  title: "Entrar",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email = "" } = await searchParams;

  return <AuthEntry defaultEmail={email} />;
}
