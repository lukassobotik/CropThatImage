"use client";
import {useRef, useState} from "react";
import styles from "@/app/drag-and-drop.module.css";

export default function DragAndDrop({onFileSubmit} : {onFileSubmit : any}) {
    const [dragActive, setDragActive] = useState<boolean>(false);
    const inputRef = useRef<any>(null);
    const [files, setFiles] = useState<any>([]);

    function handleChange(e: any) {
        e.preventDefault();
        console.log("File has been added");
        if (e.target.files && e.target.files[0]) {
            console.log(e.target.files);
            for (let i = 0; i < e.target.files["length"]; i++) {
                setFiles((prevState: any) => [...prevState, e.target.files[i]]);
            }
        }
    }

    function handleSubmitFile(e: any) {
        if (files.length === 0) {
            // no file has been submitted
        } else {
            onFileSubmit(files);
            setFiles([]);
        }
    }

    function handleDrop(e: any) {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            for (let i = 0; i < e.dataTransfer.files["length"]; i++) {
                setFiles((prevState: any) => [...prevState, e.dataTransfer.files[i]]);
            }
        }
    }

    function handleDragLeave(e: any) {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
    }

    function handleDragOver(e: any) {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(true);
    }

    function handleDragEnter(e: any) {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(true);
    }

    function removeFile(fileName: any, idx: any) {
        const newArr = [...files];
        newArr.splice(idx, 1);
        setFiles([]);
        setFiles(newArr);
    }

    function openFileExplorer() {
        inputRef.current.value = "";
        inputRef.current.click();
    }

    return (<div className={styles.parent}>
        <form
            className={dragActive ? styles.active : styles.dropzone}
            onDragEnter={handleDragEnter}
            onSubmit={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}>

            <input
                placeholder="fileInput"
                className={styles.input}
                ref={inputRef}
                type="file"
                multiple={true}
                onChange={handleChange}
                accept=".xlsx,.xls,image/*,.doc, .docx,.ppt, .pptx,.txt,.pdf"/>

            <div className={styles.dropzone_background} onClick={openFileExplorer}></div>

            <div className={styles.dropzone_content}>
                <p>
                    Drag & Drop files or{" "}
                    <span
                        className={styles.select_files}
                        onClick={openFileExplorer}>
                        <u>Select files</u>
                    </span>{" "}
                    to upload
                </p>

                <div className={styles.files}>
                    {files.map((file: any, idx: any) => (
                        <div key={idx} className={styles.file}>
                            <div>{file.name}</div>
                            <span onClick={() => removeFile(file.name, idx)}>
                                remove
                            </span>
                        </div>
                    ))}
                </div>

                {files.length > 0 ? <button
                    className={styles.submit}
                    onClick={handleSubmitFile}>
                    Submit
                </button> : null}
            </div>
        </form>
    </div>);
}