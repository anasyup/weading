import ResetForm from "@/components/auth/reset-form";

export const metadata = { title: "Reset password" };

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <ResetForm token={token} />;
}
