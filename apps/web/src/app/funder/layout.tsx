import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Shieldly - Funder Dashboard",
    description: "Stake funds, earn yield, and participate in policy voting",
};

export default function FunderLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="min-h-screen bg-background">
            {children}
        </div>
    );
} 