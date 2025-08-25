'use client';

import { useState, useEffect } from 'react';
import { Post } from '../lib/database';
import { PostWithScore } from '../types';
import PostCard from './PostCard';
import SearchBar from './SearchBar';
import { dbService } from '../lib/database';

interface PostFeedProps {
  posts: Post[];
  onLike: (postId: string) => void;
}

const PostFeed = ({ posts, onLike }: PostFeedProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPosts, setFilteredPosts] = useState<PostWithScore[]>(posts.map(post => ({ ...post, similarityScore: 0 })));
  const [isSearching, setIsSearching] = useState(false);

  // Cosine similarity function for comparing embeddings
  const calculateCosineSimilarity = (vecA: number[], vecB: number[]): number => {
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
  };

  // Update filtered posts when posts or search term changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredPosts(posts.map(post => ({ ...post, similarityScore: 0 })));
    } else {
      // Use external API server for semantic search
      const performSemanticSearch = async () => {
        setIsSearching(true);
        try {
          const response = await fetch(`http://localhost:4075/generate-search-embeddings?searchKey=${encodeURIComponent(searchTerm)}`, {
            method: 'GET',
          });

          if (response.ok) {
            const data = await response.json();
            
            if (data.searchEmbeddings && Array.isArray(data.searchEmbeddings)) {
              // Get all posts with embeddings from the database
              const postsWithEmbeddings = posts.filter(post => post.embeddings && post.embeddings.length > 0);
              
              if (postsWithEmbeddings.length > 0) {
                // Calculate cosine similarity scores for all posts
                const postsWithScores = postsWithEmbeddings.map(post => {
                  const similarityScore = calculateCosineSimilarity(data.searchEmbeddings, post.embeddings!);
                  return {
                    ...post,
                    similarityScore
                  };
                });
                
                // Sort by similarity score (descending order)
                const sortedResults = postsWithScores
                  .sort((a, b) => b.similarityScore - a.similarityScore)
                  .filter(post => post.similarityScore > 0.1); // Filter out very low similarity scores
                
                if (sortedResults.length > 0) {
                  setFilteredPosts(sortedResults);
                } else {
                  // Fallback to client-side search if no good semantic matches
                  const fallbackResults = posts.filter(post =>
                    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    post.author.toLowerCase().includes(searchTerm.toLowerCase())
                  );
                  setFilteredPosts(fallbackResults.map(post => ({ ...post, similarityScore: 0 })));
                }
              } else {
                // No posts with embeddings, fallback to client-side search
                const fallbackResults = posts.filter(post =>
                  post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  post.author.toLowerCase().includes(searchTerm.toLowerCase())
                );
                setFilteredPosts(fallbackResults.map(post => ({ ...post, similarityScore: 0 })));
              }
            } else {
              // No searchEmbeddings in response, fallback to client-side search
              const fallbackResults = posts.filter(post =>
                post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                post.author.toLowerCase().includes(searchTerm.toLowerCase())
              );
              setFilteredPosts(fallbackResults.map(post => ({ ...post, similarityScore: 0 })));
            }
          } else {
            throw new Error('Semantic search failed');
          }
        } catch (error) {
          console.error('Error in semantic search:', error);
          // Fallback to client-side search
          const fallbackResults = posts.filter(post =>
            post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
            post.author.toLowerCase().includes(searchTerm.toLowerCase())
          );
          setFilteredPosts(fallbackResults.map(post => ({ ...post, similarityScore: 0 })));
        } finally {
          setIsSearching(false);
        }
      };

      // Debounce the search to avoid too many API calls
      const timeoutId = setTimeout(() => {
        performSemanticSearch();
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm, posts]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
        <p className="text-gray-600">Be the first to create a post and start the conversation!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <SearchBar 
          searchTerm={searchTerm} 
          onSearchChange={handleSearchChange} 
        />
        {searchTerm && (
          <div className="text-center mt-2">
            {isSearching ? (
              <div className="flex items-center justify-center space-x-2 text-sm text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Searching semantically...</span>
              </div>
            ) : (
              <div className="text-sm text-gray-600">
                <p>Showing {filteredPosts.length} of {posts.length} posts</p>
                {searchTerm && filteredPosts.length > 0 && filteredPosts[0].similarityScore > 0 && (
                  <p className="text-xs text-blue-600 mt-1">
                    Top result similarity: {(filteredPosts[0].similarityScore * 100).toFixed(1)}%
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {filteredPosts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
          <p className="text-gray-600">Try adjusting your search terms or browse all posts.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredPosts.map((post) => (
            <PostCard 
              key={post.id} 
              post={post}
              onLike={onLike} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PostFeed;
