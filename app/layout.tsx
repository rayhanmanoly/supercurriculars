import { Inter as FontSans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/toaster";
import ClientLayout from "./client-layout";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "BSAK Supercurriculars",
  description: "Access resources and mentoring to support your learning",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
          "min-h-screen w-full bg-background font-sans antialiased",
          fontSans.variable
        )}>
          <ClientLayout>
            {children}
          </ClientLayout>
        <Toaster />
      </body>
    </html>
  );
}