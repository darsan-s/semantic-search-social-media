'use client';

import { useState, useEffect } from 'react';
import { dbService } from '../lib/database';

const DatabaseStatus = () => {
  const [totalPosts, setTotalPosts] = useState(0);
  const [postsWithEmbeddings, setPostsWithEmbeddings] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const allPosts = await dbService.getAllPosts();
        const postsWithEmbeddings = await dbService.getPostsWithEmbeddings();
        
        setTotalPosts(allPosts.length);
        setPostsWithEmbeddings(postsWithEmbeddings.length);
      } catch (error) {
        console.error('Error loading database stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, []);

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-blue-900">Database Status</h3>
          <p className="text-xs text-blue-700 mt-1">
            {totalPosts} total posts • {postsWithEmbeddings} with embeddings
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${postsWithEmbeddings > 0 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
          <span className="text-xs text-blue-700">
            {postsWithEmbeddings > 0 ? 'Embeddings Ready' : 'No Embeddings'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DatabaseStatus;
