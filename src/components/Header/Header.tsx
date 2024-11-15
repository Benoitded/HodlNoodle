"use client";

// src/components/Header.tsx
import React, { useRef, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
// import Link from "next/link";
import { Link } from "next-view-transitions";
import Image from "next/image";
import { saveAs } from "file-saver";
import Menu from "./Menu/Menu";

import styles from "./Header.module.scss";

import Logo from "@/assets/logo.png";
import { useAccount, useDisconnect, useEnsName } from "wagmi";

import CopyIcon from "@/assets/icons/copy.svg";
import DownloadIcon from "@/assets/icons/download.svg";
import { useAppKit } from "@reown/appkit/react";
import { usePushSDK } from "@/context/usePushSDK";

const Header: React.FC = () => {
  const router = useRouter();
  const { isConnected, address } = useAccount();
  const { data: ensName } = useEnsName({ address, chainId: 1 });
  const { open, close } = useAppKit();
  const { user, handleChatprofileUnlock, disconnectPush, isLoadingUnlock } =
    usePushSDK();
  const { disconnect } = useDisconnect();

  const menuRef = useRef<HTMLDivElement>(null);
  const [showLogoMenu, setShowLogoMenu] = useState(false);
  const logoMenuRef = useRef<HTMLDivElement>(null);

  const [showAddressMenu, setShowAddressMenu] = useState(false);
  const addressMenuRef = useRef<HTMLDivElement>(null);

  const handleCopyLogo = async () => {
    try {
      const response = await fetch(Logo.src);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);
      console.log("Logo copied to clipboard");
    } catch (err) {
      console.error("Error while copying the logo:", err);
    }
    setShowLogoMenu(false);
  };

  const handleDownloadLogo = () => {
    // Utiliser file-saver pour télécharger l'image
    saveAs(Logo.src, "HodlNoodle.png");
    setShowLogoMenu(false);
  };

  useEffect(() => {
    const handleClickOutsideLogoMenu = (event: MouseEvent) => {
      if (
        logoMenuRef.current &&
        !logoMenuRef.current.contains(event.target as Node)
      ) {
        setShowLogoMenu(false);
      }
    };

    if (showLogoMenu) {
      document.addEventListener("mousedown", handleClickOutsideLogoMenu);
    } else {
      document.removeEventListener("mousedown", handleClickOutsideLogoMenu);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutsideLogoMenu);
    };
  }, [showLogoMenu]);

  const handleLogoContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowLogoMenu(true);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        addressMenuRef.current &&
        !addressMenuRef.current.contains(event.target as Node)
      ) {
        setShowAddressMenu(false);
      }
    };

    if (showAddressMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showAddressMenu]);

  const handleDisconnect = () => {
    disconnectPush();
    disconnect();
    setShowAddressMenu(false);
  };

  return (
    <header className={styles.header}>
      <div className={styles.logoWrapper} onContextMenu={handleLogoContextMenu}>
        <Link className={styles.logo} href={"/"}>
          <Image
            src={Logo}
            height={40}
            className={styles.logoClariFi}
            alt="Logo of ClariFi"
          />
          HodlNoodle
        </Link>
        {showLogoMenu && (
          <div
            className={styles.logoMenu}
            ref={logoMenuRef}
            onMouseLeave={() => setShowLogoMenu(false)}
          >
            <button onClick={handleCopyLogo}>
              <CopyIcon />
              Copy logo as PNG
            </button>
            <button onClick={handleDownloadLogo}>
              <DownloadIcon />
              Download logo as PNG
            </button>
          </div>
        )}
      </div>
      <Menu />
      <div className={styles.connect}>
        {!isConnected ? (
          <button className={styles.containerHeader} onClick={() => open()}>
            Connect
          </button>
        ) : !user ? (
          <button
            className={`${styles.containerHeader} ${
              isLoadingUnlock ? styles.loading : ""
            }`}
            onClick={handleChatprofileUnlock}
            disabled={isLoadingUnlock}
          >
            {isLoadingUnlock ? "Unlocking..." : "Unlock Profile"}
          </button>
        ) : (
          <div className={styles.addressContainer}>
            <button
              onClick={handleDisconnect}
              className={styles.containerHeader}
            >
              {ensName ||
                (address &&
                  address.substring(0, 6) + "..." + address.slice(-4))}
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
