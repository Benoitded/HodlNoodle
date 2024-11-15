"use client";

import Image from "next/image";
import styles from "./page.module.scss";
import { Link } from "next-view-transitions";
import { useCallback, useState } from "react";
import { useEffect } from "react";
import { noodles } from "@/data/noodles";
import { PushAPI, CONSTANTS, user } from "@pushprotocol/restapi";
import { useAccount, useWalletClient } from "wagmi";
import { usePushSDK } from "@/context/usePushSDK";
import { ethers, providers } from "ethers";
import { Client } from "viem";
import { Transport } from "viem";
import { Chain } from "viem";
import { Account } from "viem";

export default function Home() {
  const { address } = useAccount();
  const { data: walletClient, isError, isLoading } = useWalletClient();
  const { user, handleChatprofileUnlock } = usePushSDK();

  async function getInfoUser() {
    if (!user) return;
    const response = await user.profile.info();
    console.log("response info user", response);
  }
  useEffect(() => {
    getInfoUser();
  }, []);

  // const handleChatprofileUnlock = useCallback(async () => {
  //   // const provider = new ethers.Signer()
  //   const signer = clientToSigner(
  //     walletClient as Client<Transport, Chain, Account>
  //   );

  //   const user = await PushAPI.initialize(signer, {
  //     env: CONSTANTS.ENV.STAGING,
  //   });
  //   const stream = await user.initStream([CONSTANTS.STREAM.CHAT]);

  //   console.log(user);
  //   // const errorExists = checkUnlockProfileErrors(user);

  //   // if (errorExists && onClose) {
  //   //   onClose();
  //   // }
  // }, [walletClient]);

  // useEffect(() => {
  //   async function initUserPush() {
  //     // Initialize Stream
  //     const stream = await user.initStream([CONSTANTS.STREAM.CHAT]);

  //     // Configure stream listen events and what to do
  //     stream.on(CONSTANTS.STREAM.CHAT, (message) => {
  //       console.log(message);
  //     });

  //     // Connect Stream
  //     stream.connect();
  //   }

  //   if (user) {
  //     initUserPush();
  //     // fetchDataVaults();
  //   }
  // }, [user]);

  function handleUnlock() {
    console.log("handleUnlock", user);
    getInfoUser();
  }

  return (
    <div className={styles.page}>
      <button onClick={handleUnlock}>Unlock</button>
      <h1>Your project start here!</h1>
      Don't forget to:
      <ul>
        <li>
          Add the metadata with name, description, keywords, etc. in .layout.tsx
        </li>
        <li>Add the metadata with name, description, url in the reown.tsx</li>
        <li>Change the logo for the header in the assets/ folder</li>
        <li> Change the logo for the icon in the public/ folder</li>
        <li>Define your colors in the globals.css file</li>
        <li>Add the pages in the app/ folder</li>
        <li>Add the components in the components/ folder</li>
        <li>Add the API routes in the src/api/ folder</li>
        <Link href="/second" className={styles.link}>
          Go to second page
        </Link>
      </ul>
    </div>
  );
}
