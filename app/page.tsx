
"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { MouseEvent as ReactMouseEvent, FocusEvent as ReactFocusEvent } from "react";
import { BsFillCaretLeftFill, BsFillCaretRightFill } from "react-icons/bs";
import styles from "./page.module.css";

gsap.registerPlugin(useGSAP);

export default function Home() {
  const [activeSide, setActiveSide] = useState<"left" | "right" | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  function handleSideHoverStart(event: ReactMouseEvent<HTMLAnchorElement> | ReactFocusEvent<HTMLAnchorElement>) {
    const diamond = event.currentTarget.querySelector(`.${styles.diamondButton}`);

    if (!diamond) {
      return;
    }

    gsap.to(diamond, {
      scale: 1.08,
      duration: 0.18,
      ease: "power2.out",
    });
  }

  function handleSideHoverEnd(event: ReactMouseEvent<HTMLAnchorElement> | ReactFocusEvent<HTMLAnchorElement>) {
    const diamond = event.currentTarget.querySelector(`.${styles.diamondButton}`);

    if (!diamond) {
      return;
    }

    gsap.to(diamond, {
      scale: 1,
      duration: 0.18,
      ease: "power2.out",
    });
  }

  useGSAP(() => {
    if (!headingRef.current) {
      return;
    }

    gsap.fromTo(
      headingRef.current,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: 0.9, ease: "power2.out" },
    );
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
            onMouseEnter={(event) => {
              setActiveSide("left");
              handleSideHoverStart(event);
            }}
            onMouseLeave={(event) => {
              setActiveSide(null);
              handleSideHoverEnd(event);
            }}
            onFocus={(event) => {
              setActiveSide("left");
              handleSideHoverStart(event);
            }}
            onBlur={(event) => {
              setActiveSide(null);
              handleSideHoverEnd(event);
            }}
            onClick={(event) => event.preventDefault()}
          >
            <span className={styles.diamondButton} aria-hidden="true">
              <BsFillCaretLeftFill className={styles.diamondIcon} />
            </span>
            <span>DISCOVER A.I.</span>
          </Link>

          <div className={styles.headingBox}>
            <h1 ref={headingRef} className={styles.heading}>
              <span className={`${styles.headingLine} ${styles.headingLineTop}`}>Sophisticated</span>
              <span className={`${styles.headingLine} ${styles.headingLineBottom}`}>skincare</span>
            </h1>
          </div>

          <Link
            href="/testing"
            className={`${styles.sideLink} ${styles.sideLinkRight}`}
            onMouseEnter={(event) => {
              setActiveSide("right");
              handleSideHoverStart(event);
            }}
            onMouseLeave={(event) => {
              setActiveSide(null);
              handleSideHoverEnd(event);
            }}
            onFocus={(event) => {
              setActiveSide("right");
              handleSideHoverStart(event);
            }}
            onBlur={(event) => {
              setActiveSide(null);
              handleSideHoverEnd(event);
            }}
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
