// ============================================================
// lib/engines/memorySystem.ts — Content Memory System
// نظام الذاكرة — منع تكرار المحتوى + ضمان التجدد
// ============================================================

import type { ContentMemory } from '../pipeline/pipelineTypes';

const MEMORY_STORAGE_KEY = 'mahwous_content_memory';
const MAX_MEMORY_ENTRIES = 100;

// ── Memory Operations ──────────────────────────────────────────────────────

export function getProductMemory(productUrl: string): ContentMemory | null {
  if (typeof window === 'undefined') return null;

  try {
    const allMemory = getAllMemory();
    return allMemory.find(m => m.productUrl === productUrl) || null;
  } catch {
    return null;
  }
}

export function saveProductMemory(memory: ContentMemory): void {
  if (typeof window === 'undefined') return;

  try {
    const allMemory = getAllMemory();
    const idx = allMemory.findIndex(m => m.productUrl === memory.productUrl);

    if (idx >= 0) {
      allMemory[idx] = memory;
    } else {
      allMemory.unshift(memory);
    }

    if (allMemory.length > MAX_MEMORY_ENTRIES) allMemory.splice(MAX_MEMORY_ENTRIES);
    localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(allMemory));
  } catch { /* storage full */ }
}

export function getAllMemory(): ContentMemory[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(MEMORY_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

// ── Deduplication ──────────────────────────────────────────────────────────

/**
 * Returns scenes that haven't been used for this product
 */
export function getUnusedScenes(productUrl: string, availableScenes: string[]): string[] {
  const memory = getProductMemory(productUrl);
  if (!memory) return availableScenes;

  const unused = availableScenes.filter(scene => !memory.usedScenes.includes(scene));

  // If all scenes used, reset and return all
  if (unused.length === 0) {
    return availableScenes;
  }

  return unused;
}

/**
 * Returns scenarios that haven't been used for this product
 */
export function getUnusedScenarios(productUrl: string, availableScenarios: string[]): string[] {
  const memory = getProductMemory(productUrl);
  if (!memory) return availableScenarios;

  const unused = availableScenarios.filter(s => !memory.usedScenarios.includes(s));

  if (unused.length === 0) return availableScenarios;
  return unused;
}

/**
 * Returns backgrounds that haven't been used for this product
 */
export function getUnusedBackgrounds(productUrl: string, availableBackgrounds: string[]): string[] {
  const memory = getProductMemory(productUrl);
  if (!memory) return availableBackgrounds;

  const unused = availableBackgrounds.filter(b => !memory.usedBackgrounds.includes(b));

  if (unused.length === 0) return availableBackgrounds;
  return unused;
}

// ── Record Usage ───────────────────────────────────────────────────────────

export function recordUsage(
  productUrl: string,
  usage: {
    scenes?: string[];
    scenarios?: string[];
    backgrounds?: string[];
    captionStyles?: string[];
    contentType?: 'educational' | 'promotional';
  }
): void {
  let memory = getProductMemory(productUrl);

  if (!memory) {
    memory = {
      productId: generateProductId(productUrl),
      productUrl,
      usedScenes: [],
      usedScenarios: [],
      usedBackgrounds: [],
      usedCaptionStyles: [],
      generationHistory: [],
    };
  }

  // Append usage
  if (usage.scenes) {
    memory.usedScenes = [...new Set([...memory.usedScenes, ...usage.scenes])];
  }
  if (usage.scenarios) {
    memory.usedScenarios = [...new Set([...memory.usedScenarios, ...usage.scenarios])];
  }
  if (usage.backgrounds) {
    memory.usedBackgrounds = [...new Set([...memory.usedBackgrounds, ...usage.backgrounds])];
  }
  if (usage.captionStyles) {
    memory.usedCaptionStyles = [...new Set([...memory.usedCaptionStyles, ...usage.captionStyles])];
  }

  // Record in history
  memory.generationHistory.unshift({
    timestamp: new Date().toISOString(),
    contentType: usage.contentType || 'promotional',
    scenes: usage.scenes || [],
    scenarios: usage.scenarios || [],
  });

  // Keep last 50 history entries
  if (memory.generationHistory.length > 50) {
    memory.generationHistory.splice(50);
  }

  saveProductMemory(memory);
}

// ── Statistics ─────────────────────────────────────────────────────────────

export function getMemoryStats(productUrl: string): {
  totalGenerations: number;
  uniqueScenes: number;
  uniqueScenarios: number;
  educationalCount: number;
  promotionalCount: number;
  lastGenerated: string | null;
} {
  const memory = getProductMemory(productUrl);
  if (!memory) {
    return {
      totalGenerations: 0,
      uniqueScenes: 0,
      uniqueScenarios: 0,
      educationalCount: 0,
      promotionalCount: 0,
      lastGenerated: null,
    };
  }

  return {
    totalGenerations: memory.generationHistory.length,
    uniqueScenes: memory.usedScenes.length,
    uniqueScenarios: memory.usedScenarios.length,
    educationalCount: memory.generationHistory.filter(h => h.contentType === 'educational').length,
    promotionalCount: memory.generationHistory.filter(h => h.contentType === 'promotional').length,
    lastGenerated: memory.generationHistory[0]?.timestamp || null,
  };
}

// ── Clear Memory ───────────────────────────────────────────────────────────

export function clearProductMemory(productUrl: string): void {
  if (typeof window === 'undefined') return;
  try {
    const allMemory = getAllMemory();
    const filtered = allMemory.filter(m => m.productUrl !== productUrl);
    localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(filtered));
  } catch { /* ignore */ }
}

export function clearAllMemory(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(MEMORY_STORAGE_KEY);
}

// ── Helpers ────────────────────────────────────────────────────────────────

function generateProductId(url: string): string {
  // Extract product slug from URL
  const parts = url.split('/');
  const slug = parts[parts.length - 1] || parts[parts.length - 2] || 'unknown';
  return slug.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
}
