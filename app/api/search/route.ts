import { NextRequest, NextResponse } from 'next/server';
import { embeddingService } from '../../../lib/embeddings';
import { dbService } from '../../../lib/database';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }

    // Perform semantic search using embeddings
    const similarityResults = await embeddingService.semanticSearch(query, 3);
    
    if (similarityResults.length === 0) {
      return NextResponse.json({ results: [] });
    }

    // Get the full post details for the top results
    const allPosts = await dbService.getAllPosts();
    const results = similarityResults
      .map(result => {
        const post = allPosts.find(p => p.id === result.postId);
        if (post) {
          return {
            ...post,
            similarityScore: result.similarityScore
          };
        }
        return null;
      })
      .filter(Boolean)
      .sort((a, b) => (b as any).similarityScore - (a as any).similarityScore);

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error in semantic search API:', error);
    return NextResponse.json(
      { error: 'Internal server error during search' },
      { status: 500 }
    );
  }
} 
