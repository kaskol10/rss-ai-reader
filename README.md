# RSS AI Reader

A **privacy-first** RSS reader with AI-powered summaries, inspired by Hacker News design. Built with React, TypeScript, and OpenAI integration.

## 🔒 Privacy & Security

This RSS reader is designed with privacy as the top priority:

- **No Data Collection**: No analytics, tracking, or data collection
- **Local Storage Only**: All your feeds, prompts, and settings are stored locally in your browser
- **Anonymous AI Requests**: AI summaries use anonymous requests with no user identification
- **No Server**: Runs entirely in your browser - no backend server to store your data
- **Open Source**: Full source code available for transparency and audit
- **No Third-Party Tracking**: No Google Analytics, Facebook pixels, or other tracking scripts

## Features

- 📰 **RSS Feed Parsing** - Read RSS feeds with clean, Hacker News-style interface
- 🤖 **AI Summaries** - Generate custom AI summaries using OpenAI GPT
- ⚙️ **Customizable Prompts** - Create and manage custom AI summary prompts
- 🎨 **Hacker News UI** - Clean, minimalist design inspired by Hacker News
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile devices
- ⚡ **Real-time Updates** - Refresh feeds and generate summaries on demand

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd rss-ai
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env
```

4. Add your OpenAI API key to `.env`:
```
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

5. Start the development server:
```bash
npm run dev
```

6. Open your browser and navigate to `http://localhost:3000`

## Usage

### Reading RSS Feeds

The app starts by loading the Hacker News RSS feed. You can:
- Click on any article to view details
- Use the refresh button to reload the feed
- View article summaries and full content

### AI Summaries

1. Select an article from the feed
2. Choose a summary prompt from the available options
3. Click "Generate AI Summary" to create a custom summary
4. Add your own custom prompts using the "Add Custom" button

### Custom Prompts

Create custom AI summary prompts for different use cases:
- Technical summaries for developers
- Business summaries for executives
- Casual summaries for general readers
- Or any other specific format you prefer

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **RSS Parsing**: rss-parser
- **AI Integration**: OpenAI API
- **Icons**: Lucide React

## Project Structure

```
src/
├── components/          # React components
│   ├── Header.tsx      # App header with refresh
│   ├── FeedList.tsx    # RSS feed list display
│   ├── ArticleDetail.tsx # Article detail view
│   └── PromptSelector.tsx # AI prompt management
├── services/           # API services
│   ├── rssService.ts   # RSS feed parsing
│   └── aiService.ts    # OpenAI integration
├── types/              # TypeScript type definitions
│   └── index.ts
├── App.tsx            # Main app component
├── main.tsx           # App entry point
└── index.css          # Global styles
```

## Future Enhancements

- [ ] Desktop app with Electron
- [ ] Mobile apps with React Native
- [ ] Offline support and caching
- [ ] Multiple RSS feed support
- [ ] Local AI model integration
- [ ] User authentication and preferences
- [ ] Export summaries to various formats

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

