// ton
import {TonClient} from "@ton/ton";
import {Address} from "@ton/core";
import {CHAIN} from "@tonconnect/sdk";

export const TON_PRICE_FEED_ID = "0x8963217838ab4cf5cadc172203c1f0b763fbaa45f346d8ee50ba994bbcac3026";
// usdt 合约地址
export const usdtContractAddress = "kQD0GKBM8ZbryVk2aESmzfU6b9b_8era_IkvBSELujFZPsyy";

//
export const TonClientAPIKey = "6a0955bc32034c4f0ef76337a1899a8402fae16560a4f7139cb5be05b2dc7177";
//
export const TonClientEndpoint = "https://testnet.toncenter.com/api/v2/jsonRPC";
// 借贷合约地址
export const TonLoanContract = Address.parse("kQDsnErv5oJxm6V3dKzs81Ay3XdVbZmjF85lrgaF_zcYVssD");
// 交易网络
export const TransactionNetwork = CHAIN.TESTNET;