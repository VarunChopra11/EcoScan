import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, X, AlertCircle } from 'lucide-react';

interface ImageDropzoneProps {
  onImageSelected: (file: File) => void;
  isLoading: boolean;
}

export const ImageDropzone: React.FC<ImageDropzoneProps> = ({
  onImageSelected,
  isLoading,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setErrorMessage(null);

    // Validation
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage('Please select a valid image file (JPEG, PNG, or WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Image size exceeds 10MB limit. Please upload a smaller image.');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleClear = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    setSelectedFile(null);
    setErrorMessage(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleAnalyze = () => {
    if (selectedFile) {
      onImageSelected(selectedFile);
    }
  };

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {errorMessage && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      {!preview ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-brand-500 bg-brand-50/70 scale-[1.01]'
              : 'border-slate-300 bg-white hover:border-brand-400 hover:bg-slate-50/70'
          }`}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100/80 text-brand-700 shadow-sm">
            <UploadCloud className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-sm font-bold text-slate-800">
            Drag & drop your clothing photo here
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-xs">
            Supports JPEG, PNG, and WebP up to 10MB. Clear lighting produces the most accurate recognition.
          </p>
          <button
            type="button"
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition"
          >
            <ImageIcon className="h-3.5 w-3.5" />
            <span>Browse Local Files</span>
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="relative mx-auto aspect-video max-h-72 overflow-hidden rounded-xl bg-slate-950 flex items-center justify-center">
            <img
              src={preview}
              alt="Selected apparel"
              className="h-full w-full object-contain"
            />
            <button
              onClick={handleClear}
              disabled={isLoading}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/80 text-white backdrop-blur hover:bg-slate-900 transition"
              title="Remove image"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-left w-full sm:w-auto">
              <p className="text-xs font-semibold text-slate-800 truncate max-w-xs">
                {selectedFile?.name}
              </p>
              <p className="text-[11px] text-slate-500">
                {(Number(selectedFile?.size || 0) / (1024 * 1024)).toFixed(2)} MB • Ready for carbon analysis
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleClear}
                disabled={isLoading}
                className="w-1/2 sm:w-auto rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Change Photo
              </button>
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={isLoading}
                className="w-1/2 sm:w-auto rounded-xl bg-gradient-to-r from-brand-600 to-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-brand-500/20 hover:from-brand-700 hover:to-emerald-700 transition"
              >
                Analyze Footprint
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
