'use client';

import { useState } from 'react';
import { CreatePostData } from '../lib/database';

interface CreatePostFormProps {
  onSubmit: (postData: CreatePostData) => void;
}

const CreatePostForm = ({ onSubmit }: CreatePostFormProps) => {
  const [formData, setFormData] = useState<CreatePostData>({
    title: '',
    content: '',
    author: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim() || !formData.author.trim()) {
      return;
    }

    onSubmit(formData);
    setFormData({
      title: '',
      content: '',
      author: '',
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSubmit(e as any);
    }
  };

  return (
    <div className="card max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Create a New Post</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="input-field"
            placeholder="Enter post title..."
            required
            aria-required="true"
          />
        </div>
        
        <div>
          <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-2">
            Author
          </label>
          <input
            type="text"
            id="author"
            name="author"
            value={formData.author}
            onChange={handleInputChange}
            className="input-field"
            placeholder="Enter your name..."
            required
            aria-required="true"
          />
        </div>
        
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
            Content
          </label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="input-field min-h-[120px] resize-y"
            placeholder="Write your post content here..."
            required
            aria-required="true"
          />
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="submit"
            className="btn-primary"
            aria-label="Create post"
          >
            Create Post
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePostForm;
