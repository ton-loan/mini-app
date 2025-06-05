'use client';
import React from 'react';
import { useParams, useRouter } from 'next/navigation';

const assetMap = {
  ton: {
    name: 'TON',
    icon: '/images/ton_logo.png',
    supplyBalance: 1.0,
    supplyValue: 3.02,
    availableToWithdraw: 1.0,
    apy: 0.75,
    apyBonus: 2,
    walletBalance: 26.11,
    availableLiquidity: 225933.41,
    price: 3.00,
    liquidationThreshold: '78%',
    liquidationBonus: '8%',
  },
  usdt: {
    name: 'USDT',
    icon: '/images/usdt_logo.png',
    supplyBalance: 100,
    supplyValue: 100,
    availableToWithdraw: 100,
    apy: 3.85,
    apyBonus: 7,
    walletBalance: 500,
    availableLiquidity: 1000000,
    price: 1.0,
    liquidationThreshold: '80%',
    liquidationBonus: '7%',
  },
};

export default function BorrowSummaryPage() {
  const router = useRouter();
  const asset = assetMap['usdt'] || assetMap.ton;

  return (
    <div style={{ background: '#fff', borderRadius: 18, margin: 24, padding: 24, maxWidth: 480, minHeight: 600 }}>
      {/* 币种信息 */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
        <img src={asset.icon} alt={asset.name} style={{ width: 48, height: 48, marginRight: 14 }} />
      
      </div>
      {/* Supply Balance */}
      <div style={{ color: '#888', fontWeight: 500, fontSize: 18, marginBottom: 6 }}>Supply Balance</div>
      <div style={{ fontSize: 40, fontWeight: 800, marginBottom: 4 }}>
        {asset.supplyBalance} <span style={{ fontSize: 22, fontWeight: 500 }}>{asset.name}</span>
        <span style={{ color: '#888', fontSize: 22, fontWeight: 400, marginLeft: 8 }}>${asset.supplyValue}</span>
      </div>
      {/* 可取款额度 */}
      <div style={{ color: '#888', fontWeight: 500, fontSize: 18, marginBottom: 6 }}>Available to Withdraw</div>
      <div style={{ display: 'flex', alignItems: 'center', fontWeight: 700, fontSize: 20, marginBottom: 18 }}>
        <img src={asset.icon} alt={asset.name} style={{ width: 24, height: 24, marginRight: 8 }} />
        {asset.availableToWithdraw} {asset.name}
      </div>
      {/* 操作按钮 */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 24 }}>
        <button
          style={{
            flex: 1,
            border: '2px solid #3b82f6',
            background: '#fff',
            color: '#3b82f6',
            borderRadius: 32,
            padding: '16px 0',
            fontWeight: 700,
            fontSize: 20,
            cursor: 'pointer',
          }}
          onClick={() => router.push(`/deposit/withdraw-ton`)}
        >
          <span style={{ marginRight: 8 }}>↩</span> Withdraw
        </button>
        <button
          style={{
            flex: 1,
            background: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: 32,
            padding: '16px 0',
            fontWeight: 700,
            fontSize: 20,
            cursor: 'pointer',
          }}
          onClick={() => router.push(`/deposit/deposit-ton`)}
        >
          <span style={{ marginRight: 8 }}>+</span> Supply more
        </button>
      </div>
      {/* Supply APY */}
      <div style={{
        background: '#f7f8fa',
        borderRadius: 16,
        padding: '16px 22px',
        fontWeight: 600,
        fontSize: 18,
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 18,
      }}>
        <span>Supply APY</span>
        <span style={{ color: '#3b82f6', fontWeight: 700 }}>
          {asset.apy}% {asset.apyBonus && <span style={{ color: '#1ecb81', fontWeight: 700, fontSize: 16, marginLeft: 6 }}>+{asset.apyBonus}🪙</span>}
        </span>
      </div>
      {/* 资产信息 */}
      <div style={{
        background: '#f7f8fa',
        borderRadius: 16,
        padding: '16px 22px',
        fontSize: 17,
      }}>
        <InfoRow label="Wallet Balance" value={`${asset.walletBalance} ${asset.name}`} icon={asset.icon} />
        <InfoRow label="Available Liquidity" value={`${asset.availableLiquidity} ${asset.name}`} icon={asset.icon} />
        <InfoRow label="Asset Price" value={`$${asset.price}`} />
        <InfoRow label="Liquidation Threshold" value={asset.liquidationThreshold} tooltip="If your health factor drops below this, your position may be liquidated." />
        <InfoRow label="Liquidation Bonus" value={asset.liquidationBonus} tooltip="Bonus for liquidators when your position is liquidated." />
      </div>
    </div>
  );
}

function InfoRow({ label, value, icon, tooltip }: { label: string, value: string, icon?: string, tooltip?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', margin: '10px 0', fontSize: 17 }}>
      <span style={{ color: '#888', flex: 1, display: 'flex', alignItems: 'center' }}>
        {label}
        {tooltip && (
          <span title={tooltip} style={{
            marginLeft: 6, width: 18, height: 18, borderRadius: '50%', background: '#eee', color: '#888',
            fontWeight: 700, fontSize: 14, textAlign: 'center', lineHeight: '18px', cursor: 'pointer', display: 'inline-block'
          }}>?</span>
        )}
      </span>
      <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center' }}>
        {icon && <img src={icon} alt="" style={{ width: 20, height: 20, marginRight: 6 }} />}
        {value}
      </span>
    </div>
  );
} 