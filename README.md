# SocialFeed - Social Media Website

A clean, modern social media platform built with Next.js, React, TypeScript, and TailwindCSS.

## Features

- ✨ **Create Posts**: Write and share posts with titles, content, and author names
- 🔍 **Semantic Search**: AI-powered search using embeddings and cosine similarity
- ❤️ **Like Posts**: Interact with posts by liking them
- 💾 **Data Persistence**: Posts are saved to IndexedDB and persist between sessions
- 📱 **Responsive Design**: Clean, modern UI that works on all devices
- ♿ **Accessibility**: Built with accessibility best practices

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **State Management**: React Hooks (useState, useEffect)
- **Data Storage**: IndexedDB for persistence and future semantic search

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd social-media-app
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/
│   ├── globals.css          # Global styles and TailwindCSS
│   ├── layout.tsx           # Root layout component
│   └── page.tsx             # Main page component
├── components/
│   ├── Header.tsx           # Navigation header
│   ├── SearchBar.tsx        # Post search functionality
│   ├── CreatePostForm.tsx   # Form for creating new posts
│   ├── PostCard.tsx         # Individual post display
│   ├── PostFeed.tsx         # Post feed with search
│   └── DatabaseStatus.tsx   # Database and embedding status
├── lib/
│   ├── database.ts          # IndexedDB service and data models
│   └── embeddings.ts        # Embedding service for semantic search
├── types/
│   └── index.ts             # TypeScript type definitions
├── package.json             # Dependencies and scripts
├── tailwind.config.js       # TailwindCSS configuration
├── tsconfig.json            # TypeScript configuration
└── README.md                # Project documentation
```

## Usage

### Creating Posts
1. Click on the "Create Post" tab
2. Fill in the title, author name, and content
3. Click "Create Post" to publish

### Viewing Posts
- All posts are displayed on the home page
- Posts are sorted by creation date (newest first)
- Each post shows title, author, content, creation time, and like count

### Searching Posts
- Use the search bar to filter posts
- Search works across post titles, content, and author names
- Results update in real-time as you type

### Liking Posts
- Click the heart icon on any post to like it
- Like counts are updated immediately
- All data is persisted in localStorage

## Customization

### Styling
- Modify `tailwind.config.js` to customize colors and theme
- Update `app/globals.css` for custom component styles
- All components use TailwindCSS utility classes

### Features
- Add new post fields by updating the `Post` interface in `lib/database.ts`
- Implement user authentication by extending the data model
- Add comments, sharing, or other social features
- Enable semantic search by implementing embeddings with transformers.js

### Semantic Search Features
The platform now includes AI-powered semantic search:
1. **Automatic Embeddings**: Posts are automatically converted to vector embeddings using Hugging Face models
2. **Cosine Similarity**: Search results are ranked using cosine similarity between query and post embeddings
3. **Real-time Search**: Semantic search API with 300ms debouncing for optimal performance
4. **Fallback Search**: Falls back to text-based search if semantic search fails
5. **Similarity Scores**: Results display similarity scores to show relevance

### Technical Implementation
- Uses `@xenova/transformers` package for embedding generation
- IndexedDB stores 384-dimensional vectors for each post
- API route `/api/search` handles semantic search requests
- Cosine similarity calculation for accurate result ranking

## Building for Production

```bash
npm run build
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).
