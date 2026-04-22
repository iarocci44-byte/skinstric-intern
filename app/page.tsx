
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  const [isHeadingVisible, setIsHeadingVisible] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setIsHeadingVisible(true);
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <Link href="/" className={styles.brand}>
            SKINSTRIC
          </Link>
          <span className={styles.introLabel}>[ INTRO ]</span>
        </div>
      </div>
      <main className={styles.main}>
        <div className={styles.headingBox}>
          <h1 className={`${styles.heading} ${isHeadingVisible ? styles.headingVisible : ""}`}>
            Sophisticated
            <br />
            skincare
          </h1>
        </div>
      </main>
    </div>
  );
}
