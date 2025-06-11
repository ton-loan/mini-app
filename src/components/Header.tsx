import React from 'react';
import { TonConnectButton } from '@tonconnect/ui-react';

export default function Header({ title = 'TON Loan' }: { title?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18,marginTop: 10 }}>
      <TonConnectButton style={{ marginLeft: 'auto' }} />
    </div>
  );
} 