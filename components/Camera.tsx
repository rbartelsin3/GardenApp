"use client";

import { useRef, useState, useEffect } from "react";

interface CameraProps {
  onCapture: (imageSrc: string) => void;
  onClose: () => void;
}

export default function Camera({ onCapture, onClose }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Kan de camera niet laden. Zorg ervoor dat u toestemming heeft gegeven.");
      }
    }

    startCamera();

    const currentVideoRef = videoRef.current;

    return () => {
      if (currentVideoRef && currentVideoRef.srcObject) {
        const stream = currentVideoRef.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageSrc = canvas.toDataURL("image/jpeg");
        onCapture(imageSrc);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex justify-between p-4 text-white">
        <h2 className="text-xl font-semibold">Plant Scannen</h2>
        <button onClick={onClose} className="p-2">
          ✕
        </button>
      </div>

      <div className="relative flex-1 bg-stone-900 overflow-hidden">
        {error ? (
          <div className="flex items-center justify-center h-full p-8 text-center text-white">
            <p>{error}</p>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
      </div>

      <div className="p-8 flex justify-center bg-black">
        <button
          onClick={captureImage}
          disabled={!!error}
          className="w-20 h-20 bg-white rounded-full border-8 border-stone-300 active:bg-stone-200 transition-colors disabled:opacity-50"
          aria-label="Neem foto"
        />
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
