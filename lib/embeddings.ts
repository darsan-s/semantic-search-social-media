import { dbService } from './database';

export interface EmbeddingResult {
  embeddings: number[];
  model: string;
  generatedAt: Date;
}

export class EmbeddingService {
  private static instance: EmbeddingService;
  
  static getInstance(): EmbeddingService {
    if (!EmbeddingService.instance) {
      EmbeddingService.instance = new EmbeddingService();
    }
    return EmbeddingService.instance;
  }

  /**
   * Generate mock embeddings for a post
   * TODO: Replace with actual Hugging Face model integration
   */
  async generateEmbeddings(text: string, model: string = 'mock-model'): Promise<EmbeddingResult> {
    console.log(`Generating mock embeddings for text using model: ${model}`);
    
    // Generate mock embeddings based on text content
    // This simulates what real embeddings would look like
    const mockEmbeddings = new Array(384).fill(0).map((_, index) => {
      // Create some variation based on text content
      const charCode = text.charCodeAt(index % text.length) || 0;
      return Math.sin(charCode + index) * 0.1 + (Math.random() - 0.5) * 0.2;
    });
    
    return {
      embeddings: mockEmbeddings,
      model,
      generatedAt: new Date(),
    };
  }

  /**
   * Generate embeddings for a post and store them in the database
   */
  async generateAndStoreEmbeddings(postId: string, text: string, model?: string): Promise<void> {
    try {
      const embeddingResult = await this.generateEmbeddings(text, model);
      await dbService.updatePostEmbeddings(
        postId,
        embeddingResult.embeddings,
        embeddingResult.model
      );
    } catch (error) {
      console.error('Error generating and storing embeddings:', error);
      throw error;
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  /**
   * Perform semantic search using vector similarity
   */
  async semanticSearch(query: string, limit: number = 3): Promise<Array<{ postId: string; similarityScore: number }>> {
    try {
      // Generate embeddings for the query
      const queryEmbeddings = await this.generateEmbeddings(query);
      
      // Get all posts with embeddings
      const postsWithEmbeddings = await dbService.getPostsWithEmbeddings();
      
      if (postsWithEmbeddings.length === 0) {
        return [];
      }

      // Calculate similarity scores for all posts
      const similarityScores = postsWithEmbeddings
        .map(post => ({
          postId: post.id,
          similarityScore: this.calculateCosineSimilarity(queryEmbeddings.embeddings, post.embeddings!)
        }))
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, limit);

      return similarityScores;
    } catch (error) {
      console.error('Error performing semantic search:', error);
      throw error;
    }
  }

  /**
   * Batch generate embeddings for all posts without embeddings
   */
  async generateEmbeddingsForAllPosts(): Promise<void> {
    try {
      const postsWithoutEmbeddings = await dbService.getAllPosts();
      const postsNeedingEmbeddings = postsWithoutEmbeddings.filter(
        post => !post.embeddings || !post.embeddingGeneratedAt
      );

      console.log(`Generating embeddings for ${postsNeedingEmbeddings.length} posts`);

      for (const post of postsNeedingEmbeddings) {
        const text = `${post.title} ${post.content}`;
        await this.generateAndStoreEmbeddings(post.id, text);
      }
    } catch (error) {
      console.error('Error generating embeddings for all posts:', error);
      throw error;
    }
  }
}

export const embeddingService = EmbeddingService.getInstance();
