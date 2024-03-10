"use client";
import styles from "./page.module.css";
import LogoRemover from "@/app/LogoRemover";

export default function Home() {
    return (
        <main className={styles.main}>
            <LogoRemover />
        </main>
    );
}
