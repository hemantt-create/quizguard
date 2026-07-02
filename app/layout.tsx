import type { Metadata } from "next";
import { AppHeader } from "@/app/_components/app-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "QuizGuard",
  description:
    "Secure online quiz platform for weekly departmental assessments",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        <AppHeader />
        {children}
      </body>
    </html>
  );
}
