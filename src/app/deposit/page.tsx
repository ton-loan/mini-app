'use client';
import React, {useState, ChangeEvent, useEffect} from 'react';
import {
    SendTransactionRequest,
    TonConnectButton,
    useTonAddress,
    useTonConnectUI
} from '@tonconnect/ui-react';
import {AppRoot, Button, Input, Text, Placeholder} from "@telegram-apps/telegram-ui";
import {Address, fromNano, beginCell, toNano} from "@ton/core";
import {CHAIN} from "@tonconnect/sdk";
import {HermesClient} from "@pythnetwork/hermes-client";
import {
    PythContract,
    PYTH_CONTRACT_ADDRESS_TESTNET,
    calculateUpdatePriceFeedsFee,
} from "@pythnetwork/pyth-ton-js";
import {JettonMaster, TonClient} from "@ton/ton";
import {
    createCellChain,
} from "@pythnetwork/pyth-ton-js";
import {getHttpEndpoint} from "@orbs-network/ton-access";

const CONTRACT_ADDRESS: string = "EQDQLM-OU7V8qeWq0qTpiqzZzF4Q7P9ghcRvPsKyK3LnCdSq";

const client = new TonClient({
    endpoint: "https://testnet.toncenter.com/api/v2/jsonRPC",
    apiKey: "6a0955bc32034c4f0ef76337a1899a8402fae16560a4f7139cb5be05b2dc7177", // Optional
});
const BTC_PRICE_FEED_ID = "0x8963217838ab4cf5cadc172203c1f0b763fbaa45f346d8ee50ba994bbcac3026";

export interface PoolInfo {
    totalShare: bigint;       // 总份额
    totalAmount: bigint;      // 总资产
    liquidityIndex: bigint;   // 流动性指数
}

export interface UserDeposit {
    shareAmount: bigint;       // 用户持有的份额
    principalIndex: bigint;    // 存入时的流动性指数
}

const DepositPage: React.FC = () => {
    const [amount, setAmount] = useState<string>('');
    const address = useTonAddress();

    const [tonConnectUI] = useTonConnectUI();
    const [balance, setBalance] = useState<string>('0.00');
    const [tonPool, setTonPool] = useState<PoolInfo>({
        liquidityIndex: BigInt(0),
        totalAmount: BigInt(0),
        totalShare: BigInt(0)
    });
    const [usdtPool, setUsdtPool] = useState<PoolInfo>({
        liquidityIndex: BigInt(0),
        totalAmount: BigInt(0),
        totalShare: BigInt(0)
    });
    const [userTon, setUserTon] = useState<UserDeposit>({principalIndex: BigInt(0), shareAmount: BigInt(0)});
    const [userUsdt, setUserUsdt] = useState<UserDeposit>({principalIndex: BigInt(0), shareAmount: BigInt(0)});

    // 状态变量来存储异步获取的数据
    const [guardianSetIndex, setGuardianSetIndex] = useState<number | null>(null);
    const [tonPrice, setTonPrice] = useState<number | null>(null);
    const [tonPriceFromHermes, setTonPriceFromHermes] = useState<number | null>(null);

    const contractAddress = Address.parse(PYTH_CONTRACT_ADDRESS_TESTNET);
    const contract = client.open(PythContract.createFromAddress(contractAddress));
    // 借贷合约地址
    const TonLoanContract = Address.parse("kQAPkw7Ukqpc0w5blvPk4AzXRAkZ52fQxfGB3jmQsIIUNaZy");

    // 从借贷合约获取信息
    useEffect(() => {
        (async () => {

            // 获取 testnet endpoint
            const endpoint = await getHttpEndpoint({network: 'testnet'});

            // 创建 TonClient 实例
            const client = new TonClient({endpoint});
            const contract = TonLoanContract;

            // 池信息
            const tonRes = await client.runMethod(contract, "getTonPool");
            setTonPool({
                totalShare: tonRes.stack.readBigNumber(),
                totalAmount: tonRes.stack.readBigNumber(),
                liquidityIndex: tonRes.stack.readBigNumber(),
            });

            const usdtRes = await client.runMethod(contract, "getUsdtPool");
            setUsdtPool({
                totalShare: usdtRes.stack.readBigNumber(),
                totalAmount: usdtRes.stack.readBigNumber(),
                liquidityIndex: usdtRes.stack.readBigNumber(),
            });

            // 用户信息
            console.log('用户地址' + address)
            if (address == '') {
                return;
            }
            const userCell = beginCell().storeAddress(Address.parse(address)).endCell();

            const userTonRes = await client.runMethod(contract, "getUserTonDeposit", [
                {type: "slice", cell: userCell},
            ]);
            setUserTon({
                shareAmount: userTonRes.stack.readBigNumber(),
                principalIndex: userTonRes.stack.readBigNumber(),
            });
            console.log(userTon)
            const userUsdtRes = await client.runMethod(contract, "getUserUsdtDeposit", [
                {type: "slice", cell: userCell},
            ]);
            setUserUsdt({
                shareAmount: userUsdtRes.stack.readBigNumber(),
                principalIndex: userUsdtRes.stack.readBigNumber(),
            });
            console.log(userUsdt)
            console.log(userUsdt.shareAmount?.toString());
        })();
    }, [address]);

    // Create HermesClient instance
    const hermesEndpoint = "https://hermes.pyth.network";
    const hermesClient = new HermesClient(hermesEndpoint);

    useEffect(() => {
        const fetchGuardianSetIndexAndPrice = async () => {
            try {
                // 获取当前 guardian set index
                const index = await contract.getCurrentGuardianSetIndex();
                setGuardianSetIndex(index);
                console.log("Guardian Set Index:", index);

                // 获取 BTC price
                // const price = await contract.getPriceUnsafe(BTC_PRICE_FEED_ID);
                // setTonPrice(price.price / 100000000);
                // console.log("BTC Price from TON contract:", price);

                // 获取 BTC price from HermesClient
                const priceIds = [BTC_PRICE_FEED_ID];
                const latestPriceUpdates = await hermesClient.getLatestPriceUpdates(priceIds, {encoding: "hex"});
                const priceFromHermes = latestPriceUpdates.parsed?.[0].price;
                if (priceFromHermes && typeof priceFromHermes.price === "string") {
                    setTonPriceFromHermes((Number(priceFromHermes.price) / 100000000));
                    console.log("Hermes TON Price:", (Number(priceFromHermes.price) / 100000000));
                    setTonPrice((Number(priceFromHermes.price) / 100000000));
                }

                // 获取ton price A
                try {

                    // 调用get_ton_price_A方法
                    const priceA = await client.runMethod(
                        Address.parse(CONTRACT_ADDRESS),
                        'get_ton_price_A'
                    )
                    //setTonPriceA(priceA);
                    console.log("Ton price A:", priceA.stack.readBigNumber());
                } catch (error) {
                    console.error("获取TON价格A失败：", error);
                }

            } catch (error) {
                console.error("获取数据失败：", error);
            }
        };

        fetchGuardianSetIndexAndPrice().then();
    }, []);

    useEffect(() => {
        const fetchBalance = async () => {
            if (!address) return;
            try {
                const balance = await client.getBalance(Address.parse(address))
                setBalance(fromNano(balance));
            } catch (error) {
                console.error("获取余额失败：", error);
            }
        };

        fetchBalance().then();
    }, [address]);

    const handleDeposit = async () => {
        if (!address) {
            alert("请先连接您的钱包！");
            return;
        }

        const tonAmount: number = parseFloat(amount);
        if (isNaN(tonAmount) || tonAmount <= 0) {
            alert("请输入有效的存款金额！");
            return;
        }
        console.log('用户质押金额：' + tonAmount)

        // 获取 BTC 价格
        const priceIds = [BTC_PRICE_FEED_ID];
        const latestPriceUpdates = await hermesClient.getLatestPriceUpdates(priceIds, {encoding: "hex"});
        console.log(latestPriceUpdates);

        // 获取价格更新数据
        const priceUpdateData = Buffer.from(latestPriceUpdates.binary.data[0], "hex");
        console.log("Price update data:", priceUpdateData);

        // 获取更新费用
        const updateFee = await contract.getUpdateFee(priceUpdateData);

        const totalFee = calculateUpdatePriceFeedsFee(BigInt(updateFee)) + BigInt(updateFee);
        console.log("totalFee:", totalFee);

        if (latestPriceUpdates.parsed === null || typeof latestPriceUpdates.parsed == 'undefined') {
            console.log("latestPriceUpdates.parsed error");
            return;
        }

        console.log("publish_time:", latestPriceUpdates.parsed[0].price.publish_time);

        // Create a buffer for price IDs: 1 byte length + (32 bytes per ID)
        const priceIdsBuffer = Buffer.alloc(1 + priceIds.length * 32);
        priceIdsBuffer.writeUInt8(priceIds.length, 0);

        // Write each price ID as a 32-byte value
        priceIds.forEach((id, index) => {
            // Remove '0x' prefix if present and pad to 64 hex chars (32 bytes)
            const hexId = id.replace("0x", "").padStart(64, "0");
            Buffer.from(hexId, "hex").copy(priceIdsBuffer, 1 + index * 32);
        });

        // const customPayload = Buffer.from("1234567890abcdef", "hex");
        const customPayload = beginCell()
            .storeInt(1, 8)  // 第一个整数
            .storeInt(toNano(0.8), 32)  // 第二个整数
            .endCell();

        const message = beginCell()
            .storeUint(5, 32) // op 5 ok
            .storeRef(createCellChain(priceUpdateData)) // ok
            .storeRef(createCellChain(priceIdsBuffer)) // ok
            .storeUint(latestPriceUpdates.parsed[0].price.publish_time, 64) // minPublishTime
            .storeUint(latestPriceUpdates.parsed[0].price.publish_time, 64)   // minPublishTime
            .storeAddress(TonLoanContract) // 价格最终通知者
            .storeRef(customPayload)
            .endCell();

        // 创建交易并发送
        const transaction: SendTransactionRequest = {
            validUntil: 0,
            network: CHAIN.TESTNET,
            messages: [
                {
                    address: "EQB4ZnrI5qsP_IUJgVJNwEGKLzZWsQOFhiaqDbD7pTt_f9oU",  // 目标合约地址 pyth预言机
                    amount: totalFee + amount,  // 交易费用
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
    };

    const handleWithdrawTon = async () => {
        if (!address) {
            alert("请先连接您的钱包！");
            return;
        }

        const tonAmount: number = parseFloat(amount);
        if (isNaN(tonAmount) || tonAmount <= 0) {
            alert("请输入有效的存款金额！");
            return;
        }
        console.log(tonPriceFromHermes);

        // 获取 BTC 价格
        const priceIds = [BTC_PRICE_FEED_ID];
        const latestPriceUpdates = await hermesClient.getLatestPriceUpdates(priceIds, {encoding: "hex"});
        console.log(latestPriceUpdates);

        // 获取价格更新数据
        const priceUpdateData = Buffer.from(latestPriceUpdates.binary.data[0], "hex");
        console.log("Price update data:", priceUpdateData);

        // 获取更新费用
        const updateFee = await contract.getUpdateFee(priceUpdateData);
        console.log("Update fee:", updateFee);
        const totalFee = calculateUpdatePriceFeedsFee(BigInt(updateFee)) + BigInt(updateFee);

        if (latestPriceUpdates.parsed === null || typeof latestPriceUpdates.parsed == 'undefined') {
            console.log("latestPriceUpdates.parsed error");
            return;
        }

        console.log("publish_time:", latestPriceUpdates.parsed[0].price.publish_time);

        // Create a buffer for price IDs: 1 byte length + (32 bytes per ID)
        const priceIdsBuffer = Buffer.alloc(1 + priceIds.length * 32);
        priceIdsBuffer.writeUInt8(priceIds.length, 0);

        // Write each price ID as a 32-byte value
        priceIds.forEach((id, index) => {
            // Remove '0x' prefix if present and pad to 64 hex chars (32 bytes)
            const hexId = id.replace("0x", "").padStart(64, "0");
            Buffer.from(hexId, "hex").copy(priceIdsBuffer, 1 + index * 32);
        });

        // const customPayload = Buffer.from("1234567890abcdef", "hex");
        const customPayload = beginCell()
            .storeInt(1, 8)  // 第一个整数
            .storeInt(toNano(0.8), 32)  // 第二个整数
            .endCell();

        const message = beginCell()
            .storeUint(5, 32) // op 5 ok
            .storeRef(createCellChain(priceUpdateData)) // ok
            .storeRef(createCellChain(priceIdsBuffer)) // ok
            .storeUint(latestPriceUpdates.parsed[0].price.publish_time, 64) // minPublishTime
            .storeUint(latestPriceUpdates.parsed[0].price.publish_time, 64)   // minPublishTime
            .storeAddress(Address.parse("EQABBG0h2To7QlXyDqr_li1khz_w92FbzFzOinQ1uPrZyKEb")) // 价格最终通知者
            .storeRef(customPayload)
            .endCell();

        // 创建交易并发送
        const transaction: SendTransactionRequest = {
            validUntil: 0,
            network: CHAIN.TESTNET,
            messages: [
                {
                    address: "EQB4ZnrI5qsP_IUJgVJNwEGKLzZWsQOFhiaqDbD7pTt_f9oU",  // 目标合约地址 pyth预言机
                    amount: totalFee.toString(),  // 交易费用
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
    };

    const handleDepositUSDT = async () => {
        if (!address) {
            alert("Please connect your wallet first!");
            return;
        }
        const tonAmount: number = parseFloat(amount);
        if (isNaN(tonAmount) || tonAmount <= 0) {
            alert("Please enter a valid deposit amount!");
            return;
        }

        // 获取 testnet endpoint
        const endpoint = await getHttpEndpoint({network: 'testnet'});

        // 创建 TonClient 实例
        const client = new TonClient({endpoint});

        const master = client.open(JettonMaster.create(Address.parse("kQD0GKBM8ZbryVk2aESmzfU6b9b_8era_IkvBSELujFZPsyy")));
        // 正确调用实例方法
        const userUsdtWalletAddress = await master.getWalletAddress(Address.parse(address));

        const loanUsdtWalletAddress = await master.getWalletAddress(Address.parse('kQAPkw7Ukqpc0w5blvPk4AzXRAkZ52fQxfGB3jmQsIIUNaZy'));

        // message(0xf8a7ea5) TokenTransfer {
        //     queryId: Int as uint64;
        //     amount: Int as coins;
        //     destination: Address;
        //     response_destination: Address;
        //     custom_payload: Cell?;
        //     forward_ton_amount: Int as coins;
        //     forward_payload: Slice as remaining; // Comment Text message when Transfer the jetton
        // }


        const testWalletAddress = await master.getWalletAddress(Address.parse("0QDy11X2jePLoLuOO5DeiNLXEFYNXdW-xnKqqn6s7rzrU8uL"));
        console.log('testWalletAddress:' + testWalletAddress.toString());
        const body = beginCell()
            .storeUint(0xf8a7ea5, 32)                 // jetton transfer op code
            .storeUint(0, 64)                         // query_id:uint64
            .storeCoins(toNano("0.005"))              // amount:(VarUInteger 16) -  Jetton amount for transfer (decimals = 6 - USDT, 9 - default). Function toNano use decimals = 9 (remember it)
            // destination:MsgAddress 质押合约的usdt地址
            .storeAddress(Address.parse("kQAPkw7Ukqpc0w5blvPk4AzXRAkZ52fQxfGB3jmQsIIUNaZy"))// 目标钱包地址，非jetton钱包
            //  response_destination:MsgAddress
            .storeAddress(Address.parse('kQBw8Y9VI9Ie1XbIx5sx2FfK_c8EVKJn49XtFPHwwlW10D5m'))// 发送者自己的普通地址
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
                    address: 'kQBw8Y9VI9Ie1XbIx5sx2FfK_c8EVKJn49XtFPHwwlW10D5m',  // 用户的usdt钱包
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

    const handleAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
        setAmount(e.target.value);
    };

    return (
        <AppRoot>
            <div style={styles.container as React.CSSProperties}>
                <div>
                    <TonConnectButton style={{float: "right"}}/>
                </div>

                {/* 钱包余额 */}
                <div style={{marginTop: "20px"}}>
                    <Text weight="3">Your Balance: {balance} TON</Text>
                </div>

                {/* Guardian Index & Price */}
                <div style={{marginTop: "20px"}}>
                    {guardianSetIndex !== null ? (
                        <Text weight="3">Current Guardian Set Index: {guardianSetIndex}</Text>
                    ) : (
                        <Placeholder>Loading Guardian Set Index...</Placeholder>
                    )}
                    <br/>
                    {tonPrice !== null ? (
                        <Text weight="3">TON Price: {tonPrice} USD</Text>
                    ) : (
                        <Placeholder>Loading TON Price...</Placeholder>
                    )}
                </div>

                {/* TON 池信息 */}
                <div style={{marginTop: "30px"}}>
                    <Text weight="3">TON Pool Info</Text>
                    <div>
                        <Text>Total Share: {tonPool?.totalShare?.toString() ?? "Loading..."}</Text>
                        <Text>Total Amount: {tonPool?.totalAmount?.toString() ?? "Loading..."}</Text>
                        <Text>Liquidity Index: {tonPool?.liquidityIndex?.toString() ?? "Loading..."}</Text>
                    </div>
                </div>

                {/* 用户 TON 存款 */}
                <div style={{marginTop: "20px"}}>
                    <Text weight="3">Your TON Deposit</Text>
                    <div>
                        <Text>Share Amount: {userTon?.shareAmount?.toString() ?? "Loading..."}</Text>
                        <Text>Principal Index: {userTon?.principalIndex?.toString() ?? "Loading..."}</Text>
                    </div>
                </div>

                {/* USDT 池信息 */}
                <div style={{marginTop: "30px"}}>
                    <Text weight="3">USDT Pool Info</Text>
                    <div>
                        <Text>Total Share: {usdtPool?.totalShare?.toString() ?? "Loading..."}</Text>
                        <Text>Total Amount: {usdtPool?.totalAmount?.toString() ?? "Loading..."}</Text>
                        <Text>Liquidity Index: {usdtPool?.liquidityIndex?.toString() ?? "Loading..."}</Text>
                    </div>
                </div>

                {/* 用户 USDT 存款 */}
                <div style={{marginTop: "20px"}}>
                    <Text weight="3">Your USDT Deposit</Text>
                    <div>
                        <Text>Share Amount: {userUsdt?.shareAmount?.toString() ?? "Loading..."}</Text>
                        <Text>Principal Index: {userUsdt?.principalIndex?.toString() ?? "Loading..."}</Text>
                    </div>
                </div>

                <div style={{marginTop: "20px"}}>
                    <label>
                        <Input
                            type="number"
                            value={amount}
                            onChange={handleAmountChange}
                            style={{marginLeft: "10px"}}
                        />
                    </label>
                </div>

                {/* 按钮 */}
                <Button onClick={handleDeposit} style={{marginTop: "20px", padding: "8px 16px"}}>
                    Deposit TON
                </Button>
                <Button onClick={handleWithdrawTon} style={{marginTop: "20px", padding: "8px 16px"}}>
                    Withdraw TON
                </Button>
                <Button onClick={handleDepositUSDT} style={{marginTop: "20px", padding: "8px 16px"}}>
                    Deposit USDT
                </Button>
            </div>
        </AppRoot>

    );
};

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        padding: '10px',
        height: '100vh',
        backgroundColor: '#F8F9FA',
    },
    logo: {
        display: 'block',
        width: '144px',
        height: '144px',
        marginBottom: '20px',
    },
    buttonWrapper: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: '10px',
        width: '100%',
        maxWidth: '200px',
        margin: '0 auto',
    },
};

export default DepositPage;
