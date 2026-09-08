import type { Metadata } from "next";
import { AppProviders } from "@/components/app-providers";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "DreamRooms — social prediction rooms",
  description: "Gather around live Event Contract predictions with clear market context.",
  applicationName: "DreamRooms",
  keywords: ["DreamDEX", "prediction markets", "Somnia", "Event Contracts"],
  icons: { icon: "/icon.svg" },
  openGraph: {
    title: "DreamRooms — social prediction rooms",
    description: "Compare community conviction with live DreamDEX odds.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AppProviders>
          <ToastProvider>{children}</ToastProvider>
        </AppProviders>
      </body>
    </html>
  );
}
