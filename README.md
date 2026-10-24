<div align="center">

# 🎵 CReEPUSIK Web

**Your Music. Synchronized. Ad-Free. Everywhere.**

A state-of-the-art open-source music streaming web application and social listening platform. Stream any track with high fidelity, create synchronized listening rooms with live chat and live voice talk, discover community playlists synced across devices, and enjoy a sleek modern UI built with React 19, TypeScript, and Tailwind CSS.

[![Latest Release](https://img.shields.io/badge/Release-v1.7.3-c3ec52?style=for-the-badge&logo=android&logoColor=black)](https://github.com/CREESPYG/CReESPUSIK/releases/tag/v1.7.3)
[![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20PWA-121318?style=for-the-badge&logo=vite&logoColor=c3ec52)](https://github.com/CREESPYG/CReESPUSIK)
[![React 19](https://img.shields.io/badge/React-19.3-121318?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![Vercel Ready](https://img.shields.io/badge/Deploy-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)
[![Supabase](https://img.shields.io/badge/Realtime-Supabase-121318?style=for-the-badge&logo=supabase&logoColor=3ECF8E)](https://supabase.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-121318?style=for-the-badge&logo=open-source-initiative&logoColor=c3ec52)](LICENSE)

<br/>

[🚀 **Live Web App**](#-getting-started) &nbsp;•&nbsp; [📦 **GitHub Release & Android APK**](https://github.com/CREESPYG/CReESPUSIK/releases/tag/v1.7.3) &nbsp;•&nbsp; [✨ Features](#-key-features) &nbsp;•&nbsp; [🛠️ Tech Stack](#-technology-stack)

</div>

---

## ⚡ Highlights

- 🎧 **Ad-Free High-Fidelity Audio**: Pure, uninterrupted playback with zero commercials, background audio streaming, and instant play from playlists.
- 👥 **Real-Time "Listen Together" Rooms**: Join or host live rooms with zero lag and dual-channel permission synchronization powered by Supabase Realtime presence and broadcast channels.
- 🎙️ **Live Voice Chat in Rooms**: Agora-powered voice-only channel with speaking indicators, per-user volume, device switching, and host moderation (mute/kick/disable).
- 🔴 **Live Room Indications**: Live indicators on desktop rail, mobile tab bar, and home dashboard banner whenever rooms are active.
- 💬 **Integrated Live Room Chat**: Communicate in real time with fellow listeners inside the room or via the global drawer from any screen.
- 🌐 **Global (Community) Playlist Sync**: Create **Public (Global)** or **Private** playlists. Public playlists automatically sync to Supabase Cloud so other listeners worldwide can discover and play them.
- 💾 **Persistent Web Library**: Client-side resilient library powered by `localStorage` mirroring — your favorites, playlists, and history are always preserved.
- 🎨 **State-of-the-Art Aesthetic**: Crafted with modern dark mode, fluid typography (Geist), vibrant accent themes, glassmorphism, and micro-animations.

- 🎥 **True Android App Behavior**: Minimized playback with native MediaStyle notification + lock-screen controls, and **real-time room message notifications** as proper Android notifications (heads-up, tap-to-open).

---

## 📦 Android App Releases (v1.7.3)

Android APK builds are published directly in the **[GitHub Releases section](https://github.com/CREESPYG/CReESPUSIK/releases/tag/v1.7.3)**:

| File | Type | Signature | Size | Download |
|------|------|-----------|------|----------|
| `CReEPUSIK-v1.7.3.apk` | **Production Release** | **v2 + v3 Signed** | `~6.9 MB` | [📥 Download via GitHub Release](https://github.com/CREESPYG/CReESPUSIK/releases/tag/v1.7.3) |
| `CReEPUSIK-v1.7.2.apk` | Previous release | v2 + v3 Signed | `~6.9 MB` | [📥 Download](https://github.com/CREESPYG/CReESPUSIK/releases/tag/v1.7.2) |

### 📲 How to Install on Android
1. Download `CReEPUSIK-v1.7.3.apk` from the [GitHub Releases](https://github.com/CREESPYG/CReESPUSIK/releases/tag/v1.7.3) page.
2. Tap **Install** (if prompted, allow *Install unknown apps* in your browser/file manager).
3. Open **CReEPUSIK** and enjoy unlimited music streaming!

### 🆕 What's New in v1.7.3
- **Crash Fixed — No More 10-20 Second App Closes:** The playback service now takes the foreground itself with an immediate MediaStyle notification on every start. Previously it depended on Media3 promoting it at the right moment; when playback was starting/paused at that instant Android killed the whole process a few seconds later (`startForegroundService()` without `startForeground()`). The service also stops itself safely if a notification can never be posted, instead of letting Android kill the app.
- **True Spotify/Musike-Style Background Playback:** The foreground service now stays alive for as long as *any* track is loaded — playing, paused, buffering or switching tracks — survives swiping the app out of recents (`stopWithTask=false`), keeps its wake lock renewed every second while playing (long DJ sets / live streams never lose the CPU), and the WebView keeps running minimized so the queue advances through auto-play.
- **Lock-Screen & Bluetooth Controls Now Work:** Next/Previous from the lock screen, headset buttons, Bluetooth and Android Auto are relayed into the app's queue (previously they hit an empty native playlist and did nothing). Play/Pause, seek and the notification buttons all keep working.
- **Instant Media Notification:** Android 12+ no longer defers the media notification by up to 10 seconds (`FOREGROUND_SERVICE_IMMEDIATE`), so the service is foregrounded the moment playback starts.
- **Dead Play Button Fixed:** After the service was torn down, pressing play could silently do nothing because the plugin refused to recreate the native engine. It now always recreates it on demand.
- **Android 7/8 Notification Crash Fixed:** The room-notification plugin used a main-executor API that only exists on Android 9+; notifications now use a plain worker thread so they work on every supported Android version (minSdk 24).
- **MediaSession Discovery:** The playback service now declares the official Media3 `MediaSessionService` intent-filter, so system media UIs (lock screen, Bluetooth, Android Auto) can always bind to the session.

<details>
<summary><strong>What shipped in v1.7.2</strong></summary>

- **Native Android Room Notifications:** WebView has no Notification API, so the app now ships a custom `MusikeNotify` plugin — live room chat messages and member activity arrive as real Android notifications (high-importance channel, vibration, tap-to-open) with the same duplicate-suppression guarantees as the web.
- **Noise Cancellation by Default:** Agora `ANS` noise suppression is enabled by default and can be toggled On/Off in Voice Settings (applies live via track recreation, persisted per user).
- **Google Meet-style Voice Sounds:** Bright two-note chime when someone joins voice, soft descending farewell when someone drops — including self connect/disconnect.
- **Exactly-One System Notifications:** Fully deterministic, actor-stamped system message IDs (join/leave/kick/promote/host-transfer/voice-toggle) plus a roster "already-in-users" guard — no more duplicated "X joined the room" entries no matter how many members are online, across reconnect flaps included.
- **Single Host-Transfer Notification:** The "👑 … is now the Host" line is canonical everywhere (new host gets the same single line as everyone else) and every event carries its true actor timestamp, now rendered on system bubbles.
- **Sender Message Timestamps:** Your own chat bubbles now show delivery time ("Not delivered" hint on failures).
- **Host-Only Clear Chat:** Broom action in Live Room Chat wipes everyone's chat simultaneously and future late joiners start clean.
- **Merged Room Entry:** "Join with Code" (default) and "Create a Room" merged into one card with an option toggle; wider dynamic layout that fills the screen.
- **Ghost-Listener Fix:** Realtime presence-leave truth fast-expires crashed/killed clients within seconds — the list reaches 0 listeners almost immediately, even after abnormal exits.
- **Musike-style pnpm APK Pipeline:** The mobile project is a standalone pnpm workspace (`@musike/web` inside `mobile/`) that copies the web source, builds it with pnpm, and produces the signed APK without touching the main npm project.

</details>

<details>
<summary><strong>What shipped in v1.7.1</strong></summary>

- **Agora-Powered Live Voice Chat in Listening Rooms:** Voice-only Agora RTC channel per room — join/leave, speaking rings, per-user volume (0-150), individual "mute myself" mic control, host moderation (host-mute, force-disconnect, talk/hear permissions), and microphone/speaker device switching via Voice Settings.
- **Automatic Signed Voice Tokens:** New serverless `/api/agora-token` endpoint mints Agora RTC tokens server-side whenever the project's App Certificate is enabled — no manual temporary tokens needed (`AGORA_APP_CERTIFICATE` env var). The client auto-detects and retries joins with the signed token.
- **Duplicate-Free System Notifications:** Shared notification utility with deterministic tags, in-process burst suppression, and cross-tab claiming — chat and voice events never double-fire again.
- **Microphone-Only Voice Capture:** Explicit `AEC + ANS + AGC` processing on every mic track plus automatic screening of OS loopback devices (Stereo Mix / Voicemeeter / etc.) so desktop audio never leaks into the voice channel. The Voice Channel card shows a live "Capturing: &lt;device&gt;" label.
- **Stable Member Avatars:** Presence re-tracks now always carry the avatar and the roster keeps the last known avatar when a metadata refresh lacks one — avatars no longer disappear when hosts moderate the room.
- **Collapsible Host Controls:** The Host Controls panel collapses behind a `-`/`+` toggle so hosts can declutter the room.

<details>
<summary>What shipped in v1.7.0</summary>

- Uninterrupted background playback engine (Musike 1.5.1 reverse engineered): continuous CPU WakeLock retention, MediaStyle ForegroundService promotion, unthrottled background WebView.
- `AUDIO_BECOMING_NOISY` safety, instant async album art on the lock screen notification, 16 real vector character avatar arts.

</details>

</details>

---

## ✨ Key Features

### 1. 👥 Live Listening Rooms ("Listen Together")
- **Instant Host / Join**: Host your own listening broadcast or join active rooms via room code or from the live rooms directory.
- **Synchronized Playback**: Music position and playback state (play/pause/seek/queue) automatically synchronize across all active members.
- **Flexible Playback Control**: Switch between **Host Only** control and **Shared** control.
- **In-Room Live Chat**: Chat stream with live presence badges, member list, and notification indicators.

### 2. 🔍 Instant Search & Google Music Suggestions
- Search songs, artists, albums, and playlists with instant debounce.
- Autocomplete search suggestions directly from Google Music API.

### 3. 🌐 Global Community Playlists
- Discover public community playlists synced worldwide in real time via Supabase.
- Publish your own playlists to the global directory with one click.

### 4. 🎛️ Audio Visualizer & Cinema Mode
- Immersive Cinema visualizer with animated audio waveforms, ambient background lighting, and synced lyrics display.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend Core** | React 19, TypeScript, Vite 8, React Router v8 |
| **State & Data** | Zustand 5, Client-side Persistent Storage |
| **Realtime Engine** | Supabase Realtime (WebSockets, Broadcast, Presence) |
| **Styling & Design** | Tailwind CSS v4, Motion (Framer Motion), Geist Variable Typography |
| **Deployment** | Vercel Serverless Functions (`/api`), PWA (Vite PWA Plugin, Service Worker) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- pnpm (or npm / yarn)

### Installation
```bash
# Clone the repository
git clone https://github.com/CREESPYG/CReESPUSIK.git

# Enter the project directory
cd CReESPUSIK

# Install dependencies
pnpm install

# Start development server
pnpm dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build
```bash
pnpm build
```
The optimized web bundle will be output to `dist/`.

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
