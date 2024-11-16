"use client";

// @/src/app/module/index.tsx

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useTransitionRouter } from "next-view-transitions";

import styles from "./page.module.scss";

function Page() {
  const router = useTransitionRouter();

  useEffect(() => {
    router.push("/");
  }, [router]);

  return (
    <div className={styles.contentCluster}>
      <Link href={`/`} className={styles.backBtn}>
        Back
      </Link>

      <div className={styles.problem}>
        <h1>I did not find this noodle</h1>
        <Link href={`/`}>Go back to the list</Link>
      </div>
    </div>
  );
}

export default Page;
