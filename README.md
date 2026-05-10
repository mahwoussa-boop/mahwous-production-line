# 🌹 Perfume Brand AI — Campaign Generator

A production-ready Next.js application that generates high-quality 3D promotional images for perfume brands, featuring a consistent Arab male brand ambassador, using the Replicate AI pipeline.

---

## 🚀 Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
# Fill in your API keys in .env.local
```

### 3. Run development server

```bash
npm run dev
# Open http://localhost:3000
```

---

## 🔑 Required API Keys

| Service | Purpose | Get Key |
|---------|---------|---------|
| **Replicate** | AI image generation (FLUX + LoRA) | [replicate.com/account/api-tokens](https://replicate.com/account/api-tokens) |
| **Anthropic Claude** | Product analysis, captions, bottle description | [console.anthropic.com](https://console.anthropic.com) |

---

## 📁 Project Structure

```
perfume-brand-ai/
├── app/
│   ├── globals.css              # Luxury design system (gold/obsidian theme)
│   ├── layout.tsx               # Root layout + Google Fonts
│   ├── page.tsx                 # Main application page (client)
│   └── api/
│       ├── generate/route.ts    # POST: Generates 3 images via Replicate
│       ├── scrape/route.ts      # POST: Scrapes product URL + Claude analysis
│       ├── captions/route.ts    # POST: Generates Arabic social captions
│       └── analyze-bottle/route.ts  # POST: Claude Vision → bottle description
├── components/
│   ├── ImageUpload.tsx          # Drag-drop bottle image + auto-analysis
│   ├── UrlScraper.tsx           # Product URL input + scrape button
│   ├── VibeAttireSelector.tsx   # Dropdowns for vibe and attire
│   ├── LoraConfig.tsx           # Collapsible LoRA model configuration
│   ├── OutputGrid.tsx           # 3-column generated images display
│   └── CaptionDisplay.tsx       # Arabic captions with copy buttons
└── lib/
    ├── types.ts                 # TypeScript type definitions
    ├── promptEngine.ts          # Dynamic prompt construction (THE CORE)
    ├── replicateClient.ts       # Replicate API integration + pipeline
    └── scraper.ts               # Cheerio-based product page scraper
```

---

## 🧠 AI Pipeline Architecture

```
User Input
    │
    ├─ URL Mode: Product URL → Scraper → Claude Analysis → Auto-fill
    └─ Manual Mode: Direct text input
    
    │
    ├─ Bottle Image → Claude Vision → Precise bottle description
    │
    ▼
Prompt Engine (lib/promptEngine.ts)
    │
    ├─ LoRA trigger word (face consistency)
    ├─ Attire description (from ATTIRE_MAP)
    ├─ Vibe/scene description (from VIBE_MAP)
    ├─ Hand-bottle interaction (anatomically precise)
    ├─ Bottle description (from Claude Vision)
    └─ Quality modifiers
    
    │
    ▼
Replicate API (3x parallel calls)
    │
    ├─ Story format (9:16 — 1080×1920)
    ├─ Post format (1:1 — 1024×1024)
    └─ Landscape format (16:9 — 1920×1080)
    
    │
    ▼
Output: 3 generated images + Arabic captions
```

---

## 🎯 Solving the Core Challenges

### 1. Facial Consistency (LoRA)
The app accepts a HuggingFace LoRA model ID trained on your character's face. The LoRA trigger word is placed **first** in the prompt (highest attention weight) for maximum consistency.

**How to train a LoRA:**
1. Collect 15-20 high-quality photos of your character
2. Use [Replicate's LoRA trainer](https://replicate.com/ostris/flux-dev-lora-trainer) or HuggingFace AutoTrain
3. Paste the model ID in the LoRA configuration panel

### 2. Product Fidelity (3-Layer Strategy)
| Layer | Method | Ensures |
|-------|--------|---------|
| **Layer 1** | Claude Vision → bottle description injected into prompt | Shape, color, proportions |
| **Layer 2** | Image-to-image with low strength (0.35) | Visual reference |
| **Layer 3** | ControlNet (enable via `USE_CONTROLNET=true`) | Hard structural edges |

### 3. Natural Hand-Bottle Interaction
The prompt engine specifies:
- Which hand (right)
- Exact grip anatomy (thumb position, finger wrap)
- Bottle tilt angle (15°) so the label faces camera
- Relative bottle position (chest-to-waist height)
- Explicit prohibition of floating/clipping in negative prompt

### 4. Dynamic Context
The `VIBE_MAP` and `ATTIRE_MAP` in `lib/promptEngine.ts` contain 8 detailed scene descriptions and 5 attire descriptions. Claude automatically selects the best combination when scraping a product URL based on the perfume's notes and character.

---

## ⚙️ Environment Variables

```bash
# Required
REPLICATE_API_TOKEN=r8_...
ANTHROPIC_API_KEY=sk-ant-...

# Optional: Default LoRA (pre-fills the UI)
NEXT_PUBLIC_DEFAULT_LORA_MODEL=username/arab-man-face-lora
NEXT_PUBLIC_DEFAULT_LORA_TRIGGER=sks man

# Optional: Enable advanced ControlNet pipeline
USE_CONTROLNET=true

# Optional: Override model IDs
REPLICATE_FLUX_LORA_MODEL=lucataco/flux-dev-lora:...
REPLICATE_CONTROLNET_MODEL=xlabs-ai/flux-dev-controlnet:...
```

---

## 🔄 Extending the App

### Add a new vibe
In `lib/promptEngine.ts`, add an entry to `VIBE_MAP`:

```typescript
my_new_vibe: {
  label: 'My New Vibe',
  arabicLabel: 'الاسم العربي',
  description: 'detailed scene description...',
  lighting: 'lighting description...',
  mood: 'mood words...',
  colorPalette: 'color1, color2',
},
```

### Switch to a different AI model
Update the model ID in `.env.local` or directly in `lib/replicateClient.ts`.

### Add more social platforms (TikTok, LinkedIn)
Extend the captions API route prompt in `app/api/captions/route.ts`.

---

## 📊 Expected Generation Time

| Setting | Estimated Time |
|---------|---------------|
| Without LoRA, without bottle image | 30-50 seconds |
| With LoRA only | 45-70 seconds |
| With LoRA + bottle reference | 60-90 seconds |
| With LoRA + ControlNet | 90-120 seconds |

*All 3 aspect ratios are generated simultaneously (parallel API calls).*

---

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + custom CSS design system
- **AI Images:** Replicate (FLUX Dev + LoRA)
- **AI Text:** Anthropic Claude (Opus)
- **Scraping:** Cheerio
- **UI:** React Dropzone, Lucide Icons

---

## 📜 License

Private commercial license. All rights reserved.
