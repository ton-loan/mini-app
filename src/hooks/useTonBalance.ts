// hooks/useTonBalance.ts
import {useEffect, useState} from "react";
import {TonClient, fromNano} from "@ton/ton";
import {Address} from "@ton/core";

export function useTonBalance(userAddress: string | null) {
    // 1.初始化RPC客户端
    const client = new TonClient({
        endpoint: "https://testnet.toncenter.com/api/v2/jsonRPC",
        apiKey: "6a0955bc32034c4f0ef76337a1899a8402fae16560a4f7139cb5be05b2dc7177",
    });

    const [tonBalance, setTonBalance] = useState<number>(0);

    useEffect(() => {
        if (!userAddress) return;

        const fetchTonBalance = async () => {
            try {
                const balance = await client.getBalance(Address.parse(userAddress));
                setTonBalance(Number(fromNano(balance)));
                console.log("获取到用户TON余额：" + Number(fromNano(balance)).toFixed(2));
            } catch (error) {
                console.error("获取 TON 余额失败:", error);
                setTonBalance(0);
            }
        };

        fetchTonBalance().then();
    }, [userAddress]);

    return Number(tonBalance.toFixed(2));
}
