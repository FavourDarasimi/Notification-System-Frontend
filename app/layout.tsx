import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { AppHeader } from "@/components/app-header";
import { AuthProvider } from "@/lib/auth-context";
import "@/tokens.css";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Notify — Notification System Client",
  description: "Test client for the notification system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <AuthProvider>
          <AppHeader />
          <main className="flex w-full flex-1 flex-col">{children}</main>
          <footer className="container">
            <div className="app-footer">
              Notification System · test client — Pusher + Celery + Django
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
