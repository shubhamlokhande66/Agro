import { DashboardShell } from "@/components/layout/DashboardShell";

export default function DashLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
