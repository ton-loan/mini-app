"use client";
import '@telegram-apps/telegram-ui/dist/styles.css';
import React, {useEffect, useState} from 'react';
import styles from '../../styles/app';
import {Address, beginCell, Cell, fromNano, toNano} from "@ton/core";
import {PYTH_CONTRACT_ADDRESS_TESTNET, PythContract} from "@pythnetwork/pyth-ton-js";
import {JettonMaster, JettonWallet, TonClient} from "@ton/ton";
import {getHttpEndpoint} from "@orbs-network/ton-access";
import {SendTransactionRequest, useTonAddress, useTonConnectUI, useTonWallet} from "@tonconnect/ui-react";
import {HermesClient} from "@pythnetwork/hermes-client";
import {TON_PRICE_FEED_ID, TonClientAPIKey, TonClientEndpoint, TonLoanContract, usdtContractAddress} from "@/config";
import {CHAIN} from "@tonconnect/sdk";


export interface UserDeposit {
    shareAmount: number;       // 用户持有的份额
    principalIndex: number;    // 存入时的流动性指数
}

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

    // 存储用户TON质押信息
    const [userTonAsset, setUserTonAsset] = useState<Asset>({
        symbol: 'TON',     // 资产代码
        icon: "/images/ton_logo.png",       // 你可以替换为本地或网络图片
        deposit: 0,    // 存款数量
        suppliedValue: 0,// 存款价值
        walletBalance: 0,// 钱包余额
        walletValue: 0,  // 钱包价值
        depositAPY: 0,   // 质押年华
    });

    // 存储用户USDT质押信息
    const [userUsdtAsset, setUserUsdtAsset] = useState<Asset>({
        symbol: 'usdt',     // 资产代码
        icon: "/images/usdt_logo.png",       // 你可以替换为本地或网络图片
        deposit: 0,    // 存款数量
        suppliedValue: 0,// 存款价值
        walletBalance: 0,// 钱包余额
        walletValue: 0,  // 钱包价值
        depositAPY: 0,   // 质押年华
    });

    const [userTonDeposit, setUserTonDeposit] = useState<UserDeposit>({
        principalIndex: 0,
        shareAmount: 0
    });
    const [userUsdtDeposit, setUserUsdtDeposit] = useState<UserDeposit>({
        principalIndex: 0,
        shareAmount: 0
    });

    // 状态变量来存储异步获取的数据
    const [guardianSetIndex, setGuardianSetIndex] = useState<number | null>(null);
    const [tonPrice, setTonPrice] = useState<number>(0);
    const [tonPriceFromHermes, setTonPriceFromHermes] = useState<number | null>(null);

    const [tab, setTab] = useState<'assets' | 'loans'>('assets');
    const [tonConnectUI] = useTonConnectUI();
    // 1.初始化RPC客户端
    const client = new TonClient({
        endpoint: TonClientEndpoint,
        apiKey: TonClientAPIKey, // Optional
    });
    // 获取用户Ton和USDT余额
    useEffect(() => {

        // 获取ton数量
        const fetchBalance = async () => {
            if (!userAddress) return;

            if (userWallet?.account.chain == CHAIN.MAINNET) {
                alert('Please use the Testnet work to connect !');
            }

            try {
                const balance = await client.getBalance(Address.parse(userAddress))
                console.log("用户ton余额：" + fromNano(balance));
                setUserTonAsset(prev => ({
                    ...prev,
                    walletBalance: Number(fromNano(balance))
                }));
            } catch (error) {
                console.error("获取余额失败：", error);
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

    // 2.初始化预言机配置
    useEffect(() => {

        const contractAddress = Address.parse(PYTH_CONTRACT_ADDRESS_TESTNET);
        const contract = client.open(PythContract.createFromAddress(contractAddress));

        // 从预言机获取Ton最新价格信息
        const hermesEndpoint = "https://hermes.pyth.network";
        const hermesClient = new HermesClient(hermesEndpoint);
        const fetchGuardianSetIndexAndPrice = async () => {
            try {
                // 获取当前 guardian set index
                const index = await contract.getCurrentGuardianSetIndex();
                setGuardianSetIndex(index);
                console.log("Guardian Set Index:", index);

                // 获取 TON price
                // const price = await contract.getPriceUnsafe(TON_PRICE_FEED_ID);
                // setTonPrice(price.price / 100000000);
                // console.log("TON Price from TON contract:", price);

                // 获取 TON price from HermesClient
                const priceIds = [TON_PRICE_FEED_ID];
                const latestPriceUpdates = await hermesClient.getLatestPriceUpdates(priceIds, {encoding: "hex"});
                const priceFromHermes = latestPriceUpdates.parsed?.[0].price;
                if (priceFromHermes) {
                    setTonPriceFromHermes((Number(priceFromHermes.price) / 100000000));
                    console.log("Hermes TON Price:", (Number(priceFromHermes.price) / 100000000));
                    setTonPrice((Number(priceFromHermes.price) / 100000000))
                }

            } catch (error) {
                console.error("获取数据失败：", error);
            }
        };

        fetchGuardianSetIndexAndPrice().then();
    }, []);

    // 3.从借贷合约获取信息
    useEffect(() => {
        (async () => {

            // 获取 testnet endpoint
            const endpoint = await getHttpEndpoint({network: 'testnet'});

            // 创建 TonClient 实例
            const client = new TonClient({
                endpoint: TonClientEndpoint,
                apiKey: TonClientAPIKey, // Optional
            });
            const contract = TonLoanContract;

            // 池信息
            const tonRes = await client.runMethod(contract, "getTonPool");
            // setTonPool({
            //     totalShare: tonRes.stack.readBigNumber(),
            //     totalAmount: tonRes.stack.readBigNumber(),
            //     liquidityIndex: tonRes.stack.readBigNumber(),
            // });

            const usdtRes = await client.runMethod(contract, "getUsdtPool");
            // setUsdtPool({
            //     totalShare: usdtRes.stack.readBigNumber(),
            //     totalAmount: usdtRes.stack.readBigNumber(),
            //     liquidityIndex: usdtRes.stack.readBigNumber(),
            // });

            // 用户信息
            console.log('用户地址' + userAddress)
            if (userAddress == '') {
                return;
            }
            const userCell = beginCell().storeAddress(Address.parse(userAddress)).endCell();

            const userTonRes = await client.runMethod(contract, "getUserTonDeposit", [
                {type: "slice", cell: userCell},
            ]);
            ///console.log("用户ton质押数量：" + userTonRes.stack.readBigNumber().toString())
            setUserTonDeposit({
                shareAmount: Number(fromNano(userTonRes.stack.readBigNumber())),
                principalIndex: Number(userTonRes.stack.readBigNumber().toString()),
            });
            console.log("用户ton质押数量：" + (userTonDeposit.shareAmount.toFixed(2)));
            const userUsdtRes = await client.runMethod(contract, "getUserUsdtDeposit", [
                {type: "slice", cell: userCell},
            ]);
            setUserUsdtDeposit({
                shareAmount: userUsdtRes.stack.readNumber() / 1000000,
                principalIndex: userUsdtRes.stack.readNumber(),
            });
            console.log("用户usdt质押数量：" + userUsdtDeposit.shareAmount.toString());
        })();
    }, [userAddress]);

    const handleUsdtDeposit = async () => {
        if (!userAddress) {
            alert("Please connect your wallet first!");
            return;
        }
        const usdtAmount: number = 1;
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
    const [hasPendingTx, setHasPendingTx] = useState(false);

    const useTxWatcher = (userAddress: string | null) => {
        useEffect(() => {
            if (!userAddress) return;

            const checkTxStatus = async () => {
                const hash = localStorage.getItem("last_tx_hash");
                if (!hash) {
                    console.log("无代查询交易 ✅");
                    return
                }

                try {
                    const res = await fetch('https://testnet.toncenter.com/api/v3/traces?msg_hash' + hash + '=&include_actions=false&limit=10&offset=0&sort=desc', {});
                    const data = await res.json();
                    let pending_messages = data.traces[0].trace_info.pending_messages;
                    console.log("Transactions result:", data.traces[0].trace_info.pending_messages);

                    if (pending_messages == 0) {
                        console.log("交易已被确认 ✅");
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
            {/* 资产总览 */}
            <div style={styles.card}>
                <div style={{fontSize: 16, color: "#888"}}>My Assets</div>
                <div style={{fontSize: 36, fontWeight: 800, margin: "8px 0"}}>
                    ${(userUsdtAsset.walletBalance + userTonAsset.walletBalance * tonPrice).toFixed(2)}
                </div>
                <button style={styles.depositBtn} onClick={handleUsdtDeposit}>Transform 1 Usdt Test</button>
            </div>
        </div>
    );
};

export default HomePage;
