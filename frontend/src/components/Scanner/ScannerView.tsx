import React, { useState } from 'react';
import { UploadCloud, Camera, AlertCircle } from 'lucide-react';
import { ScanResponse, ScanInputMode } from '../../types';
import { ImageDropzone } from './ImageDropzone';
import { CameraCapture } from './CameraCapture';
import { SamplePicker } from './SamplePicker';
import { ScanningLoader } from './ScanningLoader';
import { ScanResults } from './ScanResults';
import { scanImage } from '../../services/api';

interface ScannerViewProps {
  onScanSuccess: (scan: ScanResponse) => void;
  onNavigateToRedeem: () => void;
}

export const ScannerView: React.FC<ScannerViewProps> = ({
  onScanSuccess,
  onNavigateToRedeem,
}) => {
  const [mode, setMode] = useState<ScanInputMode>('upload');
  const [isLoading, setIsLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState<ScanResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const executeScan = async (params: {
    file?: File;
    base64Data?: string;
    sampleHint?: string;
  }) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await scanImage(params);
      setCurrentResult(response);
      onScanSuccess(response);
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during scanning. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanAnother = () => {
    setCurrentResult(null);
    setErrorMessage(null);
  };

  if (isLoading) {
    return (
      <div className="py-6">
        <ScanningLoader />
      </div>
    );
  }

  if (currentResult) {
    return (
      <ScanResults
        results={currentResult}
        onScanAnother={handleScanAnother}
        onGoToRedeem={onNavigateToRedeem}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Intro Heading */}
      <div className="text-center max-w-xl mx-auto">
        <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
          Scan Your Clothing. Measure Impact.
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-600">
          Upload or capture a photo of your apparel. We estimate cradle-to-grave carbon footprints,
          award EcoPoints on sustainable choices, and unlock circular partner discounts.
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-xl bg-slate-200/80 p-1 shadow-inner gap-1">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition ${
              mode === 'upload'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UploadCloud className="h-4 w-4" />
            <span>Upload Image</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('camera')}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition ${
              mode === 'camera'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="h-4 w-4" />
            <span>Live Camera</span>
          </button>
        </div>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="mx-auto max-w-lg flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 shadow-sm">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Scanner Mode View */}
      <div className="max-w-xl mx-auto">
        {mode === 'upload' ? (
          <ImageDropzone
            onImageSelected={(file) => executeScan({ file })}
            isLoading={isLoading}
          />
        ) : (
          <CameraCapture
            onCapture={(base64Data) => executeScan({ base64Data })}
            onCancel={() => setMode('upload')}
            isLoading={isLoading}
          />
        )}

        {/* Quick Sample Presets */}
        <SamplePicker
          onSelectSample={(sampleHint) => executeScan({ sampleHint })}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};
