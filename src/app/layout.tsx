"use client";
import '@telegram-apps/telegram-ui/dist/styles.css';
import "./globals.css";
import React from "react";
import {TonConnectUIProvider} from "@tonconnect/ui-react";
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import styles from "@/styles/app";

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
        <body style={styles.bg}>
        <TonConnectUIProvider manifestUrl="https://tonloan.com/tonconnect-manifest.json">
        <Header />
            {children}
        <Footer  />
        </TonConnectUIProvider>
        </body>
        </html>
    );
}
