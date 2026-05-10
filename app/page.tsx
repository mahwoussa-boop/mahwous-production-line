'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Toaster, toast } from 'sonner';

// ─── Types ──────────────────────────────────────────────────────────────────

interface PerfumeData {
  name: string;
  brand: string;
  gender?: 'men' | 'women' | 'unisex';
  notes?: string;
  description?: string;
  imageUrl?: string;
  price?: string;
}

interface GeneratedImage {
  format: 'story' | 'post' | 'landscape';
  label: string;
  aspectRatio: string;
  url: string;
  dimensions: { width: number; height: number };
}

interface VideoInfo {
  id: string;
  operationName?: string;  // Veo 3 operation name
  aspectRatio: '9:16' | '16:9';
  status: string;
  videoUrl?: string | null;
  progress?: number;
  eta_sec?: number;
  error?: string;
  voiceoverText?: string;
  scenarioName?: string;
  hook?: string;
  visualFx?: string;
  soundFx?: string;
  engine?: string;
}

interface PlatformCaption {
  platform: string;
  label: string;
  caption: string;
  imageFormat: 'story' | 'post' | 'landscape';
  videoAspect?: '9:16' | '16:9';
  hasMetricool: boolean;
  icon: string;
  color: string;
}

type Step = 'input' | 'generating' | 'output';
type OutputTab = 'content' | 'manual' | 'publish';

// ─── Platform Config ────────────────────────────────────────────────────────

const METRICOOL_PLATFORMS = [
  'facebook', 'instagram', 'threads', 'linkedin', 'pinterest', 'twitter', 'tiktok', 'youtube'
];

const MANUAL_PLATFORMS = [
  { key: 'whatsapp', label: 'واتساب', icon: '💬', color: 'green' },
  { key: 'haraj', label: 'حراج', icon: '🏷️', color: 'yellow' },
  { key: 'telegram', label: 'تلقرام', icon: '✈️', color: 'blue' },
  { key: 'snapchat', label: 'سناب شات', icon: '👻', color: 'yellow' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP — Mahwous Production Line v3.0
// ═══════════════════════════════════════════════════════════════════════════════
export default function HomePage() {
  const [step, setStep] = useState<Step>('input');
  const [productUrl, setProductUrl] = useState('');
  const [loadingStatus, setLoadingStatus] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [outputTab, setOutputTab] = useState<OutputTab>('content');

  // Product data
  const [perfumeData, setPerfumeData] = useState<PerfumeData | null>(null);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [captions, setCaptions] = useState<Record<string, string>>({});
  const [videoCaptions, setVideoCaptions] = useState<Record<string, string>>({});
  const [videos, setVideos] = useState<VideoInfo[]>([]);
  const [voiceoverText, setVoiceoverText] = useState('');
  const [vibe, setVibe] = useState('');
  const [scenarioType, setScenarioType] = useState<string>('classic_mahwous');

  // Image uploads
  const [bottlePreview, setBottlePreview] = useState('');
  const [bottleBase64, setBottleBase64] = useState('');
  const [charPreview, setCharPreview] = useState('');
  const [charBase64, setCharBase64] = useState('');
  const bottleRef = useRef<HTMLInputElement>(null);
  // Bottle analysis state
  const [bottleAnalysis, setBottleAnalysis] = useState<any>(null);
  const [analyzingBottle, setAnalyzingBottle] = useState(false);
  const [bottleAnalysisError, setBottleAnalysisError] = useState('');
  const charRef = useRef<HTMLInputElement>(null);

  // Manual product input fallback (when scraper fails)
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualBrand, setManualBrand] = useState('');
  const [manualPrice, setManualPrice] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  // Metricool
  const [metricoolOk, setMetricoolOk] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishResults, setPublishResults] = useState<any>(null);

  // Video polling
  const [polling, setPolling] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const videosRef = useRef<VideoInfo[]>([]);

  // Video confirmation state — videos are NOT generated automatically
  const [videoConfirmed, setVideoConfirmed] = useState(false);
  const [pendingVideoData, setPendingVideoData] = useState<{ pd: PerfumeData; v: string; att: string; storyUrl?: string; landUrl?: string } | null>(null);
  const [generatingVideo, setGeneratingVideo] = useState(false);

  // Check Metricool
  useEffect(() => {
    fetch('/api/metricool/config').then(r => r.json()).then(d => setMetricoolOk(d.connected === true)).catch(() => {});
  }, []);

  // Sync ref
  useEffect(() => { videosRef.current = videos; }, [videos]);

  // ── Image upload handler ────────────────────────────────────────────────
  const onUpload = (type: 'bottle' | 'char', e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) { toast.error('ملف غير صالح'); return; }
    if (f.size > 10 * 1024 * 1024) { toast.error('الحجم أكبر من 10MB'); return; }
    const r = new FileReader();
    r.onload = async (ev) => {
      const b64 = ev.target?.result as string;
      if (type === 'bottle') {
        setBottleBase64(b64);
        setBottlePreview(b64);
        // تحليل الزجاجة تلقائياً بعد رفعها
        setBottleAnalysis(null);
        setBottleAnalysisError('');
        setAnalyzingBottle(true);
        try {
          const ar = await fetch('/api/analyze-bottle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: b64 }),
          });
          if (ar.ok) {
            const ad = await ar.json();
            setBottleAnalysis(ad.analysis || null);
          } else {
            setBottleAnalysisError('فشل تحليل الزجاجة');
          }
        } catch {
          setBottleAnalysisError('خطأ في تحليل الزجاجة');
        } finally {
          setAnalyzingBottle(false);
        }
      } else {
        setCharBase64(b64);
        setCharPreview(b64);
      }
    };
    r.readAsDataURL(f);
  };

  const removeImg = (type: 'bottle' | 'char') => {
    if (type === 'bottle') { setBottleBase64(''); setBottlePreview(''); setBottleAnalysis(null); setBottleAnalysisError(''); if (bottleRef.current) bottleRef.current.value = ''; }
    else { setCharBase64(''); setCharPreview(''); if (charRef.current) charRef.current.value = ''; }
  };

  // ── Video Polling ───────────────────────────────────────────────────────
  const pollVideos = useCallback(async () => {
    const pending = videosRef.current.filter(v => v.id && ['pending', 'processing', 'queued', 'finalizing'].includes(v.status));
    if (!pending.length) {
      setPolling(false);
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      return;
    }
    try {
      const res = await fetch('/api/poll-video', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videos: pending.map(v => ({ id: v.operationName || v.id, operationName: v.operationName || v.id, aspectRatio: v.aspectRatio })) }),
      });
      if (!res.ok) return;
      const data = await res.json();
      const pollResults = data.videos || data.results || [];
      setVideos(prev => {
        const u = [...prev];
        for (const r of pollResults) {
          const i = u.findIndex(v => v.aspectRatio === r.aspectRatio);
          if (i !== -1) u[i] = { ...u[i], status: r.status, videoUrl: r.videoUrl || u[i].videoUrl, progress: r.progress ?? u[i].progress, eta_sec: r.eta_sec, error: r.error };
        }
        return u;
      });
      const allDone = pollResults.every((r: any) => ['complete', 'failed', 'error'].includes(r.status));
      if (allDone && pollResults.length > 0) {
        setPolling(false);
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
        const anyComplete = pollResults.some((r: any) => r.status === 'complete');
        if (anyComplete) toast.success('اكتملت الفيديوهات! 🎬');
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!polling) return;
    if (pollRef.current) clearInterval(pollRef.current);
    const t = setTimeout(() => pollVideos(), 8000);
    pollRef.current = setInterval(() => pollVideos(), 12000);
    return () => { clearTimeout(t); if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
  }, [polling, pollVideos]);

  // ═══════════════════════════════════════════════════════════════════════════
  // START PRODUCTION — the main pipeline
  // ═══════════════════════════════════════════════════════════════════════════
  // ── Start with manual data (when scraper fails) ──
  const handleStartWithManualData = async () => {
    if (!manualName.trim()) { toast.error('أدخل اسم العطر'); return; }
    setShowManualInput(false);
    const pd: PerfumeData = {
      name: manualName.trim(),
      brand: manualBrand.trim() || 'مهووس',
      gender: 'unisex',
      price: manualPrice.trim() || undefined,
      notes: manualNotes.trim() || undefined,
    };
    await runProductionPipeline(pd);
  };

  const handleStartProduction = async () => {
    if (!productUrl.trim()) { toast.error('أدخل رابط المنتج'); return; }
    setStep('generating'); setLoadingProgress(0);

    try {
      // ── Step 1: Scrape product data ──
      setLoadingStatus('جاري استخراج بيانات المنتج...'); setLoadingProgress(5);
      let pd: PerfumeData;
      let v = 'oriental_palace';
      let att = 'saudi_bisht';

      try {
        const scrapeRes = await fetch('/api/scrape', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: productUrl.trim() }),
        });
        if (!scrapeRes.ok) {
          const errData = await scrapeRes.json();
          throw new Error(errData.error || 'فشل استخراج البيانات');
        }
        const sd = await scrapeRes.json();
        pd = {
          name: sd.product.name ?? '', brand: sd.product.brand ?? '',
          gender: sd.product.gender ?? 'unisex', notes: sd.product.notes,
          description: sd.product.description, imageUrl: sd.product.imageUrl, price: sd.product.price,
        };
        v = sd.recommendation?.vibe || 'oriental_palace';
        att = sd.recommendation?.attire || 'saudi_bisht';
      } catch (scrapeErr: any) {
        // Scraper failed — show manual input form
        console.warn('[page] Scraper failed:', scrapeErr.message);
        setStep('input');
        setShowManualInput(true);
        toast.error('تعذّر استخراج بيانات المنتج تلقائياً — أدخل البيانات يدوياً');
        return;
      }

      setPerfumeData(pd);
      setVibe(v);
      await runProductionPipeline(pd, v, att);
    } catch (e: any) {
      toast.error(e?.message || 'خطأ غير متوقع');
      setStep('input');
    }
  };

  const runProductionPipeline = async (pd: PerfumeData, v = 'oriental_palace', att = 'saudi_bisht') => {
    setStep('generating'); setLoadingProgress(10);
    setPerfumeData(pd); setVibe(v);

    try {

      // ── Step 2: Generate 3 images (story + post + landscape) ──
      setLoadingStatus('جاري توليد 3 صور سينمائية...'); setLoadingProgress(15);
      const genRes = await fetch('/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          perfumeData: pd, vibe: v, attire: att,
          // صورة المنتج تُسحب تلقائياً من الرابط — لا حاجة لرفع يدوي
          productImageUrl: pd.imageUrl || undefined,
          bottleAnalysis: bottleAnalysis || undefined,
        }),
      });
      if (!genRes.ok) throw new Error((await genRes.json()).error || 'فشل توليد الصور');
      const gd = await genRes.json();

      let done: GeneratedImage[] = [];
      if (gd.status === 'completed' && gd.images) {
        done = gd.images.map((i: any) => ({ format: i.format, label: i.label, dimensions: i.dimensions, url: i.url, aspectRatio: i.aspectRatio }));
      } else if (gd.pendingImages) {
        let pend = gd.pendingImages;
        for (let c = 0; c < 60 && pend?.length; c++) {
          setLoadingStatus(`جاري توليد الصور... (${c * 3}ث)`); setLoadingProgress(15 + Math.min(c, 30));
          await new Promise(r => setTimeout(r, 3000));
          const pr = await fetch('/api/poll-status', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pendingImages: pend }),
          });
          if (!pr.ok) continue;
          const pp = await pr.json();
          for (const r of pp.results) {
            if (r.status === 'COMPLETED' && r.imageUrl) {
              const f = r.format as 'story' | 'post' | 'landscape';
              done.push({ format: f, label: r.label, dimensions: r.dimensions, url: r.imageUrl, aspectRatio: f === 'story' ? '9:16' : f === 'post' ? '1:1' : '16:9' });
            }
          }
          pend = pp.results.filter((r: any) => r.status !== 'COMPLETED' && r.status !== 'FAILED');
          if (pp.allCompleted) break;
        }
      }
      if (!done.length) throw new Error('فشل توليد الصور');
      setImages(done);

      // ── Step 3: Generate captions for all platforms ──
      setLoadingStatus('جاري كتابة كابشنات لكل المنصات...'); setLoadingProgress(55);
      try {
        const cr = await fetch('/api/captions', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ perfumeData: pd, vibe: v, attire: att, productUrl: productUrl.trim() }),
        });
        if (cr.ok) { const cd = await cr.json(); setCaptions(cd.captions || {}); }
      } catch {}

      // ── Show results immediately ──
      setStep('output'); setOutputTab('content');
      toast.success('حملتك جاهزة! راجع الصور ثم اضغط على “توليد الفيديو” عند التأكد من الصور');

      // ── Step 4: Save video data for manual confirmation ──
      // Videos are NOT generated automatically — user must confirm after reviewing images
      const storyUrl = done.find(i => i.format === 'story')?.url;
      const landUrl = done.find(i => i.format === 'landscape')?.url;
      setPendingVideoData({ pd, v, att, storyUrl, landUrl });
      setVideoConfirmed(false);
    } catch (e: any) {
      toast.error(e?.message || 'خطأ غير متوقع');
      setStep('input');
    }
  };

  // ── Actions ─────────────────────────────────────────────────────────────
  const reset = () => {
    setStep('input'); setProductUrl(''); setPerfumeData(null); setImages([]);
    setCaptions({}); setVideoCaptions({}); setVideos([]); setVoiceoverText('');
    setOutputTab('content'); setLoadingStatus(''); setLoadingProgress(0);
    setBottleBase64(''); setBottlePreview(''); setCharBase64(''); setCharPreview(''); setBottleAnalysis(null); setBottleAnalysisError('');
    setPolling(false); setVibe(''); setPublishing(false); setPublishResults(null);
    setVideoConfirmed(false); setPendingVideoData(null); setGeneratingVideo(false);
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (bottleRef.current) bottleRef.current.value = '';
    if (charRef.current) charRef.current.value = '';
  };

  // ── Generate Video (manual — called after user confirms images) ──
  const handleGenerateVideo = async () => {
    if (!pendingVideoData || generatingVideo) return;
    const { pd, v, att, storyUrl, landUrl } = pendingVideoData;
    if (!storyUrl && !landUrl) { toast.error('لا توجد صور لتوليد الفيديو'); return; }

    setGeneratingVideo(true);
    setVideoConfirmed(true);
    setVideos([
      { id: '', aspectRatio: '9:16', status: 'pending', progress: 0 },
      { id: '', aspectRatio: '16:9', status: 'pending', progress: 0 },
    ]);
    toast.info('جاري توليد الفيديوهات...');

    try {
      // Try Veo 3 first
      let videoEndpoint = '/api/generate-video-veo';
      let vr = await fetch(videoEndpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          perfumeData: pd, imageUrl: storyUrl || landUrl,
          landscapeImageUrl: landUrl || storyUrl, vibe: v, videoEngine: 'auto',
          bottleAnalysis: bottleAnalysis || undefined,
          scenarioType: scenarioType || 'classic_mahwous',
        }),
      });

      // Fallback to Hedra
      if (!vr.ok) {
        videoEndpoint = '/api/generate-video';
        vr = await fetch(videoEndpoint, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            perfumeData: pd, imageUrl: storyUrl || landUrl,
            landscapeImageUrl: landUrl || storyUrl, vibe: v,
            bottleAnalysis: bottleAnalysis || undefined,
          }),
        });
      }

      if (vr.ok) {
        const vd = await vr.json();
        setVoiceoverText(vd.voiceoverText || '');
        const nv: VideoInfo[] = vd.videos.map((x: any) => ({
          id: x.operationName || x.id || '',
          operationName: x.operationName || x.id || '',
          aspectRatio: x.aspectRatio,
          status: x.status === 'completed' ? 'complete' : (x.status || 'queued'),
          progress: x.status === 'completed' ? 100 : 0,
          error: x.error,
          voiceoverText: x.voiceoverText,
          scenarioName: x.scenarioName, hook: x.hook,
          visualFx: x.visualFx, soundFx: x.soundFx, engine: x.engine || 'veo3',
          videoUrl: x.videoUrl || undefined,
        }));
        setVideos(nv); videosRef.current = nv;
        const needsPolling = nv.some(x => x.id && !['complete', 'failed', 'error'].includes(x.status));
        if (needsPolling) {
          setPolling(true);
        } else {
          const anyComplete = nv.some(x => x.status === 'complete' && x.videoUrl);
          if (anyComplete) toast.success('اكتملت الفيديوهات! 🎬');
        }
        // Video captions
        try {
          const vc = await fetch('/api/video-captions', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ perfumeData: pd, productUrl: productUrl.trim(), vibe: v }),
          });
          if (vc.ok) { const vcd = await vc.json(); setVideoCaptions(vcd.captions || {}); }
        } catch {}
      } else {
        toast.error('فشل توليد الفيديو');
        setVideos([]);
      }
    } catch {
      toast.error('خطأ في توليد الفيديو');
      setVideos([]);
    } finally {
      setGeneratingVideo(false);
    }
  };

  // ── Publish Now via Metricool ──
  const handlePublishNow = async () => {
    if (!perfumeData || !metricoolOk) return;
    setPublishing(true);
    try {
      toast.info('جاري النشر على جميع المنصات...');
      const res = await fetch('/api/metricool/smart-publish', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          perfumeName: perfumeData.name, perfumeBrand: perfumeData.brand, productUrl,
          captions, videoCaptions,
          imageUrls: {
            story: images.find(i => i.format === 'story')?.url,
            post: images.find(i => i.format === 'post')?.url,
            landscape: images.find(i => i.format === 'landscape')?.url,
          },
          videoUrls: {
            vertical: videos.find(v => v.aspectRatio === '9:16' && v.videoUrl)?.videoUrl,
            horizontal: videos.find(v => v.aspectRatio === '16:9' && v.videoUrl)?.videoUrl,
          },
        }),
      });
      const data = await res.json();
      setPublishResults(data);
      if (data.success) toast.success(`تم نشر ${data.summary?.totalScheduled || 0} منشور بنجاح!`);
      else toast.error(data.error || 'فشل النشر');
    } catch { toast.error('خطأ في النشر'); }
    setPublishing(false);
  };

  // ── Download CSV for Metricool ──
  const handleDownloadCSV = async () => {
    if (!perfumeData) return;
    try {
      toast.info('جاري تجهيز ملف CSV...');
      const allCaptions = { ...captions, ...videoCaptions };
      const res = await fetch('/api/export-csv', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          perfumeName: perfumeData.name, perfumeBrand: perfumeData.brand, productUrl,
          captions: allCaptions,
          imageUrls: {
            story: images.find(i => i.format === 'story')?.url,
            post: images.find(i => i.format === 'post')?.url,
            landscape: images.find(i => i.format === 'landscape')?.url,
          },
          videoUrls: {
            vertical: videos.find(v => v.aspectRatio === '9:16' && v.videoUrl)?.videoUrl,
            horizontal: videos.find(v => v.aspectRatio === '16:9' && v.videoUrl)?.videoUrl,
          },
        }),
      });
      if (!res.ok) throw new Error('فشل التصدير');
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${perfumeData.name.replace(/\s+/g, '_')}_campaign.csv`;
      a.click(); URL.revokeObjectURL(a.href);
      toast.success('تم تحميل ملف CSV');
    } catch { toast.error('فشل تحميل CSV'); }
  };

  // ── Download single image ──
  const downloadImage = (url: string, name: string) => {
    const a = document.createElement('a');
    a.href = url; a.target = '_blank'; a.download = name;
    a.click();
  };

  // ── Copy caption ──
  const copyCaption = (text: string, platform: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`تم نسخ كابشن ${platform}`);
  };

  // ── Download all captions as text ──
  const downloadAllCaptions = () => {
    if (!perfumeData) return;
    const all = { ...captions, ...videoCaptions };
    const lines = [`كابشنات حملة: ${perfumeData.name}\n${'='.repeat(50)}`];
    for (const [k, v] of Object.entries(all)) {
      if (v) lines.push(`\n[${ k.replace(/_/g, ' ').toUpperCase() }]\n${v}\n${'-'.repeat(40)}`);
    }
    const b = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(b);
    a.download = `captions-${perfumeData.name.substring(0, 20)}.txt`;
    a.click(); URL.revokeObjectURL(a.href);
  };

  const completedVids = videos.filter(v => v.status === 'complete' && v.videoUrl);
  const pendingVids = videos.filter(v => ['pending', 'processing', 'queued', 'finalizing'].includes(v.status));

  // ── Platform caption helper ──
  const getCaptionForPlatform = (platformKey: string): string => {
    const all = { ...captions, ...videoCaptions };
    // Try exact match first
    if (all[platformKey]) return all[platformKey];
    // Try partial match
    for (const [k, v] of Object.entries(all)) {
      if (k.toLowerCase().includes(platformKey.toLowerCase()) && v) return v;
    }
    return '';
  };

  const getImageForPlatform = (platformKey: string): GeneratedImage | undefined => {
    const storyPlatforms = ['instagram_story', 'snapchat', 'facebook_story', 'pinterest'];
    const postPlatforms = ['instagram_post', 'facebook_post', 'telegram', 'haraj', 'truth', 'whatsapp'];
    const landscapePlatforms = ['twitter', 'linkedin', 'youtube_thumbnail'];
    if (storyPlatforms.some(p => platformKey.includes(p))) return images.find(i => i.format === 'story');
    if (landscapePlatforms.some(p => platformKey.includes(p))) return images.find(i => i.format === 'landscape');
    return images.find(i => i.format === 'post');
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100" dir="rtl">
      <Toaster richColors position="top-center" />

      {/* ── Header ── */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5Z"/></svg>
            </div>
            <div>
              <h1 className="font-bold text-base">Mahwous Production Line</h1>
              <p className="text-[10px] text-gray-500">5 assets &rarr; 21 posts &rarr; 15+ platforms</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${metricoolOk ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className="text-[10px] text-gray-500">{metricoolOk ? 'Metricool' : 'Offline'}</span>
            </div>
            {step === 'output' && (
              <button onClick={reset} className="text-xs text-gray-400 hover:text-amber-400 transition px-3 py-1.5 rounded-lg border border-white/10 hover:border-amber-400/50">
                حملة جديدة
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">

        {/* ═══════════════════════════════════════════════════════════════════
            INPUT — 3 simple steps
            ═══════════════════════════════════════════════════════════════════ */}
        {step === 'input' && (
          <div className="flex flex-col items-center justify-center min-h-[75vh] text-center space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs font-medium">
                v3.0 — Production Line
              </div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300 bg-clip-text text-transparent">
                خط الإنتاج الكلاسيكي
              </h2>
              <p className="text-gray-400 max-w-lg mx-auto text-sm leading-relaxed">
                أدخل رابط المنتج + اختر نوع المحتوى + اضغط ابدأ — صورة المنتج تُسحب تلقائياً<br />
                <span className="text-amber-400/70">5 أصول &rarr; 21 منشور &rarr; 15+ منصة &rarr; نشر تلقائي</span>
              </p>
            </div>

            <div className="w-full max-w-xl space-y-6">
              {/* Step 1: Product URL */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                  <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center text-[10px] font-bold">1</span>
                  رابط المنتج
                </label>
                <input
                  type="url"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20 transition"
                  placeholder="https://mahwous.com/products/..."
                  value={productUrl}
                  onChange={e => setProductUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleStartProduction()}
                  dir="ltr"
                />
              </div>

              {/* Step 2: Auto Product Image Info */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-400/5 border border-blue-400/20">
                <div className="w-8 h-8 rounded-lg bg-blue-400/10 flex items-center justify-center flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                </div>
                <div className="text-right">
                  <p className="text-xs text-blue-400 font-medium">صورة المنتج تُسحب تلقائياً</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">سيتم سحب الصورة الحقيقية للمنتج من الرابط مباشرة وإدخالها في يد الشخصية بدقة 100%</p>
                </div>
              </div>

              {/* Step 2: Scenario Type Selector */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                  <span className="w-5 h-5 rounded-full bg-purple-400/20 text-purple-400 flex items-center justify-center text-[10px] font-bold">2</span>
                  نوع المحتوى
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'bottle_talks', label: '🫙 الزجاجة تتحدث', desc: 'العطر يروي قصته' },
                    { id: 'ingredients_talk', label: '🌿 المكونات تتحدث', desc: 'حوار المكونات' },
                    { id: 'bottle_vs_man', label: '🤝 مهووس والزجاجة', desc: 'حوار مع الشخصية' },
                    { id: 'brand_story', label: '📖 قصة الماركة', desc: 'تأسيس وتاريخ' },
                    { id: 'royal_history', label: '👑 تاريخ الملوك', desc: 'ملوك وأمراء' },
                    { id: 'classic_mahwous', label: '⭐ مهووس الكلاسيكي', desc: 'الأسلوب الأصلي' },
                  ].map(s => (
                    <button
                      key={s.id}
                      onClick={() => setScenarioType(s.id)}
                      className={`p-2 rounded-lg border text-right transition-all ${
                        scenarioType === s.id
                          ? 'border-purple-400 bg-purple-400/10 text-purple-300'
                          : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                      }`}
                    >
                      <div className="text-[11px] font-medium">{s.label}</div>
                      <div className="text-[9px] opacity-60 mt-0.5">{s.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Start Button */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                  <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center text-[10px] font-bold">3</span>
                  ابدأ الإنتاج
                </label>
                <button
                  onClick={handleStartProduction}
                  disabled={!productUrl.trim()}
                  className="w-full py-4 text-base font-bold rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 text-black shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-30 disabled:shadow-none disabled:hover:scale-100 flex items-center justify-center gap-3"
                >
                  ابدأ الإنتاج الآن
                </button>
              </div>

              {/* Manual Input Fallback — shown when scraper fails */}
              {showManualInput && (
                <div className="mt-4 p-4 rounded-xl border border-orange-400/30 bg-orange-400/5 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span className="text-xs text-orange-400 font-medium">أدخل بيانات المنتج يدوياً</span>
                    <button onClick={() => setShowManualInput(false)} className="mr-auto text-gray-600 hover:text-gray-400">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="اسم العطر (مطلوب) — مثال: فالنتينو بورن إن روما 100مل"
                    value={manualName}
                    onChange={e => setManualName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-3 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-amber-400/50 transition"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="الماركة — مثال: Valentino"
                      value={manualBrand}
                      onChange={e => setManualBrand(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-3 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-amber-400/50 transition"
                    />
                    <input
                      type="text"
                      placeholder="السعر — مثال: 484 ريال"
                      value={manualPrice}
                      onChange={e => setManualPrice(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-3 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-amber-400/50 transition"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="مكونات العطر (اختياري) — مثال: ورد، عنبر، فانيليا"
                    value={manualNotes}
                    onChange={e => setManualNotes(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-3 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-amber-400/50 transition"
                  />
                  <button
                    onClick={handleStartWithManualData}
                    disabled={!manualName.trim()}
                    className="w-full py-3 text-sm font-bold rounded-lg bg-orange-500 hover:bg-orange-400 text-white transition disabled:opacity-30"
                  >
                    ابدأ الإنتاج بالبيانات اليدوية
                  </button>
                </div>
              )}
            </div>

            {/* Features */}
            <div className="flex flex-wrap justify-center gap-2 text-[11px] text-gray-500">
              {['3 صور بـ 3 أحجام', '2 فيديو (Veo 3)', 'كابشنات 15 منصة', 'نشر تلقائي Metricool', 'CSV جاهز', 'تحميل يدوي'].map(f => (
                <span key={f} className="px-3 py-1.5 rounded-full border border-white/5 bg-white/[0.02]">{f}</span>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            GENERATING — progress
            ═══════════════════════════════════════════════════════════════════ */}
        {step === 'generating' && (
          <div className="flex flex-col items-center justify-center min-h-[75vh] text-center space-y-8">
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
              <div className="absolute inset-3 rounded-full border-2 border-amber-300 border-b-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
              <span className="absolute inset-0 flex items-center justify-center text-2xl animate-pulse">&#9733;</span>
            </div>
            <div>
              <p className="text-xl font-bold mb-2">جاري الإنتاج...</p>
              <p className="text-sm text-amber-400 animate-pulse">{loadingStatus}</p>
            </div>
            <div className="w-full max-w-sm">
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-700" style={{ width: `${loadingProgress}%` }} />
              </div>
              <p className="text-[10px] text-gray-600 mt-2">{loadingProgress}%</p>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            OUTPUT — Results Dashboard
            ═══════════════════════════════════════════════════════════════════ */}
        {step === 'output' && perfumeData && (
          <div className="space-y-6">

            {/* ── Product Card ── */}
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-5">
              {perfumeData.imageUrl && <img src={perfumeData.imageUrl} alt="" className="w-20 h-20 object-contain rounded-xl bg-black/30 p-1" />}
              <div className="flex-1">
                <h3 className="font-bold text-lg">{perfumeData.name}</h3>
                <p className="text-sm text-gray-500">{perfumeData.brand}</p>
                {perfumeData.price && <p className="text-sm text-amber-400 font-medium mt-1">{perfumeData.price}</p>}
              </div>
              <div className="flex flex-col items-end gap-2 text-xs">
                <span className="flex items-center gap-1.5 text-green-400">{images.length} صور</span>
                {completedVids.length > 0 && <span className="flex items-center gap-1.5 text-blue-400">{completedVids.length} فيديو</span>}
                {pendingVids.length > 0 && <span className="flex items-center gap-1.5 text-amber-400 animate-pulse">{pendingVids.length} قيد التوليد</span>}
                <span className="flex items-center gap-1.5 text-purple-400">{Object.keys(captions).length} كابشن</span>
              </div>
            </div>

            {/* ── Quick Actions ── */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: 'نشر الآن', icon: '🚀', fn: handlePublishNow, disabled: !metricoolOk || publishing, highlight: true },
                { label: 'تحميل CSV', icon: '📊', fn: handleDownloadCSV, disabled: false, highlight: false },
                { label: 'تحميل الكل', icon: '📥', fn: () => { images.forEach(i => window.open(i.url, '_blank')); completedVids.forEach(v => window.open(v.videoUrl!, '_blank')); }, disabled: false, highlight: false },
                { label: 'الكابشنات', icon: '📝', fn: downloadAllCaptions, disabled: false, highlight: false },
                { label: 'حملة جديدة', icon: '✨', fn: reset, disabled: false, highlight: false },
              ].map(a => (
                <button key={a.label} onClick={a.fn} disabled={a.disabled}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm transition ${a.highlight ? 'border-amber-400/50 bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 font-bold' : 'border-white/10 hover:border-amber-400/30 hover:bg-white/[0.02]'} disabled:opacity-30`}>
                  <span className="text-lg">{a.icon}</span>
                  {a.label}
                </button>
              ))}
            </div>

            {/* ── Tabs ── */}
            <div className="flex gap-1 p-1.5 bg-white/[0.03] rounded-xl">
              {[
                { key: 'content' as OutputTab, label: '📸 الصور والفيديو', badge: pendingVids.length > 0 },
                { key: 'manual' as OutputTab, label: '📱 نشر يدوي', badge: false },
                { key: 'publish' as OutputTab, label: '🚀 نشر تلقائي', badge: false },
              ].map(t => (
                <button key={t.key} onClick={() => setOutputTab(t.key)}
                  className={`flex-1 py-3 px-3 rounded-lg text-sm font-medium transition ${outputTab === t.key ? 'bg-amber-400 text-black' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}>
                  {t.label}
                  {t.badge && <span className="mr-1 inline-block w-2 h-2 bg-white rounded-full animate-pulse" />}
                </button>
              ))}
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                TAB: Content (صور + فيديو + كابشنات)
                ═══════════════════════════════════════════════════════════════ */}
            {outputTab === 'content' && (
              <div className="space-y-6">

                {/* ── Images Grid ── */}
                <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-amber-400">الصور ({images.length})</h3>
                    <button onClick={() => images.forEach(i => downloadImage(i.url, `${perfumeData.name}_${i.format}.png`))} className="text-xs text-gray-500 hover:text-amber-400 transition">تحميل الكل</button>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {images.map(img => (
                      <div key={img.format} className="space-y-2">
                        <div className="relative rounded-xl overflow-hidden border border-white/10 group cursor-pointer" onClick={() => window.open(img.url, '_blank')}>
                          <img src={img.url} alt={img.label} className="w-full h-48 object-cover" />
                          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                            <p className="text-xs font-medium">{img.label}</p>
                            <p className="text-[10px] text-gray-400">{img.aspectRatio}</p>
                          </div>
                        </div>
                        <button onClick={() => downloadImage(img.url, `${perfumeData.name}_${img.format}.png`)} className="w-full py-1.5 text-[11px] text-amber-400 border border-amber-400/20 rounded-lg hover:bg-amber-400/10 transition">تحميل</button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Video Section: Confirm or Show Progress ── */}
                <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-blue-400">الفيديوهات (Veo 3)</h3>
                    {pendingVids.length > 0 && (
                      <span className="flex items-center gap-1.5 text-xs text-amber-400 animate-pulse">
                        <span className="w-2 h-2 bg-amber-400 rounded-full" />
                        جاري التوليد...
                      </span>
                    )}
                  </div>

                  {/* ── Confirmation Button (shown before video generation) ── */}
                  {!videoConfirmed && !generatingVideo && videos.length === 0 && pendingVideoData && (
                    <div className="py-6 text-center space-y-4">
                      <div className="inline-flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-blue-400/10 border border-blue-400/20 flex items-center justify-center">
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="1.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-200">راجع الصور أعلاه</p>
                          <p className="text-[11px] text-gray-500 mt-1">بعد التأكد من ظهور العطر بشكل صحيح — اضغط لتوليد الفيديو</p>
                        </div>
                        <button
                          onClick={handleGenerateVideo}
                          className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                          توليد الفيديو — الصور صحيحة
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── Generating Spinner ── */}
                  {generatingVideo && videos.length === 0 && (
                    <div className="py-8 text-center space-y-3">
                      <div className="inline-block w-8 h-8 border-2 border-blue-400/50 border-t-blue-400 rounded-full animate-spin" />
                      <p className="text-sm text-gray-500">جاري بدء توليد الفيديوهات...</p>
                    </div>
                  )}

                  {/* ── Video Cards ── */}
                  {videos.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {videos.map(v => (
                        <div key={v.aspectRatio} className="p-4 rounded-xl border border-white/10 bg-white/[0.02] space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold">{v.aspectRatio === '9:16' ? '📱 عمودي' : '🖥️ أفقي'}</span>
                            <span className="text-xs text-gray-500">{v.aspectRatio === '9:16' ? 'TikTok / Reels / Stories' : 'YouTube / LinkedIn'}</span>
                          </div>

                          {/* شريط التقدم البصري */}
                          {['pending', 'processing', 'queued', 'finalizing'].includes(v.status) && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">{v.status === 'queued' ? 'في الطابور...' : v.status === 'processing' ? 'جاري المعالجة...' : v.status === 'finalizing' ? 'جاري الإنهاء...' : 'جاري التوليد...'}</span>
                                <span className="text-amber-400 font-bold">{v.progress ?? 0}%</span>
                              </div>
                              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-1000"
                                  style={{
                                    width: `${v.progress ?? 0}%`,
                                    background: 'linear-gradient(90deg, #f59e0b, #fbbf24, #f59e0b)',
                                    backgroundSize: '200% 100%',
                                    animation: 'progress-shimmer 2s infinite linear'
                                  }}
                                />
                              </div>
                              {v.eta_sec && v.eta_sec > 0 && (
                                <p className="text-[10px] text-gray-600">الوقت المتبقي: ~{v.eta_sec < 60 ? `${v.eta_sec}ث` : `${Math.ceil(v.eta_sec / 60)}د`}</p>
                              )}
                            </div>
                          )}

                          {/* فيديو جاهز */}
                          {v.videoUrl && (
                            <div className="space-y-2">
                              <video src={v.videoUrl} controls className="w-full rounded-lg" />
                              <a href={v.videoUrl} target="_blank" rel="noopener noreferrer"
                                className="block w-full py-2 text-center text-xs text-amber-400 border border-amber-400/20 rounded-lg hover:bg-amber-400/10 transition">
                                تحميل الفيديو
                              </a>
                            </div>
                          )}

                          {/* خطأ */}
                          {(v.status === 'failed' || v.status === 'error') && (
                            <p className="text-xs text-red-400 bg-red-500/5 p-2 rounded-lg">{v.error || 'فشل توليد الفيديو'}</p>
                          )}

                          {/* معلومات إضافية */}
                          {v.hook && (
                            <div className="p-2 rounded-lg bg-amber-400/5 border border-amber-400/20">
                              <p className="text-[10px] text-amber-300/70 mb-1">🎯 الهوك</p>
                              <p className="text-xs text-amber-200 font-medium italic">{v.hook}</p>
                            </div>
                          )}
                          {v.voiceoverText && (
                            <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                              <p className="text-[10px] text-gray-500 mb-1">🎤 نص الفويس أوفر</p>
                              <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-3" dir="rtl">{v.voiceoverText}</p>
                            </div>
                          )}
                          {v.scenarioName && <p className="text-[10px] text-amber-400/40">📋 {v.scenarioName}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Captions ── */}
                {Object.keys(captions).length > 0 && (
                  <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-bold text-purple-400">الكابشنات ({Object.keys({...captions,...videoCaptions}).length} منصة)</h3>
                      <button onClick={downloadAllCaptions} className="text-xs text-gray-500 hover:text-amber-400 transition">تحميل الكل</button>
                    </div>
                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                      {Object.entries({ ...captions, ...videoCaptions }).map(([k, v]) => v ? (
                        <div key={k} className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-amber-400 font-bold">{k.replace(/_/g, ' ').toUpperCase()}</p>
                            <button onClick={() => copyCaption(v, k)} className="text-[10px] text-gray-500 hover:text-amber-400 transition px-2 py-1 rounded border border-white/10 hover:border-amber-400/30">نسخ</button>
                          </div>
                          <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed" dir="rtl">{v}</p>
                        </div>
                      ) : null)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                TAB: Manual Publishing (WhatsApp, Haraj, Telegram, Snapchat)
                ═══════════════════════════════════════════════════════════════ */}
            {outputTab === 'manual' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-amber-400/5 border border-amber-400/20">
                  <p className="text-sm text-amber-400">هذه المنصات لا تدعم النشر التلقائي عبر Metricool — حمّل الصورة وانسخ الكابشن وانشر يدوياً</p>
                </div>

                {MANUAL_PLATFORMS.map(mp => {
                  const caption = getCaptionForPlatform(mp.key);
                  const image = getImageForPlatform(mp.key);
                  return (
                    <div key={mp.key} className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl">{mp.icon}</span>
                        <h4 className="font-bold text-base">{mp.label}</h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Image */}
                        <div className="space-y-2">
                          <p className="text-xs text-gray-500">الصورة ({image?.aspectRatio || '1:1'})</p>
                          {image && (
                            <div className="relative rounded-xl overflow-hidden border border-white/10">
                              <img src={image.url} alt="" className="w-full h-48 object-cover" />
                              <button onClick={() => downloadImage(image.url, `${perfumeData.name}_${mp.key}.png`)}
                                className="absolute bottom-2 left-2 text-xs bg-black/70 text-amber-400 px-3 py-1.5 rounded-lg hover:bg-black/90 transition">
                                تحميل الصورة
                              </button>
                            </div>
                          )}
                          {/* Video if available */}
                          {completedVids.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500 mb-1">الفيديو</p>
                              <div className="flex gap-2">
                                {completedVids.map(v => (
                                  <a key={v.aspectRatio} href={v.videoUrl!} target="_blank" rel="noopener noreferrer"
                                    className="text-xs bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded-lg border border-blue-500/20 hover:bg-blue-500/20 transition">
                                    فيديو {v.aspectRatio}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Caption */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-500">الكابشن</p>
                            <button onClick={() => copyCaption(caption, mp.label)}
                              className="text-xs text-amber-400 hover:underline">نسخ</button>
                          </div>
                          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 max-h-48 overflow-y-auto">
                            <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed" dir="rtl">
                              {caption || 'لم يتم توليد كابشن لهذه المنصة'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                TAB: Auto Publishing (Metricool)
                ═══════════════════════════════════════════════════════════════ */}
            {outputTab === 'publish' && (
              <div className="space-y-6">
                {/* Metricool Status */}
                {!metricoolOk && (
                  <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-sm text-red-400">
                    Metricool غير متصل — أضف METRICOOL_API_TOKEN في Vercel Environment Variables
                  </div>
                )}

                {/* Publish Now */}
                <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
                  <h3 className="font-bold text-amber-400 mb-3">النشر الفوري عبر Metricool</h3>
                  <p className="text-xs text-gray-500 mb-4">
                    سيتم نشر كل الصور والفيديوهات على المنصات المربوطة: Facebook, Instagram, Threads, LinkedIn, Pinterest, Twitter, TikTok, YouTube
                  </p>

                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {['Facebook', 'Instagram', 'Threads', 'LinkedIn', 'Pinterest', 'Twitter', 'TikTok', 'YouTube'].map(p => (
                      <div key={p} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/5 text-xs">
                        <div className="w-2 h-2 rounded-full bg-green-400" />
                        {p}
                      </div>
                    ))}
                  </div>

                  <button onClick={handlePublishNow} disabled={!metricoolOk || publishing}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold text-sm disabled:opacity-30 transition hover:shadow-lg hover:shadow-amber-500/20">
                    {publishing ? 'جاري النشر...' : '🚀 نشر الآن على جميع المنصات'}
                  </button>
                </div>

                {/* Download CSV */}
                <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
                  <h3 className="font-bold mb-3">تحميل ملف CSV يدوي</h3>
                  <p className="text-xs text-gray-500 mb-4">
                    ملف CSV بتنسيق Metricool — يمكنك رفعه يدوياً على منصة Metricool في حال وجود أخطاء في النشر التلقائي
                  </p>
                  <p className="text-xs text-gray-600 mb-4">
                    الأعمدة: Date, Time, Platform, Post, Link, Image, Video, Media_Type
                  </p>
                  <button onClick={handleDownloadCSV}
                    className="w-full py-3 rounded-xl border border-amber-400/50 text-amber-400 font-medium text-sm hover:bg-amber-400/10 transition">
                    📊 تحميل ملف CSV
                  </button>
                </div>

                {/* Publish Results */}
                {publishResults && (
                  <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
                    <h3 className="font-bold mb-3">نتائج النشر</h3>
                    {publishResults.results?.map((r: any, i: number) => (
                      <div key={i} className={`flex items-center justify-between p-3 rounded-lg mb-2 ${r.success ? 'bg-green-500/5 border border-green-500/10' : 'bg-red-500/5 border border-red-500/10'}`}>
                        <span className="text-sm">{r.target || r.platform}</span>
                        <span className={`text-xs ${r.success ? 'text-green-400' : 'text-red-400'}`}>
                          {r.success ? 'نجح' : r.error || 'فشل'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Summary */}
                <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
                  <h4 className="font-bold mb-3">ملخص المحتوى</h4>
                  <div className="grid grid-cols-3 gap-3 text-center text-xs">
                    <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/10">
                      <p className="text-2xl font-bold text-green-400">{images.length}</p>
                      <p className="text-gray-500 mt-1">صور</p>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                      <p className="text-2xl font-bold text-blue-400">{completedVids.length}</p>
                      <p className="text-gray-500 mt-1">فيديوهات</p>
                    </div>
                    <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/10">
                      <p className="text-2xl font-bold text-purple-400">{Object.keys(captions).length + Object.keys(videoCaptions).length}</p>
                      <p className="text-gray-500 mt-1">كابشنات</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-4 mt-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <p className="text-[10px] text-gray-600">Mahwous AI Production Line</p>
          <span className="text-[10px] px-3 py-1 rounded-full bg-amber-400/10 text-amber-400 font-medium border border-amber-400/20">
            v3.0 — Production Line
          </span>
        </div>
      </footer>
    </div>
  );
}
