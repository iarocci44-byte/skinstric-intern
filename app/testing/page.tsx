"use client";

import Link from "next/link";
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { BsFillCaretLeftFill, BsFillCaretRightFill } from "react-icons/bs";
import styles from "./page.module.css";

const INTRO_STORAGE_KEY = "skinstric.testing.introName";
const CITY_STORAGE_KEY = "skinstric.testing.cityName";
const PROFILE_DRAFT_STORAGE_KEY = "skinstric.testing.profileDraft";
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
	const inputRef = useRef<HTMLInputElement>(null);
	const processingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
			if (processingTimerRef.current) {
				clearTimeout(processingTimerRef.current);
			}
		};
	}, []);

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

	function handleEnterSave() {
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

		if (processingTimerRef.current) {
			clearTimeout(processingTimerRef.current);
		}

		processingTimerRef.current = setTimeout(() => {
			setSubmissionPhase("done");
		}, 2000);
	}

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		handleEnterSave();
	}

	function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
		if (event.key !== "Enter") {
			return;
		}

		event.preventDefault();
		handleEnterSave();
	}

	return (
		<div className={styles.page}>
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
			<Link href="/" className={styles.backLink}>
				<span className={styles.backDiamondButton} aria-hidden="true">
					<BsFillCaretLeftFill className={styles.backIcon} />
				</span>
				<span>BACK</span>
			</Link>
			{submissionPhase === "done" ? (
				<Link href="#" className={styles.proceedLink}>
					<span>PROCEED</span>
					<span className={styles.proceedDiamondButton} aria-hidden="true">
						<BsFillCaretRightFill className={styles.proceedIcon} />
					</span>
				</Link>
			) : null}
		</div>
	);
}
