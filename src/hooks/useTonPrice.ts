import { useEffect, useState } from "react";
import { Address } from "@ton/core";
import { HermesClient } from "@pythnetwork/hermes-client";
import {PYTH_CONTRACT_ADDRESS_TESTNET, PythContract} from "@pythnetwork/pyth-ton-js";
import {TonClient} from "@ton/ton";

const TON_PRICE_FEED_ID = "0x8963217838ab4cf5cadc172203c1f0b763fbaa45f346d8ee50ba994bbcac3026";
const hermesClient = new HermesClient("https://hermes.pyth.network");

export function useTonPrice() {
    const [guardianSetIndex, setGuardianSetIndex] = useState<number>(0);
    const [tonPrice, setTonPrice] = useState<number>(0);
    // 1.初始化RPC客户端
    const client = new TonClient({
        endpoint: "https://testnet.toncenter.com/api/v2/jsonRPC",
        apiKey: "6a0955bc32034c4f0ef76337a1899a8402fae16560a4f7139cb5be05b2dc7177",
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const contractAddress = Address.parse(PYTH_CONTRACT_ADDRESS_TESTNET);
                const contract = client.open(PythContract.createFromAddress(contractAddress));

                const index = await contract.getCurrentGuardianSetIndex();
                setGuardianSetIndex(index);

                const latestPriceUpdates = await hermesClient.getLatestPriceUpdates(
                    [TON_PRICE_FEED_ID],
                    { encoding: "hex" }
                );
                const priceFromHermes = latestPriceUpdates.parsed?.[0]?.price;

                if (priceFromHermes) {
                    const price = Number(priceFromHermes.price) / 100_000_000;
                    setTonPrice(price);
                    console.log("TON 预言机数据获取TON价格:", price);
                }
            } catch (error) {
                console.error("TON 预言机数据获取失败:", error);
            }
        };

        fetchData().then();
    }, []);

    return { guardianSetIndex, tonPrice };
}
