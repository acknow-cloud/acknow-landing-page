import type {Metadata} from "next";
import {Geist, Geist_Mono} from "next/font/google";
import { Analytics } from "@vercel/analytics/next"

import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Acknow — Stay tuned",
    description: "Automated incident remediation platform.",
    keywords: [
        "incident remediation",
        "automated remediation",
        "incident response platform",
        "DevOps automation",
        "SRE tools",
        "incident management",
        "alert management",
        "observability automation",
        "runbook automation",
        "cloud infrastructure security",
        "production resilience",
        "compliance audit logs",
        "error budget tracking",
        "AI incident response"
    ]
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
        <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
        {children}
        <Analytics />
        </body>
        </html>
    );
}
