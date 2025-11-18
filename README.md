# Coach Labeler Possession Tracking

A Next.js application for tracking and analyzing possession data in sports coaching.

## Features

- **Game Setup**: Configure teams and rosters using ESPN data integration
- **Possession Tracking**: Record and track possession phases, groups, and player actions
- **Player Actions**: Log detailed player activities during possessions
- **Outcome Analysis**: Track possession outcomes and results
- **Action Summaries**: View aggregated statistics and summaries
- **Export Data**: Export tracking data to CSV format
- **Statistics Table**: Comprehensive stat tracking and visualization

## Tech Stack

- **Framework**: Next.js 14.2.10
- **Language**: TypeScript
- **Styling**: CSS with PostCSS
- **UI**: React 18.2.0

## Getting Started

### Prerequisites

- Node.js (v20 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/coach-labeler-possession-tracking.git
cd coach-labeler-possession-tracking
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   └── espn/         # ESPN data integration endpoints
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout component
│   └── page.tsx          # Home page
├── components/            # React components
│   ├── ActionSummaries.tsx    # Display action summaries
│   ├── ExportPanel.tsx        # Data export functionality
│   ├── GameSetup.tsx          # Game configuration
│   ├── OutcomePanel.tsx       # Outcome tracking
│   ├── PhasesGroups.tsx       # Phase and group management
│   ├── PlayerActions.tsx      # Player action tracking
│   ├── PossessionBuilder.tsx  # Possession building interface
│   ├── RecordingFlow.tsx      # Main recording workflow
│   ├── RosterEditor.tsx       # Team roster management
│   └── StatTable.tsx          # Statistics display
└── lib/                   # Utility libraries
    ├── csv.ts            # CSV export utilities
    ├── espn.ts           # ESPN API integration
    ├── schema.ts         # Data schemas and types
    └── store.tsx         # State management
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run linter (currently not configured)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is private and proprietary.

