"use client";
import '@telegram-apps/telegram-ui/dist/styles.css';
import React, { useState, useEffect } from 'react';
import { TonConnectButton, useTonAddress } from '@tonconnect/ui-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const mockData = {
  supplyBalance: 3.09,
  netAPY: 0.71,
  availableToBorrow: 2.22,
  healthFactor: 100,
  assets: [
    {
      symbol: "TON",
      icon: "/images/ton_logo.png", // 你可以替换为本地或网络图片
      supplied: 1.0,
      suppliedValue: 3.09,
      walletBalance: 3.95,
      walletValue: 12.13,
      supplyAPY: 0.71,
    },
    {
      symbol: "USDT",
      icon: "/images/usdt_logo.png",
      supplied: 0.0,
      suppliedValue: 0.0,
      walletBalance: 0.0,
      walletValue: 0.0,
      supplyAPY: 3.85,
    },
  ],
  loans: [
    {
      symbol: "TON",
      icon: "/images/ton_logo.png",
      borrowed: 0.5,
      borrowedValue: 1.55,
      interestRate: 2.5,
      repayable: true,
    },
    {
      symbol: "USDT",
      icon: "/images/usdt_logo.png",
      borrowed: 0.0,
      borrowedValue: 0.0,
      interestRate: 5.2,
      repayable: false,
    },
  ],
};

const HomePage = () => {
    const [userScore, setUserScore] = useState<number | null>(null);
    const [canCheckIn, setCanCheckIn] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const userFriendlyAddress = useTonAddress();
    const [tab, setTab] = useState<'assets' | 'loans'>('assets');
    const [mainTab, setMainTab] = useState<'home' | 'rates' | 'task' | 'menu'>('home');
    const [language, setLanguage] = useState<'en' | 'zh'>('en');
    const [darkMode, setDarkMode] = useState(false);
    const [taskTab, setTaskTab] = useState<'getting' | 'leaderboard'>('getting');

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
        <div style={styles.bg}>
            {/* 顶部栏 */}
            {mainTab === 'home' && (
                <>
                    <div style={styles.header}>
                        {/* Logo 和 DApp 名称 */}
                        <img src="/logo.png" alt="TON Loan Logo" style={{ width: 36, height: 36, borderRadius: "50%", marginRight: 10 }} />
                        <span style={{ fontWeight: 700, fontSize: 22, color: "#222" }}>TON Loan</span>
                        <TonConnectButton style={{ marginLeft: "auto" }} />
                    </div>

                    {/* 资产总览 */}
                    <div style={styles.card}>
                        <div style={{ fontSize: 16, color: "#888" }}>My Deposits</div>
                        <div style={{ fontSize: 36, fontWeight: 800, margin: "8px 0" }}>
                            ${mockData.supplyBalance.toFixed(2)}
                        </div>
                        <div style={{ color: "#1ecb81", fontWeight: 600, fontSize: 16 }}>
                            NET APY <span>+{mockData.netAPY}%</span>
                        </div>
                        <button style={styles.depositBtn}>Deposit</button>
                    </div>

                    {/* 可借额度与健康因子 */}
                    <div style={styles.borrowCard}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <div>
                                <div style={{ color: "#fff", fontSize: 15 }}>You Can Borrow</div>
                                <div style={{ color: "#fff", fontWeight: 700, fontSize: 24 }}>
                                    ${mockData.availableToBorrow.toFixed(2)}
                                </div>
                            </div>
                            <button style={styles.borrowBtn}>Borrow</button>
                        </div>
                        <div style={{ marginTop: 12, color: "#fff", fontSize: 15, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ display: 'flex', alignItems: 'center' }}>
                                Loan Safety Score
                                <span style={{
                                    display: 'inline-block',
                                    marginLeft: 6,
                                    width: 18,
                                    height: 18,
                                    borderRadius: '50%',
                                    background: '#fff2',
                                    color: '#fff',
                                    fontWeight: 700,
                                    fontSize: 14,
                                    textAlign: 'center',
                                    lineHeight: '18px',
                                    cursor: 'pointer',
                                    position: 'relative',
                                }}
                                    title="Shows how safe your loan is."
                                >
                                    ?
                                </span>
                            </span>
                            <span style={{ fontWeight: 700 }}>{mockData.healthFactor}%</span>
                        </div>
                        <div style={styles.healthBar}>
                            <div style={{ ...styles.healthBarInner, width: `${mockData.healthFactor}%` }} />
                        </div>
                    </div>

                    {/* 资产/借款列表 */}
                    <div style={styles.assetCard}>
                        <div style={{ display: "flex" }}>
                            <button
                                style={tab === 'assets' ? styles.tabActive : styles.tab}
                                onClick={() => setTab('assets')}
                            >
                                My Assets
                            </button>
                            <button
                                style={tab === 'loans' ? styles.tabActive : styles.tab}
                                onClick={() => setTab('loans')}
                            >
                                My Loans
                            </button>
                        </div>
                        <div>
                            {tab === 'assets' && (
                                <>
                                    {mockData.assets.map((asset) => (
                                        <div key={asset.symbol} style={styles.assetRow}>
                                            <img src={asset.icon} alt={asset.symbol} style={styles.assetIcon} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 700 }}>{asset.symbol}</div>
                                                <div style={{ color: "#888", fontSize: 13 }}>
                                                    Wallet: {asset.walletBalance} (${asset.walletValue})
                                                </div>
                                            </div>
                                            <div style={{ textAlign: "right" }}>
                                                <div style={{ fontWeight: 700 }}>{asset.supplied}</div>
                                                <div style={{ color: "#888", fontSize: 13 }}>${asset.suppliedValue}</div>
                                                <div style={{ color: "#1ecb81", fontSize: 13 }}>APY {asset.supplyAPY}%</div>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                            {tab === 'loans' && (
                                <>
                                    {mockData.loans.map((loan) => (
                                        <div key={loan.symbol} style={styles.assetRow}>
                                            <img src={loan.icon} alt={loan.symbol} style={styles.assetIcon} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 700 }}>{loan.symbol}</div>
                                                <div style={{ color: "#888", fontSize: 13 }}>
                                                    Borrowed: {loan.borrowed} (${loan.borrowedValue})
                                                </div>
                                            </div>
                                            <div style={{ textAlign: "right" }}>
                                                <div style={{ color: "#1ecb81", fontSize: 13 }}>Interest {loan.interestRate}%</div>
                                                {loan.borrowed > 0 && loan.repayable && (
                                                    <button style={styles.repayBtn}>Repay</button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {mockData.loans.every(l => l.borrowed === 0) && (
                                        <div style={{ color: '#888', textAlign: 'center', padding: 24 }}>No active loans</div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </>
            )}
            {mainTab === 'task' && (
                <div style={styles.taskCard}>
                    {/* 顶部栏：Logo和连接钱包 */}
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
                        <img src="/logo.png" alt="TON Loan Logo" style={{ width: 36, height: 36, borderRadius: "50%", marginRight: 10 }} />
                        <span style={{ fontWeight: 700, fontSize: 22, color: "#222" }}>TON Loan</span>
                        <TonConnectButton style={{ marginLeft: "auto" }} />
                    </div>
                    {/* 日常签到任务 */}
                    <div style={{ marginBottom: 24, background: '#f7f8fa', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ fontWeight: 600, fontSize: 16 }}>Daily Check-in</div>
                            <div style={{ color: '#888', fontSize: 14 }}>Sign in every day to earn points!</div>
                        </div>
                        <button style={styles.checkinBtn}>Check In</button>
                    </div>
                    {/* Getting Started/Leaderboard tab切换 */}
                    <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
                        <button
                            style={taskTab === 'getting' ? { ...styles.menuBtn, ...styles.menuBtnActive } : styles.menuBtn}
                            onClick={() => setTaskTab('getting')}
                        >
                            Getting Started
                        </button>
                        <button
                            style={taskTab === 'leaderboard' ? { ...styles.menuBtn, ...styles.menuBtnActive } : styles.menuBtn}
                            onClick={() => setTaskTab('leaderboard')}
                        >
                            Leaderboard
                        </button>
                    </div>
                    {taskTab === 'getting' && (
                        <>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                <li style={styles.taskItem}>
                                    <span role="img" aria-label="wallet" style={{ marginRight: 10 }}>🔗</span>
                                    Connect your TON wallet
                                </li>
                                <li style={styles.taskItem}>
                                    <span role="img" aria-label="deposit" style={{ marginRight: 10 }}>💰</span>
                                    Make your first deposit
                                </li>
                                <li style={styles.taskItem}>
                                    <span role="img" aria-label="borrow" style={{ marginRight: 10 }}>💸</span>
                                    Try borrowing an asset
                                </li>
                                <li style={styles.taskItem}>
                                    <span role="img" aria-label="repay" style={{ marginRight: 10 }}>✅</span>
                                    Repay a loan
                                </li>
                            </ul>
                            <div style={{ color: '#888', fontSize: 14, marginTop: 24 }}>
                                Complete these tasks to get familiar with TON Loan!
                            </div>
                        </>
                    )}
                    {taskTab === 'leaderboard' && (
                        <div style={{ marginTop: 8 }}>
                            <ol style={{ paddingLeft: 18, margin: 0 }}>
                                <li style={styles.leaderItem}><span>🥇 Alice</span><span style={{ float: 'right', fontWeight: 700 }}>1200</span></li>
                                <li style={styles.leaderItem}><span>🥈 Bob</span><span style={{ float: 'right', fontWeight: 700 }}>950</span></li>
                                <li style={styles.leaderItem}><span>🥉 Carol</span><span style={{ float: 'right', fontWeight: 700 }}>800</span></li>
                                <li style={styles.leaderItem}><span>Dave</span><span style={{ float: 'right', fontWeight: 700 }}>600</span></li>
                                <li style={styles.leaderItem}><span>You</span><span style={{ float: 'right', fontWeight: 700, color: '#3b82f6' }}>300</span></li>
                            </ol>
                        </div>
                    )}
                </div>
            )}
            {mainTab === 'rates' && (
                <div style={styles.ratesCard}>
                    {/* 顶部栏：Logo、DApp名称、TonConnectButton，与首页一致 */}
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
                        <img src="/logo.png" alt="TON Loan Logo" style={{ width: 36, height: 36, borderRadius: "50%", marginRight: 10 }} />
                        <span style={{ fontWeight: 700, fontSize: 22, color: "#222" }}>TON Loan</span>
                        <TonConnectButton style={{ marginLeft: "auto" }} />
                    </div>
                    {/* Market Overview 标题 */}
                    <div style={{ fontWeight: 800, fontSize: 28, color: "#222", letterSpacing: 1, marginBottom: 18 }}>Market Overview</div>
                    {/* 池子tab */}
                    <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
                        <button style={{ ...styles.poolTab, ...styles.poolTabActive }}>Main Pool</button>
                        <button style={styles.poolTab} disabled>LP Pool</button>
                        <button style={styles.poolTab} disabled>Alts Pool</button>
                    </div>
                    {/* 总览数据 */}
                    <div style={{ display: 'flex', gap: 18, marginBottom: 18 }}>
                        <div style={styles.overviewBox}>
                            <div style={{ color: '#888', fontSize: 15 }}>Main Total Supply</div>
                            <div style={{ fontWeight: 800, fontSize: 26 }}>$8,000,000</div>
                        </div>
                        <div style={styles.overviewBox}>
                            <div style={{ color: '#888', fontSize: 15 }}>Main Total Borrow</div>
                            <div style={{ fontWeight: 800, fontSize: 26 }}>$2,500,000</div>
                        </div>
                    </div>
                    {/* 资产表头 */}
                    <div style={{ display: 'flex', color: '#888', fontWeight: 600, fontSize: 15, marginBottom: 8, padding: '0 6px' }}>
                        <div style={{ flex: 2 }}>Asset</div>
                        <div style={{ flex: 2, textAlign: 'right' }}>Total Supply</div>
                        <div style={{ flex: 2, textAlign: 'right' }}>Total Borrow</div>
                    </div>
                    {/* 资产列表（仅TON和USDT） */}
                    <div>
                        {[{
                            symbol: 'USDT',
                            icon: '/images/usdt_logo.png',
                            supply: '5.78M',
                            supplyUSD: '5.78M',
                            borrow: '2.84M',
                            borrowUSD: '2.84M',
                        }, {
                            symbol: 'TON',
                            icon: '/images/ton_logo.png',
                            supply: '1.67M',
                            supplyUSD: '5.12M',
                            borrow: '1.40M',
                            borrowUSD: '4.29M',
                        }].map(asset => (
                            <div key={asset.symbol} style={styles.marketRow}>
                                <div style={{ flex: 2, display: 'flex', alignItems: 'center' }}>
                                    <img src={asset.icon} alt={asset.symbol} style={{ width: 36, height: 36, marginRight: 12 }} />
                                    <span style={{ fontWeight: 700, fontSize: 17 }}>{asset.symbol}</span>
                                </div>
                                <div style={{ flex: 2, textAlign: 'right' }}>
                                    <div style={{ fontWeight: 700, fontSize: 17 }}>{asset.supply}</div>
                                    <div style={{ color: '#888', fontSize: 13 }}>${asset.supplyUSD}</div>
                                </div>
                                <div style={{ flex: 2, textAlign: 'right' }}>
                                    <div style={{ fontWeight: 700, fontSize: 17 }}>{asset.borrow}</div>
                                    <div style={{ color: '#888', fontSize: 13 }}>${asset.borrowUSD}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {mainTab === 'menu' && (
                <div style={styles.menuCard}>
                    {/* 顶部栏：Logo和连接钱包 */}
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
                        <img src="/logo.png" alt="TON Loan Logo" style={{ width: 36, height: 36, borderRadius: "50%", marginRight: 10 }} />
                        <span style={{ fontWeight: 700, fontSize: 22, color: "#222" }}>TON Loan</span>
                        <TonConnectButton style={{ marginLeft: "auto" }} />
                    </div>
                    {/* 语言设置 */}
                    <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>Language</div>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                        <button
                            style={language === 'en' ? { ...styles.menuBtn, ...styles.menuBtnActive } : styles.menuBtn}
                            onClick={() => setLanguage('en')}
                        >
                            English
                        </button>
                        <button
                            style={language === 'zh' ? { ...styles.menuBtn, ...styles.menuBtnActive } : styles.menuBtn}
                            onClick={() => setLanguage('zh')}
                        >
                            中文
                        </button>
                    </div>
                    {/* 暗黑模式设置 */}
                    <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>Theme</div>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button
                            style={!darkMode ? { ...styles.menuBtn, ...styles.menuBtnActive } : styles.menuBtn}
                            onClick={() => setDarkMode(false)}
                        >
                            Light
                        </button>
                        <button
                            style={darkMode ? { ...styles.menuBtn, ...styles.menuBtnActive } : styles.menuBtn}
                            onClick={() => setDarkMode(true)}
                        >
                            Dark
                        </button>
                    </div>
                    {/* 底部链接和客服入口 */}
                    <div style={{ marginTop: 40, borderTop: '1px solid #eee', paddingTop: 18 }}>
                        <div style={{ display: 'flex', gap: 18, marginBottom: 12 }}>
                            <a href="/privacy" style={styles.menuLink} target="_blank" rel="noopener noreferrer">Privacy Policy</a>
                            <a href="/terms" style={styles.menuLink} target="_blank" rel="noopener noreferrer">Terms of Service</a>
                        </div>
                        <a href="/support" style={styles.supportBtn} target="_blank" rel="noopener noreferrer">🛠️ Support Ticket</a>
                    </div>
                </div>
            )}
            {/* 底部导航栏 */}
            <div style={styles.navbar}>
                <NavItem label="Home" active={mainTab === 'home'} icon="🏠" onClick={() => setMainTab('home')} />
                <NavItem label="Rates" active={mainTab === 'rates'} icon="📊" onClick={() => setMainTab('rates')} />
                <NavItem label="Task" active={mainTab === 'task'} icon="📝" onClick={() => setMainTab('task')} />
                <NavItem label="Menu" active={mainTab === 'menu'} icon="☰" onClick={() => setMainTab('menu')} />
            </div>
        </div>
    );
};

function NavItem({ label, icon, active = false, onClick }: { label: string; icon: string; active?: boolean; onClick?: () => void }) {
    return (
        <div
            style={{
                flex: 1,
                textAlign: "center",
                color: active ? "#3b82f6" : "#888",
                fontWeight: active ? 700 : 500,
                fontSize: 13,
                cursor: onClick ? 'pointer' : 'default',
            }}
            onClick={onClick}
        >
            <div style={{ fontSize: 22 }}>{icon}</div>
            <div>{label}</div>
        </div>
    );
}

const styles = {
    bg: {
        minHeight: "100vh",
        background: "#f7f8fa",
        padding: "0 0 70px 0",
        position: "relative" as const,
        fontFamily: "Inter, sans-serif",
        maxWidth: "480px",
        margin: "0 auto",
    },
    header: {
        display: "flex",
        alignItems: "center",
        padding: "18px 18px 0 18px",
        background: "#f7f8fa",
    },
    card: {
        background: "#fff",
        borderRadius: 18,
        margin: "18px 18px 0 18px",
        padding: 18,
        boxShadow: "0 2px 8px #0001",
    },
    borrowCard: {
        background: "linear-gradient(90deg,#1e3c72,#2a5298)",
        borderRadius: 18,
        margin: "18px 18px 0 18px",
        padding: 18,
        boxShadow: "0 2px 8px #0001",
    },
    borrowBtn: {
        background: "#fff",
        color: "#1e3c72",
        border: "none",
        borderRadius: 12,
        padding: "8px 22px",
        fontWeight: 700,
        fontSize: 16,
        cursor: "pointer",
        marginTop: 8,
    },
    healthBar: {
        width: "100%",
        height: 8,
        background: "#fff4",
        borderRadius: 6,
        marginTop: 6,
        overflow: "hidden",
    },
    healthBarInner: {
        height: "100%",
        background: "#1ecb81",
        borderRadius: 6,
        transition: "width 0.3s",
    },
    assetCard: {
        background: "#fff",
        borderRadius: 18,
        margin: "18px 18px 0 18px",
        padding: 18,
        boxShadow: "0 2px 8px #0001",
    },
    tabActive: {
        flex: 1,
        background: "#f7f8fa",
        border: "none",
        borderRadius: 12,
        padding: "8px 0",
        fontWeight: 700,
        fontSize: 16,
        color: "#222",
        marginRight: 8,
        cursor: "pointer",
    },
    tab: {
        flex: 1,
        background: "#fff",
        border: "none",
        borderRadius: 12,
        padding: "8px 0",
        fontWeight: 500,
        fontSize: 16,
        color: "#888",
        cursor: "pointer",
    },
    assetRow: {
        display: "flex",
        alignItems: "center",
        padding: "14px 0",
        borderBottom: "1px solid #f0f0f0",
        gap: 14,
    },
    assetIcon: {
        width: 36,
        height: 36,
        marginRight: 14,
    },
    navbar: {
        position: "fixed" as const,
        left: "0",
        right: "0",
        bottom: "0",
        height: "64px",
        background: "#fff",
        borderTop: "1px solid #eee",
        display: "flex",
        alignItems: "center",
        zIndex: 10,
        maxWidth: "480px",
        margin: "0 auto",
    },
    depositBtn: {
        background: "#3b82f6",
        color: "#fff",
        border: "none",
        borderRadius: 12,
        padding: "10px 32px",
        fontWeight: 700,
        fontSize: 16,
        cursor: "pointer",
        marginTop: 18,
        marginBottom: 0,
        width: "100%",
        boxShadow: "0 2px 8px #3b82f622",
    },
    repayBtn: {
        background: "#1ecb81",
        color: "#fff",
        border: "none",
        borderRadius: 8,
        padding: "6px 18px",
        fontWeight: 600,
        fontSize: 14,
        cursor: "pointer",
        marginTop: 8,
    },
    taskCard: {
        background: "#fff",
        borderRadius: 18,
        margin: "24px 18px 0 18px",
        padding: 24,
        boxShadow: "0 2px 8px #0001",
        minHeight: 320,
        textAlign: 'left' as const,
        maxWidth: '480px',
    },
    taskItem: {
        fontSize: 17,
        color: '#222',
        background: '#f7f8fa',
        borderRadius: 10,
        padding: '12px 16px',
        marginBottom: 12,
        display: 'flex',
        alignItems: 'center',
    },
    checkinBtn: {
        background: "#1ecb81",
        color: "#fff",
        border: "none",
        borderRadius: 8,
        padding: "8px 22px",
        fontWeight: 700,
        fontSize: 15,
        cursor: "pointer",
        marginLeft: 12,
    },
    leaderItem: {
        fontSize: 15,
        color: '#222',
        background: '#f7f8fa',
        borderRadius: 8,
        padding: '8px 12px',
        marginBottom: 6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    ratesCard: {
        background: "#fff",
        borderRadius: 18,
        margin: "24px 18px 0 18px",
        padding: 24,
        boxShadow: "0 2px 8px #0001",
        minHeight: 320,
        textAlign: 'left' as const,
        maxWidth: '480px',
    },
    poolTab: {
        background: '#f7f8fa',
        border: 'none',
        borderRadius: 16,
        padding: '8px 22px',
        fontWeight: 700,
        fontSize: 16,
        color: '#888',
        cursor: 'pointer',
    },
    poolTabActive: {
        background: '#fff',
        color: '#222',
        boxShadow: '0 2px 8px #0001',
    },
    overviewBox: {
        background: '#f7f8fa',
        borderRadius: 16,
        padding: '16px 22px',
        flex: 1,
        textAlign: 'center' as const,
    },
    marketRow: {
        display: 'flex',
        alignItems: 'center',
        background: '#f7f8fa',
        borderRadius: 16,
        padding: '16px 8px',
        marginBottom: 14,
        fontSize: 16,
    },
    menuCard: {
        background: "#fff",
        borderRadius: 18,
        margin: "24px 18px 0 18px",
        padding: 24,
        boxShadow: "0 2px 8px #0001",
        minHeight: 320,
        textAlign: 'left' as const,
        maxWidth: '480px',
    },
    menuBtn: {
        background: '#f7f8fa',
        border: 'none',
        borderRadius: 12,
        padding: '10px 28px',
        fontWeight: 600,
        fontSize: 16,
        color: '#888',
        cursor: 'pointer',
        transition: 'all 0.2s',
    },
    menuBtnActive: {
        background: '#3b82f6',
        color: '#fff',
        fontWeight: 700,
        boxShadow: '0 2px 8px #3b82f622',
    },
    menuLink: {
        color: '#3b82f6',
        fontWeight: 600,
        fontSize: 15,
        textDecoration: 'none',
        transition: 'color 0.2s',
    },
    supportBtn: {
        display: 'inline-block',
        background: '#f7f8fa',
        color: '#222',
        borderRadius: 10,
        padding: '10px 22px',
        fontWeight: 700,
        fontSize: 16,
        textDecoration: 'none',
        marginTop: 6,
        boxShadow: '0 2px 8px #0001',
        transition: 'background 0.2s',
    },
};

export default HomePage;
