'use client';
import React, {useEffect, useState} from 'react';
import {useParams, useRouter} from 'next/navigation';
import {useTonPrice} from "@/hooks/useTonPrice";
import {useTonBalance} from "@/hooks/useTonBalance";
import {SendTransactionRequest, useTonAddress, useTonConnectUI} from "@tonconnect/ui-react";
import {Address, beginCell, toNano} from "@ton/core";
import {TonLoanContract, TransactionNetwork} from "@/config";
import {useUserTonDeposit} from "@/hooks/useUserTonDeposit";

const assetMap = {
    ton: {
        name: 'TON',
        icon: '/images/ton_logo.png',
        apy: 0.75,
        utilization: 86.48,
        gas: 0.1,
    },
    usdt: {
        name: 'USDT',
        icon: '/images/usdt_logo.png',
        apy: 10.00,
        utilization: 72.12,
        gas: 0.05,
        price: 1.0,
    },
};

export default function DepositPage() {
    const symbol = 'ton';
    const router = useRouter();
    const asset = assetMap[symbol as 'ton' | 'usdt'] || assetMap.ton;
    const [amount, setAmount] = useState('');
    const [percent, setPercent] = useState<number | null>(null);
    const {guardianSetIndex, tonPrice} = useTonPrice();
    // 存储用户基本信息
    const userAddress = useTonAddress();
    const tonBalance: number = useTonBalance(userAddress);
    // 用户质押信息
    const userTonDeposit = useUserTonDeposit(userAddress);

    // 计算美元价值
    const usdValue = amount ? (parseFloat(amount) * tonPrice).toFixed(2) : '0.00';
    const [tonConnectUI] = useTonConnectUI();
    // 快捷选择
    const handlePercent = (p: number) => {
        setPercent(p);
        setAmount((((userTonDeposit.shareAmount * userTonDeposit.principalIndex) * p) / 100).toFixed(2));
    };

    // 处理质押
    const handleWithdraw = async () => {
        console.log('用户取回金额：' + amount);
        if (!userAddress) {
            alert("请先连接您的钱包！");
            return;
        }

        const tonAmount: number = parseFloat(amount);
        if (isNaN(tonAmount) || tonAmount <= 0) {
            alert("请输入有效的取款金额！");
            return;
        }
        console.log('用户质押金额：' + tonAmount)

        const message = beginCell()
            .storeUint(10087, 32)
            .storeUint(toNano(tonAmount), 64)
            .endCell();
        console.log("整体交易费用" + (0.1 + tonAmount))
        // 创建交易并发送
        const transaction: SendTransactionRequest = {
            validUntil: 0,
            network: TransactionNetwork,
            messages: [
                {
                    address: TonLoanContract.toString(),
                    amount: toNano(0.1 + tonAmount).toString(),  // 交易费用
                    payload: message.toBoc().toString('base64'),
                }
            ]
        };

        try {
            const tx = await tonConnectUI.sendTransaction(transaction);
            console.log("交易已发送：", tx);
            alert("存款交易已发送，请在您的钱包中确认。");
        } catch (error: any) {
            console.error("交易发送失败：", error);
            alert("交易发送失败：" + error.message);
        }
    }

    return (
        <div style={{background: '#fff', borderRadius: 18, margin: 24, padding: 24, maxWidth: 480, minHeight: 600}}>
            {/* 币种tab切换 */}
            <div style={{display: 'flex', gap: 12, marginBottom: 18}}>
                {(['ton', 'usdt'] as const).map((key) => (
                    <button
                        key={key}
                        style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: symbol === key ? '#f7f8fa' : '#fff',
                            border: symbol === key ? '2px solid #3b82f6' : '2px solid #eee',
                            color: symbol === key ? '#3b82f6' : '#888',
                            borderRadius: 16,
                            padding: '10px 0',
                            fontWeight: 700,
                            fontSize: 18,
                            cursor: symbol === key ? 'default' : 'pointer',
                            boxShadow: symbol === key ? '0 2px 8px #3b82f622' : undefined,
                            transition: 'all 0.2s',
                            marginRight: key === 'ton' ? 8 : 0,
                        }}
                        disabled={symbol === key}
                        onClick={() => router.push(`/deposit/deposit-${key}`)}
                    >
                        <img src={assetMap[key].icon} alt={assetMap[key].name}
                             style={{width: 28, height: 28, marginRight: 8}}/>
                        {assetMap[key].name}
                    </button>
                ))}
            </div>
            {/* 币种信息 */}
            {/* 输入框 */}
            <div style={{fontSize: 40, fontWeight: 700, margin: '18px 0 0 0'}}>
                <input
                    type="number"
                    value={amount}
                    onChange={e => {
                        setAmount(e.target.value);
                        setPercent(null);
                    }}
                    placeholder="0"
                    style={{
                        fontSize: 40,
                        fontWeight: 700,
                        border: 'none',
                        outline: 'none',
                        width: 120,
                        background: 'transparent'
                    }}
                />
            </div>
            <div style={{color: '#888', fontSize: 18, marginBottom: 8}}>${usdValue}</div>
            {/* 快捷选择 */}
            <div style={{display: 'flex', gap: 12, margin: '18px 0'}}>
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
                onClick={() => handleWithdraw()}
            >
                <span style={{marginRight: 8}}>↩</span> Withdraw
            </button>
            {/* 资产信息 */}
            <div style={{marginTop: 24}}>
                <InfoRow label="MAX"
                         value={`${(userTonDeposit.principalIndex * userTonDeposit.shareAmount)} ${asset.name}`}
                         icon={asset.icon}/>
                <InfoRow label="Wallet Balance" value={`${tonBalance} ${asset.name}`} icon={asset.icon}/>
                <InfoRow label="Health Factor" value="100% → 100%"/>
                <InfoRow label="Organic APY" value={`${asset.apy}%`}/>
                <InfoRow label="Utilization" value={`${asset.utilization}%`} tooltip="Utilization rate of the pool"/>
                <InfoRow label="Estimated Gas Fee" value={`${asset.gas} ${asset.name}`}
                         tooltip="Estimated network fee"/>
            </div>
        </div>
    );
}

function InfoRow({label, value, icon, tooltip}: { label: string, value: string, icon?: string, tooltip?: string }) {
    return (
        <div style={{display: 'flex', alignItems: 'center', margin: '10px 0', fontSize: 17}}>
      <span style={{color: '#888', flex: 1, display: 'flex', alignItems: 'center'}}>
        {label}
          {tooltip && (
              <span title={tooltip} style={{
                  marginLeft: 6,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: '#eee',
                  color: '#888',
                  fontWeight: 700,
                  fontSize: 14,
                  textAlign: 'center',
                  lineHeight: '18px',
                  cursor: 'pointer',
                  display: 'inline-block'
              }}>?</span>
          )}
      </span>
            <span style={{fontWeight: 700, display: 'flex', alignItems: 'center'}}>
        {icon && <img src={icon} alt="" style={{width: 20, height: 20, marginRight: 6}}/>}
                {value}
      </span>
        </div>
    );
}
