"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Image from "next/image";
import Link from "next/link";
import { FocusEvent as ReactFocusEvent, MouseEvent as ReactMouseEvent, useEffect, useRef, useState } from "react";
import { BsFillCaretLeftFill } from "react-icons/bs";
import shutterIcon from "../assets/camera-icon.svg";
import galleryIcon from "../assets/gallery-icon.svg";
import styles from "./page.module.css";

gsap.registerPlugin(useGSAP);

const PHASE_TWO_API_URL = "https://us-central1-api-skinstric-ai.cloudfunctions.net/skinstricPhaseTwo";
const PHASE_TWO_RESPONSE_STORAGE_KEY = "skinstric.result.phaseTwoResponse";

export default function ResultPage() {
	const pageRef = useRef<HTMLDivElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const displayVideoRef = useRef<HTMLVideoElement>(null);
	const previewCanvasRef = useRef<HTMLCanvasElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const previewRafRef = useRef<number | null>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const requestAbortRef = useRef<AbortController | null>(null);
	const [submissionPhase, setSubmissionPhase] = useState<"idle" | "processing" | "done" | "error">("idle");
	const [errorMessage, setErrorMessage] = useState("");
	const [cameraActive, setCameraActive] = useState(false);
	const [cameraReady, setCameraReady] = useState(false);

	function handleIconHoverStart(event: ReactMouseEvent<HTMLButtonElement> | ReactFocusEvent<HTMLButtonElement>) {
		gsap.to(event.currentTarget, {
			scale: 1.08,
			duration: 0.4,
			ease: "power2.out",
		});
	}

	function handleIconHoverEnd(event: ReactMouseEvent<HTMLButtonElement> | ReactFocusEvent<HTMLButtonElement>) {
		gsap.to(event.currentTarget, {
			scale: 1,
			duration: 0.4,
			ease: "power2.out",
		});
	}

	function handleBackHoverStart(event: ReactMouseEvent<HTMLAnchorElement> | ReactFocusEvent<HTMLAnchorElement>) {
		const diamond = event.currentTarget.querySelector(`.${styles.backDiamondButton}`);

		if (!diamond) {
			return;
		}

		gsap.to(diamond, {
			scale: 1.08,
			duration: 0.18,
			ease: "power2.out",
		});
	}

	function handleBackHoverEnd(event: ReactMouseEvent<HTMLAnchorElement> | ReactFocusEvent<HTMLAnchorElement>) {
		const diamond = event.currentTarget.querySelector(`.${styles.backDiamondButton}`);

		if (!diamond) {
			return;
		}

		gsap.to(diamond, {
			scale: 1,
			duration: 0.18,
			ease: "power2.out",
		});
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

	async function submitPhaseTwo(base64Image: string) {
		if (requestAbortRef.current) {
			requestAbortRef.current.abort();
		}

		const controller = new AbortController();
		requestAbortRef.current = controller;

		const response = await fetch(PHASE_TWO_API_URL, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ image: base64Image }),
			signal: controller.signal,
		});

		const responseText = await response.text();

		if (!response.ok) {
			throw new Error(`Phase two request failed: ${response.status} ${responseText}`);
		}

		const contentType = response.headers.get("content-type") ?? "";
		const data = contentType.includes("application/json") && responseText ? JSON.parse(responseText) : responseText;
		window.localStorage.setItem(PHASE_TWO_RESPONSE_STORAGE_KEY, JSON.stringify(data));
	}

	function fileToBase64(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => {
				const result = reader.result as string;
				// Strip the data URL prefix (e.g. "data:image/jpeg;base64,")
				const base64 = result.split(",")[1];
				resolve(base64);
			};
			reader.onerror = () => reject(reader.error);
			reader.readAsDataURL(file);
		});
	}

	function stopPreviewLoop() {
		if (previewRafRef.current !== null) {
			cancelAnimationFrame(previewRafRef.current);
			previewRafRef.current = null;
		}
	}

	function drawPreviewFrame() {
		const video = displayVideoRef.current;
		const previewCanvas = previewCanvasRef.current;

		if (!streamRef.current || !video || !previewCanvas) {
			previewRafRef.current = null;
			return;
		}

		const context = previewCanvas.getContext("2d");

		if (!context || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
			previewRafRef.current = requestAnimationFrame(drawPreviewFrame);
			return;
		}

		const cssWidth = Math.max(1, previewCanvas.clientWidth);
		const cssHeight = Math.max(1, previewCanvas.clientHeight);
		const dpr = window.devicePixelRatio || 1;
		const targetWidth = Math.max(1, Math.round(cssWidth * dpr));
		const targetHeight = Math.max(1, Math.round(cssHeight * dpr));

		if (previewCanvas.width !== targetWidth || previewCanvas.height !== targetHeight) {
			previewCanvas.width = targetWidth;
			previewCanvas.height = targetHeight;
		}

		const videoWidth = video.videoWidth;
		const videoHeight = video.videoHeight;

		if (videoWidth > 0 && videoHeight > 0) {
			const scale = Math.max(targetWidth / videoWidth, targetHeight / videoHeight);
			const sourceWidth = targetWidth / scale;
			const sourceHeight = targetHeight / scale;
			const sourceX = (videoWidth - sourceWidth) / 2;
			const sourceY = (videoHeight - sourceHeight) / 2;

			context.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, targetWidth, targetHeight);
		}

		previewRafRef.current = requestAnimationFrame(drawPreviewFrame);
	}

	function startPreviewLoop() {
		stopPreviewLoop();
		previewRafRef.current = requestAnimationFrame(drawPreviewFrame);
	}

	async function activateCamera() {
		if (submissionPhase === "processing") {
			return;
		}

		try {
			if (!navigator.mediaDevices?.getUserMedia) {
				return;
			}

			if (streamRef.current) {
				streamRef.current.getTracks().forEach((track) => track.stop());
			}

			const stream = await navigator.mediaDevices.getUserMedia({
				video: {
					facingMode: "user",
					width: { ideal: 1280 },
					height: { ideal: 720 },
				},
			});
			streamRef.current = stream;
			setCameraReady(false);
			setCameraActive(true);

			const display = displayVideoRef.current;

			if (!display) {
				return;
			}

			display.srcObject = stream;

			await new Promise<void>((resolve, reject) => {
				display.onloadedmetadata = () => resolve();
				display.onerror = () => reject(new Error("Video failed to load"));
				display.play().catch(reject);
			});

			setCameraReady(true);
			startPreviewLoop();
		} catch (error) {
			if (error instanceof DOMException && error.name === "AbortError") {
				return;
			}
			setCameraActive(false);
			setCameraReady(false);
			setSubmissionPhase("error");
			setErrorMessage("Could not access camera. Please check permissions and try again.");
		}
	}

	function dismissCamera() {
		stopPreviewLoop();

		if (streamRef.current) {
			streamRef.current.getTracks().forEach((track) => track.stop());
			streamRef.current = null;
		}

		const display = displayVideoRef.current;

		if (display) {
			display.srcObject = null;
		}

		setCameraReady(false);
		setCameraActive(false);
	}

	async function capturePhoto() {
		const video = displayVideoRef.current;
		const canvas = canvasRef.current;

		if (!video || !canvas) {
			return;
		}

		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;
		canvas.getContext("2d")?.drawImage(video, 0, 0);

		dismissCamera();

		const base64 = canvas.toDataURL("image/jpeg", 0.92).split(",")[1];

		try {
			setSubmissionPhase("processing");
			setErrorMessage("");
			await submitPhaseTwo(base64);
			setSubmissionPhase("done");
		} catch (error) {
			if (error instanceof DOMException && error.name === "AbortError") {
				return;
			}
			setSubmissionPhase("error");
			setErrorMessage("Could not upload the photo. Please try again.");
		} finally {
			requestAbortRef.current = null;
		}
	}

	function openFilePicker() {
		if (submissionPhase !== "processing") {
			fileInputRef.current?.click();
		}
	}

	async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];
		// Reset so the same file can be re-selected
		event.target.value = "";

		if (!file) {
			return;
		}

		try {
			setSubmissionPhase("processing");
			setErrorMessage("");

			const base64 = await fileToBase64(file);
			await submitPhaseTwo(base64);
			setSubmissionPhase("done");
		} catch (error) {
			if (error instanceof DOMException && error.name === "AbortError") {
				return;
			}
			setSubmissionPhase("error");
			setErrorMessage("Could not upload the image. Please try again.");
		} finally {
			requestAbortRef.current = null;
		}
	}

	useEffect(() => {
		return () => {
			stopPreviewLoop();

			if (streamRef.current) {
				streamRef.current.getTracks().forEach((track) => track.stop());
			}
			if (requestAbortRef.current) {
				requestAbortRef.current.abort();
			}
		};
	}, []);

	return (
		<div ref={pageRef} className={styles.page}>
            <span className={styles.analysisLabel}>TO START ANALYSIS</span>
			<main className={styles.main}>
				<div className={styles.scene}>
					<div className={styles.squareSet}>
						<span className={`${styles.orbitBox} ${styles.orbitBoxOne}`} />
						<span className={`${styles.orbitBox} ${styles.orbitBoxTwo}`} />
						<span className={`${styles.orbitBox} ${styles.orbitBoxThree}`} />
						<button
							type="button"
							className={styles.iconButton}
							onClick={activateCamera}
							onMouseEnter={handleIconHoverStart}
							onMouseLeave={handleIconHoverEnd}
							onFocus={handleIconHoverStart}
							onBlur={handleIconHoverEnd}
							aria-label="Activate camera"
						>
							<Image src={shutterIcon} alt="" className={styles.actionIconImage} width={26} height={26} />
						</button>
						<div className={`${styles.callout} ${styles.calloutLeft}`} aria-hidden="true">
							<div className={styles.calloutTrack}>
								<span className={styles.calloutLine} />
								<span className={styles.calloutDot} />
								<p className={styles.calloutBlurb}>
									ALLOW A.I.
									<br />
									TO SCAN YOUR FACE
								</p>
							</div>
						</div>
					</div>

					<div className={styles.squareSet}>
						<span className={`${styles.orbitBox} ${styles.orbitBoxOne}`} />
						<span className={`${styles.orbitBox} ${styles.orbitBoxTwo}`} />
						<span className={`${styles.orbitBox} ${styles.orbitBoxThree}`} />
						<button
							type="button"
							className={styles.iconButton}
							onClick={openFilePicker}
							onMouseEnter={handleIconHoverStart}
							onMouseLeave={handleIconHoverEnd}
							onFocus={handleIconHoverStart}
							onBlur={handleIconHoverEnd}
							aria-label="Upload image from device"
						>
							<Image src={galleryIcon} alt="" className={styles.actionIconImage} width={26} height={26} />
						</button>
						<div className={`${styles.callout} ${styles.calloutRight}`} aria-hidden="true">
							<div className={styles.calloutTrack}>
								<span className={styles.calloutLine} />
								<span className={styles.calloutDot} />
								<p className={styles.calloutBlurb}>
									ALLOW A.I.
									<br />
									ACCESS TO GALLERY
								</p>
							</div>
						</div>
					</div>

					<input
						ref={fileInputRef}
						type="file"
						accept="image/*"
						className={styles.fileInput}
						onChange={(e) => { void handleFileChange(e); }}
					/>
					<canvas ref={canvasRef} className={styles.fileInput} aria-hidden="true" />
				</div>
			</main>
			{submissionPhase === "processing" ? (
				<p className={styles.statusMessage} aria-live="polite">Uploading...</p>
			) : null}
			{submissionPhase === "done" ? (
				<p className={styles.statusMessage} aria-live="polite">Upload complete.</p>
			) : null}
			{submissionPhase === "error" ? (
				<p className={`${styles.statusMessage} ${styles.statusMessageError}`} aria-live="polite">{errorMessage}</p>
			) : null}
			<Link
				href="/testing"
				className={styles.backLink}
				onMouseEnter={handleBackHoverStart}
				onMouseLeave={handleBackHoverEnd}
				onFocus={handleBackHoverStart}
				onBlur={handleBackHoverEnd}
			>
				<span className={styles.backDiamondButton} aria-hidden="true">
					<BsFillCaretLeftFill className={styles.backIcon} />
				</span>
				<span>BACK</span>
			</Link>
			{cameraActive ? (
				<div className={styles.cameraOverlay} role="dialog" aria-label="Camera preview">
					<canvas className={`${styles.cameraPreviewCanvas} ${cameraReady ? styles.cameraPreviewReady : ""}`} ref={previewCanvasRef} />
					<div className={styles.cameraControls}>
						<button
							type="button"
							className={styles.cameraShutterButton}
							onClick={() => { void capturePhoto(); }}
							aria-label="Take photo"
						/>
					</div>
					<button
						type="button"
						className={styles.cameraDismiss}
						onClick={dismissCamera}
						aria-label="Close camera"
					>
						&#x2715;
					</button>
				</div>
			) : null}
			<video ref={displayVideoRef} className={styles.hiddenVideoFeed} muted playsInline />
		</div>
	);
}
