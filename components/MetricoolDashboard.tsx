'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3, TrendingUp, Users, Zap, Brain, Target,
  Settings, RefreshCw, Loader2, ChevronDown, ChevronUp,
  Lightbulb, Clock, Hash, Eye, Heart, MessageCircle,
  Share2, Award, AlertCircle, CheckCircle2, Download,
} from 'lucide-react';

import { type MetricoolCredentials } from '@/lib/metricoolClient';

import {
  getLast30DaysSummary,
  calculatePerformanceScore,
  storeAnalyticsSnapshot,
  getAnalyticsHistory,
  type AnalyticsSummary,
} from '@/lib/metricoolAnalytics';

import {
  getCompetitors,
  addCompetitor,
  removeCompetitor,
  getStoredInsights,
  getStoredContentIdeas,
  DEFAULT_COMPETITORS,
  type CompetitorProfile,
  type CompetitorInsight,
  type ContentIdea,
} from '@/lib/metricoolCompetitor';

import {
  getLearningProfile,
  updateLearningFromPerformance,
  generateSmartSuggestions,
  getPerformanceHistory,
  type LearningProfile,
  type SmartSuggestion,
} from '@/lib/selfLearningEngine';

// ── MetricoolDashboard Component ────────────────────────────────────────────

export default function MetricoolDashboard() {
  // State
  const [isConfigured, setIsConfigured] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [credentials, setCredentials] = useState<MetricoolCredentials>({
    userToken: '', blogId: '', userId: '',
  });
  const [activeSection, setActiveSection] = useState<
    'overview' | 'analytics' | 'competitors' | 'learning' | 'suggestions'
  >('overview');
  const [loading, setLoading] = useState(false);

  // Data
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [performanceScore, setPerformanceScore] = useState(0);
  const [competitors, setCompetitors] = useState<CompetitorProfile[]>([]);
  const [insights, setInsights] = useState<CompetitorInsight[]>([]);
  const [contentIdeas, setContentIdeas] = useState<ContentIdea[]>([]);
  const [learningProfile, setLearningProfile] = useState<LearningProfile | null>(null);
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [analyticsHistory, setAnalyticsHistory] = useState<any[]>([]);

  // Initialize — check connection via API (server-side)
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const res = await fetch('/api/metricool/config');
        const data = await res.json();
        setIsConfigured(data.connected === true);
        if (data.connected) {
          setCredentials({
            userToken: '***server-side***',
            blogId: data.blogId || '',
            userId: data.userId || '',
          });
        }
      } catch {
        setIsConfigured(false);
      }
    };
    checkConnection();

    // Load local data
    setCompetitors(getCompetitors());
    const storedInsights = getStoredInsights();
    if (storedInsights) setInsights(storedInsights.insights);
    const storedIdeas = getStoredContentIdeas();
    if (storedIdeas) setContentIdeas(storedIdeas.ideas);
    setLearningProfile(getLearningProfile());
    setSuggestions(generateSmartSuggestions());
    setAnalyticsHistory(getAnalyticsHistory());
  }, []);

  // Save credentials (now just refreshes connection check)
  const handleSaveCredentials = async () => {
    try {
      const res = await fetch('/api/metricool/config');
      const data = await res.json();
      setIsConfigured(data.connected === true);
      if (data.connected) {
        setCredentials({
          userToken: '***server-side***',
          blogId: data.blogId || '',
          userId: data.userId || '',
        });
      }
    } catch {
      setIsConfigured(false);
    }
    setShowSettings(false);
  };

  // Refresh analytics
  const handleRefreshAnalytics = useCallback(async () => {
    if (!isConfigured) return;
    setLoading(true);
    try {
      const data = await getLast30DaysSummary();
      setSummary(data);
      const score = calculatePerformanceScore(data);
      setPerformanceScore(score);
      storeAnalyticsSnapshot(data);
      setAnalyticsHistory(getAnalyticsHistory());

      // Update learning profile
      const updatedProfile = updateLearningFromPerformance();
      setLearningProfile(updatedProfile);
      setSuggestions(generateSmartSuggestions());
    } catch (error) {
      console.error('[Dashboard] Failed to refresh:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Add default competitors
  const handleAddDefaultCompetitors = () => {
    for (const comp of DEFAULT_COMPETITORS) {
      const existing = competitors.find(c => c.handle === comp.handle);
      if (!existing) {
        const added = addCompetitor(comp);
        setCompetitors(prev => [...prev, added]);
      }
    }
  };

  // Remove competitor
  const handleRemoveCompetitor = (id: string) => {
    removeCompetitor(id);
    setCompetitors(prev => prev.filter(c => c.id !== id));
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <Brain size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">مركز الذكاء</h2>
              <p className="text-xs text-[var(--text-muted)]">
                Metricool + AI — تحليل وتعلم وتحسين تلقائي
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isConfigured && (
              <button
                onClick={handleRefreshAnalytics}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--obsidian-light)] border border-[var(--obsidian-border)] text-xs text-[var(--text-muted)] hover:text-[var(--gold)] hover:border-[var(--gold)] transition-all"
              >
                {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                تحديث
              </button>
            )}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--obsidian-light)] border border-[var(--obsidian-border)] text-xs text-[var(--text-muted)] hover:text-[var(--gold)] hover:border-[var(--gold)] transition-all"
            >
              <Settings size={12} />
              إعدادات
            </button>
          </div>
        </div>

        {/* Connection Status */}
        <div className="flex items-center gap-2 text-xs">
          <div className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-[var(--text-muted)]">
            {isConfigured ? 'Metricool متصل — النظام الذكي يعمل' : 'Metricool غير متصل — أضف بيانات الاتصال'}
          </span>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mt-4 p-4 rounded-xl bg-[var(--obsidian-light)] border border-[var(--obsidian-border)] space-y-3">
            <h4 className="text-sm font-bold text-[var(--gold)]">حالة اتصال Metricool</h4>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Token يُقرأ تلقائياً من Vercel Environment Variables — لا تحتاج إدخال شيء هنا.
              تأكد من إضافة <code className="bg-black/30 px-1.5 py-0.5 rounded text-[10px]">METRICOOL_API_TOKEN</code> في Vercel.
            </p>
            {isConfigured && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 space-y-1">
                <p className="text-xs text-green-400 font-medium">متصل بنجاح</p>
                {credentials.blogId && (
                  <p className="text-[10px] text-[var(--text-muted)]">Blog ID: {credentials.blogId}</p>
                )}
                {credentials.userId && (
                  <p className="text-[10px] text-[var(--text-muted)]">User ID: {credentials.userId}</p>
                )}
              </div>
            )}
            {!isConfigured && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                <p className="text-xs text-red-400">غير متصل — أضف METRICOOL_API_TOKEN في Vercel ثم أعد النشر</p>
              </div>
            )}
            <button
              onClick={handleSaveCredentials}
              className="w-full py-2 rounded-lg bg-[var(--gold)] text-black text-xs font-bold hover:opacity-90 transition-opacity"
            >
              إعادة فحص الاتصال
            </button>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-1 p-1.5 bg-[var(--obsidian-light)] rounded-xl overflow-x-auto">
        {[
          { key: 'overview', label: 'نظرة عامة', icon: BarChart3 },
          { key: 'analytics', label: 'التحليلات', icon: TrendingUp },
          { key: 'competitors', label: 'المنافسون', icon: Users },
          { key: 'learning', label: 'التعلم الذاتي', icon: Brain },
          { key: 'suggestions', label: 'اقتراحات ذكية', icon: Lightbulb },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveSection(key as any)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg transition-all text-xs font-medium whitespace-nowrap ${
              activeSection === key
                ? 'bg-[var(--gold)] text-black'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* ══════ Overview Section ══════ */}
      {activeSection === 'overview' && (
        <div className="space-y-4">
          {/* Performance Score */}
          <div className="glass-card p-6 text-center">
            <div className="relative w-32 h-32 mx-auto mb-4">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="var(--obsidian-border)" strokeWidth="8" />
                <circle
                  cx="60" cy="60" r="50" fill="none"
                  stroke={performanceScore >= 70 ? '#22c55e' : performanceScore >= 40 ? '#eab308' : '#ef4444'}
                  strokeWidth="8"
                  strokeDasharray={`${(performanceScore / 100) * 314} 314`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-[var(--text-primary)]">{performanceScore}</span>
                <span className="text-xs text-[var(--text-muted)]">من 100</span>
              </div>
            </div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">نقاط الأداء</h3>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              {performanceScore >= 70 ? 'أداء ممتاز! استمر بنفس الاستراتيجية' :
               performanceScore >= 40 ? 'أداء جيد — هناك مجال للتحسين' :
               'يحتاج تحسين — اتبع الاقتراحات الذكية'}
            </p>
          </div>

          {/* Quick Stats */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'المنشورات', value: summary.totalPosts, icon: Eye, color: 'text-blue-400' },
                { label: 'التفاعل', value: summary.totalEngagement.toLocaleString(), icon: Heart, color: 'text-red-400' },
                { label: 'الوصول', value: summary.totalImpressions.toLocaleString(), icon: TrendingUp, color: 'text-green-400' },
                { label: 'معدل التفاعل', value: `${summary.avgEngagementRate.toFixed(1)}%`, icon: Zap, color: 'text-yellow-400' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="glass-card p-4 text-center">
                  <Icon size={20} className={`mx-auto mb-2 ${color}`} />
                  <p className="text-lg font-bold text-[var(--text-primary)]">{value}</p>
                  <p className="text-xs text-[var(--text-muted)]">{label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Recommendations */}
          {summary && summary.recommendations.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="text-sm font-bold text-[var(--gold)] mb-3 flex items-center gap-2">
                <Lightbulb size={16} />
                توصيات فورية
              </h3>
              <div className="space-y-2">
                {summary.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-[var(--text-secondary)] leading-relaxed">
                    <CheckCircle2 size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isConfigured && (
            <div className="glass-card p-6 text-center space-y-3">
              <AlertCircle size={32} className="mx-auto text-yellow-400" />
              <h3 className="text-sm font-bold text-[var(--text-primary)]">اربط حسابك بـ Metricool</h3>
              <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
                لتفعيل النظام الذكي الكامل — التحليلات، تحليل المنافسين، والتعلم الذاتي — اربط حسابك بـ Metricool API
              </p>
              <button
                onClick={() => setShowSettings(true)}
                className="px-6 py-2 rounded-lg bg-[var(--gold)] text-black text-xs font-bold hover:opacity-90 transition-opacity"
              >
                إعداد Metricool
              </button>
            </div>
          )}
        </div>
      )}

      {/* ══════ Analytics Section ══════ */}
      {activeSection === 'analytics' && (
        <div className="space-y-4">
          {summary ? (
            <>
              {/* Best Posting Times */}
              {Object.keys(summary.bestPostingTimes).length > 0 && (
                <div className="glass-card p-5">
                  <h3 className="text-sm font-bold text-[var(--gold)] mb-3 flex items-center gap-2">
                    <Clock size={16} />
                    أفضل أوقات النشر (بناءً على بياناتك)
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {Object.entries(summary.bestPostingTimes).map(([platform, time]) => (
                      <div key={platform} className="p-3 rounded-lg bg-[var(--obsidian-light)] border border-[var(--obsidian-border)] text-center">
                        <p className="text-xs text-[var(--text-muted)] capitalize">{platform}</p>
                        <p className="text-lg font-bold text-[var(--gold)]">{time}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Best Post */}
              {summary.bestPerformingPost && (
                <div className="glass-card p-5">
                  <h3 className="text-sm font-bold text-[var(--gold)] mb-3 flex items-center gap-2">
                    <Award size={16} />
                    أفضل منشور أداءً
                  </h3>
                  <div className="p-3 rounded-lg bg-[var(--obsidian-light)] border border-[var(--obsidian-border)]">
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-2">
                      {summary.bestPerformingPost.text?.substring(0, 200) || 'بدون نص'}
                    </p>
                    <div className="flex gap-4 text-xs text-[var(--text-muted)]">
                      <span className="flex items-center gap-1"><Heart size={12} className="text-red-400" /> {summary.bestPerformingPost.likes}</span>
                      <span className="flex items-center gap-1"><MessageCircle size={12} className="text-blue-400" /> {summary.bestPerformingPost.comments}</span>
                      <span className="flex items-center gap-1"><Share2 size={12} className="text-green-400" /> {summary.bestPerformingPost.shares}</span>
                      <span className="flex items-center gap-1"><Eye size={12} /> {summary.bestPerformingPost.impressions}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Performance History */}
              {analyticsHistory.length > 0 && (
                <div className="glass-card p-5">
                  <h3 className="text-sm font-bold text-[var(--gold)] mb-3 flex items-center gap-2">
                    <TrendingUp size={16} />
                    تطور الأداء
                  </h3>
                  <div className="flex items-end gap-1 h-24">
                    {analyticsHistory.slice(-30).map((entry, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t"
                        style={{
                          height: `${Math.max(4, entry.score)}%`,
                          backgroundColor: entry.score >= 70 ? '#22c55e' :
                            entry.score >= 40 ? '#eab308' : '#ef4444',
                          opacity: 0.6 + (i / 30) * 0.4,
                        }}
                        title={`${entry.date}: ${entry.score} نقطة`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-1">
                    <span>قبل 30 يوم</span>
                    <span>اليوم</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="glass-card p-6 text-center space-y-3">
              <BarChart3 size={32} className="mx-auto text-[var(--text-muted)]" />
              <p className="text-sm text-[var(--text-muted)]">
                {isConfigured
                  ? 'اضغط "تحديث" لجلب التحليلات من Metricool'
                  : 'اربط Metricool لعرض التحليلات'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ══════ Competitors Section ══════ */}
      {activeSection === 'competitors' && (
        <div className="space-y-4">
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[var(--gold)] flex items-center gap-2">
                <Users size={16} />
                المنافسون ({competitors.length})
              </h3>
              <button
                onClick={handleAddDefaultCompetitors}
                className="text-xs text-[var(--gold)] hover:underline"
              >
                + إضافة منافسين افتراضيين
              </button>
            </div>

            {competitors.length === 0 ? (
              <div className="text-center py-6 space-y-2">
                <Users size={24} className="mx-auto text-[var(--text-muted)]" />
                <p className="text-xs text-[var(--text-muted)]">لم تتم إضافة منافسين بعد</p>
                <button
                  onClick={handleAddDefaultCompetitors}
                  className="px-4 py-2 rounded-lg bg-[var(--gold)] text-black text-xs font-bold"
                >
                  إضافة منافسين صناعة العطور
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {competitors.map(comp => (
                  <div key={comp.id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--obsidian-light)] border border-[var(--obsidian-border)]">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{comp.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">{comp.handle} — {comp.platform}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveCompetitor(comp.id)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      حذف
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Insights */}
          {insights.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="text-sm font-bold text-[var(--gold)] mb-3 flex items-center gap-2">
                <Target size={16} />
                رؤى من تحليل المنافسين
              </h3>
              <div className="space-y-3">
                {insights.map((insight, i) => (
                  <div key={i} className="p-3 rounded-lg bg-[var(--obsidian-light)] border border-[var(--obsidian-border)]">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        insight.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                        insight.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {insight.priority === 'high' ? 'عالي' : insight.priority === 'medium' ? 'متوسط' : 'منخفض'}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">{insight.categoryAr}</span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">{insight.insightAr}</p>
                    <p className="text-xs text-[var(--gold)] mt-1">{insight.actionableAr}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Content Ideas */}
          {contentIdeas.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="text-sm font-bold text-[var(--gold)] mb-3 flex items-center gap-2">
                <Lightbulb size={16} />
                أفكار محتوى مستوحاة من المنافسين
              </h3>
              <div className="space-y-2">
                {contentIdeas.slice(0, 5).map((idea, i) => (
                  <div key={i} className="p-3 rounded-lg bg-[var(--obsidian-light)] border border-[var(--obsidian-border)]">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-[var(--text-primary)]">{idea.titleAr}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        idea.estimatedEngagement === 'high' ? 'bg-green-500/20 text-green-400' :
                        idea.estimatedEngagement === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {idea.estimatedEngagement === 'high' ? 'تفاعل عالي' : idea.estimatedEngagement === 'medium' ? 'تفاعل متوسط' : 'تفاعل منخفض'}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">{idea.descriptionAr}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {idea.hashtags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--gold)]/10 text-[var(--gold)]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════ Learning Section ══════ */}
      {activeSection === 'learning' && (
        <div className="space-y-4">
          {learningProfile && (
            <>
              {/* Confidence Level */}
              <div className="glass-card p-5">
                <h3 className="text-sm font-bold text-[var(--gold)] mb-3 flex items-center gap-2">
                  <Brain size={16} />
                  مستوى التعلم الذاتي
                </h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="h-3 rounded-full bg-[var(--obsidian-light)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${learningProfile.confidenceLevel}%`,
                          background: learningProfile.confidenceLevel >= 70
                            ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                            : learningProfile.confidenceLevel >= 40
                            ? 'linear-gradient(90deg, #eab308, #ca8a04)'
                            : 'linear-gradient(90deg, #ef4444, #dc2626)',
                        }}
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-[10px] text-[var(--text-muted)]">
                      <span>ثقة: {learningProfile.confidenceLevel}%</span>
                      <span>{learningProfile.totalPostsAnalyzed} منشور محلل</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-2">
                  {learningProfile.confidenceLevel < 30
                    ? 'النظام يحتاج المزيد من البيانات — انشر أكثر ليتعلم'
                    : learningProfile.confidenceLevel < 70
                    ? 'النظام يتعلم — النتائج تتحسن مع كل منشور'
                    : 'النظام واثق من توصياته — البيانات كافية'}
                </p>
              </div>

              {/* Audience Preferences */}
              <div className="glass-card p-5">
                <h3 className="text-sm font-bold text-[var(--gold)] mb-3">تفضيلات جمهورك المُكتشفة</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'يفضل الفيديو', value: learningProfile.audiencePreferences.prefersVideo },
                    { label: 'يفضل الأسئلة', value: learningProfile.audiencePreferences.prefersQuestions },
                    { label: 'يفضل الإيموجي', value: learningProfile.audiencePreferences.prefersEmoji },
                    { label: 'يفضل دعوة التفاعل', value: learningProfile.audiencePreferences.prefersCTA },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center gap-2 p-2 rounded-lg bg-[var(--obsidian-light)]">
                      <div className={`w-3 h-3 rounded-full ${value ? 'bg-green-400' : 'bg-red-400'}`} />
                      <span className="text-xs text-[var(--text-secondary)]">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Best Hashtags */}
              <div className="glass-card p-5">
                <h3 className="text-sm font-bold text-[var(--gold)] mb-3 flex items-center gap-2">
                  <Hash size={16} />
                  أفضل الهاشتاقات أداءً
                </h3>
                <div className="flex flex-wrap gap-2">
                  {learningProfile.bestPerformingHashtags.map(tag => (
                    <span key={tag} className="text-xs px-3 py-1 rounded-full bg-[var(--gold)]/10 text-[var(--gold)] border border-[var(--gold)]/20">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Optimal Settings per Platform */}
              <div className="glass-card p-5">
                <h3 className="text-sm font-bold text-[var(--gold)] mb-3">الإعدادات المثلى لكل منصة</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-[var(--text-muted)] border-b border-[var(--obsidian-border)]">
                        <th className="text-right py-2 pr-2">المنصة</th>
                        <th className="text-center py-2">طول الكابشن</th>
                        <th className="text-center py-2">عدد الهاشتاقات</th>
                        <th className="text-center py-2">أفضل وقت</th>
                        <th className="text-center py-2">أفضل نوع</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(learningProfile.optimalCaptionLength).map(platform => (
                        <tr key={platform} className="border-b border-[var(--obsidian-border)]/50">
                          <td className="py-2 pr-2 text-[var(--text-primary)] capitalize font-medium">{platform}</td>
                          <td className="py-2 text-center text-[var(--text-secondary)]">{learningProfile.optimalCaptionLength[platform]} حرف</td>
                          <td className="py-2 text-center text-[var(--text-secondary)]">{learningProfile.optimalHashtagCount[platform]}</td>
                          <td className="py-2 text-center text-[var(--gold)]">{learningProfile.bestPostingHours[platform]}:00</td>
                          <td className="py-2 text-center text-[var(--text-secondary)]">{learningProfile.bestContentTypes[platform]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ══════ Suggestions Section ══════ */}
      {activeSection === 'suggestions' && (
        <div className="space-y-4">
          <div className="glass-card p-5">
            <h3 className="text-sm font-bold text-[var(--gold)] mb-3 flex items-center gap-2">
              <Zap size={16} />
              اقتراحات ذكية لتحسين الأداء
            </h3>
            <p className="text-xs text-[var(--text-muted)] mb-4">
              بناءً على تحليل {getPerformanceHistory().length} منشور وبيانات المنافسين
            </p>

            {suggestions.length > 0 ? (
              <div className="space-y-3">
                {suggestions.map((suggestion, i) => (
                  <div key={i} className="p-4 rounded-xl bg-[var(--obsidian-light)] border border-[var(--obsidian-border)]">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        suggestion.impact === 'high' ? 'bg-red-500/20 text-red-400' :
                        suggestion.impact === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {suggestion.impact === 'high' ? 'تأثير عالي' : suggestion.impact === 'medium' ? 'تأثير متوسط' : 'تأثير منخفض'}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">{suggestion.typeAr}</span>
                    </div>
                    <p className="text-sm text-[var(--text-primary)] font-medium">{suggestion.suggestionAr}</p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-1">
                      بناءً على: {suggestion.basedOn} ({suggestion.dataPoints} نقطة بيانات)
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Lightbulb size={24} className="mx-auto text-[var(--text-muted)] mb-2" />
                <p className="text-xs text-[var(--text-muted)]">
                  ابدأ بالنشر لتحصل على اقتراحات ذكية مخصصة لك
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
