'use client';

import { useState, useEffect } from 'react';
import {
  Archive, Trash2, Send, Download, Eye, EyeOff,
  Clock, CheckCircle2, XCircle, Calendar, Image,
  Video, FileText, ChevronDown, ChevronUp, Sparkles,
  Copy, Check, ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

interface SavedPost {
  id: string;
  timestamp: string;
  perfumeName: string;
  perfumeBrand: string;
  productUrl: string;
  storyImageUrl: string;
  postImageUrl: string;
  landscapeImageUrl: string;
  verticalVideoUrl: string;
  horizontalVideoUrl: string;
  captions: Record<string, string>;
  videoCaptions: Record<string, string>;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  publishedPlatforms?: string[];
  scheduledTime?: string;
}

const PLATFORM_NAMES: Record<string, string> = {
  instagram_post: 'انستقرام بوست',
  instagram_story: 'انستقرام ستوري',
  instagram_reel: 'انستقرام ريلز',
  facebook_post: 'فيسبوك',
  twitter: 'تويتر / X',
  tiktok: 'تيك توك',
  linkedin: 'لينكد إن',
  youtube_thumbnail: 'يوتيوب',
  pinterest: 'بنترست',
  google_business: 'قوقل بزنس',
  whatsapp_status: 'واتساب',
  haraj: 'حراج',
  snapchat: 'سناب شات',
};

const STATUS_LABELS: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  draft: { label: 'مسودة', color: 'text-gray-400', icon: Archive },
  scheduled: { label: 'مجدول', color: 'text-blue-400', icon: Clock },
  published: { label: 'تم النشر', color: 'text-green-400', icon: CheckCircle2 },
  failed: { label: 'فشل', color: 'text-red-400', icon: XCircle },
};

export default function SavedPosts() {
  const [posts, setPosts] = useState<SavedPost[]>([]);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [copiedCaption, setCopiedCaption] = useState<string | null>(null);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = () => {
    try {
      const saved = localStorage.getItem('mahwous_saved_posts');
      if (saved) {
        const parsed = JSON.parse(saved);
        setPosts(Array.isArray(parsed) ? parsed.sort((a: SavedPost, b: SavedPost) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ) : []);
      }
    } catch {
      setPosts([]);
    }
  };

  const deletePost = (id: string) => {
    const updated = posts.filter(p => p.id !== id);
    setPosts(updated);
    localStorage.setItem('mahwous_saved_posts', JSON.stringify(updated));
    toast.success('تم حذف المنشور');
  };

  const clearAll = () => {
    if (confirm('هل تريد حذف جميع المنشورات المحفوظة؟')) {
      setPosts([]);
      localStorage.setItem('mahwous_saved_posts', JSON.stringify([]));
      toast.success('تم حذف جميع المنشورات');
    }
  };

  const copyCaption = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCaption(key);
    setTimeout(() => setCopiedCaption(null), 2000);
    toast.success('تم نسخ الكابشن');
  };

  const downloadAllMedia = (post: SavedPost) => {
    const urls = [
      post.storyImageUrl, post.postImageUrl, post.landscapeImageUrl,
      post.verticalVideoUrl, post.horizontalVideoUrl,
    ].filter(Boolean);
    if (urls.length === 0) {
      toast.error('لا توجد ملفات للتحميل');
      return;
    }
    urls.forEach(url => window.open(url, '_blank', 'noopener,noreferrer'));
    toast.success(`جاري تحميل ${urls.length} ملفات`);
  };

  const downloadCaptions = (post: SavedPost) => {
    const allCaptions = { ...post.captions, ...post.videoCaptions };
    const lines: string[] = [
      `كابشنات عطر: ${post.perfumeName}`,
      `العلامة: ${post.perfumeBrand}`,
      `الرابط: ${post.productUrl}`,
      `التاريخ: ${new Date(post.timestamp).toLocaleString('ar-SA')}`,
      '═'.repeat(50),
    ];
    for (const [key, value] of Object.entries(allCaptions)) {
      if (value && typeof value === 'string') {
        const name = PLATFORM_NAMES[key] || key.replace(/_/g, ' ');
        lines.push(`\n▸ ${name}:\n${value}`);
        lines.push('─'.repeat(40));
      }
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mahwous-${post.perfumeName.replace(/\s+/g, '-').substring(0, 20)}-captions.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('تم تحميل الكابشنات');
  };

  const mediaCount = (post: SavedPost) => {
    return [post.storyImageUrl, post.postImageUrl, post.landscapeImageUrl,
      post.verticalVideoUrl, post.horizontalVideoUrl].filter(Boolean).length;
  };

  const captionCount = (post: SavedPost) => {
    return Object.keys({ ...post.captions, ...post.videoCaptions }).filter(
      k => (post.captions?.[k] || post.videoCaptions?.[k])
    ).length;
  };

  if (posts.length === 0) {
    return (
      <div className="glass-card p-6 text-center">
        <Archive size={40} className="mx-auto text-[var(--text-muted)] opacity-40 mb-3" />
        <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">لا توجد منشورات محفوظة</h3>
        <p className="text-xs text-[var(--text-muted)]">
          اضغط &quot;حفظ المنشور&quot; بعد توليد الحملة لحفظها هنا
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card p-5 space-y-4">
      {/* العنوان */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Archive size={18} className="text-[var(--gold)]" />
          <h3 className="text-base font-bold text-[var(--gold)]">المنشورات المحفوظة</h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--gold)]/20 text-[var(--gold)] font-medium">
            {posts.length}
          </span>
        </div>
        <button
          onClick={clearAll}
          className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1"
        >
          <Trash2 size={10} /> حذف الكل
        </button>
      </div>

      {/* قائمة المنشورات */}
      <div className="space-y-3">
        {posts.map(post => {
          const isExpanded = expandedPost === post.id;
          const statusInfo = STATUS_LABELS[post.status] || STATUS_LABELS.draft;
          const StatusIcon = statusInfo.icon;

          return (
            <div key={post.id} className="rounded-xl bg-[var(--obsidian-light)] border border-[var(--obsidian-border)] overflow-hidden">
              {/* رأس المنشور */}
              <button
                onClick={() => setExpandedPost(isExpanded ? null : post.id)}
                className="w-full p-3 flex items-center gap-3 text-right hover:bg-white/5 transition-all"
              >
                {/* صورة مصغرة */}
                {post.postImageUrl ? (
                  <img src={post.postImageUrl} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-[var(--obsidian)] flex items-center justify-center flex-shrink-0">
                    <Sparkles size={16} className="text-[var(--gold)] opacity-40" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[var(--text-primary)] truncate">{post.perfumeName}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{post.perfumeBrand}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[9px] text-[var(--text-muted)] flex items-center gap-1">
                      <Calendar size={8} />
                      {new Date(post.timestamp).toLocaleString('ar-SA', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                    <span className="text-[9px] text-[var(--text-muted)] flex items-center gap-1">
                      <Image size={8} /> {mediaCount(post)} وسائط
                    </span>
                    <span className="text-[9px] text-[var(--text-muted)] flex items-center gap-1">
                      <FileText size={8} /> {captionCount(post)} كابشن
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1 ${statusInfo.color} bg-current/10`}
                    style={{ backgroundColor: 'transparent' }}>
                    <StatusIcon size={10} />
                    {statusInfo.label}
                  </span>
                  {isExpanded ? <ChevronUp size={14} className="text-[var(--text-muted)]" /> : <ChevronDown size={14} className="text-[var(--text-muted)]" />}
                </div>
              </button>

              {/* تفاصيل المنشور */}
              {isExpanded && (
                <div className="border-t border-[var(--obsidian-border)] p-3 space-y-3">
                  {/* الوسائط */}
                  <div>
                    <p className="text-[10px] font-bold text-[var(--text-muted)] mb-2">الوسائط:</p>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {post.storyImageUrl && (
                        <a href={post.storyImageUrl} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                          <img src={post.storyImageUrl} alt="ستوري" className="w-16 h-28 rounded-lg object-cover border border-[var(--obsidian-border)] hover:border-[var(--gold)] transition-all" />
                          <p className="text-[8px] text-center text-[var(--text-muted)] mt-1">ستوري</p>
                        </a>
                      )}
                      {post.postImageUrl && (
                        <a href={post.postImageUrl} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                          <img src={post.postImageUrl} alt="بوست" className="w-20 h-20 rounded-lg object-cover border border-[var(--obsidian-border)] hover:border-[var(--gold)] transition-all" />
                          <p className="text-[8px] text-center text-[var(--text-muted)] mt-1">بوست</p>
                        </a>
                      )}
                      {post.landscapeImageUrl && (
                        <a href={post.landscapeImageUrl} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                          <img src={post.landscapeImageUrl} alt="أفقي" className="w-28 h-16 rounded-lg object-cover border border-[var(--obsidian-border)] hover:border-[var(--gold)] transition-all" />
                          <p className="text-[8px] text-center text-[var(--text-muted)] mt-1">أفقي</p>
                        </a>
                      )}
                      {post.verticalVideoUrl && (
                        <a href={post.verticalVideoUrl} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 flex flex-col items-center">
                          <div className="w-16 h-28 rounded-lg bg-[var(--obsidian)] border border-[var(--obsidian-border)] hover:border-[var(--gold)] flex items-center justify-center transition-all">
                            <Video size={16} className="text-pink-400" />
                          </div>
                          <p className="text-[8px] text-center text-[var(--text-muted)] mt-1">فيديو عمودي</p>
                        </a>
                      )}
                      {post.horizontalVideoUrl && (
                        <a href={post.horizontalVideoUrl} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 flex flex-col items-center">
                          <div className="w-28 h-16 rounded-lg bg-[var(--obsidian)] border border-[var(--obsidian-border)] hover:border-[var(--gold)] flex items-center justify-center transition-all">
                            <Video size={16} className="text-red-400" />
                          </div>
                          <p className="text-[8px] text-center text-[var(--text-muted)] mt-1">فيديو أفقي</p>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* الكابشنات */}
                  <div>
                    <p className="text-[10px] font-bold text-[var(--text-muted)] mb-2">الكابشنات:</p>
                    <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                      {Object.entries({ ...post.captions, ...post.videoCaptions }).map(([key, value]) => {
                        if (!value || typeof value !== 'string') return null;
                        return (
                          <div key={key} className="flex items-start gap-2 p-2 rounded-lg bg-black/20">
                            <span className="text-[9px] text-[var(--gold)] font-medium flex-shrink-0 w-20 truncate">
                              {PLATFORM_NAMES[key] || key}
                            </span>
                            <p className="text-[9px] text-[var(--text-secondary)] flex-1 line-clamp-2">{value}</p>
                            <button
                              onClick={() => copyCaption(key, value)}
                              className="flex-shrink-0 text-[var(--text-muted)] hover:text-[var(--gold)]"
                            >
                              {copiedCaption === key ? <Check size={10} className="text-green-400" /> : <Copy size={10} />}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* أزرار الإجراءات */}
                  <div className="flex gap-2 pt-2 border-t border-[var(--obsidian-border)]">
                    <button
                      onClick={() => downloadAllMedia(post)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-xs text-green-400 hover:bg-green-500/20 transition-all"
                    >
                      <Download size={12} /> تحميل الوسائط
                    </button>
                    <button
                      onClick={() => downloadCaptions(post)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-purple-500/10 border border-purple-500/30 text-xs text-purple-400 hover:bg-purple-500/20 transition-all"
                    >
                      <FileText size={12} /> تحميل الكابشنات
                    </button>
                    {post.productUrl && (
                      <a
                        href={post.productUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--gold)]/10 border border-[var(--gold)]/30 text-xs text-[var(--gold)] hover:bg-[var(--gold)]/20 transition-all"
                      >
                        <ExternalLink size={12} />
                      </a>
                    )}
                    <button
                      onClick={() => deletePost(post.id)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400 hover:bg-red-500/20 transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
