"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Link from "next/link";
import { FocusEvent as ReactFocusEvent, FormEvent, KeyboardEvent, MouseEvent as ReactMouseEvent, useEffect, useRef, useState } from "react";
import { BsFillCaretLeftFill, BsFillCaretRightFill } from "react-icons/bs";
import styles from "./page.module.css";

gsap.registerPlugin(useGSAP);

const INTRO_STORAGE_KEY = "skinstric.testing.introName";
const CITY_STORAGE_KEY = "skinstric.testing.cityName";
const PROFILE_DRAFT_STORAGE_KEY = "skinstric.testing.profileDraft";
const PHASE_ONE_RESPONSE_STORAGE_KEY = "skinstric.testing.phaseOneResponse";
const PHASE_ONE_API_URL = "https://us-central1-api-skinstric-ai.cloudfunctions.net/skinstricPhaseOne";
const NAME_PATTERN = /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/;

function validateTextValue(value: string, fieldLabel: string) {
	const trimmedValue = value.trim();

	if (!trimmedValue) {
		return `Please enter your ${fieldLabel}.`;
	}

	if (!NAME_PATTERN.test(trimmedValue)) {
		return "Use letters only. Numbers and invalid characters are not allowed.";
	}

	return "";
}

export default function TestingPage() {
  const pageRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const requestAbortRef = useRef<AbortController | null>(null);
  const proceedLinkRef = useRef<HTMLAnchorElement>(null);
	const [inputValue, setInputValue] = useState("");
	const [activeField, setActiveField] = useState<"name" | "city">(() => {
		if (typeof window === "undefined") {
			return "name";
		}

		const storedName = window.localStorage.getItem(INTRO_STORAGE_KEY);
		const storedCity = window.localStorage.getItem(CITY_STORAGE_KEY);

		if (storedName && !storedCity) {
			return "city";
		}

		return "name";
	});
	const [errorMessage, setErrorMessage] = useState("");
	const [isTextOverflowing, setIsTextOverflowing] = useState(false);
	const [submissionPhase, setSubmissionPhase] = useState<"input" | "processing" | "done">("input");

	function handleDiamondHoverStart(event: ReactMouseEvent<HTMLAnchorElement> | ReactFocusEvent<HTMLAnchorElement>) {
		const diamond = event.currentTarget.querySelector(
			`.${styles.backDiamondButton}, .${styles.proceedDiamondButton}`,
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

	function handleDiamondHoverEnd(event: ReactMouseEvent<HTMLAnchorElement> | ReactFocusEvent<HTMLAnchorElement>) {
		const diamond = event.currentTarget.querySelector(
			`.${styles.backDiamondButton}, .${styles.proceedDiamondButton}`,
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

	useEffect(() => {
		function updateOverflowState() {
			const inputElement = inputRef.current;

			if (!inputElement) {
				return;
			}

			setIsTextOverflowing(inputElement.scrollWidth > inputElement.clientWidth + 1);
		}

		updateOverflowState();
		window.addEventListener("resize", updateOverflowState);

		return () => {
			window.removeEventListener("resize", updateOverflowState);
		};
	}, [inputValue]);

	useEffect(() => {
		return () => {
			if (requestAbortRef.current) {
				requestAbortRef.current.abort();
			}
		};
	}, []);

	async function submitPhaseOne(introName: string, cityName: string) {
		if (requestAbortRef.current) {
			requestAbortRef.current.abort();
		}

		const requestAbortController = new AbortController();
		requestAbortRef.current = requestAbortController;

		const payloadVariants: Record<string, string>[] = [
			{ name: introName, location: cityName },
			{ introName, cityName },
			{ name: introName, cityName },
			{ name: introName, city: cityName },
			{ intro_name: introName, city_name: cityName },
		];

		let lastFailureDetails = "";

		for (const payload of payloadVariants) {
			const response = await fetch(PHASE_ONE_API_URL, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json, text/plain, */*",
				},
				body: JSON.stringify(payload),
				signal: requestAbortController.signal,
			});

			const responseText = await response.text();

			if (!response.ok) {
				lastFailureDetails = `status=${response.status}; payload=${JSON.stringify(payload)}; body=${responseText}`;
				// console.warn("Phase one API request failed:", {
				// 	status: response.status,
				// 	payload,
				// 	body: responseText,
				// });
				continue;
			}

			const responseContentType = response.headers.get("content-type") ?? "";

			if (responseContentType.includes("application/json")) {
				const responseJson = responseText ? JSON.parse(responseText) : {};
				// console.log("Phase one API response:", responseJson);
				window.localStorage.setItem(PHASE_ONE_RESPONSE_STORAGE_KEY, JSON.stringify(responseJson));
				return;
			}

			// console.log("Phase one API response:", responseText);
			window.localStorage.setItem(PHASE_ONE_RESPONSE_STORAGE_KEY, responseText);
			return;
		}

		throw new Error(`Phase one request failed. ${lastFailureDetails}`);
	}

	useGSAP(
		() => {
			if (!pageRef.current) {
				return;
			}

			const orbitBoxes = gsap.utils.toArray<HTMLElement>(`.${styles.orbitBox}`, pageRef.current);

			orbitBoxes.forEach((orbitBox) => {
				let duration = 28;

				if (orbitBox.classList.contains(styles.orbitBoxTwo)) {
					duration = 40;
				} else if (orbitBox.classList.contains(styles.orbitBoxThree)) {
					duration = 52;
				}

				gsap.set(orbitBox, { xPercent: -50, yPercent: -50, transformOrigin: "50% 50%" });
				gsap.to(orbitBox, {
					rotation: 360,
					duration,
					ease: "none",
					repeat: -1,
				});
			});
		},
		{ scope: pageRef },
	);

	useGSAP(
		() => {
			if (!pageRef.current || submissionPhase !== "processing") {
				return;
			}

			const loadingDots = gsap.utils.toArray<HTMLElement>(`.${styles.loadingDot}`, pageRef.current);

			if (!loadingDots.length) {
				return;
			}

			gsap.set(loadingDots, { y: 0, opacity: 0.55 });
			gsap.to(loadingDots, {
				y: -6,
				opacity: 1,
				duration: 0.45,
				ease: "sine.inOut",
				yoyo: true,
				repeat: -1,
				stagger: 0.14,
			});
		},
		{ scope: pageRef, dependencies: [submissionPhase], revertOnUpdate: true },
	);

	useGSAP(
		() => {
			if (submissionPhase !== "done" || !proceedLinkRef.current) {
				return;
			}

			const proceedLink = proceedLinkRef.current;
			const startX = -window.innerWidth * 0.5 + proceedLink.offsetWidth * 0.5;

			gsap.fromTo(
				proceedLink,
				{ autoAlpha: 0, x: startX },
				{ autoAlpha: 1, x: 0, duration: 0.56, ease: "power3.out" },
			);
		},
		{ dependencies: [submissionPhase], revertOnUpdate: true },
	);

	function saveProfileDraft(nextName?: string, nextCity?: string) {
		const savedName = nextName ?? window.localStorage.getItem(INTRO_STORAGE_KEY) ?? "";
		const savedCity = nextCity ?? window.localStorage.getItem(CITY_STORAGE_KEY) ?? "";

		window.localStorage.setItem(
			PROFILE_DRAFT_STORAGE_KEY,
			JSON.stringify({
				name: savedName,
				city: savedCity,
			}),
		);
	}

	async function handleEnterSave() {
		if (submissionPhase !== "input") {
			return;
		}

		const validationMessage = validateTextValue(inputValue, activeField === "name" ? "name" : "city");

		if (validationMessage) {
			setErrorMessage(validationMessage);
			return;
		}

		const trimmedValue = inputValue.trim();

		if (activeField === "name") {
			window.localStorage.setItem(INTRO_STORAGE_KEY, trimmedValue);
			saveProfileDraft(trimmedValue);
			setActiveField("city");
			setInputValue("");
			setIsTextOverflowing(false);
			setErrorMessage("");
			return;
		}

		window.localStorage.setItem(CITY_STORAGE_KEY, trimmedValue);
		saveProfileDraft(undefined, trimmedValue);
		setInputValue("");
		setIsTextOverflowing(false);
		setErrorMessage("");
		setSubmissionPhase("processing");

		const introName = (window.localStorage.getItem(INTRO_STORAGE_KEY) ?? "").trim();

		if (!introName) {
			setSubmissionPhase("input");
			setActiveField("name");
			setErrorMessage("Please enter your name.");
			return;
		}

		try {
			await submitPhaseOne(introName, trimmedValue);
			setSubmissionPhase("done");
		} catch (error) {
			if (error instanceof DOMException && error.name === "AbortError") {
				return;
			}

			setSubmissionPhase("input");
			setErrorMessage("We could not submit your details right now. Please try again.");
		} finally {
			requestAbortRef.current = null;
		}
	}

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		void handleEnterSave();
	}

	function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
		if (event.key !== "Enter") {
			return;
		}

		event.preventDefault();
		void handleEnterSave();
	}

	return (
		<div ref={pageRef} className={styles.page}>
			<span className={styles.analysisLabel}>TO START ANALYSIS</span>
			<main className={styles.main}>
				<form className={styles.inputWrap} onSubmit={handleSubmit}>
					<div className={styles.inputStage}>
						<span className={`${styles.orbitBox} ${styles.orbitBoxOne}`} aria-hidden="true" />
						<span className={`${styles.orbitBox} ${styles.orbitBoxTwo}`} aria-hidden="true" />
						<span className={`${styles.orbitBox} ${styles.orbitBoxThree}`} aria-hidden="true" />
						<div className={styles.inputContent}>
							{submissionPhase === "input" ? (
								<>
									<label htmlFor="intro" className={styles.inputHint}>
										CLICK TO TYPE
									</label>
									{errorMessage ? (
										<p id="intro-feedback" className={`${styles.feedback} ${styles.feedbackError}`}>
											{errorMessage}
										</p>
									) : null}
									<input
										ref={inputRef}
										id="intro"
										type="text"
										placeholder={activeField === "name" ? "Introduce Yourself" : "your city name"}
										className={`${styles.inputBox} ${isTextOverflowing ? styles.inputBoxOverflow : ""} ${errorMessage ? styles.inputBoxError : ""}`}
										value={inputValue}
										autoComplete="off"
										onChange={(event) => {
											setInputValue(event.target.value);
											if (errorMessage) {
												setErrorMessage("");
											}
										}}
										onKeyDown={handleKeyDown}
										aria-invalid={errorMessage ? "true" : "false"}
										aria-describedby="intro-feedback"
									/>
								</>
							) : null}

							{submissionPhase === "processing" ? (
								<div className={styles.statusBlock} aria-live="polite">
									<p className={styles.statusTitle}>Processing submission</p>
									<div className={styles.loadingDots} aria-hidden="true">
										<span className={styles.loadingDot} />
										<span className={styles.loadingDot} />
										<span className={styles.loadingDot} />
									</div>
								</div>
							) : null}

							{submissionPhase === "done" ? (
								<div className={styles.statusBlock} aria-live="polite">
									<p className={styles.statusTitle}>Thank you!</p>
									<p className={styles.statusSubtitle}>Proceed to next step</p>
								</div>
							) : null}
						</div>
					</div>
				</form>
			</main>
			<Link
				href="/"
				className={styles.backLink}
				onMouseEnter={handleDiamondHoverStart}
				onMouseLeave={handleDiamondHoverEnd}
				onFocus={handleDiamondHoverStart}
				onBlur={handleDiamondHoverEnd}
			>
				<span className={styles.backDiamondButton} aria-hidden="true">
					<BsFillCaretLeftFill className={styles.backIcon} />
				</span>
				<span>BACK</span>
			</Link>
			{submissionPhase === "done" ? (
				<Link
					ref={proceedLinkRef}
					href="/result"
					className={styles.proceedLink}
					onMouseEnter={handleDiamondHoverStart}
					onMouseLeave={handleDiamondHoverEnd}
					onFocus={handleDiamondHoverStart}
					onBlur={handleDiamondHoverEnd}
				>
					<span>PROCEED</span>
					<span className={styles.proceedDiamondButton} aria-hidden="true">
						<BsFillCaretRightFill className={styles.proceedIcon} />
					</span>
				</Link>
			) : null}
		</div>
	);
}
