'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface ImageUploadProps {
  onImageChange: (base64: string | null, description?: string) => void;
  perfumeName?: string;
  brandName?: string;
}

export default function ImageUpload({ onImageChange, perfumeName, brandName }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [bottleDesc, setBottleDesc] = useState<string | null>(null);

  const analyzeBottle = useCallback(
    async (base64: string) => {
      setIsAnalyzing(true);
      try {
        const res = await fetch('/api/analyze-bottle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64, perfumeName, brandName }),
        });
        const data = await res.json();
        if (data.description) {
          setBottleDesc(data.description);
          onImageChange(base64, data.description);
        } else {
          onImageChange(base64);
        }
      } catch {
        onImageChange(base64);
      } finally {
        setIsAnalyzing(false);
      }
    },
    [onImageChange, perfumeName, brandName],
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setPreview(base64);
        setBottleDesc(null);
        analyzeBottle(base64);
      };
      reader.readAsDataURL(file);
    },
    [analyzeBottle],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10 MB
  });

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    setBottleDesc(null);
    onImageChange(null);
  };

  return (
    <div className="space-y-3">
      <p className="section-label">صورة العطر المرجعية</p>

      {preview ? (
        <div className="relative group rounded-2xl overflow-hidden border border-[var(--obsidian-border)] bg-[var(--obsidian-card)]">
          {/* Image preview */}
          <div className="relative h-48 w-full">
            <Image src={preview} alt="Perfume bottle" fill className="object-contain p-4" />
          </div>

          {/* Clear button */}
          <button
            onClick={handleClear}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 border border-white/10
                       flex items-center justify-center text-white/70 hover:text-white hover:bg-black/90
                       transition-all z-10"
          >
            <X size={14} />
          </button>

          {/* Analysis status */}
          <div className="px-4 pb-4">
            {isAnalyzing && (
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <Loader2 size={12} className="animate-spin text-[var(--gold)]" />
                <span>Claude يحلّل الزجاجة...</span>
              </div>
            )}
            {bottleDesc && !isAnalyzing && (
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-[var(--gold)]">
                  ✓ تم تحليل الزجاجة بنجاح
                </p>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed line-clamp-2">
                  {bottleDesc}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`drop-zone p-8 text-center ${isDragActive ? 'active' : ''}`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-3 pointer-events-none">
            <div className="w-14 h-14 rounded-2xl bg-[var(--gold-muted)] flex items-center justify-center">
              {isDragActive ? (
                <ImageIcon size={24} className="text-[var(--gold)]" />
              ) : (
                <Upload size={24} className="text-[var(--gold)]" />
              )}
            </div>
            <div>
              <p className="text-sm text-[var(--text-primary)] font-medium">
                {isDragActive ? 'أفلت الصورة هنا' : 'ارفع صورة العطر'}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                JPG, PNG, WEBP — حتى 10 MB
              </p>
            </div>
            <p className="text-[10px] text-[var(--gold)] tracking-wide">
              سيحلّل Claude الزجاجة تلقائيًا لضمان دقة الصورة
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
