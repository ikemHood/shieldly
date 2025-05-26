import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/lib/context/theme";
import { StarknetProvider } from "@/lib/context/starknet";
import type { Metadata } from "next";
import { Share_Tech } from "next/font/google";
import "./globals.css";

const font = Share_Tech({ subsets: ["latin"], weight: ["400"], style: ["normal"] });

export const metadata: Metadata = {
  title: "Shieldly - Micro-Insurance Platform",
  description: "Accessible and affordable pay-as-you-go insurance for emerging markets",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${font.className} bg-background`}>
        <ThemeProvider>
          <StarknetProvider>
            {children}
            <Toaster />
          </StarknetProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
