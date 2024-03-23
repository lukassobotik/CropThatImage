"use client";
import React, {useEffect, useRef, useState} from "react";
import styles from "./page.module.css";
import imglyRemoveBackground, {Config} from "@imgly/background-removal"
import Checkbox from "@/checkbox";
import DownloadButton from "@/downloadButton";
import DragAndDrop from "@/dragAndDrop";

export default function ImageCropper() {
    const [originalImageURL, setOriginalImageURL] = useState<any>(null);
    const [imageURL, setImageURL] = useState<any>(null);
    const [imageURLHistory, setImageURLHistory] = useState<string[]>([]);
    const [imageURLFuture, setImageURLFuture] = useState<string[]>([]);
    const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number>(-1);
    const [croppedImageHeight, setCroppedImageHeight] = useState<number>(400);
    const [croppedImageWidth, setCroppedImageWidth] = useState<number>(400);
    const [croppedImageDownloadURL, setCroppedImageDownloadURL] = useState<string>('');
    const [croppedImageName, setCroppedImageName] = useState<string>('cropped_image.png');
    const [processingDone, setProcessingDone] = useState<boolean>(false);
    const [hasProcessingStarted, setHasProcessingStarted] = useState<boolean>(false);
    const [forceSquare, setForceSquare] = useState<boolean>(false);
    const [cropImage, setCropImage] = useState<boolean>(true);
    const [removeBg, setRemoveBg] = useState<boolean>(false);
    const [backgroundRemoved, setBackgroundRemoved] = useState<boolean>(false);
    const [padding, setPadding] = useState<number>(0);
    const [addedAlphaThreshold, setAddedAlphaThreshold] = useState<number>(0);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    let BGRemovalConfig : Config = {
        output: {
            format: "image/png",
            quality: 1,
        }
    }

    useEffect(() => {
        // Undo button
        if (hasProcessingStarted || imageURLHistory.length < 2 || currentHistoryIndex === 0) {
            disableButton(true, "undo_button");
        } else {
            disableButton(false, "undo_button");
        }

        // Redo button
        if (hasProcessingStarted || imageURLFuture.length < 1) {
            disableButton(true, "redo_button");
            return;
        } else {
            disableButton(false, "redo_button");
        }
    }, [imageURLHistory, imageURLFuture]);

    useEffect(() => {
        if (!imageURL || hasProcessingStarted) return;

        setCroppedImageWidth(imageURL.width);
        setCroppedImageHeight(imageURL.height);
    }, [hasProcessingStarted, imageURL, processingDone]);

    useEffect(() => {
        if (backgroundRemoved && cropImage) {
            console.log("Background Removed");
            setRemoveBg(false);
            startProcessingImage(true);
        } else if (backgroundRemoved && !cropImage) {
            setProcessingCompleted(true);
            setCroppedImageDownloadURL(imageURL);
        }
    }, [backgroundRemoved]);

    const startProcessingImage = (ignoreRemoveBg: boolean) => {
        if (!imageURL || !originalImageURL) return;
        setHasProcessingStarted(true);
        let currentImageURL = imageURL;

        if (imageURLFuture.length > 0) {
            setImageURLFuture([]);
        }

        const canvas = canvasRef.current;
        if (!canvas) return; // Handle potential canvas issue
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.visibility = 'hidden';

        const ctx = canvas.getContext('2d');
        if (!ctx) return; // Handle potential canvas issue
        const img = new Image();

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            if (removeBg && !ignoreRemoveBg) {
                console.log("Removing Background")
                imglyRemoveBackground(currentImageURL, BGRemovalConfig).then((blob: Blob) => {
                    setImage(URL.createObjectURL(blob), false);
                    setBackgroundRemoved(true);
                    return;
                });
                return;
            }

            console.log("Cropping Image");

            const croppedCanvas = cropToEdges(img, ctx, canvas);
            if (croppedCanvas === undefined) return;

            setImage(croppedCanvas.toDataURL(), true);
            setProcessingCompleted(true);
            setCroppedImageDownloadURL(croppedCanvas.toDataURL('image/png'));
        };

        img.src = currentImageURL;
    }

    const setImage = (url: any, saveHistory: boolean) => {
        setImageURL(url);
        if (saveHistory) {
            setImageURLHistory([...imageURLHistory, url]);
            setCurrentHistoryIndex(currentHistoryIndex + 1);
            setOriginalImageURL(url);
        }
    }

    const setProcessingCompleted = (value: boolean) => {
        setProcessingDone(value);
        setHasProcessingStarted(!value);
    }

    const cropToEdges = (img: HTMLImageElement, ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Boundary Detection
        let top = imageData.height, bottom = 0, left = imageData.width, right = 0;
        const edges = detectEdges(imageData);
        top = edges.top;
        bottom = edges.bottom;
        left = edges.left;
        right = edges.right;

        // Cropping
        let croppedWidth = (right - left) + (padding * 2);
        let croppedHeight = (bottom - top) + (padding * 2);
        let addedSquarePaddingToWidth = false;
        let addedSquarePaddingToHeight = false;
        let addedSquarePadding = 0;
        if (forceSquare) {
            const maxDimension = Math.max(croppedWidth, croppedHeight);
            addedSquarePadding = (maxDimension - Math.min(croppedWidth, croppedHeight));
            addedSquarePaddingToWidth = croppedWidth !== maxDimension;
            addedSquarePaddingToHeight = croppedHeight !== maxDimension;
            croppedWidth = maxDimension;
            croppedHeight = maxDimension;
        }
        const croppedCanvas = document.createElement('canvas');
        const croppedCtx = croppedCanvas.getContext('2d');
        if (!croppedCtx) return; // Handle potential canvas issue
        croppedCanvas.width = croppedWidth;
        croppedCanvas.height = croppedHeight;
        setCroppedImageWidth(croppedWidth);
        setCroppedImageHeight(croppedHeight);
        croppedCtx.drawImage(img, left, top, croppedWidth, croppedHeight, addedSquarePaddingToWidth ? addedSquarePadding / 2 + padding : padding, addedSquarePaddingToHeight ? addedSquarePadding / 2 + padding : padding, croppedWidth, croppedHeight);
        const croppedImageData = croppedCtx.getImageData(left, top, croppedWidth, croppedHeight);

        return croppedCanvas;
    }

    const calculateAlphaThreshold = (imageData: ImageData): number => {
        const alphaValues: number[] = [];

        for (let y = 0; y < imageData.height; y++) {
            for (let x = 0; x < imageData.width; x++) {
                const alphaIndex = (y * imageData.width + x) * 4 + 3;
                alphaValues.push(imageData.data[alphaIndex]);
            }
        }

        const meanAlpha = alphaValues.reduce((a, b) => a + b, 0) / alphaValues.length;
        const stdAlpha = Math.sqrt(alphaValues.map(x => Math.pow(x - meanAlpha, 2)).reduce((a, b) => a + b) / alphaValues.length);

        return meanAlpha + stdAlpha; // You can adjust sensitivity by adding a multiplier
    }

    const detectEdges = (imageData: ImageData) => {
        let top = imageData.height, bottom = 0, left = imageData.width, right = 0;

        const threshold = calculateAlphaThreshold(imageData) + addedAlphaThreshold;

        // Iterate through pixels (consider row-major traversal for slight efficiency gain)
        for (let y = 0; y < imageData.height; y++) {
            for (let x = 0; x < imageData.width; x++) {
                const alphaIndex = (y * imageData.width + x) * 4 + 3;
                const alpha = imageData.data[alphaIndex];

                if (alpha > threshold) { // Adjust transparency threshold if needed
                    top = Math.min(top, y);
                    bottom = Math.max(bottom, y);
                    left = Math.min(left, x);
                    right = Math.max(right, x);
                }
            }
        }

        return { top, bottom, left, right };
    };

    const handleFileSubmit = (files: any) => {
        if (files.length === 0) {
            // no file has been submitted
        } else {
            let name = files[0].name;
            name = name.split('.').slice(0, -1).join('.') + '_cropped.png';
            setCroppedImageName(name);
            const reader = new FileReader();
            reader.onload = function (event) {
                setImage(event?.target?.result, true);
                setProcessingDone(false);
            };
            reader.readAsDataURL(files[0]);
        }
    }

    const toggleCropImage = () => {
        setCropImage(!cropImage);
    };

    const toggleIsSquare = () => {
        setForceSquare(!forceSquare);
    };

    const toggleRemoveBg = () => {
        setRemoveBg(!removeBg);
    };

    function disableButton(value : boolean, buttonId : string) {
        if (value) {
            const el = document.getElementById(buttonId);
            if (el) {
                el.style.color = 'grey';
                el.style.cursor = 'initial';
                el.style.pointerEvents = 'none';
            }
        } else {
            const el = document.getElementById(buttonId);
            if (el) {
                el.style.color = 'white';
                el.style.cursor = 'pointer';
                el.style.pointerEvents = 'auto';
            }
        }
    }

    const undo = () => {
        if (hasProcessingStarted || imageURLHistory.length < 2 || currentHistoryIndex === 0) {
            disableButton(true, "undo_button");
            return;
        } else {
            disableButton(false, "undo_button");
        }

        const previousImage = imageURLHistory[currentHistoryIndex - 1];
        setCurrentHistoryIndex(currentHistoryIndex - 1);

        const copyHistory = [...imageURLHistory];
        const removedItem = copyHistory.pop();
        setImageURLHistory(copyHistory);
        if (removedItem) setImageURLFuture([removedItem, ...imageURLFuture]);

        setImageURL(previousImage);
        setCroppedImageDownloadURL(previousImage);
    }

    const redo = () => {
        if (hasProcessingStarted || imageURLFuture.length < 1) {
            disableButton(true, "redo_button");
            return;
        } else {
            disableButton(false, "redo_button");
        }

        const [removedItem, ...remainingItems] = imageURLFuture;
        setImageURLFuture(remainingItems);
        if (removedItem) setImageURLHistory([...imageURLHistory, removedItem]);

        setCurrentHistoryIndex(currentHistoryIndex + 1);
        setImageURL(removedItem);
        setCroppedImageDownloadURL(removedItem);
    }

    return (
        <div className={styles.remover_parent}>
            <div className={styles.image_settings}>
                <h1>Crop that Image!</h1>
                {!processingDone && !imageURL && !hasProcessingStarted &&
                    <DragAndDrop onFileSubmit={handleFileSubmit} />}
                <canvas ref={canvasRef} className={styles.image_ref}/>
                {imageURL ? <div className={styles.image_config}>
                    <div className={styles.number_input_parent}>
                        Padding:
                        <input type="number" className={styles.number_input} value={padding}
                               onChange={(e) => setPadding(parseInt(e.target.value))}/>
                    </div>
                    <div className={styles.checkbox_parent} onClick={toggleCropImage}>
                        <span>Crop Image:</span>
                        <Checkbox checked={cropImage} onChange={toggleCropImage}></Checkbox>
                    </div>
                    <div className={styles.number_input_parent}>
                        Increase Alpha Threshold:
                        <input type="number" className={styles.number_input} value={addedAlphaThreshold}
                               onChange={(e) => setAddedAlphaThreshold(parseInt(e.target.value))}/>
                    </div>
                    <div className={styles.checkbox_parent} onClick={toggleIsSquare}>
                        <span>Force Square:</span>
                        <Checkbox checked={forceSquare} onChange={toggleIsSquare}></Checkbox>
                    </div>
                    <div className={styles.checkbox_parent} onClick={toggleRemoveBg}>
                        <span>Remove Logo Background:</span>
                        <Checkbox checked={removeBg} onChange={toggleRemoveBg}></Checkbox>
                    </div>
                    <button className={styles.button} onClick={() => startProcessingImage(false)}>
                        <div className={styles.loader} style={{
                            opacity: (hasProcessingStarted ? 1 : 0),
                            left: (!hasProcessingStarted ? "-150%" : "")
                        }}></div>
                        <span style={{
                            opacity: (!hasProcessingStarted ? 1 : 0),
                            left: (hasProcessingStarted ? "-150%" : "")
                        }}>Process Image</span>
                    </button>
                    <div className={styles.history_buttons}>
                        <button id="undo_button" className={styles.button} onClick={undo}>Undo</button>
                        <button id="redo_button" className={styles.button} onClick={redo}>Redo</button>
                    </div>
                </div> : null}
                <div className={styles.download_button}>
                    {croppedImageDownloadURL ? <DownloadButton url={croppedImageDownloadURL} filename={croppedImageName}/> : null}
                </div>
            </div>
            <div className={styles.image_preview}>
                {imageURL && <img src={imageURL} className={styles.image} alt="image" width={croppedImageWidth}
                                  height={croppedImageHeight}/>}
            </div>
        </div>
    );
}