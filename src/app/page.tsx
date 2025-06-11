"use client";
import '@telegram-apps/telegram-ui/dist/styles.css';
import React, {useEffect, useState} from 'react';
import {useTonAddress, useTonWallet} from "@tonconnect/ui-react";
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

    useEffect(() => {
        if (!userAddress) return;
        if (userWallet?.account.chain == CHAIN.MAINNET) {
            alert('请使用测试网链接 !');
        }
    }, [userAddress]);
    return (
        <div>
            Homework
        </div>
    );
};

export default HomePage;
