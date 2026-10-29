import { useState, useEffect } from 'react';
import { insightsAPI } from '../services/api';

const Insights = () => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await insightsAPI.getAll();
      setInsights(response.data.data || []);
    } catch (err) {
      console.error('Error loading insights:', err);
      setError(err.response?.data?.message || 'Unable to load insights right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getInsightPriority = (insight) => {
    if (insight.type === 'mood_drop') return 'high';
    if (insight.type === 'sentiment_trend' && Number(insight.negativePercent || 0) >= 60) return 'high';
    if (insight.type === 'mood_streak' && insight.category === 'negative') return 'high';
    if (insight.type === 'pattern') return 'medium';
    return 'low';
  };

  const getPriorityClass = (priority) => {
    if (priority === 'high') return 'border-red-400 bg-red-100 text-red-800';
    if (priority === 'medium') return 'border-amber-400 bg-amber-100 text-amber-900';
    return 'border-[#A4BBAC] bg-[#A4BBAC]/35 text-black';
  };

  const getInsightIcon = (type) => {
    switch (type) {
      case 'mood_streak':
        return '📈';
      case 'mood_drop':
        return '📉';
      case 'pattern':
        return '🔍';
      case 'sentiment_trend':
        return '💭';
      default:
        return '💡';
    }
  };

  const getInsightColor = (type) => {
    switch (type) {
      case 'mood_streak':
        return insights.find((i) => i.type === type)?.category === 'positive'
          ? 'border-[#A4BBAC] bg-white/90'
          : 'border-[#F4DDD5] bg-[#F4DDD5]/40';
      case 'mood_drop':
        return 'border-red-400 bg-red-50/90';
      case 'pattern':
        return 'border-[#8E929B] bg-white/90';
      case 'sentiment_trend':
        return 'border-[#ECB7B3] bg-white/90';
      default:
        return 'border-[#A4BBAC] bg-white/90';
    }
  };

  const getInsightTitle = (insight) => {
    if (insight.type === 'mood_streak' && insight.category === 'positive') return 'Positive Streak';
    if (insight.type === 'mood_streak' && insight.category === 'negative') return 'Low Mood Streak';
    if (insight.type === 'mood_streak') return 'Neutral Streak';
    if (insight.type === 'mood_drop') return 'Sudden Mood Drop';
    if (insight.type === 'pattern' && insight.pattern === 'weekend_low') return 'Weekend Pattern';
    if (insight.type === 'pattern' && insight.pattern === 'weekday_low') return 'Weekday Pattern';
    if (insight.type === 'sentiment_trend') return 'Sentiment Alert';
    return 'Insight';
  };

  const filteredInsights = insights
    .filter((insight) => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'high_priority') return getInsightPriority(insight) === 'high';
      return insight.type === activeFilter;
    })
    .filter((insight) => {
      if (!query.trim()) return true;
      const text = `${insight.message || ''} ${insight.type || ''} ${insight.pattern || ''}`.toLowerCase();
      return text.includes(query.toLowerCase());
    })
    .sort((a, b) => {
      const rank = { high: 3, medium: 2, low: 1 };
      return rank[getInsightPriority(b)] - rank[getInsightPriority(a)];
    });

  const highPriorityCount = insights.filter((insight) => getInsightPriority(insight) === 'high').length;
  const actionableCount = insights.filter((insight) => (insight.recommendedActions || []).length > 0).length;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 rounded-3xl bg-yellow-200/50 border border-yellow-400/50"></div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-24 border rounded-2xl border-[#8E929B]/30 bg-white/70"></div>
          ))}
        </div>
        <div className="border h-72 rounded-3xl border-[#8E929B]/30 bg-white/70"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Yellow Header Card */}
      <header className="relative p-6 overflow-hidden border-2 rounded-3xl border-[#EAB308] bg-gradient-to-br from-[#FEF08A] via-[#FDE047] to-[#FACC15] md:p-8 shadow-md">
        <div className="absolute top-0 w-44 h-44 rounded-full -left-20 bg-white/40 blur-2xl"></div>
        <div className="absolute bottom-0 w-48 h-48 rounded-full -right-16 bg-[#F59E0B]/25 blur-3xl"></div>
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[#78350F] font-black">
              Awareness Engine
            </p>
            <h1
              className="mt-2 text-3xl font-black text-black md:text-4xl tracking-tight"
              style={{ fontFamily: 'Poppins, Inter, sans-serif' }}
            >
              Emotional Insights
            </h1>
            <p className="max-w-2xl mt-2 text-black font-semibold text-sm md:text-base">
              Insights convert your mood and journal logs into early signals, so you can act before stress becomes overwhelming.
            </p>
          </div>
          <button
            type="button"
            onClick={loadInsights}
            className="px-5 py-2.5 font-bold transition-all rounded-xl border border-black/30 bg-black text-white hover:bg-neutral-800 shadow-sm"
          >
            Refresh
          </button>
        </div>
      </header>

      {/* Summary Stats Strip */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="p-4 border rounded-2xl border-[#8E929B]/40 bg-white/85 shadow-sm">
          <p className="text-xs uppercase tracking-[0.16em] text-black font-bold opacity-75">Total Insights</p>
          <p className="mt-2 text-3xl font-black text-black">{insights.length}</p>
          <p className="mt-1 text-xs text-black font-medium">patterns identified</p>
        </div>
        <div className="p-4 border rounded-2xl border-red-300 bg-red-50/80 shadow-sm">
          <p className="text-xs uppercase tracking-[0.16em] text-red-800 font-bold">High Priority</p>
          <p className="mt-2 text-3xl font-black text-red-700">{highPriorityCount}</p>
          <p className="mt-1 text-xs text-black font-medium">need attention first</p>
        </div>
        <div className="p-4 border rounded-2xl border-[#A4BBAC] bg-[#A4BBAC]/25 shadow-sm">
          <p className="text-xs uppercase tracking-[0.16em] text-black font-bold">Action Plans</p>
          <p className="mt-2 text-3xl font-black text-black">{actionableCount}</p>
          <p className="mt-1 text-xs text-black font-medium">ready to practice today</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="p-4 border rounded-2xl border-[#8E929B]/40 bg-white/85 shadow-sm md:p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto] md:items-center">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input-field text-black font-medium text-sm"
            placeholder="Search insight text, type, or pattern..."
          />
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All' },
              { key: 'high_priority', label: 'High Priority' },
              { key: 'mood_streak', label: 'Streaks' },
              { key: 'mood_drop', label: 'Mood Drops' },
              { key: 'pattern', label: 'Patterns' },
              { key: 'sentiment_trend', label: 'Sentiment' },
            ].map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => setActiveFilter(filter.key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors border ${
                  activeFilter === filter.key
                    ? 'border-[#8E929B] bg-[#ECB7B3] text-black shadow-xs'
                    : 'border-[#8E929B]/40 bg-[#DCE1DA]/60 text-black hover:bg-[#F4DDD5]'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 text-black font-semibold border rounded-2xl border-red-400 bg-red-100">
          <p className="font-bold">Could not load insights</p>
          <p className="mt-1 text-sm">{error}</p>
        </div>
      )}

      {/* Insights Cards Grid */}
      {filteredInsights.length === 0 ? (
        <div className="px-4 py-12 text-center border rounded-3xl border-[#8E929B]/40 bg-white/85 shadow-sm">
          <div className="mb-4 text-6xl">🔍</div>
          <h2 className="mb-2 text-xl font-black text-black">No matching insights yet</h2>
          <p className="max-w-xl mx-auto text-black font-medium text-sm">
            Keep logging mood and journal entries for a few days. Once enough patterns are detected, this page will show personalized signals and action plans.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {filteredInsights.map((insight, index) => {
            const priority = getInsightPriority(insight);
            return (
              <div
                key={index}
                className={`rounded-2xl border-2 p-5 md:p-6 shadow-sm ${getInsightColor(insight.type)}`}
              >
                <div className="flex items-start space-x-4">
                  <div className="text-4xl">{getInsightIcon(insight.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-black text-lg text-black">
                        {getInsightTitle(insight)}
                      </h3>
                      <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wide ${getPriorityClass(priority)}`}>
                        {priority}
                      </span>
                    </div>

                    <p className="mb-3 text-black font-semibold text-sm leading-relaxed">{insight.message}</p>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {insight.days && (
                        <span className="px-2.5 py-1 text-xs border rounded-full border-[#8E929B]/40 bg-[#DCE1DA]/60 text-black font-bold">
                          Duration: {insight.days} days
                        </span>
                      )}
                      {Number.isFinite(insight.negativePercent) && (
                        <span className="px-2.5 py-1 text-xs border rounded-full border-[#8E929B]/40 bg-[#DCE1DA]/60 text-black font-bold">
                          Negative sentiment: {insight.negativePercent}%
                        </span>
                      )}
                      {insight.date && (
                        <span className="px-2.5 py-1 text-xs border rounded-full border-[#8E929B]/40 bg-[#DCE1DA]/60 text-black font-bold">
                          {new Date(insight.date).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {insight.days && (
                      <div className="h-2 mb-2 rounded-full bg-[#DCE1DA]">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-[#ECB7B3] to-[#A4BBAC]"
                          style={{ width: `${Math.min(100, insight.days * 10)}%` }}
                        />
                      </div>
                    )}

                    {insight.recommendedActions?.length > 0 && (
                      <div className="p-4 mt-4 border rounded-xl border-[#8E929B]/40 bg-white/95 shadow-xs">
                        <h4 className="mb-2 text-sm font-black text-black">
                          Today&apos;s Action Plan
                        </h4>
                        <ul className="space-y-1.5">
                          {insight.recommendedActions.map((action, actionIndex) => (
                            <li
                              key={`${index}-action-${actionIndex}`}
                              className="flex items-start text-sm text-black font-medium"
                            >
                              <span className="mr-2 text-[#A4BBAC] font-bold">•</span>
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Insights;
