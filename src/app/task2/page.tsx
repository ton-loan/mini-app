"use client";
import '@telegram-apps/telegram-ui/dist/styles.css';
import React, {useEffect, useState} from 'react';
import styles from '../../styles/app';
import {Address, beginCell, Cell, toNano} from "@ton/core";
import {JettonMaster, JettonWallet, TonClient} from "@ton/ton";
import {SendTransactionRequest, useTonAddress, useTonConnectUI, useTonWallet} from "@tonconnect/ui-react";
import {TonClientAPIKey, TonClientEndpoint, usdtContractAddress} from "@/config";
import {CHAIN} from "@tonconnect/sdk";



// 资产基本信息
export interface Asset {
    symbol: string,     // 资产代码
    icon: string,       // 你可以替换为本地或网络图片
    deposit: number,    // 存款数量
    suppliedValue: number,// 存款价值
    walletBalance: number,// 钱包余额
    walletValue: number,  // 钱包价值
    depositAPY: number,   // 质押年华
}

const HomePage = () => {

    // 存储用户基本信息
    const userAddress = useTonAddress();
    const userWallet = useTonWallet();

    const [userUsdtAsset, setUserUsdtAsset] = useState<Asset>({
        symbol: 'usdt',     // 资产代码
        icon: "/images/usdt_logo.png",       // 你可以替换为本地或网络图片
        deposit: 0,    // 存款数量
        suppliedValue: 0,// 存款价值
        walletBalance: 0,// 钱包余额
        walletValue: 0,  // 钱包价值
        depositAPY: 0,   // 质押年华
    });

    const [tonConnectUI] = useTonConnectUI();

    // 获取用户Ton和USDT余额
    useEffect(() => {

        // 获取ton数量
        const fetchBalance = async () => {
            if (!userAddress) return;

            if (userWallet?.account.chain == CHAIN.MAINNET) {
                alert('Please use the Testnet work to connect !');
            }
        };

        fetchBalance().then();

        const fetchUsdtBalance = async () => {
            if (!userAddress) return;
            // 1. 获取主网入口节点
            // 2. 创建 TonClient 实例
            const client = new TonClient({
                endpoint: TonClientEndpoint,
                apiKey: TonClientAPIKey, // Optional
            });

            // 3. USDT Jetton Master 地址（来自 STON.fi）
            const usdtMasterAddress = Address.parse(usdtContractAddress);

            // 4. 用户钱包地址（Tonkeeper 钱包地址等）
            const userWalletAddress = Address.parse(userAddress);

            // 5. 创建 JettonMaster 实例
            const master = JettonMaster.create(usdtMasterAddress);

            // 6. 使用 open() 包装 master 合约，获取 provider
            const openedMaster = client.open(master);

            // 7. 查询用户的 JettonWallet 地址（从 master 合约推导）
            const jettonWalletAddress = await openedMaster.getWalletAddress(userWalletAddress);
            console.log('用户usdt地址：' + jettonWalletAddress);
            // 8. 创建并打开 JettonWallet 合约
            const wallet = JettonWallet.create(jettonWalletAddress);
            const openedWallet = client.open(wallet);

            // 9. 查询余额（nanoJetton）
            const balance = await openedWallet.getBalance();

            // 10. 转为常用单位（1 USDT = 1e6 nanoUSDT）
            const usdtBalance = Number(balance) / 1e6;

            console.log('USDT Balance:', usdtBalance);
            setUserUsdtAsset(prev => ({
                ...prev,
                walletBalance: usdtBalance
            }));
        };
        fetchUsdtBalance().then();

    }, [userAddress]);

    const handleUsdtDeposit = async () => {
        if (!userAddress) {
            alert("Please connect your wallet first!");
            return;
        }
        const usdtAmount: number = 2;
        if (isNaN(usdtAmount) || usdtAmount <= 0) {
            alert("Please enter a valid deposit amount!");
            return;
        }

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
            .storeCoins(toNano(usdtAmount / 1000))              // amount:(VarUInteger 16) -  Jetton amount for transfer (decimals = 6 - USDT, 9 - default). Function toNano use decimals = 9 (remember it)
            // destination:MsgAddress 质押合约的usdt地址
            .storeAddress(Address.parse('0QAAQ3X8LZ3qmwnIgaXwgysWnBBBE8T26G8B4iQ4-PHDGHQC'))// 目标钱包地址，非jetton钱包
            //  response_destination:MsgAddress
            .storeAddress(Address.parse(userAddress))// 发送者自己的普通地址
            .storeUint(0, 1)                          // custom_payload:(Maybe ^Cell)
            .storeCoins(toNano("0.1"))                 // forward_ton_amount:(VarUInteger 16) - if >0, will send notification message
            .storeUint(0, 1)                           // forward_payload:(Either Cell ^Cell)
            .endCell();
        // Create and send the transaction
        const transaction: SendTransactionRequest = {
            validUntil: 0,
            network: CHAIN.TESTNET,
            messages: [
                {
                    address: userUsdtWalletAddress.toString(),  // 用户的usdt钱包
                    amount: toNano("0.2").toString(),  // Transaction fee
                    payload: body.toBoc().toString('base64'),
                }
            ]
        };
        try {
            const result = await tonConnectUI.sendTransaction(transaction);
            console.log("Transaction sent:", result);
            const cell = Cell.fromBase64(result.boc);
            const hashBuffer = cell.hash();
            const extMsgHashHex = cell.hash().toString("hex");
            console.info(extMsgHashHex); //e.g. 55ce653a1198d44f7d89bb79f817519d785eae53090e70dd2d13a5a2b6c5cfc1
            localStorage.setItem("last_tx_hash", extMsgHashHex);
            alert("Deposit transaction has been sent. Please confirm it in your wallet.");
        } catch (error: any) {
            console.error("Failed to send transaction:", error);
            alert("Failed to send transaction: " + error.message);
        }
    }
    const useTxWatcher = (userAddress: string | null) => {
        useEffect(() => {
            if (!userAddress) return;

            const checkTxStatus = async () => {
                const hash = localStorage.getItem("last_tx_hash");
                if (!hash) {
                    console.log("无代查询交易");
                    return
                }

                try {
                    const res = await fetch('https://testnet.toncenter.com/api/v3/traces?msg_hash' + hash + '=&include_actions=false&limit=10&offset=0&sort=desc', {});
                    const data = await res.json();
                    let pending_messages = data.traces[0].trace_info.pending_messages;
                    console.log("Transactions result:", data.traces[0].trace_info.pending_messages);

                    if (pending_messages == 0) {
                        console.log("交易已被确认");
                        alert("Your transaction has been confirmed!");

                        localStorage.removeItem("last_tx_hash");
                        clearInterval(intervalId);
                    } else {
                        console.log("交易尚未确认...");
                    }
                } catch (error) {
                    console.error("查询交易出错：", error);
                }
            };

            const intervalId = setInterval(checkTxStatus, 2000); // 每10秒执行一次

            return () => {
                clearInterval(intervalId); // 组件卸载时清理
            };
        }, [userAddress]);
    };
    useTxWatcher(userAddress);

    return (
        <div>
            <div style={styles.card}>
                <div style={{fontSize: 16, color: "#888"}}>我的USDT数量</div>
                <div style={{fontSize: 36, fontWeight: 800, margin: "8px 0"}}>
                    ${(userUsdtAsset.walletBalance ).toFixed(2)}
                </div>
                <button style={styles.depositBtn} onClick={handleUsdtDeposit}>转账测试</button>
            </div>
        </div>
    );
};

export default HomePage;
