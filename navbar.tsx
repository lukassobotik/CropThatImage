"use client";
import styles from "@/app/navbar.module.css";

export default function Navbar() {
    return (
        <nav className={styles.navbar}>
            <a href="/" className={styles.navbar_link}>CropThatImage</a>
        </nav>
    );
}