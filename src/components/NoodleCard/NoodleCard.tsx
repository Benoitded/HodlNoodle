"use client";

// src/components/NoodleCard.tsx
import React, { useRef, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Link } from "next-view-transitions";
import Image from "next/image";
import { saveAs } from "file-saver";
import { toast } from "react-hot-toast";
import Blockies from "react-blockies";
import { useAccount, useDisconnect, useEnsName } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { usePushSDK } from "@/context/usePushSDK";

import styles from "./NoodleCard.module.scss";
import Logo from "@/assets/logo.png";
import CopyIcon from "@/assets/icons/copy.svg";
import DownloadIcon from "@/assets/icons/download.svg";
import LocationIcon from "@/assets/icons/location.svg";
import RollsIcon from "@/assets/icons/rolls.svg";
import CommentsIcon from "@/assets/icons/comments.svg";

import { Noodle } from "@/types/noodle";
import { AddressLink } from "@/utils/AddressLink/AddressLink";

interface NoodleCardProps {
  noodle: Noodle;
}

const NoodleCard: React.FC<NoodleCardProps> = ({ noodle }) => {
  const router = useRouter();
  const { isConnected, address } = useAccount();
  const { data: ensName } = useEnsName({ address, chainId: 1 });
  const { open, close } = useAppKit();
  const { user, voteForTheNoodle, isVotingNoodle, isLoadingNoodles } =
    usePushSDK();
  const [activeImage, setActiveImage] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Function to scroll to a specific image
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

  // Observe the scrolling
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

  // Ajouter ces fonctions utilitaires
  const hasUserVoted = () => {
    return (
      noodle.likes.includes(address || "") ||
      noodle.dislikes.includes(address || "")
    );
  };

  const getUserVoteType = () => {
    if (noodle.likes.includes(address || "")) return "like";
    if (noodle.dislikes.includes(address || "")) return "dislike";
    return null;
  };

  function handleLike(noodle: Noodle, e: React.MouseEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (hasUserVoted()) return;
    voteForTheNoodle(noodle, address || "", true, true);
  }

  function handleDislike(noodle: Noodle, e: React.MouseEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (hasUserVoted()) return;
    voteForTheNoodle(noodle, address || "", false, true);
  }

  return (
    <Link href={`/noodle/${noodle.id}`} className={styles.noodleCard}>
      <div className={styles.divImg}>
        <div
          className={styles.imageContainer}
          ref={scrollRef}
          style={{
            viewTransitionName: "images-noodle-" + noodle.id.toLowerCase(),
          }}
        >
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
            <h3
              style={{
                viewTransitionName: "name-noodle-" + noodle.id.toLowerCase(),
              }}
            >
              {noodle.title}
            </h3>
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
              className={`${styles.rollsIcon} ${styles.like} ${
                getUserVoteType() === "like" ? styles.voted : ""
              } ${
                hasUserVoted() && getUserVoteType() !== "like"
                  ? styles.disabled
                  : ""
              }`}
              onClick={(e: React.MouseEvent<HTMLDivElement>) =>
                handleLike(noodle, e)
              }
            />
            <span
              className={
                noodle.likes.length - noodle.dislikes.length > 0
                  ? styles.positif
                  : styles.negatif
              }
            >
              {noodle.likes.length - noodle.dislikes.length}
            </span>
            <RollsIcon
              className={`${styles.rollsIcon} ${styles.dislike} ${
                getUserVoteType() === "dislike" ? styles.voted : ""
              } ${
                hasUserVoted() && getUserVoteType() !== "dislike"
                  ? styles.disabled
                  : ""
              }`}
              onClick={(e: React.MouseEvent<HTMLDivElement>) =>
                handleDislike(noodle, e)
              }
            />
          </div>
        </div>
      </div>
    </Link>
  );
};

export default NoodleCard;
