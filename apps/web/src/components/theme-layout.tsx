"use client";

import { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

interface ThemeLayoutProps {
    children: ReactNode;
}

export function ThemeLayout({ children }: ThemeLayoutProps) {
    return (
        <div className="relative min-h-screen bg-background">
            <div className="absolute top-4 right-4 z-10">
                <ThemeToggle />
            </div>
            {children}
        </div>
    );
} 