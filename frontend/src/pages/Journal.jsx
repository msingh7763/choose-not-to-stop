import { useState, useEffect } from 'react';
import { journalAPI } from '../services/api';

const Journal = () => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [entries, setEntries] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const response = await journalAPI.getAll({ limit: 20 });
      setEntries(response.data.data || []);
    } catch (error) {
      console.error('Error loading entries:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (content.trim().length < 10) {
      setMessage('Journal entry must be at least 10 characters');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      if (selectedEntry) {
        await journalAPI.update(selectedEntry._id, { content });
        setMessage('Journal entry updated!');
      } else {
        await journalAPI.create({ content });
        setMessage('Journal entry saved!');
      }

      setContent('');
      setSelectedEntry(null);
      loadEntries();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error saving journal entry');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (entry) => {
    setSelectedEntry(entry);
    setContent(entry.content);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;

    try {
      await journalAPI.delete(id);
      loadEntries();
      if (selectedEntry?._id === id) {
        setSelectedEntry(null);
        setContent('');
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };

  const getSentimentColor = (label) => {
    switch (label) {
      case 'positive':
        return 'text-green-400';
      case 'negative':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getSentimentEmoji = (label) => {
    switch (label) {
      case 'positive':
        return '😊';
      case 'negative':
        return '😢';
      default:
        return '😐';
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Journal</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Journal Form */}
        <div className="lg:col-span-2 card">
          <h2 className="text-xl font-semibold mb-4">
            {selectedEntry ? 'Edit Entry' : 'Write Your Thoughts'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows="12"
                className="input-field resize-none"
                placeholder="Write about your day, your feelings, or anything on your mind..."
                required
                minLength={10}
                maxLength={5000}
              />
              <p className="text-xs text-gray-400 mt-1">
                {content.length}/5000 characters
              </p>
            </div>

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

            <div className="flex space-x-3">
              <button type="submit" disabled={loading} className="btn-primary flex-1">
                {loading ? 'Saving...' : selectedEntry ? 'Update Entry' : 'Save Entry'}
              </button>
              {selectedEntry && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedEntry(null);
                    setContent('');
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Recent Entries */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Recent Entries</h2>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {entries.length > 0 ? (
              entries.map((entry) => (
                <div
                  key={entry._id}
                  className="bg-navy-800/50 p-4 rounded-lg border border-navy-700 hover:border-navy-600 transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">
                        {getSentimentEmoji(entry.sentimentLabel)}
                      </span>
                      <span
                        className={`text-sm font-medium ${getSentimentColor(
                          entry.sentimentLabel
                        )}`}
                      >
                        {entry.sentimentLabel}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(entry.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 mb-3 line-clamp-3">
                    {entry.content}
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(entry)}
                      className="text-xs text-electric-400 hover:text-electric-300"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(entry._id)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-4">No entries yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Journal;

