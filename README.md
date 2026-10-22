<div align="center">

# 🎵 CReEPUSIK Web

**Your Music. Synchronized. Ad-Free. Everywhere.**

A state-of-the-art open-source music streaming web application and social listening platform. Stream any track with high fidelity, create synchronized listening rooms with live chat, discover community playlists synced across devices, and enjoy a sleek modern UI built with React 19, TypeScript, and Tailwind CSS.

[![Latest Release](https://img.shields.io/badge/Release-v1.6.11-c3ec52?style=for-the-badge&logo=android&logoColor=black)](https://github.com/CREESPYG/CReESPUSIK/releases/tag/v1.6.11)
[![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20PWA-121318?style=for-the-badge&logo=vite&logoColor=c3ec52)](https://github.com/CREESPYG/CReESPUSIK)
[![React 19](https://img.shields.io/badge/React-19.3-121318?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![Vercel Ready](https://img.shields.io/badge/Deploy-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)
[![Supabase](https://img.shields.io/badge/Realtime-Supabase-121318?style=for-the-badge&logo=supabase&logoColor=3ECF8E)](https://supabase.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-121318?style=for-the-badge&logo=open-source-initiative&logoColor=c3ec52)](LICENSE)

<br/>

[🚀 **Live Web App**](#-getting-started) &nbsp;•&nbsp; [📦 **GitHub Release & Android APK**](https://github.com/CREESPYG/CReESPUSIK/releases/tag/v1.6.11) &nbsp;•&nbsp; [✨ Features](#-key-features) &nbsp;•&nbsp; [🛠️ Tech Stack](#-technology-stack)

</div>

---

## ⚡ Highlights

- 🎧 **Ad-Free High-Fidelity Audio**: Pure, uninterrupted playback with zero commercials, background audio streaming, and instant play from playlists.
- 👥 **Real-Time "Listen Together" Rooms**: Join or host live rooms with zero lag and dual-channel permission synchronization powered by Supabase Realtime presence and broadcast channels.
- 🔴 **Live Room Indications**: Live indicators on desktop rail, mobile tab bar, and home dashboard banner whenever rooms are active.
- 💬 **Integrated Live Room Chat**: Communicate in real time with fellow listeners inside the room or via the global drawer from any screen.
- 🌐 **Global (Community) Playlist Sync**: Create **Public (Global)** or **Private** playlists. Public playlists automatically sync to Supabase Cloud so other listeners worldwide can discover and play them.
- 💾 **Persistent Web Library**: Client-side resilient library powered by `localStorage` mirroring — your favorites, playlists, and history are always preserved.
- 🎨 **State-of-the-Art Aesthetic**: Crafted with modern dark mode, fluid typography (Geist), vibrant accent themes, glassmorphism, and micro-animations.

---

## 📦 Android App Releases (v1.6.11)

Android APK builds are published directly in the **[GitHub Releases section](https://github.com/CREESPYG/CReESPUSIK/releases/tag/v1.6.11)**:

| File | Type | Signature | Size | Download |
|------|------|-----------|------|----------|
| `CReEPUSIK-v1.6.11.apk` | **Production Release** | **v2 + v3 Signed** | `~6.4 MB` | [📥 Download via GitHub Release](https://github.com/CREESPYG/CReESPUSIK/releases/tag/v1.6.11) |

### 📲 How to Install on Android
1. Download `CReEPUSIK-v1.6.11.apk` from the [GitHub Releases](https://github.com/CREESPYG/CReESPUSIK/releases/tag/v1.6.11) page.
2. Tap **Install** (if prompted, allow *Install unknown apps* in your browser/file manager).
3. Open **CReEPUSIK** and enjoy unlimited music streaming!

### 🆕 What's New in v1.6.11
- **Real Vector Character Avatar Arts:** Replaced emoji avatars with 16 bespoke vector character art portraits (8 boys and 8 girls) tailored for music listeners and artists. Fully offline, crisp on all resolutions, and synchronized across rooms and live chat.
- **Android App Device Badges:** Real-time presence badge (`DeviceMobileIcon`) displayed beside members who join from the native CReEPUSIK Android app.
- **Strict Directory & Presence Cleanup:** Automatic session clearance on page close/refresh plus continuous live-presence directory pruning eliminates phantom rooms and ghost listeners.
- **Interruption-Free Room Sync:** 5-second drift tolerance with no-op remote playback skipping ensures music plays uninterrupted when members join or leave.
- **Native Wake Lock & Playback Hardening:** Long-renewable CPU wake lock in Native PlaybackService guarantees unbroken streaming with the screen off.

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
