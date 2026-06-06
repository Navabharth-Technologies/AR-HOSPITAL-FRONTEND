import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AR-OPD_Handler",
};

export default function OPDLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
