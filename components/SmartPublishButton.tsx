'use client';

import { useState, useEffect } from 'react';
import {
  Loader2, Send, CheckCircle2, XCircle, Download,
  Smartphone, ShoppingBag, Ghost, Zap, Clock,
  Sparkles, AlertTriangle, ChevronDown, ChevronUp,
  Eye, Copy, Check,
} from 'lucide-react';
import { toast } from 'sonner';

interface SmartPublishButtonProps {
  perfumeData: {
    name: string;
    brand: string;
    price?: string;
  };
  productUrl: string;
  captions: Record<string, string> | null;
  imageUrls: {
    story?: string;
    post?: string;
    landscape?: string;
  };
  videoUrls?: {
    vertical?: string;
    horizontal?: string;
  };
}

interface PublishResult {
  platform: string;
  success: boolean;
  postId?: string;
  scheduledTime?: string;
  error?: string;
  debug?: string;
}

// ── أسماء المنصات بالعربي ──────────────────────────────────────────────────────────────────────────────
const PLATFORM_NAMES: Record<string, string> = {
  instagram: 'انستقرام',
  facebook: 'فيسبوك',
  twitter: 'تويتر / X',
  tiktok: 'تيك توك',
  linkedin: 'لينكد إن',
  youtube: 'يوتيوب',
  pinterest: 'بنترست',
  google: 'قوقل بزنس',
};

// ── ألوان المنصات ──────────────────────────────────────────────────────────────────────────────
const PLATFORM_COLORS: Record<string, string> = {
  instagram: '#E1306C',
  facebook: '#1877F2',
  twitter: '#1DA1F2',
  tiktok: '#00f2ea',
  linkedin: '#0A66C2',
  youtube: '#FF0000',
  pinterest: '#E60023',
  google: '#4285F4',
};

// ── أيقونات المنصات ──────────────────────────────────────────────────────────
const PLATFORM_ICONS: Record<string, string> = {
  instagram: '📸', facebook: '📘', twitter: '🐦', tiktok: '🎵',
  linkedin: '💼', youtube: '▶️', pinterest: '📌', google: '🏢',
};

export default function SmartPublishButton({
  perfumeData,
  productUrl,
  captions,
  imageUrls,
  videoUrls,
}: SmartPublishButtonProps) {
  const [publishing, setPublishing] = useState(false);
  const [results, setResults] = useState<PublishResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [generatingOffline, setGeneratingOffline] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([
    'instagram', 'facebook', 'twitter', 'tiktok', 'linkedin', 'pinterest', 'youtube', 'google',
  ]);
  const [publishMode, setPublishMode] = useState<'smart' | 'now'>('smart');
  const [isConnected, setIsConnected] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(true);
  const [connectedNetworks, setConnectedNetworks] = useState<string[]>([]);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagnostics, setDiagnostics] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);

  // ── التحقق من اتصال Metricool ──────────────────────────────────────────
  useEffect(() => {
    const checkConnection = async () => {
      setCheckingConnection(true);
      try {
        const res = await fetch('/api/metricool/config');
        const data = await res.json();
        setIsConnected(data.connected === true);
        if (data.connectedNetworks) setConnectedNetworks(data.connectedNetworks);
      } catch {
        setIsConnected(false);
      } finally {
        setCheckingConnection(false);
      }
    };
    checkConnection();
  }, []);

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]
    );
  };

  // ── معاينة المحتوى قبل النشر ──────────────────────────────────────────
  const getPreviewCaption = (platform: string): string => {
    if (!captions) return 'لا يوجد كابشن';
    const key = platform === 'instagram' ? 'instagram_post'
      : platform === 'facebook' ? 'facebook_post'
      : captions[platform] ? platform : 'instagram_post';
    return captions[key] || captions[platform] || captions.instagram_post || captions.instagram || 'لا يوجد كابشن';
  };

  const copyCaption = (platform: string) => {
    const text = getPreviewCaption(platform);
    navigator.clipboard.writeText(text);
    setCopiedPlatform(platform);
    setTimeout(() => setCopiedPlatform(null), 2000);
    toast.success(`تم نسخ كابشن ${PLATFORM_NAMES[platform]}`);
  };

  // ── النشر الذكي عبر Metricool ──────────────────────────────────────────
  const handleSmartPublish = async () => {
    if (!isConnected) {
      toast.error('Metricool غير متصل — تأكد من إضافة METRICOOL_API_TOKEN في Vercel');
      return;
    }
    if (selectedPlatforms.length === 0) {
      toast.error('اختر منصة واحدة على الأقل');
      return;
    }

    setPublishing(true);
    setResults([]);
    setShowResults(false);
    setDiagnostics([]);

    try {
      const response = await fetch('/api/metricool/smart-publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          perfumeName: perfumeData.name,
          perfumeBrand: perfumeData.brand,
          productUrl,
          captions: captions || {},
          imageUrls: imageUrls || {},
          videoUrls: videoUrls || {},
          hashtags: [
            '#عطور', '#مهووس_ستور', '#عطور_أصلية', '#perfume',
            '#fragrance', '#السعودية', '#luxury', '#عطر',
            `#${(perfumeData.brand || 'عطر').replace(/\s+/g, '_')}`,
            `#${(perfumeData.name || 'عطر').replace(/\s+/g, '_')}`,
          ],
          platforms: selectedPlatforms,
          autoSchedule: publishMode === 'smart',
        }),
      });

      const data = await response.json();

      if (data.diagnostics) setDiagnostics(data.diagnostics);

      if (data.results) {
        setResults(data.results);
        setShowResults(true);
      }

      if (data.success) {
        toast.success(data.message);
        // حفظ سجل النشر
        try {
          const log = JSON.parse(localStorage.getItem('mahwous_publish_log') || '[]');
          log.push({
            timestamp: new Date().toISOString(),
            perfumeName: perfumeData.name,
            platforms: selectedPlatforms,
            results: data.results,
            mode: publishMode,
          });
          if (log.length > 100) log.splice(0, log.length - 100);
          localStorage.setItem('mahwous_publish_log', JSON.stringify(log));
        } catch { /* ignore */ }
      } else {
        toast.error(data.error || 'فشل النشر — اضغط "تفاصيل الأخطاء" لمعرفة السبب');
      }
    } catch (error) {
      toast.error('خطأ في الاتصال بالخادم');
      console.error('[SmartPublish] Error:', error);
    } finally {
      setPublishing(false);
    }
  };

  // ── تصدير CSV جدول النشر ──────────────────────────────────────────────────────────────────────────────
  const [exportingCSV, setExportingCSV] = useState(false);
  const [csvFormat, setCsvFormat] = useState<'single' | 'multi'>('single');

  const handleExportCSV = async (fmt: 'single' | 'multi' = csvFormat) => {
    setExportingCSV(true);
    try {
      const response = await fetch('/api/export-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          perfumeName: perfumeData.name,
          perfumeBrand: perfumeData.brand,
          productUrl,
          captions: captions || {},
          imageUrls: imageUrls || {},
          videoUrls: videoUrls || {},
          hashtags: [
            '#عطور', '#مهووس_ستور', '#عطور_أصلية', '#perfume',
            '#fragrance', '#السعودية', '#luxury', '#عطر',
            `#${(perfumeData.brand || 'عطر').replace(/\s+/g, '_')}`,
            `#${(perfumeData.name || 'عطر').replace(/\s+/g, '_')}`,
          ],
          platforms: selectedPlatforms,
          format: fmt,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        toast.error(err.error || 'فشل تصدير CSV');
        return;
      }

      // تحميل الملف
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const disposition = response.headers.get('Content-Disposition') || '';
      const filenameMatch = disposition.match(/filename="([^"]+)"/);
      a.download = filenameMatch ? filenameMatch[1] : `mahwous_schedule_${fmt}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`تم تحميل جدول النشر (${fmt === 'single' ? 'منصة واحدة' : 'متعدد المنصات'})`);
    } catch {
      toast.error('خطأ في تصدير CSV');
    } finally {
      setExportingCSV(false);
    }
  };

  // ── توليد حزمة المنصات غير المؤتمتة ──────────────────────────────────────────────────────
  const handleGenerateOffline = async () => {
    setGeneratingOffline(true);
    try {
      const response = await fetch('/api/metricool/offline-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          perfumeName: perfumeData.name,
          perfumeBrand: perfumeData.brand,
          productUrl,
          captions: captions || {},
          imageUrls: imageUrls || {},
          videoUrls: videoUrls || {},
          price: perfumeData.price,
        }),
      });

      const data = await response.json();
      if (data.success) {
        const blob = new Blob([data.textFileContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mahwous-offline-${perfumeData.name.replace(/\s+/g, '-').substring(0, 20)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('تم تحميل ملف المحتوى للمنصات غير المؤتمتة');
      } else {
        toast.error('فشل توليد المحتوى');
      }
    } catch {
      toast.error('خطأ في التوليد');
    } finally {
      setGeneratingOffline(false);
    }
  };

  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  // ── عدد الوسائط المتاحة ──────────────────────────────────────────────
  const mediaCount = [
    imageUrls?.story, imageUrls?.post, imageUrls?.landscape,
    videoUrls?.vertical, videoUrls?.horizontal,
  ].filter(Boolean).length;

  return (
    <div className="glass-card p-5 space-y-4">
      {/* ── العنوان ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap size={18} className="text-[var(--gold)]" />
          <h3 className="text-base font-bold text-[var(--gold)]">النشر الذكي عبر Metricool</h3>
        </div>
        {checkingConnection ? (
          <span className="text-[10px] px-2 py-1 rounded-full bg-gray-500/20 text-gray-400 font-medium flex items-center gap-1">
            <Loader2 size={10} className="animate-spin" /> جاري التحقق...
          </span>
        ) : isConnected ? (
          <span className="text-[10px] px-2 py-1 rounded-full bg-green-500/20 text-green-400 font-medium flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> متصل
            {connectedNetworks.length > 0 && ` (${connectedNetworks.length} منصة)`}
          </span>
        ) : (
          <span className="text-[10px] px-2 py-1 rounded-full bg-red-500/20 text-red-400 font-medium flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400" /> غير متصل
          </span>
        )}
      </div>

      {/* ── ملخص المحتوى الجاهز ── */}
      <div className="p-3 rounded-xl bg-[var(--obsidian-light)] border border-[var(--obsidian-border)]">
        <p className="text-[11px] text-[var(--text-muted)] mb-2 font-medium">المحتوى الجاهز للنشر:</p>
        <div className="flex flex-wrap gap-2">
          {imageUrls?.story && (
            <span className="text-[10px] px-2 py-1 rounded-full bg-purple-500/20 text-purple-400">📱 صورة ستوري</span>
          )}
          {imageUrls?.post && (
            <span className="text-[10px] px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">🖼️ صورة بوست</span>
          )}
          {imageUrls?.landscape && (
            <span className="text-[10px] px-2 py-1 rounded-full bg-green-500/20 text-green-400">🌅 صورة أفقية</span>
          )}
          {videoUrls?.vertical && (
            <span className="text-[10px] px-2 py-1 rounded-full bg-pink-500/20 text-pink-400">🎬 فيديو عمودي</span>
          )}
          {videoUrls?.horizontal && (
            <span className="text-[10px] px-2 py-1 rounded-full bg-red-500/20 text-red-400">🎬 فيديو أفقي</span>
          )}
          <span className="text-[10px] px-2 py-1 rounded-full bg-[var(--gold)]/20 text-[var(--gold)]">
            📝 {Object.keys(captions || {}).length} كابشن
          </span>
        </div>
        {mediaCount === 0 && (
          <p className="text-[10px] text-yellow-400 mt-2 flex items-center gap-1">
            <AlertTriangle size={10} /> لا توجد وسائط — سيتم النشر بالنص فقط
          </p>
        )}
      </div>

      {/* ── اختيار المنصات ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-[var(--text-muted)] font-medium">اختر المنصات للنشر:</p>
          <button
            onClick={() => {
              const allPlatforms = Object.keys(PLATFORM_NAMES);
              setSelectedPlatforms(prev => prev.length === allPlatforms.length ? [] : allPlatforms);
            }}
            className="text-[10px] text-[var(--gold)] hover:underline"
          >
            {selectedPlatforms.length === Object.keys(PLATFORM_NAMES).length ? 'إلغاء الكل' : 'تحديد الكل'}
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(PLATFORM_NAMES).map(([id, name]) => (
            <button
              key={id}
              onClick={() => togglePlatform(id)}
              className="text-[10px] px-3 py-1.5 rounded-full border transition-all font-medium flex items-center gap-1"
              style={{
                borderColor: selectedPlatforms.includes(id) ? PLATFORM_COLORS[id] : 'var(--obsidian-border)',
                backgroundColor: selectedPlatforms.includes(id) ? `${PLATFORM_COLORS[id]}20` : 'transparent',
                color: selectedPlatforms.includes(id) ? PLATFORM_COLORS[id] : 'var(--text-muted)',
              }}
            >
              <span>{PLATFORM_ICONS[id]}</span>
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* ── معاينة المحتوى ── */}
      <button
        onClick={() => setShowPreview(!showPreview)}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-[var(--obsidian-light)] border border-[var(--obsidian-border)] text-xs text-[var(--text-muted)] hover:text-[var(--gold)] hover:border-[var(--gold)] transition-all"
      >
        <Eye size={14} />
        {showPreview ? 'إخفاء المعاينة' : 'معاينة المحتوى قبل النشر'}
        {showPreview ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {showPreview && (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {selectedPlatforms.map(platform => (
            <div key={platform} className="p-3 rounded-xl bg-[var(--obsidian-light)] border border-[var(--obsidian-border)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold flex items-center gap-1" style={{ color: PLATFORM_COLORS[platform] }}>
                  {PLATFORM_ICONS[platform]} {PLATFORM_NAMES[platform]}
                </span>
                <button
                  onClick={() => copyCaption(platform)}
                  className="text-[10px] text-[var(--text-muted)] hover:text-[var(--gold)] flex items-center gap-1"
                >
                  {copiedPlatform === platform ? <Check size={10} className="text-green-400" /> : <Copy size={10} />}
                  {copiedPlatform === platform ? 'تم النسخ' : 'نسخ'}
                </button>
              </div>
              <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed whitespace-pre-line line-clamp-4">
                {getPreviewCaption(platform)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── وضع النشر ── */}
      <div className="flex gap-2">
        <button
          onClick={() => setPublishMode('smart')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
            publishMode === 'smart'
              ? 'bg-[var(--gold)]/20 text-[var(--gold)] border border-[var(--gold)]'
              : 'bg-[var(--obsidian-light)] text-[var(--text-muted)] border border-[var(--obsidian-border)]'
          }`}
        >
          <Sparkles size={14} />
          جدولة ذكية
          <span className="text-[9px] opacity-70">(أفضل وقت)</span>
        </button>
        <button
          onClick={() => setPublishMode('now')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
            publishMode === 'now'
              ? 'bg-[var(--gold)]/20 text-[var(--gold)] border border-[var(--gold)]'
              : 'bg-[var(--obsidian-light)] text-[var(--text-muted)] border border-[var(--obsidian-border)]'
          }`}
        >
          <Send size={14} />
          نشر فوري
          <span className="text-[9px] opacity-70">(خلال دقيقتين)</span>
        </button>
      </div>

      {/* ── زر النشر الرئيسي ── */}
      <button
        onClick={handleSmartPublish}
        disabled={publishing || !isConnected || selectedPlatforms.length === 0}
        className="w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
        style={{
          background: isConnected && selectedPlatforms.length > 0
            ? 'linear-gradient(135deg, #D4AF37, #B8860B, #D4AF37)'
            : 'var(--obsidian-light)',
          color: isConnected && selectedPlatforms.length > 0 ? 'black' : 'var(--text-muted)',
          border: isConnected && selectedPlatforms.length > 0 ? 'none' : '1px solid var(--obsidian-border)',
        }}
      >
        {publishing ? (
          <><Loader2 size={18} className="animate-spin" /> جاري النشر على {selectedPlatforms.length} منصة...</>
        ) : (
          <>
            <Send size={18} />
            {publishMode === 'smart'
              ? `نشر ذكي على ${selectedPlatforms.length} منصة (أفضل وقت لكل منصة)`
              : `نشر فوري على ${selectedPlatforms.length} منصة`
            }
          </>
        )}
      </button>

      {!isConnected && !checkingConnection && (
        <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
          <p className="text-xs text-yellow-400 text-center leading-relaxed">
            Metricool غير متصل — تأكد من إضافة <code className="bg-black/30 px-1.5 py-0.5 rounded text-[10px]">METRICOOL_API_TOKEN</code> في Vercel ثم أعد النشر (Redeploy)
          </p>
        </div>
      )}

      {/* ── نتائج النشر ── */}
      {showResults && results.length > 0 && (
        <div className="space-y-2 p-4 rounded-xl bg-[var(--obsidian-light)] border border-[var(--obsidian-border)]">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-[var(--text-primary)]">نتائج النشر:</h4>
            <div className="flex items-center gap-3 text-[10px]">
              {successCount > 0 && (
                <span className="text-green-400 flex items-center gap-1">
                  <CheckCircle2 size={12} /> {successCount} نجح
                </span>
              )}
              {failCount > 0 && (
                <span className="text-red-400 flex items-center gap-1">
                  <XCircle size={12} /> {failCount} فشل
                </span>
              )}
            </div>
          </div>

          {results.map((result, i) => (
            <div key={i} className="flex items-center justify-between text-xs py-2.5 px-3 rounded-lg bg-black/20 border border-[var(--obsidian-border)]/30">
              <div className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle2 size={14} className="text-green-400" />
                ) : (
                  <XCircle size={14} className="text-red-400" />
                )}
                <span className="font-medium" style={{ color: PLATFORM_COLORS[result.platform.toLowerCase()] || 'var(--text-primary)' }}>
                  {PLATFORM_ICONS[result.platform.toLowerCase()] || ''} {PLATFORM_NAMES[result.platform.toLowerCase()] || result.platform}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {result.scheduledTime && result.success && (
                  <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                    <Clock size={10} />
                    {new Date(result.scheduledTime).toLocaleString('ar-SA', {
                      hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short',
                    })}
                  </span>
                )}
                <span className={`font-medium ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                  {result.success ? 'تم الجدولة ✓' : 'فشل ✗'}
                </span>
              </div>
            </div>
          ))}

          {/* تفاصيل الأخطاء */}
          {failCount > 0 && (
            <div className="mt-3">
              <button
                onClick={() => setShowDiagnostics(!showDiagnostics)}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400 hover:bg-red-500/20 transition-all"
              >
                <AlertTriangle size={12} />
                {showDiagnostics ? 'إخفاء تفاصيل الأخطاء' : 'عرض تفاصيل الأخطاء'}
                {showDiagnostics ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>

              {showDiagnostics && (
                <div className="mt-2 space-y-2">
                  {/* أخطاء كل منصة */}
                  {results.filter(r => !r.success).map((result, i) => (
                    <div key={i} className="p-2 rounded-lg bg-red-500/5 border border-red-500/20">
                      <p className="text-[10px] font-bold text-red-400 mb-1">
                        {PLATFORM_NAMES[result.platform.toLowerCase()] || result.platform}:
                      </p>
                      <p className="text-[9px] text-red-300 font-mono break-all">{result.error || 'خطأ غير معروف'}</p>
                      {result.debug && (
                        <p className="text-[9px] text-red-300/60 font-mono mt-1">{result.debug}</p>
                      )}
                    </div>
                  ))}

                  {/* تشخيص عام */}
                  {diagnostics.length > 0 && (
                    <div className="p-2 rounded-lg bg-gray-500/10 border border-gray-500/20">
                      <p className="text-[10px] font-bold text-gray-400 mb-1">تشخيص النظام:</p>
                      {diagnostics.map((d, i) => (
                        <p key={i} className="text-[9px] text-gray-400 font-mono">{d}</p>
                      ))}
                    </div>
                  )}

                  <p className="text-[10px] text-yellow-400 text-center mt-2">
                    تأكد من ربط المنصات في حسابك على <a href="https://app.metricool.com" target="_blank" rel="noopener noreferrer" className="underline">Metricool</a>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── المنصات غير المؤتمتة ── */}
      <div className="border-t border-[var(--obsidian-border)] pt-4">
        <p className="text-xs text-[var(--text-muted)] mb-3 font-medium">
          المنصات بدون أتمتة — حمّل ملف المحتوى الجاهز:
        </p>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg bg-[var(--obsidian-light)] border border-[var(--obsidian-border)]">
            <Smartphone size={16} className="text-green-400" />
            <span className="text-[10px] text-[var(--text-muted)] font-medium">واتساب</span>
            <span className="text-[8px] text-[var(--text-muted)]">حالة + ستوري</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg bg-[var(--obsidian-light)] border border-[var(--obsidian-border)]">
            <ShoppingBag size={16} className="text-blue-400" />
            <span className="text-[10px] text-[var(--text-muted)] font-medium">حراج</span>
            <span className="text-[8px] text-[var(--text-muted)]">صور + وصف</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg bg-[var(--obsidian-light)] border border-[var(--obsidian-border)]">
            <Ghost size={16} className="text-yellow-400" />
            <span className="text-[10px] text-[var(--text-muted)] font-medium">سناب شات</span>
            <span className="text-[8px] text-[var(--text-muted)]">صور + فيديو</span>
          </div>
        </div>
        <button
          onClick={handleGenerateOffline}
          disabled={generatingOffline}
          className="w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 bg-[var(--obsidian-light)] border border-[var(--obsidian-border)] text-[var(--text-primary)] hover:border-[var(--gold)] hover:text-[var(--gold)] transition-all"
        >
          {generatingOffline ? (
            <><Loader2 size={14} className="animate-spin" /> جاري التوليد...</>
          ) : (
            <><Download size={14} /> تحميل ملف المحتوى (واتساب + حراج + سناب)</>
          )}
        </button>
      </div>

      {/* ── تصدير CSV جدول النشر ── */}
      <div className="border-t border-[var(--obsidian-border)] pt-4">
        <p className="text-xs text-[var(--text-muted)] mb-3 font-medium">
          تصدير جدول النشر (CSV) لـ Make.com / Buffer / Hootsuite:
        </p>
        {/* اختيار الهيكل */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setCsvFormat('single')}
            className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all border ${
              csvFormat === 'single'
                ? 'bg-[var(--gold)]/20 text-[var(--gold)] border-[var(--gold)]'
                : 'bg-[var(--obsidian-light)] text-[var(--text-muted)] border-[var(--obsidian-border)]'
            }`}
          >
            صف واحد / منصة
            <span className="block text-[8px] opacity-70">مناسب Buffer / Hootsuite</span>
          </button>
          <button
            onClick={() => setCsvFormat('multi')}
            className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all border ${
              csvFormat === 'multi'
                ? 'bg-[var(--gold)]/20 text-[var(--gold)] border-[var(--gold)]'
                : 'bg-[var(--obsidian-light)] text-[var(--text-muted)] border-[var(--obsidian-border)]'
            }`}
          >
            صف واحد / وقت نشر
            <span className="block text-[8px] opacity-70">مناسب Make.com / Zapier</span>
          </button>
        </div>
        <button
          onClick={() => handleExportCSV(csvFormat)}
          disabled={exportingCSV}
          className="w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all"
          style={{
            background: 'linear-gradient(135deg, #1a472a, #2d6a4f)',
            color: '#90EE90',
            border: '1px solid #2d6a4f',
          }}
        >
          {exportingCSV ? (
            <><Loader2 size={14} className="animate-spin" /> جاري تصدير CSV...</>
          ) : (
            <><Download size={14} /> تحميل جدول النشر CSV ({csvFormat === 'single' ? `${selectedPlatforms.length} صف` : 'مدمج'})</>
          )}
        </button>
        <p className="text-[9px] text-[var(--text-muted)] mt-2 text-center">
          الملف يحتوي على الكابشن + روابط الصور + روابط الفيديو + أوقات النشر المثلى لكل منصة
        </p>
      </div>
    </div>
  );
}
