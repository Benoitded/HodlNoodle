"use client";

// src/components/NoodleCard.tsx
import React, { useRef, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
// import Link from "next/link";
import { Link } from "next-view-transitions";
import Image from "next/image";
import { saveAs } from "file-saver";
import { toast } from "react-hot-toast";
import styles from "./NoodleCard.module.scss";
import Blockies from "react-blockies";

import Logo from "@/assets/logo.png";
import { useAccount, useDisconnect, useEnsName } from "wagmi";

import CopyIcon from "@/assets/icons/copy.svg";
import DownloadIcon from "@/assets/icons/download.svg";
import { useAppKit } from "@reown/appkit/react";
import { usePushSDK } from "@/context/usePushSDK";
import { Noodle } from "@/types/noodle";
import LocationIcon from "@/assets/icons/location.svg";
import RollsIcon from "@/assets/icons/rolls.svg";
import CommentsIcon from "@/assets/icons/comments.svg";
import { AddressLink } from "@/utils/AddressLink/AddressLink";

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
  const [activeImage, setActiveImage] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fonction pour scroller vers une image spécifique
  const scrollToImage = (index: number) => {
    const container = scrollRef.current;
    if (!container) return;

    const imageWidth = container.offsetWidth;
    container.scrollTo({
      left: imageWidth * index,
      behavior: "smooth",
    });
    setActiveImage(index);
  };

  // Observer le défilement
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      const index = Math.round(container.scrollLeft / container.offsetWidth);
      setActiveImage(index);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  function handleLike(noodle: Noodle) {
    toast.success(`Liked ${noodle.title}!`, {
      icon: "🍜",
    });
  }

  function handleDislike(noodle: Noodle) {
    toast(`Disliked ${noodle.title}`, {
      icon: "🗑️",
    });
  }

  return (
    <div className={styles.noodleCard}>
      <div className={styles.divImg}>
        <div className={styles.imageContainer} ref={scrollRef}>
          {noodle.images.map((image, index) => (
            <div key={index} className={styles.imageWrapper} data-index={index}>
              <Image src={image} alt="noodle" width={120} height={120} />
            </div>
          ))}
        </div>
        <div className={styles.indicators}>
          {noodle.images.map((_, index) => (
            <div
              key={index}
              className={`${styles.dot} ${
                index === activeImage ? styles.active : ""
              }`}
              onClick={() => scrollToImage(index)}
            />
          ))}
        </div>
      </div>
      <div className={styles.divInfo}>
        <div className={styles.topDivInfo}>
          <div className={styles.firstLine}>
            <h3>{noodle.title}</h3>
            <div className={styles.ranking}>#{noodle.rank}</div>
          </div>
          <div className={styles.description}>{noodle.description}</div>
          <div className={styles.location}>
            <LocationIcon /> {noodle.location.address}
          </div>
          <div className={styles.byWho}>
            <Blockies seed={noodle.author} />
            By{" "}
            <AddressLink
              address={noodle.author}
              isShort
              isDisplayIcone={true}
              showYourAddress={false}
            />
          </div>
        </div>

        <div className={styles.bottomDivInfo}>
          <div className={styles.nbMessages}>
            <CommentsIcon /> {noodle.messages.length}
          </div>
          <div className={styles.likesDislikes}>
            <RollsIcon
              className={`${styles.rollsIcon} ${styles.like}`}
              onClick={() => handleLike(noodle)}
            />
            <span>{noodle.likes - noodle.dislikes}</span>
            <RollsIcon
              className={`${styles.rollsIcon} ${styles.dislike}`}
              onClick={() => handleDislike(noodle)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoodleCard;
