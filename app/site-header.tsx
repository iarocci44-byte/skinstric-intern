"use client";

import Image from "next/image";
import Link from "next/link";
import locationIcon from "./assets/location.svg";

export default function SiteHeader() {
  return (
    <header className="siteHeader">
      <div className="siteHeaderLeft">
        <Link href="/" className="siteBrand">
          SKINSTRIC
        </Link>
        <Image src={locationIcon} alt="Location" className="siteIntroLabel" />
      </div>
      <div className="siteCodeBadge">ENTER CODE</div>
    </header>
  );
}
