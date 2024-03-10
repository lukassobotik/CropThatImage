"use client";
import { useState } from "react";
import styles from "/app/download-button.module.css";

export default function DownloadButton({url, filename} : {url: string, filename: string}) {
    const clickHandler = () => {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
    }

    return (
        <button className={styles.Btn} onClick={clickHandler}>
            <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 384 512" className={styles.svgIcon}>
                <path d="M169.4 470.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 370.8 224 64c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 306.7L54.6 265.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z"></path>
            </svg>
            <span className={styles.icon2}></span>
        </button>
    );
}