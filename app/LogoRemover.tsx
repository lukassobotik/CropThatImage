import { useEffect, useState, useRef } from "react";
import styles from "./page.module.css";

export default function LogoRemover() {
    const [imageURL, setImageURL] = useState<any>(null);
    const [processingDone, setProcessingDone] = useState<boolean>(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (imageURL !== null && canvasRef.current) {
            const img = new Image();
            img.onload = () => {
                const canvas = canvasRef.current;
                const ctx = canvas.getContext("2d");
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const edges = detectEdges(imageData);
                edges.forEach(({ x, y }) => {
                    const index = (y * imageData.width + x) * 4;
                    imageData.data[index + 3] = 0; // Set alpha to 0
                });
                console.log(edges)
                ctx.putImageData(imageData, 0, 0);
                setProcessingDone(true);
                console.log(imageData)

                ctx.drawImage(img, 150, 150, img.width, img.height);
            };
            img.src = imageURL;
        }
    }, [imageURL]);

    const detectEdges = (imageData: any) => {
        const edges = [];
        for (let y = 0; y < imageData.height; y++) {
            for (let x = 0; x < imageData.width; x++) {
                const alpha = imageData.data[(y * imageData.width + x) * 4 + 3];
                if (alpha === 0) {
                    edges.push({ x, y });
                }
            }
        }
        return edges;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files !== null) {
            const reader = new FileReader();
            reader.onload = function (event) {
                setImageURL(event.target.result);
                setProcessingDone(false);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    return (
        <div>
            <h1>Logo Remover</h1>
            <p>Remove the logo from the image</p>
            <input type="file" onChange={handleFileChange} />
            <canvas ref={canvasRef} className={styles.image} />
            {processingDone && <p>Image processing done!</p>}
        </div>
    );
}