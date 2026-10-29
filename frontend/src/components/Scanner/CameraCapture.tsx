import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, X, AlertCircle, Check } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (base64Data: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  onCapture,
  onCancel,
  isLoading,
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize camera
  const startCamera = async (mode: 'environment' | 'user') => {
    // Stop any existing tracks
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setErrorMessage(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your current browser.');
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err: any) {
      console.warn('Camera initialization error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage(
          'Camera access was denied. Please grant permission in your browser or switch to the File Upload tab.'
        );
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMessage('No camera device found on this system. Please use file upload.');
      } else {
        setErrorMessage(err.message || 'Unable to open camera stream. Please use file upload.');
      }
    }
  };

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [facingMode]);

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(dataUrl);

      // Stop camera while reviewing
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        setStream(null);
      }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera(facingMode);
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 p-4 text-white shadow-xl">
      <canvas ref={canvasRef} className="hidden" />

      {errorMessage ? (
        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 mb-3">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-bold text-white mb-1">Camera Unavailable</h4>
          <p className="text-xs text-slate-400 max-w-sm mb-5">{errorMessage}</p>
          <div className="flex gap-2">
            <button
              onClick={() => startCamera(facingMode)}
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition"
            >
              Retry Camera
            </button>
            <button
              onClick={onCancel}
              className="rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-500 transition"
            >
              Switch to File Upload
            </button>
          </div>
        </div>
      ) : capturedImage ? (
        /* Snapshot Review Mode */
        <div className="flex flex-col items-center">
          <div className="relative max-h-80 w-full overflow-hidden rounded-xl bg-black flex items-center justify-center">
            <img
              src={capturedImage}
              alt="Captured Garment"
              className="h-full w-full object-contain"
            />
            <div className="absolute top-3 left-3 rounded-full bg-emerald-500/90 px-2.5 py-1 text-[11px] font-bold text-white flex items-center gap-1">
              <Check className="h-3 w-3" /> Snapshot Captured
            </div>
          </div>

          <div className="mt-4 flex w-full items-center justify-between gap-3">
            <button
              onClick={handleRetake}
              disabled={isLoading}
              className="flex-1 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Retake
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className="flex-1 rounded-xl bg-gradient-to-r from-brand-600 to-emerald-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-brand-500/20 hover:from-brand-500 hover:to-emerald-400 transition"
            >
              Analyze Footprint
            </button>
          </div>
        </div>
      ) : (
        /* Live Viewfinder Mode */
        <div className="flex flex-col items-center">
          <div className="relative aspect-[4/3] w-full max-h-80 overflow-hidden rounded-xl bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />

            {/* Viewfinder reticle overlay */}
            <div className="pointer-events-none absolute inset-6 rounded-2xl border-2 border-dashed border-white/40 flex items-center justify-center">
              <div className="text-[11px] font-medium text-white/70 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full">
                Center clothing item here
              </div>
            </div>

            {/* Quick action buttons overlay */}
            <div className="absolute top-3 right-3 flex items-center gap-2">
              <button
                type="button"
                onClick={toggleFacingMode}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur hover:bg-black/80 transition"
                title="Switch front/rear camera"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur hover:bg-black/80 transition"
                title="Close camera"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Shutter controls */}
          <div className="mt-4 flex items-center justify-center gap-6">
            <button
              type="button"
              onClick={capturePhoto}
              className="group relative flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-brand-600 text-white shadow-lg shadow-brand-500/30 transition hover:scale-105 active:scale-95"
              title="Snap photo"
            >
              <Camera className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
