"use client";
import styles from "@/app/page.module.css";
import ImageCropper from "@/app/imageCropper";
import Navbar from "@/navbar";
import DragAndDrop from "@/dragAndDrop";
import {useState} from "react";

export default function Home() {
    const [files, setFiles] = useState<any>([]);
    const [submitted, setSubmitted] = useState<boolean>(false);

    const handleFileSubmit = (files: any) => {
        console.log(files);
        setFiles(files);
        setSubmitted(true);
    }

    return (
        <main className={styles.main}>
            <Navbar/>
            {!submitted ? <div className={styles.drag_and_drop}><DragAndDrop onFileSubmit={handleFileSubmit}></DragAndDrop></div> : null}
            {files.length > 0 ? files.map((file: any, id: number) => {
                return (
                    <div key={id} className={styles.file}>
                        <ImageCropper onFileSubmit={file}/>
                    </div>
                );
            }) : null}
        </main>
    );
}