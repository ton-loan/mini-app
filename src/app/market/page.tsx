'use client';
import { TonConnectButton } from '@tonconnect/ui-react';
import styles from '../../styles/app';

export default function MarketPage() {
  return (
    <div >
        <div style={styles.ratesCard}>

            {/* Market Overview 标题 */}
            <div style={{ fontWeight: 800, fontSize: 28, color: "#222", letterSpacing: 1, marginBottom: 18 }}>Market Overview</div>
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
    </div>
  );
}