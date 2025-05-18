'use client';
import { TonConnectButton } from '@tonconnect/ui-react';
import styles from '../../styles/app';
import { useState } from 'react';

export default function MarketPage() {
    const [taskTab, setTaskTab] = useState<'getting' | 'leaderboard'>('getting');
    
    return (
        <div >
            <div style={styles.taskCard}>

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
        </div>
    )
}