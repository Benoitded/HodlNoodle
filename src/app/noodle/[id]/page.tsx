"use client";

// @/src/app/module/[id]/page.tsx

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "react-hot-toast";
import Blockies from "react-blockies";
import { useAccount } from "wagmi";

import LocationIcon from "@/assets/icons/location.svg";
import RollsIcon from "@/assets/icons/rolls.svg";
import SendIcon from "@/assets/icons/send.svg";
import CameraIcon from "@/assets/icons/camera.svg";

import styles from "./page.module.scss";
import { usePushSDK } from "@/context/usePushSDK";
import { Noodle } from "@/types/noodle";
import { AddressLink } from "@/utils/AddressLink/AddressLink";
import { convertToBase64 } from "@/utils/imageUtils";

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);

  if (weeks > 1) {
    return new Date(timestamp).toLocaleString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } else if (days > 0) {
    return `${days}d ago`;
  } else if (hours > 0) {
    return `${hours}h ago`;
  } else if (minutes > 0) {
    return `${minutes}m ago`;
  } else {
    return `${Math.max(seconds, 0)}s ago`;
  }
}

function Page({ params }: { params: { id: string } }) {
  const {
    noodles,
    user,
    joinThisNoodle,
    voteForTheNoodle,
    sendMessageToGroup,
  } = usePushSDK();
  const id = params.id;
  const { address } = useAccount();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [currentNoodle, setCurrentNoodle] = useState<Noodle | null>(
    noodles.find((noodle) => noodle.id === id) || null
  );
  const [isLoading, setIsLoading] = useState(currentNoodle ? false : true);
  const [newComment, setNewComment] = useState("");
  const [imagesPreview, setImagesPreview] = useState<string[]>([]);

  useEffect(() => {
    const foundNoodle = noodles.find((noodle) => noodle.id === id);
    setCurrentNoodle(foundNoodle || null);
    setIsLoading(!foundNoodle);
  }, [id, noodles]);

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

  async function handleSendComment() {
    console.log("handleSendComment", newComment, imagesPreview);
    if (!newComment && imagesPreview.length === 0) return;
    await sendMessageToGroup(
      currentNoodle?.id || "",
      newComment,
      imagesPreview,
      true
    );
    setNewComment("");
    setImagesPreview([]);
  }

  // Ajout de la fonction pour gérer les raccourcis clavier
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSendComment();
    }
  };

  function handleJoinNoodle() {
    if (!currentNoodle) return;
    joinThisNoodle(currentNoodle.id);
  }

  const hasUserVoted = () => {
    if (!currentNoodle || !address) return false;
    return (
      currentNoodle.likes.includes(address) ||
      currentNoodle.dislikes.includes(address)
    );
  };

  const getUserVoteType = () => {
    if (!currentNoodle || !address) return null;
    if (currentNoodle.likes.includes(address)) return "like";
    if (currentNoodle.dislikes.includes(address)) return "dislike";
    return null;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    toast.loading("Téléchargement de l'image...", {
      id: "uploading-image",
    });

    if (e.target.files && e.target.files.length > 0) {
      try {
        const files = Array.from(e.target.files).map(
          (file) => new File([file], file.name, { type: file.type })
        );

        const base64Images = await Promise.all(
          files.map((file) => convertToBase64(file))
        );

        setImagesPreview((prev) => [...prev, ...base64Images]);

        toast.success("Image téléchargée avec succès !", {
          id: "uploading-image",
        });
      } catch (error) {
        console.error("Erreur lors du traitement de l'image:", error);
        toast.error("Erreur lors du traitement de l'image", {
          id: "uploading-image",
        });
      }
    }
  };

  function handleDeleteImage(idx: number) {
    setImagesPreview((prev) => prev.filter((_, i) => i !== idx));
    toast("Image supprimée !", {
      icon: "🗑️",
    });
  }

  function handleCameraClick() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;
    input.onchange = (e: Event) => {
      handleImageUpload(e as unknown as React.ChangeEvent<HTMLInputElement>);
    };
    input.click();
  }

  return (
    <div className={styles.contentNoodle}>
      {isLoading ? (
        <div className={styles.problem}>
          <div>Loading...</div>
        </div>
      ) : currentNoodle ? (
        <>
          <div className={styles.divImg}>
            <div
              className={styles.imageContainer}
              ref={scrollRef}
              style={{
                viewTransitionName:
                  "images-noodle-" + currentNoodle.id.toLowerCase(),
              }}
            >
              {currentNoodle.images.map((image, index) => (
                <div
                  key={index}
                  className={styles.imageWrapper}
                  data-index={index}
                >
                  <Image src={image} alt="noodle" width={120} height={120} />
                </div>
              ))}
            </div>
            <div className={styles.indicators}>
              {currentNoodle.images.map((_, index) => (
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

          {/* Info of the Noodle */}
          <div className={styles.infoNoodle}>
            <h1
              style={{
                viewTransitionName:
                  "name-noodle-" + currentNoodle.id.toLowerCase(),
              }}
            >
              {currentNoodle.title}
            </h1>
            <div className={styles.byWho}>
              <Blockies seed={currentNoodle.author} />
              By{" "}
              <AddressLink
                address={currentNoodle.author}
                isShort
                isDisplayIcone={true}
                showYourAddress={false}
              />
            </div>
            <div className={styles.description}>
              {currentNoodle.description}
            </div>
            <div className={styles.location}>
              <LocationIcon />{" "}
              {currentNoodle?.location?.address || "No location provided"}
            </div>
          </div>

          {/* Rate the Noodle */}
          <section className={styles.rateNoodle}>
            <div className={styles.leftRateNoodle}>Rate the noodle:</div>
            <div className={styles.likesDislikes}>
              <RollsIcon
                className={`${styles.rollsIcon} ${styles.like} ${
                  getUserVoteType() === "like" ? styles.voted : ""
                } ${
                  hasUserVoted() && getUserVoteType() !== "like"
                    ? styles.disabled
                    : ""
                }`}
                onClick={() => {
                  if (hasUserVoted()) return;
                  voteForTheNoodle(currentNoodle, address || "", true, true);
                }}
              />
              <span
                className={
                  currentNoodle.likes.length - currentNoodle.dislikes.length > 0
                    ? styles.positif
                    : styles.negatif
                }
              >
                {currentNoodle.likes.length - currentNoodle.dislikes.length}
              </span>
              <RollsIcon
                className={`${styles.rollsIcon} ${styles.dislike} ${
                  getUserVoteType() === "dislike" ? styles.voted : ""
                } ${
                  hasUserVoted() && getUserVoteType() !== "dislike"
                    ? styles.disabled
                    : ""
                }`}
                onClick={() => {
                  if (hasUserVoted()) return;
                  voteForTheNoodle(currentNoodle, address || "", false, true);
                }}
              />
            </div>
          </section>

          {/* Comment section */}
          <section className={styles.commentSection}>
            <div className={styles.titleCommentSection}>
              Talk about your experience with this noodle!
            </div>

            <div className={styles.commentInput}>
              {!hasUserVoted() && (
                <div className={styles.notJoined}>
                  Rate the noodle to comment!
                </div>
              )}
              <Blockies
                seed={(address as string) || new Date().toISOString() || ""}
              />
              <div className={styles.commentInputContainer}>
                {imagesPreview.length > 0 && (
                  <div className={styles.linePreview}>
                    {imagesPreview.map((image, index) => (
                      <div key={index} className={styles.imagePreview}>
                        <img src={image} alt="preview" />
                        <button
                          type="button"
                          onClick={() => handleDeleteImage(index)}
                          className={styles.removeImage}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className={styles.lineInterractions}>
                  <textarea
                    placeholder="Écrivez votre commentaire ici..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    disabled={!hasUserVoted()}
                  />
                  <div className={styles.divCamera} onClick={handleCameraClick}>
                    <CameraIcon />
                  </div>
                </div>
              </div>
              <button onClick={handleSendComment} disabled={!hasUserVoted()}>
                <SendIcon />
              </button>
            </div>

            {/* List of comments */}
            <div className={styles.listComments}>
              {currentNoodle.messages
                .sort((a, b) => b.timestamp - a.timestamp)
                .map((message, index) => (
                  <div key={index} className={styles.lineComment}>
                    <div className={styles.leftLineComment}>
                      <Blockies seed={message.author} />
                    </div>
                    <div className={styles.rightLineComment}>
                      <div className={styles.nameAndDate}>
                        <AddressLink
                          address={message.author}
                          isShort
                          isDisplayIcone={true}
                          showYourAddress={false}
                        />
                        <span
                          className={styles.timeAgo}
                          title={new Date(message.timestamp).toLocaleString()}
                        >
                          {formatTimeAgo(message.timestamp)}
                        </span>
                      </div>
                      <div className={styles.comment}>
                        {message.type === "Text" && message.dataMessage}
                        {message.type === "Image" && (
                          <img
                            src={message.dataMessage}
                            className={styles.commentImage}
                            alt={
                              "Comment image to the noodle " +
                              currentNoodle.title
                            }
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        </>
      ) : (
        <div className={styles.problem}>
          <h1>I did not find the noodle for {id}</h1>
          <Link href={`/`}>Go back to the list</Link>
        </div>
      )}
    </div>
  );
}

export default Page;
