"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ReactNode } from "react";

export interface ThemeProviderProps {
    children: ReactNode;
    defaultTheme?: string;
    storageKey?: string;
    enableSystem?: boolean;
    enableColorScheme?: boolean;
    forcedTheme?: string;
    disableTransitionOnChange?: boolean;
    themes?: string[];
}

export function ThemeProvider({
    children,
    ...props
}: ThemeProviderProps) {
    return (
        <NextThemesProvider attribute="class" defaultTheme="system" enableSystem {...props}>
            {children}
        </NextThemesProvider>
    );
} 