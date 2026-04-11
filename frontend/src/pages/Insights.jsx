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
    } catch (error) {
      console.error('Error loading insights:', error);
      setError(error.response?.data?.message || 'Unable to load insights right now. Please try again.');
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
    if (priority === 'high') return 'border-rose-500/50 bg-rose-500/15 text-rose-200';
    if (priority === 'medium') return 'border-amber-500/50 bg-amber-500/15 text-amber-200';
    return 'border-emerald-500/50 bg-emerald-500/15 text-emerald-200';
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
          ? 'border-green-500/50 bg-green-500/10'
          : 'border-yellow-500/50 bg-yellow-500/10';
      case 'mood_drop':
        return 'border-red-500/50 bg-red-500/10';
      case 'pattern':
        return 'border-blue-500/50 bg-blue-500/10';
      case 'sentiment_trend':
        return 'border-purple-500/50 bg-purple-500/10';
      default:
        return 'border-electric-500/50 bg-electric-500/10';
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
      <div className="space-y-6">
        <div className="h-24 border rounded-3xl border-slate-700/70 bg-slate-900/65 animate-pulse"></div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-24 border rounded-2xl border-slate-700/70 bg-slate-900/65 animate-pulse"></div>
          ))}
        </div>
        <div className="border h-72 rounded-3xl border-slate-700/70 bg-slate-900/65 animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="relative p-6 overflow-hidden border rounded-3xl border-slate-700/70 bg-gradient-to-br from-slate-900/80 to-slate-950/70 md:p-8">
        <div className="absolute top-0 w-40 h-40 rounded-full -left-20 bg-emerald-500/15 blur-3xl"></div>
        <div className="absolute bottom-0 w-48 h-48 rounded-full -right-16 bg-cyan-500/15 blur-3xl"></div>
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Awareness Engine</p>
            <h1 className="mt-2 text-3xl font-bold text-white md:text-4xl">Emotional Insights</h1>
            <p className="max-w-2xl mt-2 text-slate-300">
              Insights convert your mood and journal logs into early signals, so you can act before stress becomes overwhelming.
            </p>
          </div>
          <button
            type="button"
            onClick={loadInsights}
            className="px-4 py-2 font-semibold transition-colors rounded-lg bg-emerald-400 text-slate-950 hover:bg-emerald-300"
          >
            Refresh
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="p-4 border rounded-2xl border-slate-700 bg-slate-900/75">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Total Insights</p>
          <p className="mt-2 text-3xl font-bold text-white">{insights.length}</p>
          <p className="mt-1 text-xs text-slate-400">patterns identified</p>
        </div>
        <div className="p-4 border rounded-2xl border-rose-500/40 bg-rose-500/10">
          <p className="text-xs uppercase tracking-[0.16em] text-rose-200">High Priority</p>
          <p className="mt-2 text-3xl font-bold text-rose-100">{highPriorityCount}</p>
          <p className="mt-1 text-xs text-rose-200/80">need attention first</p>
        </div>
        <div className="p-4 border rounded-2xl border-cyan-500/40 bg-cyan-500/10">
          <p className="text-xs uppercase tracking-[0.16em] text-cyan-200">Action Plans</p>
          <p className="mt-2 text-3xl font-bold text-cyan-100">{actionableCount}</p>
          <p className="mt-1 text-xs text-cyan-200/80">ready to practice today</p>
        </div>
      </div>

      <div className="p-4 border rounded-2xl border-slate-700/70 bg-slate-900/75 md:p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto] md:items-center">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-lg border-slate-700 bg-slate-950/50 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
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
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors border ${
                  activeFilter === filter.key
                    ? 'border-emerald-400/60 bg-emerald-500/20 text-white'
                    : 'border-slate-600 bg-slate-800/60 text-slate-200 hover:bg-slate-700'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 text-red-100 border rounded-2xl border-red-500/40 bg-red-500/10">
          <p className="font-semibold">Could not load insights</p>
          <p className="mt-1 text-sm">{error}</p>
        </div>
      )}

      {filteredInsights.length === 0 ? (
        <div className="px-4 py-12 text-center border rounded-3xl border-slate-700/70 bg-slate-900/75">
          <div className="mb-4 text-6xl">🔍</div>
          <h2 className="mb-2 text-xl font-semibold text-white">No matching insights yet</h2>
          <p className="max-w-xl mx-auto text-slate-400">
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
              className={`rounded-3xl border-2 p-5 md:p-6 ${getInsightColor(insight.type)}`}
            >
              <div className="flex items-start space-x-4">
                <div className="text-4xl">{getInsightIcon(insight.type)}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-white">
                      {getInsightTitle(insight)}
                    </h3>
                    <span className={`rounded-full border px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${getPriorityClass(priority)}`}>
                      {priority}
                    </span>
                  </div>

                  <p className="mb-3 text-slate-100">{insight.message}</p>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {insight.days && (
                      <span className="px-2 py-1 text-xs border rounded-full border-slate-500/60 bg-slate-900/50 text-slate-200">
                        Duration: {insight.days} days
                      </span>
                    )}
                    {Number.isFinite(insight.negativePercent) && (
                      <span className="px-2 py-1 text-xs border rounded-full border-slate-500/60 bg-slate-900/50 text-slate-200">
                        Negative sentiment: {insight.negativePercent}%
                      </span>
                    )}
                    {insight.date && (
                      <span className="px-2 py-1 text-xs border rounded-full border-slate-500/60 bg-slate-900/50 text-slate-200">
                        {new Date(insight.date).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {insight.days && (
                    <div className="h-2 mb-2 rounded-full bg-slate-800">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400"
                        style={{ width: `${Math.min(100, insight.days * 10)}%` }}
                      />
                    </div>
                  )}

                  {insight.recommendedActions?.length > 0 && (
                    <div className="p-4 mt-4 border rounded-xl border-slate-700 bg-slate-950/50">
                      <h4 className="mb-2 text-sm font-semibold text-emerald-300">
                        Today&apos;s Action Plan
                      </h4>
                      <ul className="space-y-2">
                        {insight.recommendedActions.map((action, actionIndex) => (
                          <li
                            key={`${index}-action-${actionIndex}`}
                            className="flex items-start text-sm text-slate-200"
                          >
                            <span className="mr-2 text-emerald-300">•</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );})}
        </div>
      )}
    </div>
  );
};

export default Insights;

