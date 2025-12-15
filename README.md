# Zen Gomoku (Five-in-a-Row)

## Overview / 簡介
- A 15x15 Gomoku web app with Free and Forbidden rule sets, local PvP, and an AI (Gemini) opponent.
- 五子棋網頁版，支援自由規則與禁手規則、雙人本機對戰，以及 Gemini 驅動的電腦對手。

## Features / 功能
- Switchable rule sets (Free or Forbidden) with visual warnings for forbidden moves.
- Game modes: Player vs Player or Player vs AI, with last move and winning line highlights.
- Responsive board with wood-style UI and quick reset.
- Env-based Gemini API key loading for AI suggestions.

## Getting Started / 開始使用
1. Install prerequisites: Node.js 18+ and `pnpm`.
2. Install dependencies:
   - `cd frontend`
   - `pnpm install`
3. Configure environment:
   - Create `frontend/.env.local` and set `GEMINI_API_KEY=<your-key>`.
4. Run locally:
   - `pnpm dev`
   - Open the served URL shown in the terminal (default: `http://localhost:5173`).

## Build / Preview
- Build for production: `pnpm build`
- Preview the build: `pnpm preview`

## Project Structure / 專案結構
- `frontend/` – Vite + React app source.
- `frontend/services/gomokuLogic.ts` – Core Gomoku rules (win/forbidden checks).
- `frontend/services/geminiService.ts` – Gemini-powered AI move helper.

## Notes
- Ensure your Gemini API key has quota to enable the AI opponent; otherwise, switch to PvP mode.
- 禁手模式僅限制黑方，遇到禁手會顯示警示提示。

