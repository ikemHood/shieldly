import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Shieldly - Admin Dashboard",
    description: "Manage users, policies, claims, and platform settings",
};

export default function AdminLayout({
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