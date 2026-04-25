"use client";

import gsap from "gsap";
import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { useRef } from "react";
import { FocusEvent as ReactFocusEvent, MouseEvent as ReactMouseEvent } from "react";
import { BsFillCaretLeftFill, BsFillCaretRightFill } from "react-icons/bs";
import styles from "./page.module.css";

const PHASE_TWO_RESPONSE_STORAGE_KEY = "skinstric.result.phaseTwoResponse";

interface PhaseTwoAnalysis {
	predictedRace: Record<string, number>;
	predictedAge: Record<string, number>;
	predictedGender: Record<string, number>;
}

function parseAnalysis(raw: string | null): PhaseTwoAnalysis | null {
	if (!raw) return null;
	try {
		const data = JSON.parse(raw) as {
			predicted_race?: Record<string, number>;
			predicted_age?: Record<string, number>;
			predicted_gender?: Record<string, number>;
		};
		return {
			predictedRace: data.predicted_race ?? {},
			predictedAge: data.predicted_age ?? {},
			predictedGender: data.predicted_gender ?? {},
		};
	} catch {
		return null;
	}
}

function getPhaseTwoRawSnapshot(): string | null {
	if (typeof window === "undefined") return null;
	return window.localStorage.getItem(PHASE_TWO_RESPONSE_STORAGE_KEY);
}

export default function SelectPage() {
	const outlineRef = useRef<SVGSVGElement>(null);

	// useSyncExternalStore provides separate server snapshot (null) and client
	// snapshot (localStorage), avoiding hydration mismatches.
	const phaseTwoRaw = useSyncExternalStore(
		() => () => {},   // localStorage doesn't push updates — no subscription
		getPhaseTwoRawSnapshot,
		() => null,       // server: always null
	);
	const analysis = useMemo(() => parseAnalysis(phaseTwoRaw), [phaseTwoRaw]);

	// analysis?.predictedRace  — e.g. { "White": 0.82, "Asian": 0.10, ... }
	// analysis?.predictedAge   — e.g. { "20-29": 0.65, "30-39": 0.25, ... }
	// analysis?.predictedGender — e.g. { "Male": 0.12, "Female": 0.88 }

	function handleDiamondClusterHoverStart() {
		if (!outlineRef.current) return;
		gsap.killTweensOf(outlineRef.current);
		gsap.to(outlineRef.current, {
			autoAlpha: 1,
			scale: 1.5,
			duration: 0.45,
			ease: "power2.out",
		});
	}

	function handleDiamondClusterHoverEnd() {
		if (!outlineRef.current) return;
		gsap.killTweensOf(outlineRef.current);
		gsap.to(outlineRef.current, {
			autoAlpha: 0,
			scale: 1,
			duration: 0.28,
			ease: "power2.inOut",
		});
	}

	function handleNavHoverStart(event: ReactMouseEvent<HTMLAnchorElement> | ReactFocusEvent<HTMLAnchorElement>) {
		const diamond = event.currentTarget.querySelector(
			`.${styles.backDiamondButton}, .${styles.summaryDiamondButton}`,
		);

		if (!diamond) {
			return;
		}

		gsap.to(diamond, {
			scale: 1.08,
			duration: 0.18,
			ease: "power2.out",
		});
	}

	function handleNavHoverEnd(event: ReactMouseEvent<HTMLAnchorElement> | ReactFocusEvent<HTMLAnchorElement>) {
		const diamond = event.currentTarget.querySelector(
			`.${styles.backDiamondButton}, .${styles.summaryDiamondButton}`,
		);

		if (!diamond) {
			return;
		}

		gsap.to(diamond, {
			scale: 1,
			duration: 0.18,
			ease: "power2.out",
		});
	}

	return (
		<main className={styles.page} data-analysis-loaded={analysis !== null}>
			<div className={styles.analysisCopy}>
				<div className={styles.analysisCopyTitle}>A.I. ANALYSIS</div>
				<div>A.I. has estimated the following.</div>
				<div>Fix estimated information if needed.</div>
			</div>
			<div
				className={styles.diamondGrid}
				onMouseEnter={handleDiamondClusterHoverStart}
				onMouseLeave={handleDiamondClusterHoverEnd}
			>
				<svg
					ref={outlineRef}
					className={styles.diamondOutline}
					viewBox="0 0 313.67 313.67"
					fill="none"
					aria-hidden="true"
				>
					<polygon
						points="156.835,0 313.67,156.835 156.835,313.67 0,156.835"
						className={styles.diamondOutlineStroke}
					/>
				</svg>
				{[
					{ positionClass: styles.top, label: "DEMOGRAPHICS", href: "/summary" },
					{ positionClass: styles.right, label: "COSMETIC CONCERNS", href: null },
					{ positionClass: styles.bottom, label: "WEATHER", href: null },
					{
						positionClass: styles.left,
						href: null,
						label: (
							<>
								SKIN TYPE
								<br />
								DETAILS
							</>
						),
					},
				].map(({ positionClass, label, href }, index) => {
					const tileClassName = `${styles.diamondTile} ${positionClass} ${href ? styles.interactiveDiamond : styles.disabledDiamond}`;

					const tileContent = (
						<>
							<svg
								className={styles.diamondShape}
								width="153.88"
								height="153.88"
								viewBox="0 0 218 218"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<rect
									x="108.807"
									width="153.876"
									height="153.875"
									transform="rotate(45 108.807 0)"
									fill="currentColor"
								/>
							</svg>
							<span className={styles.diamondLabel}>{label}</span>
						</>
					);

					if (href) {
						return (
							<Link key={`diamond-${index}`} href={href} className={tileClassName}>
								{tileContent}
							</Link>
						);
					}

					return (
						<div key={`diamond-${index}`} className={tileClassName} aria-disabled="true">
							{tileContent}
						</div>
					);
				})}
			</div>
			<Link
				href="/result"
				className={styles.backLink}
				onMouseEnter={handleNavHoverStart}
				onMouseLeave={handleNavHoverEnd}
				onFocus={handleNavHoverStart}
				onBlur={handleNavHoverEnd}
			>
				<span className={styles.backDiamondButton}>
					<BsFillCaretLeftFill className={styles.backIcon} />
				</span>
				<span>BACK</span>
			</Link>
			<Link
				href="/summary"
				className={styles.summaryLink}
				onMouseEnter={handleNavHoverStart}
				onMouseLeave={handleNavHoverEnd}
				onFocus={handleNavHoverStart}
				onBlur={handleNavHoverEnd}
			>
				<span>GET SUMMARY</span>
				<span className={styles.summaryDiamondButton}>
					<BsFillCaretRightFill className={styles.summaryIcon} />
				</span>
			</Link>
		</main>
	);
}
