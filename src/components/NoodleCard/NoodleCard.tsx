"use client";

// src/components/NoodleCard.tsx
import React, { useRef, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
// import Link from "next/link";
import { Link } from "next-view-transitions";
import Image from "next/image";
import { saveAs } from "file-saver";

import styles from "./NoodleCard.module.scss";

import Logo from "@/assets/logo.png";
import { useAccount, useDisconnect, useEnsName } from "wagmi";

import CopyIcon from "@/assets/icons/copy.svg";
import DownloadIcon from "@/assets/icons/download.svg";
import { useAppKit } from "@reown/appkit/react";
import { usePushSDK } from "@/context/usePushSDK";
import { Noodle } from "@/types/noodle";

interface NoodleCardProps {
  noodle: Noodle;
}

const NoodleCard: React.FC<NoodleCardProps> = ({ noodle }) => {
  const router = useRouter();
  const { isConnected, address } = useAccount();
  const { data: ensName } = useEnsName({ address, chainId: 1 });
  const { open, close } = useAppKit();
  const { user, handleChatprofileUnlock, disconnectPush, isLoadingUnlock } =
    usePushSDK();

  return (
    <div className={styles.noodleCard}>
      <div className={styles.divImg}></div>
      <div className={styles.divInfo}>
        <div className={styles.topDivInfo}>
          <div className={styles.firstLine}>
            <h3>{noodle.title}</h3>
            <div className={styles.ranking}>#1</div>
          </div>
          <div className={styles.description}>{noodle.description}</div>
          <div className={styles.location}>{noodle.location.latitude}</div>
          <div className={styles.byWho}>
            By {noodle.author.slice(0, 6)}...{noodle.author.slice(-4)}
          </div>
        </div>

        <div className={styles.bottomDivInfo}>
          <div className={styles.nbMessages}>{noodle.comments.length}</div>
          <div className={styles.likesDislikes}>
            <span>{noodle.likes} likes</span>
            <span>{noodle.dislikes} dislikes</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoodleCard;
