"use client";
import '@telegram-apps/telegram-ui/dist/styles.css';
import React, { useState } from 'react';
import styles  from '../styles/app';

const HomePage = () => {
    const [tab, setTab] = useState<'assets' | 'loans'>('assets');

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
    return (
        <div >
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
        </div>
    );
};

export default HomePage;
