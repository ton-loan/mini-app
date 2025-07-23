import { useEffect, useState } from "react";
import {TonClient} from "@ton/ton";
import {Address, beginCell, fromNano} from "@ton/core";
import {TonClientAPIKey, TonClientEndpoint, TonLoanContract} from "@/config";

export interface UserDeposit {
    shareAmount: number;
    principalIndex: number;
}

export function useUserUsdtDeposit(userAddress: string): UserDeposit {
    const [userUsdtDeposit, setUserUsdtDeposit] = useState<UserDeposit>({
        shareAmount: 0,
        principalIndex: 0
    });
    // 创建 TonClient 实例
    const client = new TonClient({
        endpoint: TonClientEndpoint,
        apiKey: TonClientAPIKey, // Optional
    });

    useEffect(() => {
        (async () => {
            if (!userAddress) return;

            const userCell = beginCell().storeAddress(Address.parse(userAddress)).endCell();

            const userTonRes = await client.runMethod(TonLoanContract, "getUserUsdtDeposit", [
                { type: "slice", cell: userCell }
            ]);

            setUserUsdtDeposit({
                shareAmount: Number(fromNano(userTonRes.stack.readBigNumber())),
                principalIndex: Number(userTonRes.stack.readBigNumber().toString()),
            });
        })();
    }, [userAddress]);

    return userUsdtDeposit;
}
