'use client';

import { useState, useEffect } from 'react';
import { Post, dbService } from '../lib/database';

const DatabaseInspector = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        await dbService.init();
        const allPosts = await dbService.getAllPosts();
        setPosts(allPosts);
      } catch (error) {
        console.error('Error loading posts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPosts();
  }, []);

  const refreshPosts = async () => {
    setIsLoading(true);
    try {
      const allPosts = await dbService.getAllPosts();
      setPosts(allPosts);
    } catch (error) {
      console.error('Error refreshing posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="card max-w-4xl mx-auto">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-gray-600">Loading posts...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Database Inspector</h2>
        <button
          onClick={refreshPosts}
          className="btn-secondary"
          aria-label="Refresh posts"
        >
          Refresh
        </button>
      </div>

      <div className="mb-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-blue-800 font-medium">
              Total Posts: {posts.length} | 
              Posts with Embeddings: {posts.filter(p => p.embeddings && p.embeddings.length > 0).length} |
              Posts without Embeddings: {posts.filter(p => !p.embeddings || p.embeddings.length === 0).length}
            </span>
          </div>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No posts found in database
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h3>
                  <p className="text-gray-600 mb-2">{post.content}</p>
                  <div className="text-sm text-gray-500">
                    <span>Author: {post.author}</span>
                    <span className="mx-2">•</span>
                    <span>Created: {new Date(post.createdAt).toLocaleString()}</span>
                    <span className="mx-2">•</span>
                    <span>Likes: {post.likes}</span>
                  </div>
                </div>
                
                <div className="ml-4">
                  {post.embeddings && post.embeddings.length > 0 ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center space-x-2 text-green-800">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium">Embeddings ✓</span>
                      </div>
                      <div className="text-xs text-green-600 mt-1">
                        Model: {post.embeddingModel || 'Unknown'}
                      </div>
                      <div className="text-xs text-green-600">
                        Generated: {post.embeddingGeneratedAt ? new Date(post.embeddingGeneratedAt).toLocaleString() : 'Unknown'}
                      </div>
                      <div className="text-xs text-green-600">
                        Dimensions: {post.embeddings.length}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-center space-x-2 text-red-800">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium">No Embeddings ✗</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {post.embeddings && post.embeddings.length > 0 && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-600 mb-2">
                    <strong>Embedding Preview:</strong> First 10 values
                  </div>
                  <div className="text-xs font-mono text-gray-700">
                    [{post.embeddings.slice(0, 10).map((val, i) => 
                      <span key={i} className="inline-block w-16 text-right">{val.toFixed(4)}</span>
                    ).join(', ')}...]
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DatabaseInspector;
