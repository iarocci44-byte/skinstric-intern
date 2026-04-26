"use client";

import gsap from "gsap";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { BsFillCaretLeftFill, BsFillCaretRightFill } from "react-icons/bs";
import styles from "./page.module.css";

const PHASE_TWO_KEY = "skinstric.result.phaseTwoResponse";

type CategoryKey = "race" | "age" | "gender";

interface PhaseTwoData {
	predicted_race?: Record<string, number>;
	predicted_age?: Record<string, number>;
	predicted_gender?: Record<string, number>;
	predictedRace?: Record<string, number>;
	predictedAge?: Record<string, number>;
	predictedGender?: Record<string, number>;
}

interface NormalizedPhaseTwoData {
	predicted_race: Record<string, number>;
	predicted_age: Record<string, number>;
	predicted_gender: Record<string, number>;
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toNumberRecord(value: unknown): Record<string, number> | null {
	if (Array.isArray(value)) {
		const mappedEntries = value
			.map((item) => {
				if (Array.isArray(item) && item.length >= 2 && typeof item[0] === "string") {
					const numeric = Number(item[1]);
					if (Number.isFinite(numeric)) {
						return [item[0], numeric] as const;
					}
				}

				if (isObjectRecord(item)) {
					const labelCandidate =
						item.label ??
						item.name ??
						item.key ??
						item.value_name ??
						item.group;

					const valueCandidate =
						item.value ??
						item.score ??
						item.probability ??
						item.prob ??
						item.confidence ??
						item.percentage;

					if (typeof labelCandidate === "string") {
						const numeric = Number(valueCandidate);
						if (Number.isFinite(numeric)) {
							return [labelCandidate, numeric] as const;
						}
					}
				}

				return null;
			})
			.filter((entry): entry is readonly [string, number] => entry !== null);

		if (!mappedEntries.length) return null;
		return Object.fromEntries(mappedEntries);
	}

	if (!isObjectRecord(value)) return null;

	const entries = Object.entries(value)
		.map(([key, candidate]) => {
			if (typeof candidate === "number" && Number.isFinite(candidate)) {
				return [key, candidate] as const;
			}

			if (typeof candidate === "string") {
				const parsed = Number(candidate);
				if (Number.isFinite(parsed)) {
					return [key, parsed] as const;
				}
			}

			return null;
		})
		.filter((item): item is readonly [string, number] => item !== null);

	if (!entries.length) return null;
	return Object.fromEntries(entries);
}

function findNumberRecordByKeys(
	root: unknown,
	keys: readonly string[],
): Record<string, number> | null {
	const queue: unknown[] = [root];
	const seen = new Set<unknown>();

	while (queue.length) {
		const current = queue.shift();
		if (!current || seen.has(current)) continue;
		seen.add(current);

		if (Array.isArray(current)) {
			for (const item of current) queue.push(item);
			continue;
		}

		if (!isObjectRecord(current)) continue;

		for (const [key, value] of Object.entries(current)) {
			if (keys.includes(key)) {
				const mapped = toNumberRecord(value);
				if (mapped) return mapped;
			}
			queue.push(value);
		}
	}

	return null;
}

function parsePhaseTwoRaw(raw: string | null): PhaseTwoData | null {
	if (!raw) return null;

	try {
		const initial = JSON.parse(raw) as unknown;
		const unwrapped =
			typeof initial === "string"
				? (JSON.parse(initial) as unknown)
				: initial;

		if (!unwrapped || typeof unwrapped !== "object") {
			return null;
		}

		const candidate = unwrapped as Record<string, unknown>;
		if (candidate.data && typeof candidate.data === "object") {
			return candidate.data as PhaseTwoData;
		}

		return candidate as PhaseTwoData;
	} catch {
		return null;
	}
}

function getSnapshot(): string | null {
	return window.localStorage.getItem(PHASE_TWO_KEY);
}

function sortedEntries(map: Record<string, number> | undefined) {
	if (!map) return [];
	return Object.entries(map)
		.sort((a, b) => b[1] - a[1]);
}

function normalizePhaseTwoData(payload: PhaseTwoData | null): NormalizedPhaseTwoData {
	if (!payload) {
		return {
			predicted_race: {},
			predicted_age: {},
			predicted_gender: {},
		};
	}

	const race =
		toNumberRecord(payload.predicted_race) ??
		toNumberRecord(payload.predictedRace) ??
		findNumberRecordByKeys(payload, ["predicted_race", "predictedRace", "race", "races"]) ??
		{};

	const age =
		toNumberRecord(payload.predicted_age) ??
		toNumberRecord(payload.predictedAge) ??
		findNumberRecordByKeys(payload, ["predicted_age", "predictedAge", "age", "ages"]) ??
		{};

	const gender =
		toNumberRecord(payload.predicted_gender) ??
		toNumberRecord(payload.predictedGender) ??
		findNumberRecordByKeys(payload, ["predicted_gender", "predictedGender", "gender", "genders"]) ??
		{};

	return {
		predicted_race: race,
		predicted_age: age,
		predicted_gender: gender,
	};
}

function pct(value: number) {
	return `${Math.round(value * 100)}%`;
}

function titleCaseWords(label: string) {
	if (!label) return label;
	return label.replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function SummaryPage() {
	const raw = useSyncExternalStore(
		() => () => {},
		getSnapshot,
		() => null,
	);

	const data = useMemo<PhaseTwoData | null>(() => parsePhaseTwoRaw(raw), [raw]);

	const normalizedData = useMemo(() => normalizePhaseTwoData(data), [data]);

	const [activeCategory, setActiveCategory] = useState<CategoryKey>("race");
	const [selectedValues, setSelectedValues] = useState<Record<CategoryKey, string | null>>({
		race: null,
		age: null,
		gender: null,
	});

	const categoryEntries = useMemo(
		() => ({
			race: sortedEntries(normalizedData.predicted_race),
			age: sortedEntries(normalizedData.predicted_age),
			gender: sortedEntries(normalizedData.predicted_gender),
		}),
		[normalizedData],
	);

	const categoryLabels: Record<CategoryKey, string> = {
		race: "Race",
		age: "Age",
		gender: "Sex",
	};

	const displayedSelections = {
		race: selectedValues.race ?? categoryEntries.race[0]?.[0] ?? "No data",
		age: selectedValues.age ?? categoryEntries.age[0]?.[0] ?? "No data",
		gender: selectedValues.gender ?? categoryEntries.gender[0]?.[0] ?? "No data",
	};

	const displayedPercentages = {
		race: categoryEntries.race.find(([label]) => label === displayedSelections.race)?.[1],
		age: categoryEntries.age.find(([label]) => label === displayedSelections.age)?.[1],
		gender: categoryEntries.gender.find(([label]) => label === displayedSelections.gender)?.[1],
	};

	const activeEntries = categoryEntries[activeCategory];
	const activeSelection = displayedSelections[activeCategory];
	const activeSelectionLabel = titleCaseWords(activeSelection);
	const selectedPercentageRaw = displayedPercentages[activeCategory] ?? 0;
	const selectedPercentage = Math.max(0, Math.min(1, selectedPercentageRaw));
	const [animatedPercentage, setAnimatedPercentage] = useState(selectedPercentage);
	const progressTweenRef = useRef({ value: selectedPercentage });
	const progressCircleRef = useRef<SVGCircleElement>(null);

	useEffect(() => {
		const tweenTarget = progressTweenRef.current;
		gsap.killTweensOf(tweenTarget);

		gsap.to(tweenTarget, {
			value: selectedPercentage,
			duration: 0.55,
			ease: "power2.out",
			onUpdate: () => {
				setAnimatedPercentage(tweenTarget.value);
			},
		});

		return () => {
			gsap.killTweensOf(tweenTarget);
		};
	}, [selectedPercentage]);

	useEffect(() => {
		if (!progressCircleRef.current) return;
		gsap.fromTo(
			progressCircleRef.current,
			{ opacity: 0.8 },
			{ opacity: 1, duration: 0.28, ease: "power1.out" },
		);
	}, [activeCategory]);

	const clampedAnimatedPercentage = Math.max(0, Math.min(1, animatedPercentage));
	const circleRadius = 88;
	const circleCircumference = 2 * Math.PI * circleRadius;
	const circleDashOffset = circleCircumference * (1 - clampedAnimatedPercentage);

	function handleOptionSelect(label: string) {
		setSelectedValues((current) => ({
			...current,
			[activeCategory]: label,
		}));
	}

	return (
		<main className={styles.page}>
			<div className={styles.copyBlock}>
				<div className={styles.copyTitle}>A.I. ANALYSIS</div>
				<div className={styles.copyHeading}>DEMOGRAPHICS</div>
				<div>PREDICTED RACE & AGE</div>
			</div>

			<div className={styles.layout}>
				{/* Left — 3 stacked boxes */}
				<div className={styles.leftColumn}>
					<button
						type="button"
						className={`${styles.leftBox} ${activeCategory === "race" ? styles.leftBoxActive : ""}`}
						onClick={() => setActiveCategory("race")}
					>
						<p className={styles.leftBoxValue}>{titleCaseWords(displayedSelections.race)}</p>
						<p className={styles.leftBoxLabel}>Race</p>
					</button>
					<button
						type="button"
						className={`${styles.leftBox} ${activeCategory === "age" ? styles.leftBoxActive : ""}`}
						onClick={() => setActiveCategory("age")}
					>
						<p className={styles.leftBoxValue}>{titleCaseWords(displayedSelections.age)}</p>
						<p className={styles.leftBoxLabel}>Age</p>
					</button>
					<button
						type="button"
						className={`${styles.leftBox} ${activeCategory === "gender" ? styles.leftBoxActive : ""}`}
						onClick={() => setActiveCategory("gender")}
					>
						<p className={styles.leftBoxValue}>{titleCaseWords(displayedSelections.gender)}</p>
						<p className={styles.leftBoxLabel}>Sex</p>
					</button>
				</div>

				{/* Center — large box */}
				<div className={styles.centerBox}>
					<p className={styles.centerSelectedTitle}>{activeSelectionLabel}</p>
					<div className={styles.centerCircleWrap}>
						<svg className={styles.percentageCircle} viewBox="0 0 220 220" aria-hidden="true">
							<circle className={styles.percentageCircleTrack} cx="110" cy="110" r={circleRadius} />
							<circle
								ref={progressCircleRef}
								className={styles.percentageCircleProgress}
								cx="110"
								cy="110"
								r={circleRadius}
								style={{
									strokeDasharray: `${circleCircumference}`,
									strokeDashoffset: `${circleDashOffset}`,
								}}
							/>
						</svg>
						<div className={styles.centerCircleValue}>{pct(clampedAnimatedPercentage)}</div>
					</div>
				</div>

				{/* Right — tall skinny box */}
				<div className={styles.rightBox}>
					<p className={`${styles.boxTitle} ${styles.rightPanelTitle}`}>{categoryLabels[activeCategory]} A.I. Confidence</p>
					<div className={styles.optionList}>
						{activeEntries.length ? (
							activeEntries.map(([label, value]) => (
								<button
									key={label}
									type="button"
									className={`${styles.optionButton} ${displayedSelections[activeCategory] === label ? styles.optionButtonActive : ""}`}
									onClick={() => handleOptionSelect(label)}
								>
									<span className={styles.optionLabelWrap}>
										<span className={styles.optionDiamond} aria-hidden="true">
											{displayedSelections[activeCategory] === label && (
												<span className={styles.optionDiamondDot} />
											)}
										</span>
										<span className={styles.optionLabel}>{titleCaseWords(label)}</span>
									</span>
									<span className={styles.optionValue}>{pct(value)}</span>
								</button>
							))
						) : (
							<p className={styles.predictionRow}>No data</p>
						)}
					</div>
				</div>
			</div>

			<p className={styles.bottomInstruction}>
				If A.I estimate is wrong, select the correct one.
			</p>

			<Link href="/select" className={styles.backLink}>
				<span className={styles.backDiamondButton}>
					<BsFillCaretLeftFill className={styles.backIcon} />
				</span>
				<span>BACK</span>
			</Link>

			<Link href="/" className={styles.homeLink}>
				<span>HOME</span>
				<span className={styles.homeDiamondButton}>
					<BsFillCaretRightFill className={styles.homeIcon} />
				</span>
			</Link>
		</main>
	);
}
