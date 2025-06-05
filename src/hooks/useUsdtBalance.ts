// hooks/useUsdtBalance.ts
import { useEffect, useState } from 'react';
import {JettonMaster, JettonWallet, TonClient} from "@ton/ton";
import {Address} from "@ton/core";
import {TonClientAPIKey, TonClientEndpoint, usdtContractAddress} from "@/config";

export const useUsdtBalance = (userAddress: string | undefined,) => {
    const [usdtBalance, setUsdtBalance] = useState<number>(0);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchUsdtBalance = async () => {
            if (!userAddress) return;
            setLoading(true);
            setError(null);

            try {
                const client = new TonClient({
                    endpoint: TonClientEndpoint,
                    apiKey: TonClientAPIKey,
                });

                const usdtMasterAddress = Address.parse(usdtContractAddress);
                const userWalletAddress = Address.parse(userAddress);

                const master = JettonMaster.create(usdtMasterAddress);
                const openedMaster = client.open(master);

                const jettonWalletAddress = await openedMaster.getWalletAddress(userWalletAddress);
                const wallet = JettonWallet.create(jettonWalletAddress);
                const openedWallet = client.open(wallet);

                const balance = await openedWallet.getBalance();
                const usdtBalance = Number(balance) / 1e6;
                setUsdtBalance(usdtBalance);

            } catch (err: any) {
                console.error('Failed to fetch USDT balance:', err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchUsdtBalance().then();
    }, [userAddress, TonClientEndpoint, TonClientAPIKey, usdtContractAddress]);

    return { usdtBalance, loading, error };
};
