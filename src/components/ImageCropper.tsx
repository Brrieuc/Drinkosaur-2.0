
import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check, Loader2 } from 'lucide-react';

interface ImageCropperProps {
    image: string;
    onCropComplete: (croppedImage: string) => void;
    onClose: () => void;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({ image, onCropComplete, onClose }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const onCropChange = (crop: any) => setCrop(crop);
    const onZoomChange = (zoom: any) => setZoom(zoom);

    const onCropAreaComplete = useCallback((_: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const createCroppedImage = async () => {
        setIsProcessing(true);
        try {
            const canvas = document.createElement('canvas');
            const img = new Image();
            img.src = image;
            await new Promise((resolve) => (img.onload = resolve));

            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            canvas.width = croppedAreaPixels.width;
            canvas.height = croppedAreaPixels.height;

            ctx.drawImage(
                img,
                croppedAreaPixels.x,
                croppedAreaPixels.y,
                croppedAreaPixels.width,
                croppedAreaPixels.height,
                0,
                0,
                croppedAreaPixels.width,
                croppedAreaPixels.height
            );

            // Resize to a standard profile size to save space/bandwidth
            const outputCanvas = document.createElement('canvas');
            outputCanvas.width = 320;
            outputCanvas.height = 320;
            const outCtx = outputCanvas.getContext('2d');
            if (outCtx) {
                outCtx.drawImage(canvas, 0, 0, 320, 320);
            }

            const base64Image = outputCanvas.toDataURL('image/jpeg', 0.6);

            onCropComplete(base64Image);
        } catch (e) {
            console.error(e);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[300] bg-black flex flex-col">
            <div className="flex justify-between items-center p-6 text-white z-10">
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
                    <X size={24} />
                </button>
                <h3 className="font-bold text-lg">Crop Photo</h3>
                <button
                    onClick={createCroppedImage}
                    disabled={isProcessing}
                    className="bg-blue-600 px-6 py-2 rounded-full font-bold flex items-center gap-2"
                >
                    {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                    Apply
                </button>
            </div>

            <div className="relative flex-1 bg-black/50">
                <Cropper
                    image={image}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    onCropChange={onCropChange}
                    onCropComplete={onCropAreaComplete}
                    onZoomChange={onZoomChange}
                    cropShape="round"
                    showGrid={false}
                />
            </div>

            <div className="p-10 bg-black text-white z-10">
                <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    aria-labelledby="Zoom"
                    onChange={(e: any) => setZoom(e.target.value)}
                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
            </div>
        </div>
    );
};
