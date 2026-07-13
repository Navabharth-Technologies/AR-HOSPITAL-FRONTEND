import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CapgoProvider } from "./providers/CapgoProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AR Hospital - Smart OPD",
  description: "Next-generation healthcare operating system",
  icons: {
    icon: "/assets/ar-logo-new.png",
  },
};

export const viewport: import("next").Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-medical-dark text-gray-900 selection:bg-medical-maroon selection:text-white`}>
        {/* Background elements */}
        <div className="fixed inset-0 z-[-1] overflow-hidden bg-medical-dark">
          <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-medical-light-silver rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
          <div className="absolute top-[20%] right-[-10%] w-[30rem] h-[30rem] bg-medical-maroon rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-[-20%] left-[20%] w-[40rem] h-[40rem] bg-medical-silver rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
        <CapgoProvider>
          {children}
        </CapgoProvider>
      </body>
    </html>
  );
}
