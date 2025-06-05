import { useEffect, useState } from "react";
import {getHttpEndpoint} from "@orbs-network/ton-access";
import {TonClient} from "@ton/ton";
import {Address, beginCell, fromNano} from "@ton/core";
import {TonLoanContract} from "@/config";

export interface UserDeposit {
    shareAmount: number;
    principalIndex: number;
}

export function useUserTonDeposit(userAddress: string): UserDeposit {
    const [userTonDeposit, setUserTonDeposit] = useState<UserDeposit>({
        shareAmount: 0,
        principalIndex: 0
    });

    useEffect(() => {
        (async () => {
            if (!userAddress) return;

            const endpoint = await getHttpEndpoint({ network: 'testnet' });
            const client = new TonClient({ endpoint });
            const userCell = beginCell().storeAddress(Address.parse(userAddress)).endCell();

            const userTonRes = await client.runMethod(TonLoanContract, "getUserTonDeposit", [
                { type: "slice", cell: userCell }
            ]);

            setUserTonDeposit({
                shareAmount: Number(fromNano(userTonRes.stack.readBigNumber())),
                principalIndex: Number(userTonRes.stack.readBigNumber().toString()),
            });
        })();
    }, [userAddress]);

    return userTonDeposit;
}
