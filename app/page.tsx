"use client";
import Image from "next/image";
import styles from "./page.module.css";
import { useState } from "react";
import LogoRemover from "@/app/LogoRemover";

export default function Home() {
  return (
    <main className={styles.main}>
        <LogoRemover />
    </main>
  );
}
