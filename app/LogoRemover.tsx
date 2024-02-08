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
            const croppedWidth = right - left;
            const croppedHeight = bottom - top;
            // const croppedWidth = 1024 - 150;
            // const croppedHeight = 1024 - 200;
            const croppedCanvas = document.createElement('canvas');
            const croppedCtx = croppedCanvas.getContext('2d');
            if (!croppedCtx) return; // Handle potential canvas issue
            croppedCanvas.width = croppedWidth;
            croppedCanvas.height = croppedHeight;
            setCroppedImageWidth(croppedWidth);
            setCroppedImageHeight(croppedHeight);
            croppedCtx.drawImage(img, left, top, croppedWidth, croppedHeight, 0, 0, croppedWidth, croppedHeight);
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
            setCroppedImageName(e?.target?.files[0].name.slice(0, -4) + '_cropped.png');
            const reader = new FileReader();
            reader.onload = function (event) {
                setImageURL(event?.target?.result);
                setProcessingDone(false);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    return (
        <div>
            <h1>Logo Edges Remover</h1>
            <p>Remove the edges of a logo</p>
            {!processingDone && <input type="file" onChange={handleFileChange}/>}
            <canvas ref={canvasRef} className={styles.image_ref}/>
            <div className={styles.processing_done}>
                {processingDone && <p>Image processing done!</p>}
                {croppedImageDownloadURL &&
                    <a href={croppedImageDownloadURL} download={croppedImageName}>Download Cropped Image</a>}
            </div>
            {imageURL && <img src={imageURL} className={styles.image} alt="image" width={croppedImageWidth} height={croppedImageHeight}/>}
        </div>
    );
}