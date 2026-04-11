import { useState, useEffect } from 'react';
import { anonymousAPI, journalAPI } from '../services/api';

const AnonymousWall = () => {
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [expandedPosts, setExpandedPosts] = useState({});
  const [expandedStories, setExpandedStories] = useState({});
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStories, setLoadingStories] = useState(false);
  const [message, setMessage] = useState('');

  const reactionTypes = ['💙', '🤗', '💪', '🙏'];

  useEffect(() => {
    loadPosts();
    loadStories();
    const interval = setInterval(loadPosts, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadPosts = async () => {
    try {
      const response = await anonymousAPI.getAll({ limit: 50 });
      setPosts(response.data.data || []);
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  };

  const loadStories = async () => {
    setLoadingStories(true);
    try {
      const response = await journalAPI.getAll({ limit: 30 });
      setStories(response.data.data || []);
    } catch (error) {
      console.error('Error loading stories:', error);
      setStories([]);
    } finally {
      setLoadingStories(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (content.trim().length < 10) {
      setMessage('Post must be at least 10 characters');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await anonymousAPI.create({ content });
      setContent('');
      setMessage(response.data?.message || 'Post created successfully.');
      loadPosts();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error creating post');
    } finally {
      setLoading(false);
    }
  };

  const handleReaction = async (postId, reactionType) => {
    try {
      await anonymousAPI.addReaction(postId, reactionType);
      loadPosts();
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const getTimeRemaining = (expiresAt) => {
    if (!expiresAt) {
      return 'Stays on wall';
    }

    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) return `${hours}h ${minutes}m left`;
    if (minutes > 0) return `${minutes}m left`;
    return 'Expiring soon';
  };

  const toggleExpandedPost = (postId) => {
    setExpandedPosts((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const toggleExpandedStory = (storyId) => {
    setExpandedStories((prev) => ({ ...prev, [storyId]: !prev[storyId] }));
  };

  const shouldShowPreviewToggle = (text) => String(text || '').trim().length > 140;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">24-Hour Anonymous Wall</h1>
      <p className="text-gray-400">
        Share your thoughts anonymously. Posts automatically disappear after 24 hours.
      </p>

      {/* Create Post Form */}
      <div className="card">
        <h2 className="mb-4 text-xl font-semibold">Share Something</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows="4"
            className="resize-none input-field"
            placeholder="Write something supportive, share your experience, or just express yourself..."
            required
            minLength={10}
            maxLength={500}
          />
          <p className="text-xs text-gray-400">{content.length}/500</p>

          {message && (
            <div
              className={`p-3 rounded-lg ${
                message.includes('Error')
                  ? 'bg-red-500/20 text-red-200'
                  : 'bg-green-500/20 text-green-200'
              }`}
            >
              {message}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Posting...' : 'Post Anonymously'}
          </button>
        </form>
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {posts.length > 0 ? (
          posts.map((post) => (
            <div key={post._id} className="card">
              <p className={`mb-2 text-gray-200 whitespace-pre-wrap ${expandedPosts[post._id] ? '' : 'line-clamp-2'}`}>
                {post.content}
              </p>
              {shouldShowPreviewToggle(post.content) && (
                <button
                  type="button"
                  onClick={() => toggleExpandedPost(post._id)}
                  className="mb-4 text-xs font-medium text-electric-300 hover:text-electric-200"
                >
                  {expandedPosts[post._id] ? 'Show less' : 'Read more'}
                </button>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-navy-700">
                <div className="flex space-x-2">
                  {reactionTypes.map((emoji) => {
                    // Handle both Map and object formats
                    const reactions = post.reactions || {};
                    const count = typeof reactions.get === 'function' 
                      ? reactions.get(emoji) || 0
                      : reactions[emoji] || 0;
                    return (
                      <button
                        key={emoji}
                        onClick={() => handleReaction(post._id, emoji)}
                        className="flex items-center px-2 py-1 space-x-1 transition-all rounded-lg bg-navy-800/50 hover:bg-navy-700"
                      >
                        <span>{emoji}</span>
                        {count > 0 && (
                          <span className="text-xs text-gray-300">{count}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="text-right">
                  <span className={`text-xs ${post.isPersistent ? 'text-emerald-300' : 'text-gray-400'}`}>
                    {getTimeRemaining(post.expiresAt)}
                  </span>
                  {post.isPersistent && (
                    <p className="text-[10px] uppercase tracking-wide text-emerald-400/80 mt-1">
                      more than 4 lines
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center col-span-full card">
            <div className="mb-4 text-6xl">🌐</div>
            <p className="text-gray-400">No posts yet. Be the first to share!</p>
          </div>
        )}
      </div>

      {/* Personal Story Records */}
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-2xl font-semibold text-white">My Story Records</h2>
          <span className="text-xs uppercase tracking-[0.16em] text-electric-200 bg-electric-900/30 border border-electric-700/40 px-3 py-2 rounded-full">
            from journal
          </span>
        </div>
        <p className="mb-5 text-gray-300">
          Your personal journal stories are saved as your private timeline here.
        </p>

        {loadingStories ? (
          <p className="text-gray-400">Loading your stories...</p>
        ) : stories.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {stories.map((story) => (
              <article key={story._id} className="p-4 border rounded-xl border-navy-700 bg-navy-800/50">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <span className={`text-xs font-semibold uppercase tracking-wide ${
                    story.sentimentLabel === 'positive'
                      ? 'text-emerald-300'
                      : story.sentimentLabel === 'negative'
                        ? 'text-rose-300'
                        : 'text-slate-300'
                  }`}>
                    {story.sentimentLabel || 'neutral'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(story.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <p className={`text-gray-200 whitespace-pre-wrap ${expandedStories[story._id] ? '' : 'line-clamp-2'}`}>
                  {story.content}
                </p>
                {shouldShowPreviewToggle(story.content) && (
                  <button
                    type="button"
                    onClick={() => toggleExpandedStory(story._id)}
                    className="mt-2 text-xs font-medium text-electric-300 hover:text-electric-200"
                  >
                    {expandedStories[story._id] ? 'Show less' : 'Read more'}
                  </button>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="px-4 py-6 text-center text-gray-400 border rounded-xl border-navy-700 bg-navy-800/40">
            No stories yet. Write in Journal to see your records here.
          </div>
        )}
      </div>
    </div>
  );
};

export default AnonymousWall;

