"use client";

import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="siteHeader">
      <div className="siteHeaderLeft">
        <Link href="/" className="siteBrand">
          SKINSTRIC
        </Link>
        <span className="siteIntroLabel">[ INTRO ]</span>
      </div>
      <div className="siteCodeBadge">ENTER CODE</div>
    </header>
  );
}
