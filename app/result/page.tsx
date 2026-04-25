"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { BsFillCaretLeftFill } from "react-icons/bs";
import shutterIcon from "../assets/shutter-icon.svg";
import galleryIcon from "../assets/gallery-icon.svg";
import styles from "./page.module.css";

export default function ResultPage() {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const selectedFileRef = useRef<File | null>(null);

	async function activateCamera() {
		try {
			if (!navigator.mediaDevices?.getUserMedia) {
				return;
			}

			if (streamRef.current) {
				streamRef.current.getTracks().forEach((track) => track.stop());
			}

			const stream = await navigator.mediaDevices.getUserMedia({ video: true });
			streamRef.current = stream;
		} catch {
			// Intentionally silent: UI status text is not shown on this page.
		}
	}

	function openFilePicker() {
		fileInputRef.current?.click();
	}

	function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];

		if (!file) {
			selectedFileRef.current = null;
			return;
		}

		selectedFileRef.current = file;
	}

	useEffect(() => {
		return () => {
			if (streamRef.current) {
				streamRef.current.getTracks().forEach((track) => track.stop());
			}
		};
	}, []);

	return (
		<div className={styles.page}>
            <span className={styles.analysisLabel}>TO START ANALYSIS</span>
			<main className={styles.main}>
				<div className={styles.scene}>
					<div className={styles.squareSet}>
						<span className={`${styles.orbitBox} ${styles.orbitBoxOne}`} />
						<span className={`${styles.orbitBox} ${styles.orbitBoxTwo}`} />
						<span className={`${styles.orbitBox} ${styles.orbitBoxThree}`} />
						<button type="button" className={styles.iconButton} onClick={activateCamera} aria-label="Activate camera">
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
						<button type="button" className={styles.iconButton} onClick={openFilePicker} aria-label="Upload image from device">
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
						onChange={handleFileChange}
					/>
				</div>
			</main>
			<Link href="/testing" className={styles.backLink}>
				<span className={styles.backDiamondButton} aria-hidden="true">
					<BsFillCaretLeftFill className={styles.backIcon} />
				</span>
				<span>BACK</span>
			</Link>
		</div>
	);
}
