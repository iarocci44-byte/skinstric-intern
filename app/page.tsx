
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BsFillCaretLeftFill, BsFillCaretRightFill } from "react-icons/bs";
import styles from "./page.module.css";

export default function Home() {
  const [isHeadingVisible, setIsHeadingVisible] = useState(false);
  const [activeSide, setActiveSide] = useState<"left" | "right" | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setIsHeadingVisible(true);
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div
          className={`${styles.heroRail} ${activeSide === "left" ? styles.hoverLeft : ""} ${activeSide === "right" ? styles.hoverRight : ""}`}
        >
          <Link
            href="/discover-ai"
            className={`${styles.sideLink} ${styles.sideLinkLeft}`}
            aria-disabled="true"
            onMouseEnter={() => setActiveSide("left")}
            onMouseLeave={() => setActiveSide(null)}
            onFocus={() => setActiveSide("left")}
            onBlur={() => setActiveSide(null)}
            onClick={(event) => event.preventDefault()}
          >
            <span className={styles.diamondButton} aria-hidden="true">
              <BsFillCaretLeftFill className={styles.diamondIcon} />
            </span>
            <span>DISCOVER A.I.</span>
          </Link>

          <div className={styles.headingBox}>
            <h1 className={`${styles.heading} ${isHeadingVisible ? styles.headingVisible : ""}`}>
              <span className={`${styles.headingLine} ${styles.headingLineTop}`}>Sophisticated</span>
              <span className={`${styles.headingLine} ${styles.headingLineBottom}`}>skincare</span>
            </h1>
          </div>

          <Link
            href="/testing"
            className={`${styles.sideLink} ${styles.sideLinkRight}`}
            onMouseEnter={() => setActiveSide("right")}
            onMouseLeave={() => setActiveSide(null)}
            onFocus={() => setActiveSide("right")}
            onBlur={() => setActiveSide(null)}
          >
            <span>TAKE TEST</span>
            <span className={styles.diamondButton} aria-hidden="true">
              <BsFillCaretRightFill className={styles.diamondIcon} />
            </span>
          </Link>
        </div>

        <p className={styles.cornerCopy}>
          SKINSTRIC DEVELOPED AN A.I. THAT CREATES A
          <br /> HIGHLY-PERSONALIZED ROUTINE TAILORED TO <br />
          WHAT YOUR SKIN NEEDS.
        </p>
      </main>
    </div>
  );
}
