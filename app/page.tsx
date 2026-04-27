
"use client";

import { useEffect, useRef, useState } from "react";
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
  const headingLineTopRef = useRef<HTMLSpanElement>(null);
  const headingLineBottomRef = useRef<HTMLSpanElement>(null);
  const leftLinkRef = useRef<HTMLAnchorElement>(null);
  const rightLinkRef = useRef<HTMLAnchorElement>(null);

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

  useEffect(() => {
    const lineTop = headingLineTopRef.current;
    const lineBottom = headingLineBottomRef.current;
    const leftLink = leftLinkRef.current;
    const rightLink = rightLinkRef.current;

    if (!lineTop || !lineBottom) return;

    const vw = window.innerWidth;
    const topShift = vw <= 900 ? 180 : 280;
    const bottomShift = vw <= 900 ? 240 : 360;
    const shouldAnimate = vw > 600;
    const slideDuration = shouldAnimate ? 1.3 : 0;

    if (activeSide === "left") {
      gsap.to(lineTop, { x: topShift, duration: slideDuration, ease: "expo.out" });
      gsap.to(lineBottom, { x: bottomShift, duration: slideDuration, ease: "expo.out" });
      if (rightLink && shouldAnimate) gsap.to(rightLink, { autoAlpha: 0, duration: 0.42, ease: "power2.out" });
      if (leftLink && shouldAnimate) gsap.to(leftLink, { autoAlpha: 1, duration: 0.42, ease: "power2.out" });
    } else if (activeSide === "right") {
      gsap.to(lineTop, { x: -topShift, duration: slideDuration, ease: "expo.out" });
      gsap.to(lineBottom, { x: -bottomShift, duration: slideDuration, ease: "expo.out" });
      if (leftLink && shouldAnimate) gsap.to(leftLink, { autoAlpha: 0, duration: 0.42, ease: "power2.out" });
      if (rightLink && shouldAnimate) gsap.to(rightLink, { autoAlpha: 1, duration: 0.42, ease: "power2.out" });
    } else {
      gsap.to(lineTop, { x: 0, duration: slideDuration, ease: "expo.out" });
      gsap.to(lineBottom, { x: 0, duration: slideDuration, ease: "expo.out" });
      if (leftLink) gsap.to(leftLink, { autoAlpha: 1, duration: 0.42, ease: "power2.out" });
      if (rightLink) gsap.to(rightLink, { autoAlpha: 1, duration: 0.42, ease: "power2.out" });
    }

    return () => {
      gsap.killTweensOf([lineTop, lineBottom, leftLink, rightLink].filter(Boolean));
    };
  }, [activeSide]);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div
          className={styles.heroRail}
        >
          <Link
            href="/discover-ai"
            ref={leftLinkRef}
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
              <span ref={headingLineTopRef} className={`${styles.headingLine} ${styles.headingLineTop}`}>Sophisticated</span>
              <span ref={headingLineBottomRef} className={`${styles.headingLine} ${styles.headingLineBottom}`}>skincare</span>
            </h1>
          </div>

          <Link
            href="/testing"
            ref={rightLinkRef}
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
