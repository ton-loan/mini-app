"use client";
import '@telegram-apps/telegram-ui/dist/styles.css';
import React, { useState, useEffect } from 'react';
import { AppRoot, Placeholder, Button } from '@telegram-apps/telegram-ui';
import { TonConnectButton, useTonAddress } from '@tonconnect/ui-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const HomePage = () => {
    const [userScore, setUserScore] = useState<number | null>(null);
    const [canCheckIn, setCanCheckIn] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const userFriendlyAddress = useTonAddress();

    // Fetch user data from the API
    const fetchUserData = async (address: string) => {
        if (!address) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/user/info?address=${address}`);
            if (!response.ok) {
                throw new Error("Failed to fetch user data");
            }
            const data = await response.json();
            setUserScore(data.data.score || 0);
            setCanCheckIn(data.data.can_check_in || false);
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    };

    useEffect(() => {
        if (userFriendlyAddress) {
            fetchUserData(userFriendlyAddress);
        }
    }, [userFriendlyAddress]);

    // Handle daily check-in
    const handleCheckIn = async () => {
        if (!userFriendlyAddress) return;
        setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/api/user/checkin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ address: userFriendlyAddress }),
            });

            if (!response.ok) {
                throw new Error("Failed to check in");
            }

            const data = await response.json();
            alert(`Check-in successful! You earned 100 score.`);
            setUserScore(data.data.score || userScore); // Update total points
            setCanCheckIn(false); // Disable further check-ins for the day
        } catch (error) {
            console.error("Error during check-in:", error);
            alert("Failed to check in. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppRoot>
            <div style={styles.container as React.CSSProperties}>
                <div>
                    <TonConnectButton style={{ float: "right" }} />
                </div>
                {/* App Title */}
                <Placeholder
                    header="Your TON Loan Score"
                    description={userScore}
                >
                    <img
                        alt="TON Loans Logo"
                        src="/logo.png"
                        style={styles.logo}
                    />
                </Placeholder>

                {/* Buttons */}
                <div style={styles.buttonWrapper as React.CSSProperties}>
                    {canCheckIn ? (
                        <Button
                            size="m"
                            mode="white"
                            onClick={handleCheckIn}
                            disabled={loading}
                        >
                            {loading ? 'Checking In...' : 'Daily Check-In'}
                        </Button>
                    ) : (
                        <Button size="m" mode="white" disabled>
                            {userFriendlyAddress ? 'Already Checked In' : 'Connect Wallet First'}
                        </Button>
                    )}
                </div>
            </div>
        </AppRoot>
    );
};

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        padding: '10px',
        height: '100vh',
        backgroundColor: '#F8F9FA',
    },
    logo: {
        display: 'block',
        width: '144px',
        height: '144px',
        marginBottom: '20px',
    },
    buttonWrapper: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: '10px',
        width: '100%',
        maxWidth: '300px',
        margin: '0 auto',
    },
};

export default HomePage;
