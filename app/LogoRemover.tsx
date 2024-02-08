"use client";
import { useEffect, useState, useRef } from "react";
import styles from "./page.module.css";

export default function LogoRemover() {
    const [imageURL, setImageURL] = useState<any>(null);
    const [croppedImageHeight, setCroppedImageHeight] = useState<number>(4);
    const [croppedImageWidth, setCroppedImageWidth] = useState<number>(4);
    const [croppedImageDownloadURL, setCroppedImageDownloadURL] = useState<string>('');
    const [croppedImageName, setCroppedImageName] = useState<string>('cropped_image.png');
    const [processingDone, setProcessingDone] = useState<boolean>(false);
    const [forceSquare, setForceSquare] = useState<boolean>(false);
    const [padding, setPadding] = useState<number>(0);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!imageURL || processingDone) return; // Return if no image

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

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            // Boundary Detection
            let top = imageData.height, bottom = 0, left = imageData.width, right = 0;
            const edges = detectEdges(imageData);
            top = edges.top;
            bottom = edges.bottom;
            left = edges.left;
            right = edges.right;

            // Cropping
            console.log("forceSquare: ", forceSquare);
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
            setImageURL(croppedCanvas.toDataURL());

            setProcessingDone(true);

            setCroppedImageDownloadURL(croppedCanvas.toDataURL('image/png'));
        };

        img.src = imageURL;
    }, [imageURL, processingDone]);

    const detectEdges = (imageData: ImageData) => {
        let top = imageData.height, bottom = 0, left = imageData.width, right = 0;

        // Iterate through pixels (consider row-major traversal for slight efficiency gain)
        for (let y = 0; y < imageData.height; y++) {
            for (let x = 0; x < imageData.width; x++) {
                const alphaIndex = (y * imageData.width + x) * 4 + 3;
                const alpha = imageData.data[alphaIndex];

                if (alpha > 0) { // Adjust transparency threshold if needed
                    top = Math.min(top, y);
                    bottom = Math.max(bottom, y);
                    left = Math.min(left, x);
                    right = Math.max(right, x);
                }
            }
        }

        return { top, bottom, left, right };
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files !== null) {
            console.log(e?.target?.files[0].name)
            // TODO: Split the filename by '.', get the last item and add '_cropped' before the extension
            setCroppedImageName(e?.target?.files[0].name.slice(0, -4) + '_cropped.png');
            const reader = new FileReader();
            reader.onload = function (event) {
                setImageURL(event?.target?.result);
                setProcessingDone(false);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const toggleIsSquare = () => {
        setForceSquare(!forceSquare);
    };

    return (
        <div>
            <h1>Logo Edges Remover</h1>
            <p>Remove the edges of a logo</p>
            {!processingDone && <input type="file" className={styles.file_input} onChange={handleFileChange}/>}
            <canvas ref={canvasRef} className={styles.image_ref}/>
            <div className={styles.image_config}>
                <input type="number" className={styles.number_input} value={padding} onChange={(e) => setPadding(parseInt(e.target.value))} />
                <div>
                    Force Square:
                    <input type="checkbox" value={forceSquare ? "true" : "false"} onClick={(e) => toggleIsSquare()} />
                </div>
            </div>
            <div className={styles.processing_done}>
                {processingDone && <p>Image processing done!</p>}
                {croppedImageDownloadURL &&
                    <a href={croppedImageDownloadURL} download={croppedImageName}>Download Cropped Image</a>}
            </div>
            {imageURL && <img src={imageURL} className={styles.image} alt="image" width={croppedImageWidth} height={croppedImageHeight}/>}
        </div>
    );
}