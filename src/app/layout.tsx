"use client";
import '@telegram-apps/telegram-ui/dist/styles.css';
import "./globals.css";
import React from "react";
import {TonConnectUIProvider} from "@tonconnect/ui-react";
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
        <body style={{
            minHeight: "100vh",
            background: "#f7f8fa",
            padding: "0 0 70px 0",
            position: "relative",
            fontFamily: "Inter, sans-serif",
            maxWidth: "480px",
            margin: "0 auto",
        }}>
        <TonConnectUIProvider manifestUrl="https://tonloan.com/tonconnect-manifest.json">
        <Header />
            {children}
        <Footer  />
        </TonConnectUIProvider>
        </body>
        </html>
    );
}
