import { Post } from '../lib/database';

// Extended Post interface with similarity score for search results
export interface PostWithScore extends Post {
  similarityScore: number;
}
