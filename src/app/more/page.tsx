'use client';
import { TonConnectButton } from '@tonconnect/ui-react';
import styles from '../../styles/app';
import { useState } from 'react';

export default function MarketPage() {
    const [language, setLanguage] = useState<'en' | 'zh'>('en');
    const [darkMode, setDarkMode] = useState(false);

    return (
        <div >
                <div style={styles.menuCard}>

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
                            ру́сскийязы́к
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
        </div>
    )
}