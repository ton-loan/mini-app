'use client';
import React, {useState} from 'react';
import {useParams, useRouter} from 'next/navigation';
import {SendTransactionRequest, useTonAddress, useTonConnectUI} from "@tonconnect/ui-react";
import {useUsdtBalance} from "@/hooks/useUsdtBalance";
import {Address, beginCell, toNano} from "@ton/core";
import {CHAIN} from "@tonconnect/sdk";
import {TonClientAPIKey, TonClientEndpoint, TonLoanContract, usdtContractAddress} from "@/config";
import {getHttpEndpoint} from "@orbs-network/ton-access";
import {JettonMaster, TonClient} from "@ton/ton";

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
    const symbol = 'usdt';
    const router = useRouter();
    const asset = assetMap[symbol as 'ton' | 'usdt'] || assetMap.ton;
    const [amount, setAmount] = useState('');
    const [percent, setPercent] = useState<number | null>(null);
    const [tonConnectUI] = useTonConnectUI();

    // 存储用户基本信息
    const userAddress = useTonAddress();
    const {usdtBalance} = useUsdtBalance(userAddress);
    console.log('usdtBalance', usdtBalance);
    // 计算美元价值
    const usdValue = amount ? (parseFloat(amount) * asset.price).toFixed(2) : '0.00';

    // 快捷选择
    const handlePercent = (p: number) => {
        setPercent(p);
        setAmount(((asset.max * p) / 100).toFixed(2));
    };

    const handleUsdtDeposit = async () => {
        if (!userAddress) {
            alert("Please connect your wallet first!");
            return;
        }
        const usdtAmount: number = parseFloat(amount) / 1000;
        if (isNaN(usdtAmount) || usdtAmount <= 0) {
            alert("Please enter a valid deposit amount!");
            return;
        }

        // 获取 testnet endpoint
        const endpoint = await getHttpEndpoint({network: 'testnet'});

        // 创建 TonClient 实例
        const client = new TonClient({
            endpoint: TonClientEndpoint,
            apiKey: TonClientAPIKey, // Optional
        });
        const master = client.open(JettonMaster.create(Address.parse(usdtContractAddress)));
        const userUsdtWalletAddress = await master.getWalletAddress(Address.parse(userAddress));
        console.log('userUsdtWalletAddress:' + userUsdtWalletAddress.toString());
        const body = beginCell()
            .storeUint(0xf8a7ea5, 32)                 // jetton transfer op code
            .storeUint(0, 64)                         // query_id:uint64
            .storeCoins(toNano(usdtAmount))              // amount:(VarUInteger 16) -  Jetton amount for transfer (decimals = 6 - USDT, 9 - default). Function toNano use decimals = 9 (remember it)
            // destination:MsgAddress 质押合约的usdt地址
            .storeAddress(TonLoanContract)// 目标钱包地址，非jetton钱包
            //  response_destination:MsgAddress
            .storeAddress(Address.parse(userAddress))// 发送者自己的普通地址
            .storeUint(0, 1)                          // custom_payload:(Maybe ^Cell)
            .storeCoins(toNano("1"))                 // forward_ton_amount:(VarUInteger 16) - if >0, will send notification message
            .storeUint(0, 1)                           // forward_payload:(Either Cell ^Cell)
            .endCell();
        // Create and send the transaction
        const transaction: SendTransactionRequest = {
            validUntil: 0,
            network: CHAIN.TESTNET,
            messages: [
                {
                    address: userUsdtWalletAddress.toString(),  // 用户的usdt钱包
                    amount: toNano("1.1").toString(),  // Transaction fee
                    payload: body.toBoc().toString('base64'),
                }
            ]
        };
        try {
            const tx = await tonConnectUI.sendTransaction(transaction);
            console.log("Transaction sent:", tx);
            alert("Deposit transaction has been sent. Please confirm it in your wallet.");
        } catch (error: any) {
            console.error("Failed to send transaction:", error);
            alert("Failed to send transaction: " + error.message);
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
                onClick={() => handleUsdtDeposit()}
            >
                <span style={{marginRight: 8}}>+</span> Deposit
            </button>
            {/* 资产信息 */}
            <div style={{marginTop: 24}}>
                <InfoRow label="MAX" value={`${usdtBalance} ${asset.name}`} icon={asset.icon}/>
                <InfoRow label="Wallet Balance" value={`${usdtBalance} ${asset.name}`} icon={asset.icon}/>
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
