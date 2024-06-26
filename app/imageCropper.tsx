"use client";
import React, {useEffect, useRef, useState} from "react";
import styles from "./page.module.css";
import imglyRemoveBackground, {Config} from "@imgly/background-removal"
import Checkbox from "@/checkbox";
import DownloadButton from "@/downloadButton";
import 'react-tooltip/dist/react-tooltip.css';
import {Tooltip} from 'react-tooltip';

export default function ImageCropper({onFileSubmit} : {onFileSubmit : any}) {
    const [originalImageURL, setOriginalImageURL] = useState<any>(null);
    const [originalName, setOriginalName] = useState<string>('');
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
            setBackgroundRemoved(false);
            setRemoveBg(false);
            setCroppedImageDownloadURL(imageURL);
        }
    }, [backgroundRemoved]);

    useEffect(() => {
        handleFileSubmit(onFileSubmit);
    }, [onFileSubmit]);

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

            let currentCanvas = canvas;
            if (cropImage) {
                console.log("Cropping Image");
                // Pre-processing
                const croppedCanvas = cropToEdges(img, ctx, canvas);
                if (croppedCanvas !== undefined) {
                    currentCanvas = croppedCanvas;
                }
            } else if (!cropImage && forceSquare) {
                console.log("Forcing Square");
                const maxDimension = Math.max(currentCanvas.width, currentCanvas.height);
                const squareCanvas = document.createElement('canvas');
                const squareCtx = squareCanvas.getContext('2d');
                if (!squareCtx) return; // Handle potential canvas issue

                squareCanvas.width = maxDimension;
                squareCanvas.height = maxDimension;
                squareCtx.drawImage(currentCanvas, 0, 0, currentCanvas.width, currentCanvas.height, (maxDimension - currentCanvas.width) / 2, (maxDimension - currentCanvas.height) / 2, currentCanvas.width, currentCanvas.height);
                currentCanvas = squareCanvas;
            }

            if (padding > 0) {
                console.log("Adding Padding");
                const processed = addPaddingToCanvas(currentCanvas, padding);
                if (processed !== undefined) {
                    currentCanvas = processed;
                }
            }

            setImage(currentCanvas.toDataURL(), true);
            setProcessingCompleted(true);
            setBackgroundRemoved(false);
            setCroppedImageDownloadURL(currentCanvas.toDataURL('image/png'));
            return;
        };

        img.src = currentImageURL;
    }

    const setImage = (url: any, saveHistory: boolean) => {
        if (imageURLHistory[currentHistoryIndex] === url) {
            console.info("Image is the same as the previous one, not saving history.");
            return;
        }

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

    const addPaddingToCanvas = (canvas: HTMLCanvasElement, padding : number) => {
        if (padding === 0) return;

        let croppedWidth = canvas.width + (padding * 2);
        let croppedHeight = canvas.height + (padding * 2);

        const croppedCanvas = document.createElement('canvas');
        const croppedCtx = croppedCanvas.getContext('2d');
        if (!croppedCtx) return; // Handle potential canvas issue

        croppedCanvas.width = croppedWidth;
        croppedCanvas.height = croppedHeight;

        setCroppedImageWidth(croppedWidth);
        setCroppedImageHeight(croppedHeight);
        croppedCtx.drawImage(canvas, 0, 0, croppedWidth, croppedHeight, padding, padding, croppedWidth, croppedHeight);

        return croppedCanvas;
    }

    const cropToEdges = (img: HTMLImageElement, ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Boundary Detection
        let top: number, bottom: number, left: number, right: number;
        const edges = detectEdges(imageData);
        top = edges.topBoundary;
        bottom = edges.bottomBoundary;
        left = edges.leftBoundary;
        right = edges.rightBoundary;

        // Cropping
        let croppedWidth = right - left;
        let croppedHeight = bottom - top;
        if (croppedWidth < 0 || croppedWidth == imageData.width) {
            console.log("Image width is already cropped to the edges");
            if (croppedWidth < 0) {
                croppedWidth = Math.abs(croppedWidth);
                right = left;
                left = right - croppedWidth;
            }
        }
        if (croppedHeight < 0 || Math.abs(croppedHeight) == imageData.height) {
            console.log("Image height is already cropped to the edges");
            if (croppedHeight < 0) {
                croppedHeight = Math.abs(croppedHeight);
                bottom = top;
                top = bottom - croppedHeight;
            }
        }

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
        setCroppedImageHeight(croppedHeight)

        croppedCtx.drawImage(img, left, top, croppedWidth, croppedHeight, addedSquarePaddingToWidth ? addedSquarePadding / 2 : 0, addedSquarePaddingToHeight ? addedSquarePadding / 2  : 0, croppedWidth, croppedHeight);

        return croppedCanvas;
    }

    const calculateMeanAlpha = (imageData: ImageData): number => {
        let alphaSum = 0;
        const totalPixels = imageData.data.length / 4; // Assuming RGBA

        for (let i = 3; i < imageData.data.length; i += 4) {
            alphaSum += imageData.data[i];
        }

        return alphaSum / totalPixels;
    }

    const getAlpha = (y : number, x : number, imageData : ImageData) => {
        const alphaIndex = ((y * imageData.width + x) * 4) + 3;
        return imageData.data[alphaIndex];
    }

    const detectEdges = (imageData: ImageData) => {
        let topBoundary = imageData.height, bottomBoundary = 0, leftBoundary = imageData.width, rightBoundary = 0;

        const threshold = calculateMeanAlpha(imageData) + addedAlphaThreshold;

        if (threshold >= 255) {
            console.log(`Threshold ${threshold} exceeds the limit of 255, returning original image`);
            return { topBoundary: topBoundary, bottomBoundary: bottomBoundary, leftBoundary: leftBoundary, rightBoundary: rightBoundary };
        }

        // Iterate through pixels
        for (let y = 0; y <= imageData.height; y++) {
            for (let x = 0; x <= imageData.width; x++) {
                const alpha = getAlpha(y, x, imageData);

                if (alpha > threshold) {
                    topBoundary = Math.min(topBoundary, y);
                    bottomBoundary = Math.max(bottomBoundary, y);
                    leftBoundary = Math.min(leftBoundary, x);
                    rightBoundary = Math.max(rightBoundary, x);
                }
            }

            // Hacky solution to the infinite cropping by 1 pixel on already cropped images
            // The logic is that we add 1 pixel to the bottom boundary, and then we go through the last row of pixels again,
            // where if all the pixels that we go through are empty, we decrease the bottom boundary by 1, but if not, we keep it increased by 1
            // The reason for doing only the height and not the width is because the infinite cropping only happens on the height (still not sure why)
            if (y == imageData.height - 1) {
                bottomBoundary += 1;
            }
        }

        // Decreasing the bottom boundary by 1 if all the pixels in the last row are empty (the second part of the hacky solution)
        let allEmpty = true;
        for (let x = 0; x <= imageData.width; x++) {
            const alpha = getAlpha(imageData.height - 1, x, imageData);
            if (alpha > threshold) {
                bottomBoundary = Math.max(bottomBoundary, imageData.height - 1);
                allEmpty = false;
                break;
            }
        }
        if (allEmpty) {
            bottomBoundary -= 1;
        }

        console.log("Top: " + topBoundary + " Bottom: " + bottomBoundary + " Left: " + leftBoundary + " Right: " + rightBoundary)
        return { topBoundary: topBoundary, bottomBoundary: bottomBoundary, leftBoundary: leftBoundary, rightBoundary: rightBoundary };
    };

    const handleFileSubmit = (files: any) => {
        if (files.length === 0) {
            // no file has been submitted
        } else {
            let file = Array.isArray(files) ? files[0] : files;
            let name = file.name;
            setOriginalName(name);
            name = name.split('.').slice(0, -1).join('.') + '_cropped.png';
            setCroppedImageName(name);
            const reader = new FileReader();
            reader.onload = function (event) {
                setImage(event?.target?.result, true);
                setProcessingDone(false);
            };
            reader.readAsDataURL(file);
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
                <h1>{originalName ? originalName : "Crop that Image!"}</h1>
                <canvas ref={canvasRef} className={styles.image_ref}/>
                {imageURL ? <div className={styles.image_config}>
                    <div className={styles.number_input_parent}>
                        <span data-tooltip-id="padding-tooltip"
                              data-tooltip-content="Padding is the amount of space around the cropped image (in pixels)."
                              data-tooltip-place="top-start">Padding:</span>
                        <Tooltip className={styles.tooltip} id="padding-tooltip" place="top-start" />
                        <input type="number" className={styles.number_input} value={padding}
                               onChange={(e) => setPadding(parseInt(e.target.value))}/>
                    </div>
                    <div className={styles.checkbox_parent} onClick={toggleCropImage}>
                        <span data-tooltip-id="crop-tooltip"
                              data-tooltip-content="Select whether you want to crop the image or not."
                              data-tooltip-place="top-start">Crop Image:</span>
                        <Tooltip className={styles.tooltip} id="crop-tooltip" place="top-start"/>
                        <Checkbox checked={cropImage} onChange={toggleCropImage}></Checkbox>
                    </div>
                    <div className={styles.number_input_parent}>
                        <span data-tooltip-id="alpha-thershold-tooltip"
                              data-tooltip-content="Increase or decrease the alpha threshold to make the cropping more or less sensitive. Default is 0.
                              This value is added to the mean alpha value of the image. Maximum value should be 255 (including the automaticly calculated mean alpha)."
                              data-tooltip-place="top-start">Increase Alpha Threshold:</span>
                        <Tooltip className={styles.tooltip} id="alpha-thershold-tooltip" place="top-start"/>
                        <input type="number" className={styles.number_input} value={addedAlphaThreshold}
                               onChange={(e) => setAddedAlphaThreshold(parseInt(e.target.value))}/>
                    </div>
                    <div className={styles.checkbox_parent} onClick={toggleIsSquare}>
                        <span data-tooltip-id="square-tooltip"
                              data-tooltip-content="Select whether you want the cropped image to be a square or not."
                              data-tooltip-place="top-start">Force Square:</span>
                        <Tooltip className={styles.tooltip} id="square-tooltip" place="top-start"/>
                        <Checkbox checked={forceSquare} onChange={toggleIsSquare}></Checkbox>
                    </div>
                    <div className={styles.checkbox_parent} onClick={toggleRemoveBg}>
                        <span data-tooltip-id="remove-bg-tooltip"
                              data-tooltip-content="Select whether you want to remove the background of the image or not. This will use the Img.ly Background Removal API."
                              data-tooltip-place="top-start">Remove Logo Background:</span>
                        <Tooltip className={styles.tooltip} id="remove-bg-tooltip" place="top-start"/>
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