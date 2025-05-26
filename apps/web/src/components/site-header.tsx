"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

interface SiteHeaderProps {
    title?: string;
    subtitle?: string;
    userInfo?: {
        label: string;
        value: string;
    };
    actionLabel?: string;
    actionHref?: string;
    onAction?: () => void;
}

export function SiteHeader({
    title = "Shieldly",
    subtitle,
    userInfo,
    actionLabel,
    actionHref,
    onAction,
}: SiteHeaderProps) {
    return (
        <header className="border-b bg-card">
            <div className="container mx-auto py-4 px-4 flex justify-between items-center">
                <div className="flex items-center">
                    <h1 className="text-xl font-bold">{title}</h1>
                    {subtitle && (
                        <>
                            <span className="mx-2 text-zinc-300">|</span>
                            <span className="text-muted-foreground">{subtitle}</span>
                        </>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    {userInfo && (
                        <div className="text-right">
                            <div className="text-sm text-muted-foreground">{userInfo.label}</div>
                            <div className="text-sm font-medium">{userInfo.value}</div>
                        </div>
                    )}

                    {(actionLabel && actionHref) && (
                        <Button variant="outline" size="sm" asChild>
                            <Link href={actionHref}>{actionLabel}</Link>
                        </Button>
                    )}

                    {(actionLabel && onAction) && (
                        <Button variant="outline" size="sm" onClick={onAction}>
                            {actionLabel}
                        </Button>
                    )}

                    <ThemeToggle />
                </div>
            </div>
        </header>
    );
} 