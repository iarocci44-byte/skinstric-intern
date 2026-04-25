export default function SummaryPage() {
	return (
		<main
			style={{
				minHeight: "calc(100vh - 64px)",
				position: "relative",
				display: "grid",
				placeItems: "center",
				padding: "24px",
			}}
		>
			<div
				style={{
					position: "absolute",
					top: "24px",
					left: "24px",
					fontFamily: '"Roobert TRIAL", Arial, Helvetica, sans-serif',
					fontSize: "14px",
					fontWeight: 400,
					lineHeight: 1.4,
					letterSpacing: "0.01em",
					color: "#111111",
					maxWidth: "340px",
				}}
			>
				<div style={{ fontWeight: 600, marginBottom: "6px" }}>A.I. ANALYSIS</div>
				<div>A.I. has estimated the following.</div>
				<div>Fix estimated information if needed.</div>
			</div>
			<h1
				style={{
					margin: 0,
					fontFamily: '"Roobert TRIAL", Arial, Helvetica, sans-serif',
					fontSize: "clamp(22px, 5vw, 48px)",
					fontWeight: 600,
					letterSpacing: "0.12em",
					color: "#111111",
				}}
			>
				SUMMARY
			</h1>
		</main>
	);
}
