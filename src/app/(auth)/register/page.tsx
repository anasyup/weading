import { prisma } from "@/lib/db";
import RegisterForm from "@/components/auth/register-form";

export const metadata = { title: "Create account" };
export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const countries = await prisma.country.findMany({
    where: { status: "ACTIVE" },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, currency: true },
  });
  return <RegisterForm countries={countries} />;
}
