# GamiPhysio AR

**Intelligent, Report-Driven Augmented Reality Rehabilitation System**
with Dynamic Biomechanical Scoring and Guardian Protocols.

> ⚠️ **Decision Support Prototype** — not a registered medical device. Always consult a qualified physiotherapist.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Pose Engine | MediaPipe Pose (client-side) |
| AR Overlay | HTML Canvas 2D + Three.js |
| AI OCR | Gemini 2.0 Flash (Google AI Studio) |
| Database | Supabase (PostgreSQL + JSONB) |
| Styling | Tailwind CSS v3 |
| Deployment | Vercel |

---

## Quick Start

### 1. Clone & install

```bash
git clone https://github.com/your-username/gamiphysio-ar
cd gamiphysio-ar
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run `supabase/schema.sql`
3. Then run `supabase/seed.sql` to load the exercise library
4. Copy your **Project URL** and **anon key** from Project Settings → API

### 3. Configure environment

```bash
cp .env.local.example .env.local
```

Fill in:
```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
GEMINI_API_KEY=your_gemini_key
```

Get your Gemini key at: https://aistudio.google.com/app/apikey

### 4. Add GIF assets

Drop your exercise demonstration GIFs into `/public/gifs/`.

Naming convention: `{bodypart}_{severity}_{movement}.gif`

Examples:
```
public/gifs/
  neck_mild_rotation.gif
  neck_mild_flexion.gif
  knee_moderate_wall_squat.gif
  ankle_mild_calf_raise.gif
  ...
```

The seed data already has the correct `gif_asset` filenames — just drop the files in.

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## User Flow

```
Home → Upload Report → AI Extracts Plan → Select Exercise → AR Session → Profile/Calendar
```

1. **Upload** — Drag and drop your X-ray or medical PDF
2. **Plan** — Review the AI-extracted exercise plan, filter by body part / severity
3. **Session** — Full-screen AR session with live joint tracking and 1–5 rep scoring
4. **Profile** — Recovery calendar heatmap, streak tracking, session history

---

## Safety Features

| Feature | Description |
|---|---|
| Guardian Protocol | Severe exercises require 2 people detected in frame |
| Voice Safety | "STOP" or "HELP" pauses/ends session immediately |
| Jitter Detection | High-movement frames trigger automatic rest prompt |
| Form Jitter Pause | Auto-pauses session, shows rest overlay |
| Liability Buffer | App always shows "Decision Support Prototype" disclaimer |

---

## Scoring System

Each rep is graded **1–5** based on joint angle precision:

| Score | Label | Description |
|---|---|---|
| 5 | Perfect | Angle within ±5° of target |
| 4 | Great | Angle within ±10° of target |
| 3 | Good | Angle within ±15° of target |
| 2 | Fair | Angle within ±20° of target |
| 1 | Poor | Outside all tolerance bands |

**Session Score** = sum of all rep scores + overachieve bonus (2pts/extra rep)

---

## Database Schema

```
profiles          — anonymous user, total_points, streak_days
exercises         — Gold Standard exercise library (35 exercises seeded)
sessions          — historical AR sessions with rep_scores JSONB
report_extractions — Gemini OCR output (purgeable after plan confirmed)
daily_summary     — VIEW: aggregated daily stats for calendar heatmap
```

---

## Development

```bash
npm run dev        # start dev server
npm run build      # production build
npm run type-check # TypeScript check
npm run lint       # ESLint
```

---

## Deployment (Vercel)

```bash
vercel deploy
```

Set the same env vars in Vercel Dashboard → Project Settings → Environment Variables.

---

## Phase Roadmap

- [x] Phase 1 — DB schema, seed data, config, types, lib
- [x] Phase 2 — MediaPipe pose hook, scoring hook, voice safety, timer
- [x] Phase 3 — AR Canvas, GIF preview, Guardian overlay, Session HUD, all UI components
- [x] Phase 4 — Upload page, Plan page, Session page, Profile page
- [x] Phase 5 — Polish, README, deploy config
- [ ] Phase 6 (future) — Auth (Supabase Auth), multi-user, physio dashboard

---

## Adding New Exercises

1. Insert a row into the `exercises` table with the correct `angle_config` JSONB
2. Drop the `.gif` file in `/public/gifs/`
3. The OCR pipeline will automatically match it via keyword overlap

---

## License

MIT
