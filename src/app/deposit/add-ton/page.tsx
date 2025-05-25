'use client';
import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

const assetMap = {
  ton: {
    name: 'TON',
    icon: '/images/ton_logo.png',
    balance: 26.11,
    max: 25.76,
    apy: 0.75,
    utilization: 86.48,
    gas: 0.1,
    price: 3.015, // 1 TON = $3.015
  },
  usdt: {
    name: 'USDT',
    icon: '/images/usdt_logo.png',
    balance: 100.00,
    max: 80.00,
    apy: 3.85,
    utilization: 72.12,
    gas: 0.05,
    price: 1.0,
  },
};

export default function DepositPage() {
  const { symbol } = useParams();
  const router = useRouter();
  const asset = assetMap[symbol as 'ton' | 'usdt'] || assetMap.ton;
  const [amount, setAmount] = useState('');
  const [percent, setPercent] = useState<number | null>(null);

  // 计算美元价值
  const usdValue = amount ? (parseFloat(amount) * asset.price).toFixed(2) : '0.00';

  // 快捷选择
  const handlePercent = (p: number) => {
    setPercent(p);
    setAmount(((asset.max * p) / 100).toFixed(2));
  };

  return (
    <div style={{ background: '#fff', borderRadius: 18, margin: 24, padding: 24, maxWidth: 480, minHeight: 600 }}>
      {/* 币种信息 */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
        <img src={asset.icon} alt={asset.name} style={{ width: 48, height: 48, marginRight: 14 }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 24, display: 'flex', alignItems: 'center' }}>
            Supply <span style={{ fontWeight: 400, fontSize: 16, marginLeft: 10, background: '#eee', borderRadius: 8, padding: '2px 10px' }}>Main Pool</span>
          </div>
          <div style={{ color: '#888', fontWeight: 500 }}>{asset.name}</div>
        </div>
      </div>
      {/* 输入框 */}
      <div style={{ fontSize: 40, fontWeight: 700, margin: '18px 0 0 0' }}>
        <input
          type="number"
          value={amount}
          onChange={e => { setAmount(e.target.value); setPercent(null); }}
          placeholder="0"
          style={{ fontSize: 40, fontWeight: 700, border: 'none', outline: 'none', width: 120, background: 'transparent' }}
        />
      </div>
      <div style={{ color: '#888', fontSize: 18, marginBottom: 8 }}>${usdValue}</div>
      {/* 快捷选择 */}
      <div style={{ display: 'flex', gap: 12, margin: '18px 0' }}>
        {[25, 50, 75, 100].map(p => (
          <button
            key={p}
            style={{
              flex: 1,
              background: percent === p ? '#3b82f6' : '#eee',
              color: percent === p ? '#fff' : '#222',
              border: 'none',
              borderRadius: 16,
              padding: '12px 0',
              fontWeight: 700,
              fontSize: 18,
              cursor: 'pointer',
            }}
            onClick={() => handlePercent(p)}
          >{p}%</button>
        ))}
      </div>
      {/* 存款按钮 */}
      <button
        style={{
          width: '100%',
          background: '#3b82f6',
          color: '#fff',
          border: 'none',
          borderRadius: 32,
          padding: '18px 0',
          fontWeight: 700,
          fontSize: 22,
          margin: '18px 0',
          cursor: 'pointer',
        }}
        disabled={!amount || parseFloat(amount) <= 0}
      >
        <span style={{ marginRight: 8 }}>↓</span> Supply
      </button>
      {/* 资产信息 */}
      <div style={{ marginTop: 24 }}>
        <InfoRow label="MAX" value={`${asset.max} ${asset.name}`} icon={asset.icon} />
        <InfoRow label="Wallet Balance" value={`${asset.balance} ${asset.name}`} icon={asset.icon} />
        <InfoRow label="Health Factor" value="100% → 100%" />
        <InfoRow label="Organic APY" value={`${asset.apy}%`} />
        <InfoRow label="Utilization" value={`${asset.utilization}%`} tooltip="Utilization rate of the pool" />
        <InfoRow label="Estimated Gas Fee" value={`${asset.gas} ${asset.name}`} tooltip="Estimated network fee" />
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
