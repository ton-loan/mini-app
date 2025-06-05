"use client";
import '@telegram-apps/telegram-ui/dist/styles.css';
import React, {useEffect, useState} from 'react';
import styles from '../styles/app';
import {Address, beginCell, fromNano} from "@ton/core";
import {PYTH_CONTRACT_ADDRESS_TESTNET, PythContract} from "@pythnetwork/pyth-ton-js";
import {JettonMaster, JettonWallet, TonClient} from "@ton/ton";
import {getHttpEndpoint} from "@orbs-network/ton-access";
import {useTonAddress, useTonConnectUI, useTonWallet} from "@tonconnect/ui-react";
import {HermesClient} from "@pythnetwork/hermes-client";
import {useRouter} from 'next/navigation';
import {TON_PRICE_FEED_ID, TonClientAPIKey, TonClientEndpoint, TonLoanContract, usdtContractAddress} from "@/config";
import {CHAIN} from "@tonconnect/sdk";

export interface PoolInfo {
    totalShare: bigint;       // 总份额
    totalAmount: bigint;      // 总资产
    liquidityIndex: bigint;   // 流动性指数
}

export interface UserDeposit {
    shareAmount: number;       // 用户持有的份额
    principalIndex: number;    // 存入时的流动性指数
}

// 首页基础信息
export interface MyAsset {
    totalBalance: number,     // 总余额
    tonBalance: number,     // 总余额
    usdtBalance: number,     // usdt
    netAPY: number,           // 平均年华收益
    availableToBorrow: number,// 可借金额
    healthFactor: number,     // 健康度
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

    // 从借贷合约获取信息
    // useEffect(() => {
    //     (async () => {
    //
    //         // 获取 testnet endpoint
    //         const endpoint = await getHttpEndpoint({network: 'testnet'});
    //
    //         // 创建 TonClient 实例
    //         const client = new TonClient({endpoint});
    //
    //         // 创建 TonClient 实例
    //         const contract = TonLoanContract;
    //
    //         // 池信息
    //         //const tonRes = await client.runMethod(contract, "getTonPool");
    //
    //         //console.log(tonRes)
    //         //const usdtRes = await client.runMethod(contract, "getUsdtPool");
    //
    //         // 用户信息
    //         console.log('用户地址' + userAddress)
    //         if (userAddress == '') {
    //             return;
    //         }
    //         const userCell = beginCell().storeAddress(Address.parse(userAddress)).endCell();
    //
    //         const userTonRes = await client.runMethod(contract, "getUserTonDeposit", [
    //             {type: "slice", cell: userCell},
    //         ]);
    //
    //         setUserTonDeposit({
    //             shareAmount: userTonRes.stack.readBigNumber(),
    //             principalIndex: userTonRes.stack.readBigNumber(),
    //         });
    //         console.log(userTonDeposit);
    //
    //         const userUsdtRes = await client.runMethod(contract, "getUserUsdtDeposit", [
    //             {type: "slice", cell: userCell},
    //         ]);
    //         setUserUsdtDeposit({
    //             shareAmount: userUsdtRes.stack.readBigNumber(),
    //             principalIndex: userUsdtRes.stack.readBigNumber(),
    //         });
    //         console.log(userUsdtDeposit);
    //     })();
    // }, [userAddress]);

    const mockData = {
        supplyBalance: 3.09,
        netAPY: 0.71,
        availableToBorrow: 2.22,
        healthFactor: 100,
        assets: [
            {
                symbol: "TON",
                icon: "/images/ton_logo.png", // 你可以替换为本地或网络图片
                supplied: 1.0,
                suppliedValue: 3.09,
                walletBalance: 3.95,
                walletValue: 12.13,
                supplyAPY: 0.71,
            },
            {
                symbol: "USDT",
                icon: "/images/usdt_logo.png",
                supplied: 0.0,
                suppliedValue: 0.0,
                walletBalance: 0.0,
                walletValue: 0.0,
                supplyAPY: 3.85,
            },
        ],
        loans: [
            {
                symbol: "TON",
                icon: "/images/ton_logo.png",
                borrowed: 0.5,
                borrowedValue: 1.55,
                interestRate: 2.5,
                repayable: true,
            },
            {
                symbol: "USDT",
                icon: "/images/usdt_logo.png",
                borrowed: 0.0,
                borrowedValue: 0.0,
                interestRate: 5.2,
                repayable: false,
            },
        ],
    };

    const router = useRouter();
    return (
        <div>
            {/* 资产总览 */}
            <div style={styles.card}>
                <div style={{fontSize: 16, color: "#888"}}>My Assets</div>
                <div style={{fontSize: 36, fontWeight: 800, margin: "8px 0"}}>
                    ${(userUsdtDeposit.shareAmount * userUsdtDeposit.principalIndex + userTonDeposit.shareAmount * userTonDeposit.principalIndex * tonPrice).toFixed(2)}
                </div>
                <div style={{color: "#1ecb81", fontWeight: 600, fontSize: 16}}>
                    NET APY <span>+{mockData.netAPY}%</span>
                </div>
                <button style={styles.depositBtn} onClick={() => router.push('/deposit/deposit-ton')}>Deposit</button>
            </div>

            {/* 可借额度与健康因子 */}
            <div style={styles.borrowCard}>
                <div style={{display: "flex", justifyContent: "space-between"}}>
                    <div>
                        <div style={{color: "#fff", fontSize: 15}}>You Can Borrow</div>
                        <div style={{color: "#fff", fontWeight: 700, fontSize: 24}}>
                            ${mockData.availableToBorrow.toFixed(2)}
                        </div>
                    </div>
                    <button style={styles.borrowBtn}>Borrow</button>
                </div>
                <div style={{
                    marginTop: 12,
                    color: "#fff",
                    fontSize: 15,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                }}>
                            <span style={{display: 'flex', alignItems: 'center'}}>
                                Loan Safety Score
                                <span style={{
                                    display: 'inline-block',
                                    marginLeft: 6,
                                    width: 18,
                                    height: 18,
                                    borderRadius: '50%',
                                    background: '#fff2',
                                    color: '#fff',
                                    fontWeight: 700,
                                    fontSize: 14,
                                    textAlign: 'center',
                                    lineHeight: '18px',
                                    cursor: 'pointer',
                                    position: 'relative',
                                }}
                                      title="Shows how safe your loan is."
                                >
                                    ?
                                </span>
                            </span>
                    <span style={{fontWeight: 700}}>{mockData.healthFactor}%</span>
                </div>
                <div style={styles.healthBar}>
                    <div style={{...styles.healthBarInner, width: `${mockData.healthFactor}%`}}/>
                </div>
            </div>

            {/* 资产/借款列表 */}
            <div style={styles.assetCard}>
                <div style={{display: "flex"}}>
                    <button
                        style={tab === 'assets' ? styles.tabActive : styles.tab}
                        onClick={() => setTab('assets')}
                    >
                        My Assets
                    </button>
                    <button
                        style={tab === 'loans' ? styles.tabActive : styles.tab}
                        onClick={() => setTab('loans')}
                    >
                        My Loans
                    </button>
                </div>
                <div>
                    {tab === 'assets' && (
                        <>
                            <div key='TON' style={styles.assetRow} onClick={() => router.push('/deposit/ton')}>
                                <img src='/images/ton_logo.png' alt='TON' style={styles.assetIcon}/>
                                <div style={{flex: 1}}>
                                    <div style={{fontWeight: 700}}>TON</div>
                                    <div style={{color: "#888", fontSize: 13}}>
                                        Wallet: {userTonAsset.walletBalance.toFixed(2)} (${(userTonAsset.walletBalance * tonPrice).toFixed(2)})
                                    </div>
                                </div>
                                <div style={{textAlign: "right"}}>
                                    <div
                                        style={{fontWeight: 700}}>{userTonDeposit.shareAmount * userTonDeposit.principalIndex}</div>
                                    <div style={{
                                        color: "#888",
                                        fontSize: 13
                                    }}>${(userTonDeposit.shareAmount * userTonDeposit.principalIndex * tonPrice).toFixed(2)}</div>
                                    <div style={{color: "#1ecb81", fontSize: 13}}>APY {userTonAsset.depositAPY}%</div>
                                </div>
                            </div>
                            <div key='USDT' style={styles.assetRow} onClick={() => router.push('/deposit/usdt')}>
                                <img src='/images/usdt_logo.png' alt='USDT' style={styles.assetIcon}/>
                                <div style={{flex: 1}}>
                                    <div style={{fontWeight: 700}}>USDT</div>
                                    <div style={{color: "#888", fontSize: 13}}>
                                        Wallet: {userUsdtAsset.walletBalance.toFixed(2)} (${(userUsdtAsset.walletBalance).toFixed(2)})
                                    </div>
                                </div>
                                <div style={{textAlign: "right"}}>
                                    <div
                                        style={{fontWeight: 700}}>{userUsdtDeposit.shareAmount * userUsdtDeposit.principalIndex}</div>
                                    <div style={{
                                        color: "#888",
                                        fontSize: 13
                                    }}>${(userUsdtDeposit.shareAmount).toFixed(2)}</div>
                                    <div style={{color: "#1ecb81", fontSize: 13}}>APY {userUsdtAsset.depositAPY}%</div>
                                </div>
                            </div>
                        </>
                    )}
                    {tab === 'loans' && (
                        <>
                            {mockData.loans.map((loan) => (
                                <div key={loan.symbol} style={styles.assetRow}>
                                    <img src={loan.icon} alt={loan.symbol} style={styles.assetIcon}/>
                                    <div style={{flex: 1}}>
                                        <div style={{fontWeight: 700}}>{loan.symbol}</div>
                                        <div style={{color: "#888", fontSize: 13}}>
                                            Borrowed: {loan.borrowed} (${loan.borrowedValue})
                                        </div>
                                    </div>
                                    <div style={{textAlign: "right"}}>
                                        <div style={{color: "#1ecb81", fontSize: 13}}>Interest {loan.interestRate}%
                                        </div>
                                        {loan.borrowed > 0 && loan.repayable && (
                                            <button style={styles.repayBtn}>Repay</button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {mockData.loans.every(l => l.borrowed === 0) && (
                                <div style={{color: '#888', textAlign: 'center', padding: 24}}>No active loans</div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HomePage;
