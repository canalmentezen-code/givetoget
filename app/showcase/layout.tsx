import { auth } from "@/lib/auth";
import DashboardLayout from "../(dashboard)/layout";
import { PublicLayout } from "@/components/ui/PublicLayout";

export default async function ShowcaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (session?.user) {
    return <DashboardLayout>{children}</DashboardLayout>;
  }

  return <PublicLayout>{children}</PublicLayout>;
}
