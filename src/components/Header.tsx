import React from 'react';
import { TonConnectButton } from '@tonconnect/ui-react';

export default function Header({ title = 'TON Loan' }: { title?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18,marginTop: 10 }}>
      <img src="/logo.png" alt="TON Loan Logo" style={{ width: 36, height: 36, borderRadius: '50%', marginRight: 10 }} />
      <span style={{ fontWeight: 700, fontSize: 22, color: '#222' }}>{title}</span>
      <TonConnectButton style={{ marginLeft: 'auto' }} />
    </div>
  );
} 