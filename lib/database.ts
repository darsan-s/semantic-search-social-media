export interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: Date;
  likes: number;
  embeddings?: number[]; // Vector embeddings for semantic search
  embeddingModel?: string; // Which model was used for embeddings
  embeddingGeneratedAt?: Date; // When embeddings were generated
}

export interface CreatePostData {
  title: string;
  content: string;
  author: string;
}

class DatabaseService {
  private dbName = 'SocialFeedDB';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create posts store with indexes for search
        if (!db.objectStoreNames.contains('posts')) {
          const postsStore = db.createObjectStore('posts', { keyPath: 'id' });
          
          // Create indexes for efficient querying
          postsStore.createIndex('createdAt', 'createdAt', { unique: false });
          postsStore.createIndex('author', 'author', { unique: false });
          postsStore.createIndex('title', 'title', { unique: false });
          postsStore.createIndex('hasEmbeddings', 'embeddingGeneratedAt', { unique: false });
        }

        // Create embeddings store for vector search (separate for performance)
        if (!db.objectStoreNames.contains('embeddings')) {
          const embeddingsStore = db.createObjectStore('embeddings', { keyPath: 'postId' });
          embeddingsStore.createIndex('model', 'model', { unique: false });
        }
      };
    });
  }

  async createPost(postData: CreatePostData): Promise<Post> {
    if (!this.db) throw new Error('Database not initialized');

    const post: Post = {
      id: Date.now().toString(),
      ...postData,
      createdAt: new Date(),
      likes: 0,
      embeddings: undefined,
      embeddingModel: undefined,
      embeddingGeneratedAt: undefined,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['posts'], 'readwrite');
      const store = transaction.objectStore('posts');
      const request = store.add(post);

      request.onsuccess = () => resolve(post);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllPosts(): Promise<Post[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['posts'], 'readonly');
      const store = transaction.objectStore('posts');
      const index = store.index('createdAt');
      const request = index.getAll();

      request.onsuccess = () => {
        const posts = request.result as Post[];
        // Sort by creation date (newest first)
        posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(posts);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async updatePostLikes(postId: string, likes: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['posts'], 'readwrite');
      const store = transaction.objectStore('posts');
      const getRequest = store.get(postId);

      getRequest.onsuccess = () => {
        const post = getRequest.result;
        if (post) {
          post.likes = likes;
          const updateRequest = store.put(post);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          reject(new Error('Post not found'));
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async searchPosts(query: string): Promise<Post[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['posts'], 'readonly');
      const store = transaction.objectStore('posts');
      const request = store.getAll();

      request.onsuccess = () => {
        const posts = request.result as Post[];
        const filteredPosts = posts.filter(post =>
          post.title.toLowerCase().includes(query.toLowerCase()) ||
          post.content.toLowerCase().includes(query.toLowerCase()) ||
          post.author.toLowerCase().includes(query.toLowerCase())
        );
        resolve(filteredPosts);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async updatePostEmbeddings(postId: string, embeddings: number[], model: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['posts'], 'readwrite');
      const store = transaction.objectStore('posts');
      const getRequest = store.get(postId);

      getRequest.onsuccess = () => {
        const post = getRequest.result;
        if (post) {
          post.embeddings = embeddings;
          post.embeddingModel = model;
          post.embeddingGeneratedAt = new Date();
          
          const updateRequest = store.put(post);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          reject(new Error('Post not found'));
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async getPostsWithEmbeddings(): Promise<Post[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['posts'], 'readonly');
      const store = transaction.objectStore('posts');
      const index = store.index('hasEmbeddings');
      const request = index.getAll();

      request.onsuccess = () => {
        const posts = request.result as Post[];
        resolve(posts);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deletePost(postId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['posts'], 'readwrite');
      const store = transaction.objectStore('posts');
      const request = store.delete(postId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearDatabase(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['posts'], 'readwrite');
      const store = transaction.objectStore('posts');
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Export singleton instance
export const dbService = new DatabaseService();
