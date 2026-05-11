import { AuthEntry } from "@/components/auth-entry";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email = "" } = await searchParams;

  return <AuthEntry defaultEmail={email} />;
}
