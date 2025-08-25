'use client';

import { Post } from '../lib/database';

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
}

const PostCard = ({ post, onLike }: PostCardProps) => {
  const handleLike = () => {
    onLike(post.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleLike();
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <article className="card hover:shadow-md transition-shadow duration-200">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {post.title}
          </h3>
          <p className="text-sm text-gray-600">
            By <span className="font-medium text-primary-600">{post.author}</span>
          </p>
        </div>
        <span className="text-xs text-gray-500">
          {formatDate(post.createdAt)}
        </span>
      </div>
      
      <div className="mb-4">
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>
      </div>
      
      <div className="flex items-center justify-between">
        <button
          onClick={handleLike}
          onKeyDown={handleKeyDown}
          className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg px-3 py-2"
          tabIndex={0}
          aria-label={`Like post by ${post.author}`}
        >
          <svg 
            className="w-5 h-5" 
            fill="currentColor" 
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path 
              fillRule="evenodd" 
              d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" 
              clipRule="evenodd" 
            />
          </svg>
          <span className="font-medium">{post.likes}</span>
        </button>
        
        <div className="flex items-center space-x-4">
          {/* Show similarity score if available (from semantic search) */}
          {(post as any).similarityScore !== undefined && (
            <div className="flex items-center space-x-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              <span>{(post as any).similarityScore.toFixed(3)}</span>
            </div>
          )}
          
          <div className="text-sm text-gray-500">
            {post.likes === 1 ? '1 like' : `${post.likes} likes`}
          </div>
        </div>
      </div>
    </article>
  );
};

export default PostCard;
