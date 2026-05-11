import { redirect } from "next/navigation";

export default async function LegacySignupStatusRedirect({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  redirect(`/convite/${token}`);
}
