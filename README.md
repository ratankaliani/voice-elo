# Voice ELO Evaluation System

A web application for evaluating and comparing 11labs voices using an ELO rating system.

## Features

- **Voice Management**: Admin dashboard to add, edit, and manage voices
- **Script Management**: Create and manage different scripts for testing voices
- **Voice Comparison**: Compare two voices side-by-side and select the winner
- **ELO Scoring**: Automatic ELO score calculation based on comparisons
- **Leaderboard**: View current rankings of all voices

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (install with `curl -fsSL https://bun.sh/install | bash`)

### Installation

1. Install dependencies:
```bash
bun install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env and add your API keys
```

3. Set up the database:
```bash
bun run db:push
bun run db:generate
```

4. Start the development server:
```bash
bun run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Admin Dashboard (`/admin`)

1. **Add Voices**: Click "Add Voice" and enter:
   - Name (e.g., "Professional Male")
   - 11labs Voice ID (the actual voice ID from 11labs)
   - Optional description

2. **Add Scripts**: Click "Add Script" and enter:
   - Title
   - Content (the text to be spoken)
   - Optional category (e.g., "conversational", "narrative")

### Compare Voices (`/`)

1. Select a script from the dropdown
2. Choose two voices to compare
3. Click which voice sounds better (or "Tie")
4. ELO scores are automatically updated

### Leaderboard (`/leaderboard`)

View all voices ranked by their current ELO score. Higher scores indicate better-performing voices.

## Database Schema

- **Voice**: Stores voice information (name, 11labs ID, description)
- **Script**: Stores test scripts
- **Comparison**: Records each comparison made
- **EloScore**: Tracks ELO rating for each voice (starts at 1500)

## ELO Rating System

The ELO system uses a K-factor of 32, meaning ratings can change significantly with each comparison. The starting ELO score is 1500.

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Prisma** (ORM)
- **SQLite** (Database)
- **Tailwind CSS** (Styling)
