# 🚀 Matany.one // Autonomous AI Platform & Virtual Memory Engine

**Matany.one** is a modern, high-performance web platform for unconstrained conversational AI powered by **Magnum v4 72B (Anthracite Org)** and **DeepSeek Vision**, equipped with a 1-Million Token Virtual Context Engine, Cyber Intelligence Recon, and WebAuthn Biometric verification.

---

## ✨ Features

- **⚡ Magnum v4 72B Core**: Powered by Anthracite Org's Opus-grade prose engine for unrestricted, natural, and expressive multi-turn dialogue in fluent Arabic.
- **🧬 NSFW NANO (+21 MAX) Silicon Architecture**: Unconstrained adult/intimate/creative mode with mandatory WebAuthn Biometric (Fingerprint / Face ID) verification.
- **👁️ DeepSeek Vision Integration**: Multimodal image attachment analysis with auto-detected vision engine (`Fathom Cam`).
- **🧠 1M-Token Episodic Context Engine**: Verbatim multi-turn history up to 24 turns, accompanied by dynamic episodic memory ledger.
- **🛑 Real-time Stream Control**: Frontend and backend `AbortController` cancellation for instant token and bandwidth saving.
- **☁️ Supabase Cloud Synchronization**: Full chat persistence, Google OAuth sign-in, and cross-device synchronization.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Vite
- **Backend**: Express.js, TypeScript (`tsx`), Server-Sent Events (SSE)
- **AI Providers**: OpenRouter (`anthracite-org/magnum-v4-72b`), DeepSeek API
- **Auth & Storage**: WebAuthn Biometrics, Supabase

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
PORT=5001
OPENROUTER_API_KEY=your_openrouter_api_key
DEEPSEEK_API_KEY=your_deepseek_api_key
```

### 3. Run Development Servers
```bash
# Start backend server (port 5001)
npm run dev:server

# Start frontend client (port 3000)
npm run dev:client
```

### 4. Build for Production
```bash
npm run build
```
