import type { ReactNode } from "react";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { WalletProvider } from "../components/wallet-provider";

export const metadata = {
  title: "Mediation Rooms",
  description:
    "Plug-and-play mediation layer. Add a dispute window before execution for contracts, marketplaces and digital platforms.",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}
