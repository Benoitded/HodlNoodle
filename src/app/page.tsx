"use client";

import Image from "next/image";
import styles from "./page.module.scss";
import { Link } from "next-view-transitions";
import { useCallback, useState } from "react";
import { useEffect } from "react";
import { PushAPI, CONSTANTS, user } from "@pushprotocol/restapi";
import { useAccount, useWalletClient } from "wagmi";
import { usePushSDK } from "@/context/usePushSDK";
import NoodleCard from "@/components/NoodleCard/NoodleCard";

export default function Home() {
  const { address } = useAccount();
  const { data: walletClient, isError, isLoading } = useWalletClient();
  const { user, handleChatprofileUnlock, noodles } = usePushSDK();

  async function getInfoUser() {
    if (!user) return;
    const response = await user.profile.info();
    console.log("response info user", response);
  }
  async function getChatUser() {
    if (!user) return;
    const chats = await user.chat.list("CHATS");
    console.log("getChatUser", chats);
  }
  async function getChatRequestUser() {
    if (!user) return;
    const chats = await user.chat.list("REQUESTS");
    console.log("getChatRequestUser", chats);
  }
  useEffect(() => {
    getInfoUser();
    getChatUser();
    getChatRequestUser();
  }, [user]);

  function handleClick() {
    console.log("handleClick", user);
    getInfoUser();
    getChatUser();
    getChatRequestUser();
  }

  return (
    <div className={styles.page}>
      {/* <button onClick={handleClick}>Click to get data</button> */}
      {noodles.map((noodle) => (
        <NoodleCard noodle={noodle} />
      ))}
    </div>
  );
}
