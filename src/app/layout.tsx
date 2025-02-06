"use client";
import '@telegram-apps/telegram-ui/dist/styles.css';
import "./globals.css";
import React from "react";
import {TonConnectUIProvider} from "@tonconnect/ui-react";

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
        <body>
        <TonConnectUIProvider manifestUrl="https://tonloan.com/tonconnect-manifest.json">
            {children}
        </TonConnectUIProvider>
        </body>
        </html>
    );
}
