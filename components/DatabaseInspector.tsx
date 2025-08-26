'use client';

import { useState, useEffect } from 'react';
import { Post, dbService, CreatePostData } from '../lib/database';
import { embeddingService } from '../lib/embeddings';

const DatabaseInspector = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPopulating, setIsPopulating] = useState(false);
  const [populateProgress, setPopulateProgress] = useState(0);
  const [populateMessage, setPopulateMessage] = useState<string | null>(null);
  const [populateError, setPopulateError] = useState<string | null>(null);

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

  const handlePopulateSampleData = async () => {
    setIsPopulating(true);
    setPopulateProgress(0);
    setPopulateMessage(null);
    setPopulateError(null);

    const sampleData = [
      {
        title: "Exploring Watercolors",
        author: "Aarav Mehta",
        content: "Just finished a dreamy watercolor landscape 🌄 Loving how the colors blend together! #art #watercolor #creativeflow"
      },
      {
        title: "Sculpture Collab",
        author: "Lina Chen",
        content: "Excited to team up with @marc for a clay + wood sculpture piece 🔨🪵 #collaboration #sculpture #artcommunity"
      },
      {
        title: "Digital Canvas",
        author: "Diego Ramos",
        content: "Experimenting with new brushes in Procreate 🎨✨ Digital art feels limitless. #digitalart #artistsonline #creativity"
      },
      {
        title: "Street Mural Progress",
        author: "Maya Kapoor",
        content: "Day 3 of our mural project! The community energy is amazing ❤️ #streetart #mural #collaboration"
      },
      {
        title: "Photography + Poetry",
        author: "Ethan Walker",
        content: "Pairing my photos with short poems — blending two art forms into one expression 📷✍️ #photography #poetry #artfusion"
      },
      {
        title: "Morning Motivation",
        author: "Alice",
        content: "Start your day with positivity! Remember, every small step counts towards your dreams. #Motivation #MorningVibes"
      },
      {
        title: "Tech Trends 2025",
        author: "Bob",
        content: "AI and blockchain are transforming industries. Staying updated is key to staying ahead. #TechNews #Innovation"
      },
      {
        title: "Healthy Eating Tips",
        author: "Cathy",
        content: "Include more greens in your meals and stay hydrated. Your body will thank you! #Health #Nutrition"
      },
      {
        title: "Weekend Getaway Ideas",
        author: "David",
        content: "Explore hidden gems in your city or nearby towns. Adventure is closer than you think! #Travel #WeekendVibes"
      },
      {
        title: "Mindfulness Practice",
        author: "Eva",
        content: "Take 10 minutes daily to meditate and breathe deeply. Clear your mind and reduce stress. #Mindfulness #SelfCare"
      },
      {
        title: "Latest Movie Review",
        author: "Frank",
        content: "The new sci-fi thriller keeps you on the edge of your seat. Stunning visuals and gripping plot! #Movies #Review"
      },
      {
        title: "Workout Routine",
        author: "Grace",
        content: "Consistency beats intensity. 30 minutes of daily exercise keeps you fit and energized. #Fitness #WorkoutTips"
      },
      {
        title: "Book Recommendation",
        author: "Hannah",
        content: "The Alchemist is a timeless tale about following your dreams and listening to your heart. #Books #Reading"
      },
      {
        title: "Coffee Lovers Unite",
        author: "Jane",
        content: "Nothing beats the aroma of freshly brewed coffee in the morning. ☕ #CoffeeTime #MorningRituals"
      },
      {
        title: "Photography Hacks",
        author: "Ian",
        content: "Golden hour lighting can transform ordinary shots into breathtaking photos. #Photography #Tips"
      }
    ];

    try {
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < sampleData.length; i++) {
        const postData = sampleData[i];
        setPopulateMessage(`Creating post ${i + 1}/15: "${postData.title}"`);
        setPopulateProgress(((i + 1) / sampleData.length) * 100);

        try {
          // Step 1: Create post (same as manual creation)
          const newPost = await dbService.createPost(postData);
          
          // Step 2: Generate embeddings using external API (same as manual creation)
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
            
            const response = await fetch('https://semantic-search-social-media-api.onrender.com/generate-embeddings', {
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

            if (response.ok) {
              const embeddingData = await response.json();
              
              if (embeddingData.postEmbeddings && Array.isArray(embeddingData.postEmbeddings)) {
                // Store the actual embeddings in the database
                await dbService.updatePostEmbeddings(
                  newPost.id,
                  embeddingData.postEmbeddings,
                  embeddingData.model || 'external-api-model'
                );
                console.log(`Actual embeddings generated for post: ${postData.title}`);
              } else {
                throw new Error('Invalid embeddings format received from API');
              }
            } else {
              throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }
          } catch (embeddingError) {
            console.warn(`Failed to generate embeddings via API for post: ${postData.title}`, embeddingError);
            
            // Fallback to mock embeddings if API fails (same as manual creation)
            try {
              console.log(`Falling back to mock embeddings for post: ${postData.title}`);
              const text = `${postData.title} ${postData.content}`;
              await embeddingService.generateAndStoreEmbeddings(newPost.id, text);
              console.log(`Mock embeddings generated as fallback for post: ${postData.title}`);
            } catch (fallbackError) {
              console.error(`Failed to generate fallback embeddings for post: ${postData.title}:`, fallbackError);
              throw fallbackError;
            }
          }

          successCount++;
        } catch (postError) {
          console.error(`Error creating post "${postData.title}":`, postError);
          errorCount++;
        }
      }

      // Refresh posts to show new ones
      await refreshPosts();
      
      if (errorCount === 0) {
        setPopulateMessage(`Successfully created ${successCount} sample posts with embeddings!`);
      } else {
        setPopulateMessage(`Created ${successCount} posts successfully, ${errorCount} failed.`);
      }
    } catch (error) {
      console.error('Error populating sample data:', error);
      setPopulateError('Failed to populate sample data. Please try again.');
    } finally {
      setIsPopulating(false);
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
        <div className="flex space-x-3">
          <button
            onClick={handlePopulateSampleData}
            disabled={isPopulating}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Populate sample data"
          >
            {isPopulating ? 'Populating...' : 'Populate Sample Data'}
          </button>
          <button
            onClick={refreshPosts}
            className="btn-secondary"
            aria-label="Refresh posts"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Sample Data Population Progress */}
      {isPopulating && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-blue-800 font-medium">Populating Sample Data...</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${populateProgress}%` }}
            ></div>
          </div>
          <div className="text-sm text-blue-700">
            {populateMessage}
          </div>
        </div>
      )}

      {/* Sample Data Population Success/Error Messages */}
      {populateMessage && !isPopulating && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-green-800 font-medium">{populateMessage}</span>
            <button
              onClick={() => setPopulateMessage(null)}
              className="text-green-600 hover:text-green-800 ml-auto"
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {populateError && !isPopulating && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-red-800 font-medium">{populateError}</span>
            <button
              onClick={() => setPopulateError(null)}
              className="text-red-600 hover:text-red-800 ml-auto"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        </div>
      )}

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
