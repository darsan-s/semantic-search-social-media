'use client';

import { useState, useEffect } from 'react';
import Header from '../components/Header';
import CreatePostForm from '../components/CreatePostForm';
import PostFeed from '../components/PostFeed';
import DatabaseStatus from '../components/DatabaseStatus';
import DatabaseInspector from '../components/DatabaseInspector';
import { Post, CreatePostData, dbService } from '../lib/database';
import { embeddingService } from '../lib/embeddings';

const HomePage = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeSection, setActiveSection] = useState<'home' | 'create' | 'inspect'>('home');
  const [isGeneratingEmbeddings, setIsGeneratingEmbeddings] = useState(false);
  const [embeddingError, setEmbeddingError] = useState<string | null>(null);
  const [embeddingSuccess, setEmbeddingSuccess] = useState<string | null>(null);

  // Initialize database and load posts on component mount
  useEffect(() => {
    const initializeDB = async () => {
      try {
        await dbService.init();
        const allPosts = await dbService.getAllPosts();
        setPosts(allPosts);
      } catch (error) {
        console.error('Error initializing database:', error);
      }
    };

    initializeDB();
  }, []);

  // Auto-clear success messages after 5 seconds
  useEffect(() => {
    if (embeddingSuccess) {
      const timer = setTimeout(() => {
        setEmbeddingSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [embeddingSuccess]);

  // Auto-clear error messages after 5 seconds
  useEffect(() => {
    if (embeddingError) {
      const timer = setTimeout(() => {
        setEmbeddingError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [embeddingError]);

  const handleCreatePost = async (postData: CreatePostData) => {
    try {
      setEmbeddingError(null); // Clear any previous errors
      setEmbeddingSuccess(null); // Clear any previous success messages
      const newPost = await dbService.createPost(postData);
      setPosts(prevPosts => [newPost, ...prevPosts]);
      setActiveSection('home');
      
      // Generate actual embeddings using the external API server
      setIsGeneratingEmbeddings(true);
      try {
        console.log('Generating embeddings via external API...');
        
        // Add timeout to the fetch request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        const response = await fetch('http://localhost:4075/generate-embeddings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: postData.title,
            content: postData.content,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const embeddingData = await response.json();
        
        if (embeddingData.postEmbeddings && Array.isArray(embeddingData.postEmbeddings)) {
          // Store the actual embeddings in the database
          await dbService.updatePostEmbeddings(
            newPost.id,
            embeddingData.postEmbeddings,
            embeddingData.model || 'external-api-model' // Use model from API if available
          );
          console.log('Actual embeddings generated and stored successfully');
          setEmbeddingSuccess('Embeddings generated successfully! Your post is now searchable.');
        } else {
          throw new Error('Invalid embeddings format received from API');
        }
      } catch (embeddingError) {
        console.warn('Failed to generate embeddings via API:', embeddingError);
        
        let errorMessage = 'Failed to generate embeddings';
        if (embeddingError instanceof Error) {
          if (embeddingError.name === 'AbortError') {
            errorMessage = 'Embedding generation timed out. Please try again.';
          } else if (embeddingError.message.includes('Failed to fetch')) {
            errorMessage = 'Cannot connect to embedding service. Please check if the server is running.';
          } else {
            errorMessage = `Failed to generate embeddings: ${embeddingError.message}`;
          }
        }
        
        setEmbeddingError(errorMessage);
        
        // Fallback to mock embeddings if API fails
        try {
          console.log('Falling back to mock embeddings...');
          const text = `${postData.title} ${postData.content}`;
          await embeddingService.generateAndStoreEmbeddings(newPost.id, text);
          console.log('Mock embeddings generated as fallback');
          setEmbeddingSuccess('Post created with fallback embeddings. Search functionality may be limited.');
        } catch (fallbackError) {
          console.error('Failed to generate fallback embeddings:', fallbackError);
          if (fallbackError instanceof Error) {
            setEmbeddingError(`Failed to generate embeddings and fallback: ${fallbackError.message}`);
          } else {
            setEmbeddingError('Failed to generate embeddings and fallback: Unknown error');
          }
        }
      } finally {
        setIsGeneratingEmbeddings(false);
      }
    } catch (error) {
      console.error('Error creating post:', error);
      setIsGeneratingEmbeddings(false);
      // You could add error handling UI here
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const post = posts.find(p => p.id === postId);
      if (post) {
        const newLikes = post.likes + 1;
        await dbService.updatePostLikes(postId, newLikes);
        setPosts(prevPosts =>
          prevPosts.map(p =>
            p.id === postId ? { ...p, likes: newLikes } : p
          )
        );
      }
    } catch (error) {
      console.error('Error updating likes:', error);
    }
  };

  const handleNavigation = (section: 'home' | 'create' | 'inspect') => {
    setActiveSection(section);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-1 bg-white p-1 rounded-lg shadow-sm border border-gray-200">
            <button
              onClick={() => handleNavigation('home')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                activeSection === 'home'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
              aria-label="View all posts"
            >
              All Posts
            </button>
            <button
              onClick={() => handleNavigation('create')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                activeSection === 'create'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
              aria-label="Create new post"
            >
              Create Post
            </button>
            <button
              onClick={() => handleNavigation('inspect')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                activeSection === 'inspect'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
              aria-label="Inspect database"
            >
              Database Inspector
            </button>
          </div>
        </div>

        {/* Embedding Generation Status */}
        {isGeneratingEmbeddings && (
          <div className="flex justify-center mb-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-blue-800 text-sm font-medium">
                Generating embeddings for semantic search...
              </span>
            </div>
          </div>
        )}

        {/* Embedding Error Display */}
        {embeddingError && (
          <div className="flex justify-center mb-4">
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 flex items-center space-x-2">
              <svg className="h-4 w-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-red-800 text-sm font-medium">
                {embeddingError}
              </span>
              <button
                onClick={() => setEmbeddingError(null)}
                className="text-red-600 hover:text-red-800 ml-2"
                aria-label="Dismiss error"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Embedding Success Display */}
        {embeddingSuccess && (
          <div className="flex justify-center mb-4">
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 flex items-center space-x-2">
              <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-green-800 text-sm font-medium">
                {embeddingSuccess}
              </span>
              <button
                onClick={() => setEmbeddingSuccess(null)}
                className="text-green-600 hover:text-green-800 ml-2"
                aria-label="Dismiss success"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Content Sections */}
        {activeSection === 'home' && (
          <div>
            <h1 className="text-3xl font-bold text-gray-900 text-center mb-8">
              Welcome to SocialFeed
            </h1>
            <DatabaseStatus />
            <PostFeed posts={posts} onLike={handleLike} />
          </div>
        )}

        {activeSection === 'create' && (
          <div>
            <CreatePostForm onSubmit={handleCreatePost} />
          </div>
        )}

        {activeSection === 'inspect' && (
          <div>
            <DatabaseInspector />
          </div>
        )}
      </main>
    </div>
  );
};

export default HomePage;
