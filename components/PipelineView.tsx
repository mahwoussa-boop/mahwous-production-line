'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Sparkles, Loader2, Upload, X, Link2, Zap,
  FileCheck, Image as ImageIcon, Video, Settings2,
} from 'lucide-react';
import type { PerfumeData, PlatformCaptions, VideoPlatformCaptions, HedraVideoInfo, GeneratedImage } from '@/lib/types';
import type {
  PipelineState, PipelineStep, PipelineMode,
  ABTestResult, DistributionPackage, MontageResult,
  PipelineEvent,
} from '@/lib/pipeline/pipelineTypes';
import PipelineProgress from './PipelineProgress';
import DraftReview from './DraftReview';
import PipelineDashboard from './PipelineDashboard';

type PipelineViewStep = 'input' | 'running' | 'draft_review' | 'output';

export default function PipelineView() {
  // ── Input State ──────────────────────────────────────────────
  const [productUrl, setProductUrl] = useState('');
  const [bottleImageBase64, setBottleImageBase64] = useState('');
  const [bottleImagePreview, setBottleImagePreview] = useState('');
  const [faceRefBase64, setFaceRefBase64] = useState('');
  const [faceRefPreview, setFaceRefPreview] = useState('');
  const [pipelineMode, setPipelineMode] = useState<PipelineMode>('draft');

  // ── Pipeline State ───────────────────────────────────────────
  const [viewStep, setViewStep] = useState<PipelineViewStep>('input');
  const [pipelineId, setPipelineId] = useState<string | null>(null);
  const [steps, setSteps] = useState<PipelineStep[]>([]);
  const [events, setEvents] = useState<PipelineEvent[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  // ── Asset State ──────────────────────────────────────────────
  const [perfumeData, setPerfumeData] = useState<PerfumeData | null>(null);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [videos, setVideos] = useState<HedraVideoInfo[]>([]);
  const [captions, setCaptions] = useState<PlatformCaptions | null>(null);
  const [videoCaptions, setVideoCaptions] = useState<VideoPlatformCaptions | null>(null);
  const [abTests, setABTests] = useState<ABTestResult[]>([]);
  const [distributionPackages, setDistributionPackages] = useState<DistributionPackage[]>([]);
  const [montages, setMontages] = useState<MontageResult[]>([]);

  // ── Cost State ───────────────────────────────────────────────
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [actualCost, setActualCost] = useState(0);

  // ── Image Upload Handlers ────────────────────────────────────
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'bottle' | 'face') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('يرجى اختيار ملف صورة صالح'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('حجم الصورة يجب أن يكون أقل من 10 ميجابايت'); return; }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (type === 'bottle') {
        setBottleImageBase64(base64);
        setBottleImagePreview(base64);
      } else {
        setFaceRefBase64(base64);
        setFaceRefPreview(base64);
      }
      toast.success(type === 'bottle' ? 'تم رفع صورة المنتج' : 'تم رفع صورة الشخصية المرجعية');
    };
    reader.readAsDataURL(file);
  };

  // ── Execute Pipeline ─────────────────────────────────────────
  const handleExecutePipeline = useCallback(async () => {
    if (!productUrl.trim()) {
      toast.error('الرجاء إدخال رابط المنتج أولاً');
      return;
    }

    setIsRunning(true);
    setViewStep('running');
    setSteps([]);
    setEvents([]);

    try {
      const response = await fetch('/api/pipeline/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productUrl: productUrl.trim(),
          mode: pipelineMode,
          bottleImageBase64: bottleImageBase64 || undefined,
          faceReferenceImageBase64: faceRefBase64 || undefined,
          contentStrategy: {
            enableABTesting: true,
          },
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'فشل تنفيذ خط الإنتاج');
      }

      const data = await response.json();

      setPipelineId(data.pipelineId);
      setSteps(data.steps || []);
      setEvents(data.events || []);
      setPerfumeData(data.perfumeData || null);
      setEstimatedCost(data.costs?.estimated || 0);
      setActualCost(data.costs?.actual || 0);

      // Set assets
      if (data.assets) {
        setImages(data.assets.images || []);
        setVideos(data.assets.videos || []);
        setCaptions(data.assets.captions || null);
        setVideoCaptions(data.assets.videoCaptions || null);
        setABTests(data.assets.abTests || []);
        setDistributionPackages(data.assets.distributionPackages || []);
        setMontages(data.assets.montages || []);
      }

      // Determine next view
      if (data.status === 'paused' && data.mode === 'draft') {
        setViewStep('draft_review');
        toast.success('المسودة جاهزة للمراجعة!');
      } else if (data.status === 'completed') {
        setViewStep('output');
        toast.success('خط الإنتاج اكتمل بنجاح!');
      } else if (data.status === 'failed') {
        toast.error('فشل خط الإنتاج — يمكنك المحاولة مرة أخرى');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'حدث خطأ غير متوقع');
      setViewStep('input');
    } finally {
      setIsRunning(false);
    }
  }, [productUrl, pipelineMode, bottleImageBase64, faceRefBase64]);

  // ── Approve Draft ────────────────────────────────────────────
  const handleApproveDraft = useCallback(async () => {
    setIsApproving(true);
    setViewStep('running');

    try {
      // Re-run pipeline in production mode
      const response = await fetch('/api/pipeline/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productUrl: productUrl.trim(),
          mode: 'production',
          bottleImageBase64: bottleImageBase64 || undefined,
          faceReferenceImageBase64: faceRefBase64 || undefined,
          contentStrategy: { enableABTesting: true },
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'فشل توليد الوسائط');
      }

      const data = await response.json();
      setSteps(data.steps || []);
      setEvents(data.events || []);
      setEstimatedCost(data.costs?.estimated || 0);
      setActualCost(data.costs?.actual || 0);

      if (data.assets) {
        setImages(data.assets.images || []);
        setVideos(data.assets.videos || []);
        setCaptions(data.assets.captions || null);
        setVideoCaptions(data.assets.videoCaptions || null);
        setABTests(data.assets.abTests || []);
        setDistributionPackages(data.assets.distributionPackages || []);
      }

      setViewStep('output');
      toast.success('تم توليد جميع الوسائط بنجاح!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'فشل التوليد');
      setViewStep('draft_review');
    } finally {
      setIsApproving(false);
    }
  }, [productUrl, bottleImageBase64, faceRefBase64]);

  // ── Reject Draft ─────────────────────────────────────────────
  const handleRejectDraft = () => {
    setViewStep('input');
    toast.info('تم رفض المسودة — يمكنك البدء من جديد');
  };

  // ── Reset ────────────────────────────────────────────────────
  const handleReset = () => {
    setViewStep('input');
    setProductUrl('');
    setBottleImageBase64('');
    setBottleImagePreview('');
    setFaceRefBase64('');
    setFaceRefPreview('');
    setPerfumeData(null);
    setImages([]);
    setVideos([]);
    setCaptions(null);
    setVideoCaptions(null);
    setABTests([]);
    setDistributionPackages([]);
    setMontages([]);
    setSteps([]);
    setEvents([]);
    setPipelineId(null);
    setEstimatedCost(0);
    setActualCost(0);
  };

  // ── Schedule All ─────────────────────────────────────────────
  const handleScheduleAll = () => {
    toast.info('جاري جدولة النشر عبر Metricool...');
    // Will integrate with existing SmartPublishButton
  };

  const handleDownloadBundle = () => {
    toast.info('جاري تحميل حزمة الملفات...');
    // Will integrate with zipBundler
  };

  return (
    <div className="space-y-6">
      {/* ══════════════════════════════════════════════════════════
           INPUT VIEW — واجهة النقرة الواحدة
           ══════════════════════════════════════════════════════════ */}
      {viewStep === 'input' && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Zap size={28} className="text-[var(--gold)]" />
            </div>
            <h2 className="text-3xl font-bold text-[var(--gold)]">محرك المحتوى الآلي</h2>
            <p className="text-[var(--text-secondary)] max-w-lg">
              أدخل رابط العطر فقط — سيقوم المحرك بتوليد صور وفيديوهات ونصوص مخصصة لكل منصة تلقائياً.
            </p>
          </div>

          <div className="w-full max-w-lg space-y-4">
            {/* URL Input */}
            <div className="relative">
              <Link2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="url"
                className="luxury-input pr-10 text-sm w-full"
                placeholder="https://mahwous.com/products/..."
                value={productUrl}
                onChange={(e) => setProductUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleExecutePipeline()}
                dir="ltr"
              />
            </div>

            {/* Mode Selection */}
            <div className="flex gap-2 p-1 bg-[var(--obsidian-light)] rounded-xl">
              <button
                onClick={() => setPipelineMode('draft')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  pipelineMode === 'draft'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <FileCheck size={14} />
                وضع المسودة (موفّر للتكاليف)
              </button>
              <button
                onClick={() => setPipelineMode('production')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  pipelineMode === 'production'
                    ? 'bg-[var(--gold)]/20 text-[var(--gold)] border border-[var(--gold)]/30'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Sparkles size={14} />
                توليد كامل مباشر
              </button>
            </div>

            {/* Optional Uploads */}
            <div className="grid grid-cols-2 gap-3">
              {/* Bottle Image */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                  <Upload size={10} /> صورة المنتج (اختياري)
                </span>
                {!bottleImagePreview ? (
                  <label className="flex flex-col items-center justify-center h-20 border border-dashed border-[var(--obsidian-border)] rounded-lg cursor-pointer hover:border-[var(--gold)] transition-all group">
                    <Upload size={16} className="text-[var(--text-muted)] group-hover:text-[var(--gold)]" />
                    <span className="text-[9px] text-[var(--text-muted)] mt-1">زجاجة العطر</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'bottle')} />
                  </label>
                ) : (
                  <div className="relative h-20 rounded-lg border border-[var(--gold)] overflow-hidden">
                    <img src={bottleImagePreview} alt="" className="w-full h-full object-contain bg-white/5" />
                    <button onClick={() => { setBottleImageBase64(''); setBottleImagePreview(''); }} className="absolute top-1 left-1 w-5 h-5 rounded-full bg-red-500/80 flex items-center justify-center">
                      <X size={10} className="text-white" />
                    </button>
                  </div>
                )}
              </div>

              {/* Face Reference */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                  <Upload size={10} /> صورة الشخصية (اختياري)
                </span>
                {!faceRefPreview ? (
                  <label className="flex flex-col items-center justify-center h-20 border border-dashed border-[var(--obsidian-border)] rounded-lg cursor-pointer hover:border-[var(--gold)] transition-all group">
                    <Upload size={16} className="text-[var(--text-muted)] group-hover:text-[var(--gold)]" />
                    <span className="text-[9px] text-[var(--text-muted)] mt-1">ثبات الملامح</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'face')} />
                  </label>
                ) : (
                  <div className="relative h-20 rounded-lg border border-[var(--gold)] overflow-hidden">
                    <img src={faceRefPreview} alt="" className="w-full h-full object-contain bg-white/5" />
                    <button onClick={() => { setFaceRefBase64(''); setFaceRefPreview(''); }} className="absolute top-1 left-1 w-5 h-5 rounded-full bg-red-500/80 flex items-center justify-center">
                      <X size={10} className="text-white" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Execute Button */}
            <button
              onClick={handleExecutePipeline}
              disabled={!productUrl.trim() || isRunning}
              className="btn-gold w-full py-3.5 text-sm flex items-center justify-center gap-2 rounded-xl disabled:opacity-40"
            >
              <Sparkles size={16} />
              {pipelineMode === 'draft' ? 'توليد المسودة (مجاني)' : 'بدء خط الإنتاج الكامل'}
            </button>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-2 text-xs text-[var(--text-muted)]">
            {[
              'صور لكل المنصات',
              'فيديو بصوت عربي',
              'مونتاج آلي',
              'كابشنات A/B',
              'نشر ذكي',
              'وضع مسودة',
            ].map(f => (
              <span key={f} className="px-3 py-1 rounded-full border border-[var(--obsidian-border)] bg-[var(--obsidian-light)]">{f}</span>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
           RUNNING VIEW — تقدم خط الإنتاج
           ══════════════════════════════════════════════════════════ */}
      {viewStep === 'running' && (
        <div className="space-y-6">
          <div className="text-center space-y-4">
            <div className="relative inline-block">
              <div className="w-16 h-16 rounded-full border-2 border-[var(--gold)] border-t-transparent animate-spin" />
              <Sparkles size={20} className="absolute inset-0 m-auto text-[var(--gold)]" />
            </div>
            <div>
              <p className="text-lg font-bold text-[var(--text-primary)]">
                {isApproving ? 'جاري توليد الوسائط...' : 'جاري تنفيذ خط الإنتاج...'}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {pipelineMode === 'draft' ? 'وضع المسودة — النصوص فقط' : 'الوضع الكامل — صور + صوت + فيديو'}
              </p>
            </div>
          </div>

          {steps.length > 0 && (
            <PipelineProgress
              steps={steps}
              totalEstimatedCost={estimatedCost}
              totalActualCost={actualCost}
            />
          )}

          {/* Events Log */}
          {events.length > 0 && (
            <div className="glass-card p-4">
              <h4 className="text-xs font-bold text-[var(--text-muted)] mb-2">سجل الأحداث</h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {events.slice(-10).map((event, i) => (
                  <div key={i} className="flex items-center gap-2 text-[10px]">
                    <span className="text-[var(--text-muted)] font-mono shrink-0">
                      {new Date(event.timestamp).toLocaleTimeString('ar-SA')}
                    </span>
                    <span className={
                      event.type === 'step_completed' ? 'text-green-400' :
                      event.type === 'step_failed' ? 'text-red-400' :
                      'text-[var(--text-secondary)]'
                    }>
                      {event.messageAr}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
           DRAFT REVIEW VIEW — مراجعة المسودة
           ══════════════════════════════════════════════════════════ */}
      {viewStep === 'draft_review' && (
        <div className="space-y-6 animate-fade-in-up">
          {/* Perfume Info */}
          {perfumeData && (
            <div className="glass-card p-4 flex items-center gap-4">
              {perfumeData.imageUrl && (
                <img src={perfumeData.imageUrl} alt={perfumeData.name} className="w-14 h-14 object-contain rounded-lg bg-black/20" />
              )}
              <div className="flex-1">
                <p className="font-semibold text-[var(--text-primary)]">{perfumeData.name}</p>
                <p className="text-sm text-[var(--text-muted)]">{perfumeData.brand}</p>
                {perfumeData.price && <p className="text-xs text-[var(--gold)]">{perfumeData.price}</p>}
              </div>
            </div>
          )}

          <DraftReview
            captions={captions}
            videoCaptions={videoCaptions}
            abTestResults={abTests}
            estimatedCost={estimatedCost}
            onApprove={handleApproveDraft}
            onReject={handleRejectDraft}
            isApproving={isApproving}
          />

          {steps.length > 0 && (
            <PipelineProgress steps={steps} totalEstimatedCost={estimatedCost} totalActualCost={actualCost} />
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
           OUTPUT VIEW — لوحة المراجعة النهائية
           ══════════════════════════════════════════════════════════ */}
      {viewStep === 'output' && (
        <div className="space-y-6 animate-fade-in-up">
          {/* Perfume Info */}
          {perfumeData && (
            <div className="glass-card p-4 flex items-center gap-4">
              {perfumeData.imageUrl && (
                <img src={perfumeData.imageUrl} alt={perfumeData.name} className="w-14 h-14 object-contain rounded-lg bg-black/20" />
              )}
              <div className="flex-1">
                <p className="font-semibold text-[var(--text-primary)]">{perfumeData.name}</p>
                <p className="text-sm text-[var(--text-muted)]">{perfumeData.brand}</p>
              </div>
              <button
                onClick={handleReset}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors"
              >
                حملة جديدة
              </button>
            </div>
          )}

          {/* Pipeline Progress */}
          {steps.length > 0 && (
            <PipelineProgress steps={steps} totalEstimatedCost={estimatedCost} totalActualCost={actualCost} />
          )}

          {/* Dashboard */}
          <PipelineDashboard
            perfumeName={perfumeData?.name || ''}
            perfumeBrand={perfumeData?.brand || ''}
            images={images}
            videos={videos}
            captions={captions}
            videoCaptions={videoCaptions}
            montages={montages}
            abTests={abTests}
            distributionPackages={distributionPackages}
            onScheduleAll={handleScheduleAll}
            onDownloadBundle={handleDownloadBundle}
          />
        </div>
      )}
    </div>
  );
}
