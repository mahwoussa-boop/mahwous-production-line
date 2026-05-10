// ============================================================
// lib/smartScheduler.ts — Smart Scheduling Engine
// Suggests optimal posting times per platform,
// auto-suggests next day to avoid duplicate posts,
// manages content calendar with multi-format support
// ============================================================

// ── Best Posting Times (Saudi Arabia timezone UTC+3) ──────────────────────────
// Based on social media engagement research for Saudi/Gulf audience

export interface TimeSlot {
  hour: number;
  minute: number;
  label: string;
  engagementLevel: 'peak' | 'high' | 'medium';
}

export interface PlatformSchedule {
  platformId: string;
  platformName: string;
  platformNameAr: string;
  icon: string;
  color: string;
  bestTimes: TimeSlot[];
  contentTypes: ContentType[];
}

export type ContentType = 'post' | 'story' | 'reels' | 'video' | 'short' | 'tweet' | 'pin' | 'snap' | 'status' | 'ad';

export interface ScheduledItem {
  id: string;
  perfumeName: string;
  perfumeBrand: string;
  productUrl: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:mm
  platformId: string;
  contentType: ContentType;
  status: 'scheduled' | 'published' | 'failed' | 'draft';
  imageUrl?: string;
  videoUrl?: string;
  caption?: string;
  createdAt: string;
}

export interface DailyPlan {
  date: string;
  items: ScheduledItem[];
}

// ── Platform Schedules ────────────────────────────────────────────────────────

export const PLATFORM_SCHEDULES: PlatformSchedule[] = [
  {
    platformId: 'instagram',
    platformName: 'Instagram',
    platformNameAr: 'انستقرام',
    icon: 'instagram',
    color: '#E1306C',
    bestTimes: [
      { hour: 7, minute: 0, label: 'صباحاً — بداية اليوم', engagementLevel: 'high' },
      { hour: 12, minute: 0, label: 'وقت الغداء', engagementLevel: 'peak' },
      { hour: 17, minute: 0, label: 'بعد العمل', engagementLevel: 'high' },
      { hour: 21, minute: 0, label: 'المساء — ذروة التفاعل', engagementLevel: 'peak' },
    ],
    contentTypes: ['post', 'story', 'reels'],
  },
  {
    platformId: 'tiktok',
    platformName: 'TikTok',
    platformNameAr: 'تيك توك',
    icon: 'tiktok',
    color: '#010101',
    bestTimes: [
      { hour: 9, minute: 0, label: 'صباحاً', engagementLevel: 'high' },
      { hour: 12, minute: 0, label: 'وقت الغداء', engagementLevel: 'peak' },
      { hour: 19, minute: 0, label: 'المساء', engagementLevel: 'peak' },
      { hour: 22, minute: 0, label: 'ليلاً — أعلى تفاعل', engagementLevel: 'peak' },
    ],
    contentTypes: ['video', 'story'],
  },
  {
    platformId: 'snapchat',
    platformName: 'Snapchat',
    platformNameAr: 'سناب شات',
    icon: 'snapchat',
    color: '#FFFC00',
    bestTimes: [
      { hour: 10, minute: 0, label: 'صباحاً', engagementLevel: 'high' },
      { hour: 14, minute: 0, label: 'بعد الظهر', engagementLevel: 'peak' },
      { hour: 20, minute: 0, label: 'المساء', engagementLevel: 'peak' },
    ],
    contentTypes: ['snap', 'story'],
  },
  {
    platformId: 'youtube',
    platformName: 'YouTube',
    platformNameAr: 'يوتيوب',
    icon: 'youtube',
    color: '#FF0000',
    bestTimes: [
      { hour: 14, minute: 0, label: 'بعد الظهر', engagementLevel: 'high' },
      { hour: 17, minute: 0, label: 'بعد العمل', engagementLevel: 'peak' },
      { hour: 21, minute: 0, label: 'المساء', engagementLevel: 'peak' },
    ],
    contentTypes: ['video', 'short'],
  },
  {
    platformId: 'twitter',
    platformName: 'Twitter / X',
    platformNameAr: 'تويتر / إكس',
    icon: 'twitter',
    color: '#1DA1F2',
    bestTimes: [
      { hour: 8, minute: 0, label: 'صباحاً', engagementLevel: 'high' },
      { hour: 12, minute: 0, label: 'وقت الغداء', engagementLevel: 'peak' },
      { hour: 17, minute: 0, label: 'بعد العمل', engagementLevel: 'high' },
      { hour: 21, minute: 0, label: 'المساء', engagementLevel: 'peak' },
    ],
    contentTypes: ['tweet', 'video'],
  },
  {
    platformId: 'facebook',
    platformName: 'Facebook',
    platformNameAr: 'فيسبوك',
    icon: 'facebook',
    color: '#1877F2',
    bestTimes: [
      { hour: 9, minute: 0, label: 'صباحاً', engagementLevel: 'high' },
      { hour: 13, minute: 0, label: 'بعد الغداء', engagementLevel: 'peak' },
      { hour: 19, minute: 0, label: 'المساء', engagementLevel: 'peak' },
    ],
    contentTypes: ['post', 'story', 'reels', 'video'],
  },
  {
    platformId: 'linkedin',
    platformName: 'LinkedIn',
    platformNameAr: 'لينكد إن',
    icon: 'linkedin',
    color: '#0A66C2',
    bestTimes: [
      { hour: 8, minute: 0, label: 'صباحاً — بداية الدوام', engagementLevel: 'peak' },
      { hour: 12, minute: 0, label: 'وقت الغداء', engagementLevel: 'high' },
      { hour: 17, minute: 0, label: 'نهاية الدوام', engagementLevel: 'high' },
    ],
    contentTypes: ['post', 'video'],
  },
  {
    platformId: 'telegram',
    platformName: 'Telegram',
    platformNameAr: 'تلقرام',
    icon: 'telegram',
    color: '#0088CC',
    bestTimes: [
      { hour: 10, minute: 0, label: 'صباحاً', engagementLevel: 'high' },
      { hour: 20, minute: 0, label: 'المساء', engagementLevel: 'peak' },
    ],
    contentTypes: ['post'],
  },
  {
    platformId: 'whatsapp',
    platformName: 'WhatsApp',
    platformNameAr: 'واتساب',
    icon: 'whatsapp',
    color: '#25D366',
    bestTimes: [
      { hour: 9, minute: 0, label: 'صباحاً', engagementLevel: 'high' },
      { hour: 18, minute: 0, label: 'المساء', engagementLevel: 'peak' },
    ],
    contentTypes: ['status'],
  },
  {
    platformId: 'pinterest',
    platformName: 'Pinterest',
    platformNameAr: 'بنترست',
    icon: 'pinterest',
    color: '#E60023',
    bestTimes: [
      { hour: 14, minute: 0, label: 'بعد الظهر', engagementLevel: 'peak' },
      { hour: 21, minute: 0, label: 'المساء', engagementLevel: 'peak' },
    ],
    contentTypes: ['pin'],
  },
  {
    platformId: 'haraj',
    platformName: 'Haraj',
    platformNameAr: 'حراج',
    icon: 'haraj',
    color: '#00A859',
    bestTimes: [
      { hour: 10, minute: 0, label: 'صباحاً', engagementLevel: 'peak' },
      { hour: 16, minute: 0, label: 'بعد العصر', engagementLevel: 'high' },
    ],
    contentTypes: ['ad'],
  },
];

// ── Content Type Labels ───────────────────────────────────────────────────────

export const CONTENT_TYPE_LABELS: Record<ContentType, { ar: string; en: string; emoji: string }> = {
  post: { ar: 'بوست', en: 'Post', emoji: '📝' },
  story: { ar: 'ستوري', en: 'Story', emoji: '📱' },
  reels: { ar: 'ريلز', en: 'Reels', emoji: '🎬' },
  video: { ar: 'فيديو', en: 'Video', emoji: '🎥' },
  short: { ar: 'شورت', en: 'Short', emoji: '📹' },
  tweet: { ar: 'تغريدة', en: 'Tweet', emoji: '🐦' },
  pin: { ar: 'بن', en: 'Pin', emoji: '📌' },
  snap: { ar: 'سناب', en: 'Snap', emoji: '👻' },
  status: { ar: 'حالة', en: 'Status', emoji: '💬' },
  ad: { ar: 'إعلان', en: 'Ad', emoji: '📢' },
};

// ── Storage Keys ──────────────────────────────────────────────────────────────

const SCHEDULE_STORAGE_KEY = 'mahwous_schedule';
const HISTORY_STORAGE_KEY = 'mahwous_post_history';

// ── Helper Functions ──────────────────────────────────────────────────────────

function getStoredSchedule(): ScheduledItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(SCHEDULE_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveSchedule(items: ScheduledItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(items));
}

function getPostHistory(): ScheduledItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(HISTORY_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function savePostHistory(items: ScheduledItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(items));
}

function generateId(): string {
  return `sch_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

// ── Smart Scheduling Functions ────────────────────────────────────────────────

/**
 * Get the next available date that doesn't have a scheduled post for the same perfume.
 * Checks existing schedule and suggests the next free day.
 */
export function getNextAvailableDate(perfumeName?: string): string {
  const schedule = getStoredSchedule();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find all dates that already have posts
  const scheduledDates = new Set(
    schedule
      .filter(item => item.status === 'scheduled' || item.status === 'draft')
      .map(item => item.scheduledDate)
  );

  // Start from today and find the next free date
  let checkDate = new Date(today);
  let maxDays = 60; // Don't look more than 60 days ahead

  while (maxDays > 0) {
    const dateStr = checkDate.toISOString().split('T')[0];

    // Check if this date already has posts for this perfume
    const hasPostForPerfume = perfumeName
      ? schedule.some(item =>
          item.scheduledDate === dateStr &&
          item.perfumeName === perfumeName &&
          (item.status === 'scheduled' || item.status === 'draft')
        )
      : false;

    // Count posts on this date
    const postsOnDate = schedule.filter(
      item => item.scheduledDate === dateStr &&
        (item.status === 'scheduled' || item.status === 'draft')
    ).length;

    // If no posts for this perfume and not too many posts total
    if (!hasPostForPerfume && postsOnDate < 3) {
      return dateStr;
    }

    checkDate.setDate(checkDate.getDate() + 1);
    maxDays--;
  }

  // Fallback to today
  return today.toISOString().split('T')[0];
}

/**
 * Suggest the best posting time for a specific platform on a given date.
 */
export function suggestBestTime(platformId: string, date: string): TimeSlot | null {
  const platform = PLATFORM_SCHEDULES.find(p => p.platformId === platformId);
  if (!platform) return null;

  const schedule = getStoredSchedule();

  // Get times already scheduled on this date
  const scheduledTimes = schedule
    .filter(item => item.scheduledDate === date && item.status === 'scheduled')
    .map(item => item.scheduledTime);

  // Find the best available time (prefer peak, then high, then medium)
  const sortedTimes = [...platform.bestTimes].sort((a, b) => {
    const priority = { peak: 0, high: 1, medium: 2 };
    return priority[a.engagementLevel] - priority[b.engagementLevel];
  });

  for (const slot of sortedTimes) {
    const timeStr = `${String(slot.hour).padStart(2, '0')}:${String(slot.minute).padStart(2, '0')}`;
    // Check if this time is not too close to an existing scheduled post (within 30 min)
    const tooClose = scheduledTimes.some(st => {
      const [h, m] = st.split(':').map(Number);
      const diff = Math.abs((h * 60 + m) - (slot.hour * 60 + slot.minute));
      return diff < 30;
    });

    if (!tooClose) return slot;
  }

  // If all peak times are taken, return the first one anyway
  return sortedTimes[0] || null;
}

/**
 * Generate a full daily content plan for all platforms.
 * Returns suggested schedule items for one perfume across all platforms.
 */
export function generateDailyPlan(
  perfumeName: string,
  perfumeBrand: string,
  productUrl: string,
  date: string,
  images: { story?: string; post?: string; landscape?: string },
  videos: { vertical?: string; horizontal?: string },
  captions: Record<string, string>,
  videoCaptions: Record<string, string>,
): ScheduledItem[] {
  const items: ScheduledItem[] = [];

  for (const platform of PLATFORM_SCHEDULES) {
    const bestTime = suggestBestTime(platform.platformId, date);
    if (!bestTime) continue;

    const timeStr = `${String(bestTime.hour).padStart(2, '0')}:${String(bestTime.minute).padStart(2, '0')}`;

    for (const contentType of platform.contentTypes) {
      // Determine which media to use
      let imageUrl: string | undefined;
      let videoUrl: string | undefined;
      let caption: string | undefined;

      switch (contentType) {
        case 'story':
        case 'snap':
        case 'status':
          imageUrl = images.story;
          caption = captions[`${platform.platformId}_story`] || captions[platform.platformId] || captions.snapchat || captions.whatsapp;
          break;
        case 'reels':
        case 'short':
          videoUrl = videos.vertical;
          caption = videoCaptions[`${platform.platformId}_reels`] || videoCaptions[`${platform.platformId}_video`] || videoCaptions.tiktok_video;
          break;
        case 'video':
          videoUrl = platform.platformId === 'tiktok' ? videos.vertical : videos.horizontal;
          caption = videoCaptions[`${platform.platformId}_video`] || videoCaptions.tiktok_video;
          break;
        case 'post':
        case 'tweet':
          imageUrl = platform.platformId === 'twitter' || platform.platformId === 'linkedin'
            ? images.landscape
            : images.post;
          caption = captions[`${platform.platformId}_post`] || captions[platform.platformId] || captions.twitter;
          break;
        case 'pin':
          imageUrl = images.story;
          caption = captions.pinterest;
          break;
        case 'ad':
          imageUrl = images.post;
          caption = captions.haraj;
          break;
      }

      // Skip if no media available for this type
      if (!imageUrl && !videoUrl) continue;

      items.push({
        id: generateId(),
        perfumeName,
        perfumeBrand,
        productUrl,
        scheduledDate: date,
        scheduledTime: timeStr,
        platformId: platform.platformId,
        contentType,
        status: 'draft',
        imageUrl,
        videoUrl,
        caption,
        createdAt: new Date().toISOString(),
      });
    }
  }

  return items;
}

// ── CRUD Operations ───────────────────────────────────────────────────────────

export function addScheduledItems(items: ScheduledItem[]): void {
  const schedule = getStoredSchedule();
  schedule.push(...items);
  saveSchedule(schedule);
}

export function updateScheduledItem(id: string, updates: Partial<ScheduledItem>): void {
  const schedule = getStoredSchedule();
  const idx = schedule.findIndex(item => item.id === id);
  if (idx !== -1) {
    schedule[idx] = { ...schedule[idx], ...updates };
    saveSchedule(schedule);
  }
}

export function removeScheduledItem(id: string): void {
  const schedule = getStoredSchedule();
  saveSchedule(schedule.filter(item => item.id !== id));
}

export function getScheduledItems(): ScheduledItem[] {
  return getStoredSchedule();
}

export function getScheduleByDate(date: string): ScheduledItem[] {
  return getStoredSchedule().filter(item => item.scheduledDate === date);
}

export function getScheduleByPlatform(platformId: string): ScheduledItem[] {
  return getStoredSchedule().filter(item => item.platformId === platformId);
}

export function markAsPublished(id: string): void {
  const schedule = getStoredSchedule();
  const idx = schedule.findIndex(item => item.id === id);
  if (idx !== -1) {
    const item = { ...schedule[idx], status: 'published' as const };
    schedule.splice(idx, 1);
    saveSchedule(schedule);

    // Move to history
    const history = getPostHistory();
    history.unshift(item);
    savePostHistory(history);
  }
}

export function markAsFailed(id: string): void {
  updateScheduledItem(id, { status: 'failed' });
}

// ── Schedule All (Bulk) ───────────────────────────────────────────────────────

export function scheduleAll(items: ScheduledItem[]): void {
  const updated = items.map(item => ({ ...item, status: 'scheduled' as const }));
  addScheduledItems(updated);
}

export function scheduleSingle(item: ScheduledItem): void {
  addScheduledItems([{ ...item, status: 'scheduled' }]);
}

// ── History ───────────────────────────────────────────────────────────────────

export function getHistory(): ScheduledItem[] {
  return getPostHistory();
}

export function clearHistory(): void {
  savePostHistory([]);
}

export function clearSchedule(): void {
  saveSchedule([]);
}

// ── Export Schedule as CSV ────────────────────────────────────────────────────────────

export function exportScheduleCSV(items: ScheduledItem[]): void {
  const headers = [
    'perfume_name',
    'perfume_brand',
    'product_url',
    'scheduled_date',
    'scheduled_time',
    'platform',
    'content_type',
    'status',
    'image_url',
    'video_url',
    'caption',
  ];

  const rows = items.map(item => [
    item.perfumeName,
    item.perfumeBrand,
    item.productUrl,
    item.scheduledDate,
    item.scheduledTime,
    item.platformId,
    item.contentType,
    item.status,
    item.imageUrl || '',
    item.videoUrl || '',
    `"${(item.caption || '').replace(/"/g, '""')}"`,
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mahwous-schedule-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Calendar View Helpers ─────────────────────────────────────────────────────

export function getCalendarDays(month: number, year: number): DailyPlan[] {
  const schedule = getStoredSchedule();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const plans: DailyPlan[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const items = schedule.filter(item => item.scheduledDate === date);
    plans.push({ date, items });
  }

  return plans;
}

export function getDaysWithPosts(): string[] {
  const schedule = getStoredSchedule();
  return [...new Set(schedule.map(item => item.scheduledDate))];
}
