// src/components/Menu.tsx
import React, { useRef, useEffect, useState } from "react";

// import Link from "next/link";
import { Link } from "next-view-transitions";

import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";

import styles from "./Menu.module.scss";

import { Tooltip } from "@nextui-org/react";

import FireIcon from "@/assets/navigation/fire.svg";
import EarthIcon from "@/assets/navigation/earth.svg";
import PlusIcon from "@/assets/navigation/plus.svg";
import HeartIcon from "@/assets/navigation/heart.svg";
import ProfileIcon from "@/assets/navigation/profile.svg";

const Menu: React.FC = () => {
  const pathname = usePathname();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const isActive = (paths: string | string[]): boolean => {
    if (typeof paths === "string") {
      paths = [paths];
    }
    return paths.some((path) => {
      if (path.endsWith("*")) {
        return pathname.startsWith(path.slice(0, -1));
      }
      return pathname === path;
    });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  // Render
  return (
    <div className={styles.menu} ref={menuRef}>
      <div className={`${styles.navigation} ${isMenuOpen ? styles.open : ""}`}>
        <Link
          onClick={() => setIsMenuOpen(false)}
          className={`${styles.itemMenu}
          ${isActive(["/", "/noodle", "/noodle/*"]) ? styles.current : ""}
          `}
          href={"/"}
        >
          <FireIcon />
          Trending
        </Link>
        <Link
          onClick={() => setIsMenuOpen(false)}
          className={`${styles.itemMenu}
          ${isActive(["/map", "/map/*"]) ? styles.current : ""}
          `}
          href={"/map"}
        >
          <EarthIcon />
          Map
        </Link>
        <Link
          onClick={() => setIsMenuOpen(false)}
          className={`${styles.itemMenu} ${styles.addANoodle}
          ${isActive(["/add", "/add/*"]) ? styles.current : ""}
          `}
          href={"/add"}
        >
          <PlusIcon />
          Add a noodle
        </Link>
        <Link
          onClick={() => setIsMenuOpen(false)}
          className={`${styles.itemMenu}
          ${isActive(["/favorites"]) ? styles.current : ""}
          `}
          href={"/favorites"}
        >
          <HeartIcon />
          Favorites
        </Link>
        <Link
          onClick={() => setIsMenuOpen(false)}
          className={`${styles.itemMenu}
          ${isActive(["/profile"]) ? styles.current : ""}
          `}
          href={"/profile"}
        >
          <ProfileIcon />
          Profile
        </Link>
      </div>
    </div>
  );
};

export default Menu;
