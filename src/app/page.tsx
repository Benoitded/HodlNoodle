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
  const {
    user,
    handleChatprofileUnlock,
    noodles,
    isLoadingNoodles,
    refreshNoodles,
  } = usePushSDK();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);

  // Handle pull to refresh
  const handleTouchStart = (e: TouchEvent) => {
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = async (e: TouchEvent) => {
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY;

    // If pulled down more than 100px and at the top of the page
    if (diff > 100 && window.scrollY === 0 && !isRefreshing) {
      setIsRefreshing(true);
      await refreshNoodles();
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    document.addEventListener("touchstart", handleTouchStart);
    document.addEventListener("touchmove", handleTouchMove);

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
    };
  }, [startY, isRefreshing]);

  return (
    <div className={styles.page}>
      {(isLoadingNoodles || isRefreshing) && (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>{isRefreshing ? "Refreshing..." : "Loading noodles..."}</p>
        </div>
      )}

      {!isLoadingNoodles &&
        noodles.map((noodle) => <NoodleCard key={noodle.id} noodle={noodle} />)}
    </div>
  );
}
