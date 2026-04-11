import { useEffect, useState } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { moodAPI, journalAPI, resilienceAPI, insightsAPI, riskAPI } from '../services/api';
import RiskDashboard from '../RiskDashboard';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [moodData, setMoodData] = useState([]);
  const [journalData, setJournalData] = useState([]);
  const [resilienceScore, setResilienceScore] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState(14); // 7, 14, 30, or 0 for all
  const [error, setError] = useState(null);
  const [resilienceTrend, setResilienceTrend] = useState(null);
  const [mlCurrentPrediction, setMlCurrentPrediction] = useState(null);
  const [mlBehavioralForecast, setMlBehavioralForecast] = useState([]);
  const [isRecalculating, setIsRecalculating] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setError(null);
    try {
      const resiliencePromise = resilienceAPI
        .getCurrent()
        .catch(async () => {
          const historyRes = await resilienceAPI
            .getHistory({ limit: 1 })
            .catch(() => ({ data: { data: [] } }));

          return {
            data: {
              data: historyRes?.data?.data?.[0] || null,
            },
          };
        });

      const [moodsRes, journalsRes, resilienceRes, insightsRes] = await Promise.all([
        moodAPI.getAll({ limit: 30 }),
        journalAPI.getAll({ limit: 30 }),
        resiliencePromise,
        insightsAPI.getAll(),
      ]);

      setMoodData(moodsRes.data.data || []);
      setJournalData(journalsRes.data.data || []);
      setResilienceScore(resilienceRes.data.data);
      setInsights(insightsRes.data.data || []);

      const [riskEvaluateResult, riskForecastResult] = await Promise.allSettled([
        riskAPI.evaluate(),
        riskAPI.forecast(),
      ]);

      if (riskEvaluateResult.status === 'fulfilled') {
        const riskPayload = riskEvaluateResult.value?.data || {};
        setMlCurrentPrediction({
          risk: riskPayload.risk || null,
          reason: riskPayload.reason || 'No reason available',
          confidence: 80,
        });
      } else {
        setMlCurrentPrediction(null);
      }

      if (riskForecastResult.status === 'fulfilled') {
        setMlBehavioralForecast(riskForecastResult.value?.data?.data || []);
      } else {
        setMlBehavioralForecast([]);
      }

      // Calculate resilience trend (mock: improve by 5 points per week)
      const mockTrendScore = (resilienceRes.data.data?.score || 0) + 5;
      setResilienceTrend(mockTrendScore > resilienceRes.data.data?.score);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Could not load dashboard data. Some features may be unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    setError(null);
    setIsRecalculating(true);
    try {
      const response = await resilienceAPI.calculate();
      if (response?.data?.data) {
        setResilienceScore(response.data.data);
      }

      await loadDashboardData();
    } catch (recalculateError) {
      console.error('Error calculating resilience:', recalculateError);
      setError(
        recalculateError?.response?.data?.message ||
        'Could not calculate resilience score. Please try again.'
      );
    } finally {
      setIsRecalculating(false);
    }
  };

  const getFilteredMoodData = () => {
    if (timePeriod === 0) return moodData;
    return moodData.slice(0, timePeriod);
  };

  const getStreakCount = () => {
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const hasEntry = moodData.some((entry) => {
        const entryDate = new Date(entry.date);
        return entryDate.toDateString() === checkDate.toDateString();
      });
      if (hasEntry) streak++;
      else break;
    }
    return streak;
  };

  const getMoodEntriesCount = () => moodData.length;

  const getSentimentTrend = () => {
    if (moodData.length < 2) return 'neutral';
    const recent = moodData.slice(0, 7);
    const older = moodData.slice(7, 14);
    const recentPositive = recent.filter((e) => e.mood === 'Happy').length;
    const olderPositive = older.filter((e) => e.mood === 'Happy').length;
    return recentPositive > olderPositive ? 'up' : olderPositive > recentPositive ? 'down' : 'neutral';
  };

  // Helper function to get mood value
  const getMoodValue = (mood) => {
    const moodValues = { Happy: 5, Neutral: 3, Sad: 2, Anxious: 1, Stressed: 1 };
    return moodValues[mood] || 3;
  };

  // Current Entry Analysis
  const getCurrentEntry = () => {
    if (moodData.length === 0) return null;
    return moodData[0];
  };

  // Calculate average mood for different periods
  const getAverageMoodForPeriod = (days) => {
    const periodData = days === 0 ? moodData : moodData.slice(0, days);
    if (periodData.length === 0) return 0;
    const total = periodData.reduce((sum, entry) => sum + getMoodValue(entry.mood), 0);
    return (total / periodData.length).toFixed(2);
  };

  // Calculate mood consistency for period
  const getMoodConsistencyForPeriod = (days) => {
    const periodData = days === 0 ? moodData : moodData.slice(0, days);
    if (periodData.length === 0) return 0;
    const moodValues = periodData.map((e) => getMoodValue(e.mood));
    const mean = moodValues.reduce((a, b) => a + b, 0) / moodValues.length;
    const variance = moodValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / moodValues.length;
    const stdDev = Math.sqrt(variance);
    return ((5 - stdDev) / 5 * 100).toFixed(0); // Convert to percentage
  };

  // Get mood distribution for period
  const getMoodDistributionForPeriod = (days) => {
    const periodData = days === 0 ? moodData : moodData.slice(0, days);
    const distribution = { Happy: 0, Neutral: 0, Sad: 0, Anxious: 0, Stressed: 0 };
    periodData.forEach((entry) => {
      distribution[entry.mood] = (distribution[entry.mood] || 0) + 1;
    });
    return distribution;
  };

  // Get sentiment analytics for period
  const getSentimentAnalyticsForPeriod = (days) => {
    const periodData = days === 0 ? moodData : moodData.slice(0, days);
    const sentiments = { positive: 0, neutral: 0, negative: 0 };
    periodData.forEach((entry) => {
      const label = entry.sentimentLabel || 'neutral';
      if (label.toLowerCase() === 'positive') sentiments.positive++;
      else if (label.toLowerCase() === 'negative') sentiments.negative++;
      else sentiments.neutral++;
    });
    const total = periodData.length || 1;
    return {
      positive: ((sentiments.positive / total) * 100).toFixed(0),
      neutral: ((sentiments.neutral / total) * 100).toFixed(0),
      negative: ((sentiments.negative / total) * 100).toFixed(0),
    };
  };

  const clampMoodScore = (score) => Math.min(5, Math.max(1, score));

  // Prediction mode 1: based on the latest entry and immediate recent context.
  const getCurrentBasedPrediction = () => {
    const latest = getCurrentEntry();
    if (!latest) return null;

    const latestScore = getMoodValue(latest.mood);
    const recentScores = moodData.slice(0, 3).map((entry) => getMoodValue(entry.mood));
    const recentAvg = recentScores.length
      ? recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length
      : latestScore;

    let sentimentBias = 0;
    const sentiment = (latest.sentimentLabel || '').toLowerCase();
    if (sentiment === 'positive') sentimentBias = 0.4;
    if (sentiment === 'negative') sentimentBias = -0.4;

    const predictedScore = clampMoodScore(latestScore * 0.5 + recentAvg * 0.5 + sentimentBias);
    const roundedPrediction = Math.round(predictedScore);
    const moodFromScore = roundedPrediction >= 5 ? 'Happy' : roundedPrediction >= 3 ? 'Neutral' : 'Low Mood';

    return {
      score: predictedScore.toFixed(2),
      moodLabel: moodFromScore,
      confidence: Math.min(95, 55 + recentScores.length * 10),
      basedOn: `Latest entry + last ${recentScores.length} check-ins`,
    };
  };

  // Prediction mode 2: behavioral forecast using track windows.
  const getBehavioralPrediction = (days) => {
    const windowData = moodData.slice(0, days);
    if (!windowData.length) {
      return {
        days,
        predictedScore: '0.00',
        trend: 'stable',
        confidence: 0,
      };
    }

    const scores = windowData.map((entry) => getMoodValue(entry.mood));
    const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;

    // Recent half vs older half gives lightweight trend direction.
    const midpoint = Math.max(1, Math.floor(scores.length / 2));
    const recentHalf = scores.slice(0, midpoint);
    const olderHalf = scores.slice(midpoint);
    const recentAvg = recentHalf.reduce((sum, score) => sum + score, 0) / recentHalf.length;
    const olderAvg = olderHalf.length
      ? olderHalf.reduce((sum, score) => sum + score, 0) / olderHalf.length
      : recentAvg;

    const delta = recentAvg - olderAvg;
    const predicted = clampMoodScore(avg + delta * 0.5);
    const trend = delta > 0.2 ? 'up' : delta < -0.2 ? 'down' : 'stable';

    return {
      days,
      predictedScore: predicted.toFixed(2),
      trend,
      confidence: Math.min(95, 50 + Math.min(scores.length, 20) * 2),
    };
  };

  const behavioralPredictions = [3, 5, 7, 100].map((days) => getBehavioralPrediction(days));

  const getRiskScoreFromLabel = (risk) => {
    if (risk === 'SAFE') return '4.50';
    if (risk === 'WARNING') return '2.75';
    if (risk === 'CRITICAL') return '1.25';
    return '0.00';
  };

  const calculateMoodTrend = () => {
    const moodValues = { Happy: 5, Neutral: 3, Sad: 2, Anxious: 1, Stressed: 1 };
    const filteredData = getFilteredMoodData().reverse();

    return {
      labels: filteredData.map((entry) =>
        new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      ),
      datasets: [
        {
          label: 'Mood Score',
          data: filteredData.map((entry) => moodValues[entry.mood] || 3),
          borderColor: 'rgb(74, 222, 128)',
          backgroundColor: 'rgba(74, 222, 128, 0.1)',
          tension: 0.4,
        },
      ],
    };
  };

  const calculateSentimentData = () => {
    const sentimentCounts = getFilteredMoodData().reduce(
      (acc, entry) => {
        acc[entry.sentimentLabel] = (acc[entry.sentimentLabel] || 0) + 1;
        return acc;
      },
      { positive: 0, neutral: 0, negative: 0 }
    );

    return {
      labels: ['Positive', 'Neutral', 'Negative'],
      datasets: [
        {
          data: [
            sentimentCounts.positive,
            sentimentCounts.neutral,
            sentimentCounts.negative,
          ],
          backgroundColor: [
            'rgba(74, 222, 128, 0.8)',
            'rgba(100, 116, 139, 0.8)',
            'rgba(244, 63, 94, 0.8)',
          ],
          borderColor: [
            'rgb(74, 222, 128)',
            'rgb(100, 116, 139)',
            'rgb(244, 63, 94)',
          ],
        },
      ],
    };
  };

  const calculateResilienceGauge = () => {
    const score = resilienceScore?.score || 0;
    let statusColor;
    if (score >= 70) {
      statusColor = 'rgba(74, 222, 128, 0.8)';
    } else if (score >= 50) {
      statusColor = 'rgba(251, 191, 36, 0.8)';
    } else {
      statusColor = 'rgba(244, 63, 94, 0.8)';
    }

    return {
      labels: ['Resilience Score'],
      datasets: [
        {
          data: [score, 100 - score],
          backgroundColor: [
            statusColor,
            'rgba(51, 65, 85, 0.3)',
          ],
          borderWidth: 0,
        },
      ],
    };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-20 border rounded-3xl border-slate-700/70 bg-slate-900/65 animate-pulse"></div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 border rounded-2xl border-slate-700/70 bg-slate-900/65 animate-pulse"></div>
          ))}
        </div>
        <div className="border h-96 rounded-3xl border-slate-700/70 bg-slate-900/65 animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 text-red-100 border rounded-2xl border-red-500/50 bg-red-500/15">
          <p className="font-semibold">Could not load some data</p>
          <p className="mt-1 text-sm">{error}</p>
          <button onClick={() => loadDashboardData()} className="px-4 py-2 mt-3 text-sm font-semibold text-white bg-red-500 rounded-lg hover:bg-red-400">
            Try again
          </button>
        </div>
      )}

      <header className="relative p-6 overflow-hidden border rounded-3xl border-slate-700/70 bg-gradient-to-br from-slate-900/80 to-slate-950/70 md:p-8">
        <div className="absolute top-0 w-40 h-40 rounded-full -left-20 bg-emerald-500/15 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 w-48 h-48 rounded-full -right-16 bg-cyan-500/15 blur-3xl pointer-events-none"></div>
        <div className="relative z-10">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Progress & insights</p>
          <h1 className="mt-2 text-3xl font-bold text-white md:text-4xl">Wellness Dashboard</h1>
          <p className="max-w-2xl mt-2 text-slate-300">Weekly summary of your emotional patterns, resilience growth, and recommended actions.</p>
        </div>
        <button
          onClick={handleRecalculate}
          disabled={isRecalculating}
          className="absolute z-20 px-4 py-2 font-semibold transition-colors rounded-lg top-6 right-8 bg-emerald-400 text-slate-950 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isRecalculating ? 'Recalculating...' : 'Recalculate'}
        </button>
      </header>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="p-4 border rounded-2xl border-slate-700 bg-slate-900/75">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Total Logged</p>
          <p className="mt-2 text-3xl font-bold text-white">{getMoodEntriesCount()}</p>
          <p className="mt-1 text-xs text-slate-400">mood entries</p>
        </div>
        <div className="p-4 border rounded-2xl border-slate-700 bg-slate-900/75">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Current Streak</p>
          <p className="mt-2 text-3xl font-bold text-emerald-300">{getStreakCount()}</p>
          <p className="mt-1 text-xs text-slate-400">consecutive days</p>
        </div>
        <div className="p-4 border rounded-2xl border-slate-700 bg-slate-900/75">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Sentiment Trend</p>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-3xl font-bold text-white">
              {getSentimentTrend() === 'up' ? '↑' : getSentimentTrend() === 'down' ? '↓' : '→'}
            </p>
            <p className="text-sm text-slate-300">
              {getSentimentTrend() === 'up' ? 'Improving' : getSentimentTrend() === 'down' ? 'Declining' : 'Stable'}
            </p>
          </div>
        </div>
      </div>

      {/* Early Warning System Risk Dashboard */}
      <RiskDashboard />

      {/* Current Entry Analysis */}
      {getCurrentEntry() && (
        <div className="p-6 border rounded-3xl border-slate-700/70 bg-gradient-to-br from-emerald-900/30 to-slate-900/75 md:p-8">
          <h2 className="mb-1 text-2xl font-semibold text-white">Today&apos;s Entry</h2>
          <p className="mb-6 text-sm text-slate-300">Your latest mood check-in</p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 border rounded-2xl border-emerald-700/50 bg-slate-950/50">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Current Mood</p>
              <p className="mt-3 text-2xl font-bold text-emerald-300">{getCurrentEntry()?.mood}</p>
              <p className="mt-2 text-xs text-slate-400">Score: {getMoodValue(getCurrentEntry()?.mood)}/5</p>
            </div>
            <div className="p-4 border rounded-2xl border-emerald-700/50 bg-slate-950/50">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Entry Time</p>
              <p className="mt-3 text-lg font-semibold text-white">
                {new Date(getCurrentEntry()?.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
              <p className="mt-2 text-xs text-slate-400">
                {new Date(getCurrentEntry()?.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="p-4 border rounded-2xl border-emerald-700/50 bg-slate-950/50">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Sentiment</p>
              <p className="mt-3 text-lg font-bold capitalize text-cyan-300">{getCurrentEntry()?.sentimentLabel || 'N/A'}</p>
              <p className="mt-2 text-xs text-slate-400">From your reflection</p>
            </div>
            <div className="p-4 border rounded-2xl border-emerald-700/50 bg-slate-950/50">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Energy Level</p>
              <p className="mt-3 text-lg font-bold text-orange-300">{getCurrentEntry()?.energy || 'N/A'}</p>
              <p className="mt-2 text-xs text-slate-400">Self-reported level</p>
            </div>
          </div>
        </div>
      )}

      {/* Behavioral History Comparison */}
      <div className="p-6 border rounded-3xl border-slate-700/70 bg-gradient-to-br from-slate-900/80 to-slate-950/70 md:p-8">
        <h2 className="mb-1 text-2xl font-semibold text-white">Behavioral History</h2>
        <p className="mb-6 text-sm text-slate-300">Your mood patterns across different time periods</p>

        {moodData.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* 3 Day Track */}
            <div className="p-5 border rounded-2xl border-slate-700 bg-slate-950/50">
              <p className="mb-4 text-sm font-semibold text-white">3 Day Track</p>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-400">Avg Mood Score</p>
                  <p className="mt-1 text-2xl font-bold text-cyan-300">
                    {getAverageMoodForPeriod(3)}/5
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Mood Consistency</p>
                  <p className="mt-1 text-lg font-bold text-emerald-300">
                    {getMoodConsistencyForPeriod(3)}%
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-700">
                  <p className="mb-2 text-xs text-slate-500">Distribution</p>
                  <div className="space-y-1 text-xs">
                    {Object.entries(getMoodDistributionForPeriod(3)).map(([mood, count]) => (
                      <div key={mood} className="flex justify-between">
                        <span className="text-slate-400">{mood}</span>
                        <span className="font-semibold text-slate-200">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 5 Day Track */}
            <div className="p-5 border rounded-2xl border-slate-700 bg-slate-950/50">
              <p className="mb-4 text-sm font-semibold text-white">5 Day Track</p>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-400">Avg Mood Score</p>
                  <p className="mt-1 text-2xl font-bold text-cyan-300">
                    {getAverageMoodForPeriod(5)}/5
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Mood Consistency</p>
                  <p className="mt-1 text-lg font-bold text-emerald-300">
                    {getMoodConsistencyForPeriod(5)}%
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-700">
                  <p className="mb-2 text-xs text-slate-500">Sentiment</p>
                  <div className="space-y-1 text-xs">
                    {Object.entries(getSentimentAnalyticsForPeriod(5)).map(([sentiment, percent]) => (
                      <div key={sentiment} className="flex justify-between">
                        <span className="capitalize text-slate-400">{sentiment}</span>
                        <span className="font-semibold text-slate-200">{percent}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 7 Day Track */}
            <div className="p-5 border rounded-2xl border-slate-700 bg-slate-950/50">
              <p className="mb-4 text-sm font-semibold text-white">7 Day Track</p>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-400">Avg Mood Score</p>
                  <p className="mt-1 text-2xl font-bold text-cyan-300">
                    {getAverageMoodForPeriod(7)}/5
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Mood Consistency</p>
                  <p className="mt-1 text-lg font-bold text-emerald-300">
                    {getMoodConsistencyForPeriod(7)}%
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-700">
                  <p className="mb-2 text-xs text-slate-500">Sentiment Summary</p>
                  <div className="space-y-1 text-xs">
                    {Object.entries(getSentimentAnalyticsForPeriod(7)).map(([sentiment, percent]) => (
                      <div key={sentiment} className="flex justify-between">
                        <span className="capitalize text-slate-400">{sentiment}</span>
                        <span className="font-semibold text-slate-200">{percent}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 100 Day Track */}
            <div className="p-5 border rounded-2xl border-emerald-700/50 bg-emerald-950/30">
              <p className="mb-4 text-sm font-semibold text-white">100 Day Track</p>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-400">Avg Mood Score</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-300">
                    {getAverageMoodForPeriod(100)}/5
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Consistency</p>
                  <p className="mt-1 text-lg font-bold text-yellow-300">
                    {getMoodConsistencyForPeriod(100)}%
                  </p>
                </div>
                <div className="pt-3 border-t border-emerald-700/50">
                  <p className="mb-2 text-xs text-slate-400">Long-term Pattern</p>
                  <div className="space-y-1 text-xs">
                    {Object.entries(getSentimentAnalyticsForPeriod(100)).map(([sentiment, percent]) => (
                      <div key={sentiment} className="flex justify-between">
                        <span className="capitalize text-slate-400">{sentiment}</span>
                        <span className="font-semibold text-emerald-200">{percent}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="py-8 text-center text-slate-400">No behavioral data yet. Start logging your moods to see patterns emerge.</p>
        )}
      </div>

      {/* Prediction Engine */}
      <div className="p-6 border rounded-3xl border-slate-700/70 bg-gradient-to-br from-cyan-900/20 to-slate-900/80 md:p-8">
        <h2 className="mb-1 text-2xl font-semibold text-white">Prediction</h2>
        <p className="mb-6 text-sm text-slate-300">Two-layer forecast: current state and behavioral history tracks</p>

        {moodData.length > 0 ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="p-5 border rounded-2xl border-cyan-600/40 bg-slate-950/55">
                <p className="text-xs uppercase tracking-[0.16em] text-cyan-300">Current Based Prediction</p>
                <p className="mt-3 text-3xl font-bold text-white">
                  {mlCurrentPrediction ? getRiskScoreFromLabel(mlCurrentPrediction.risk) : getCurrentBasedPrediction()?.score}/5
                </p>
                <p className="mt-1 text-sm text-cyan-200">
                  Expected next state: {mlCurrentPrediction ? mlCurrentPrediction.risk : getCurrentBasedPrediction()?.moodLabel}
                </p>
                <p className="mt-3 text-xs text-slate-400">
                  Confidence: {mlCurrentPrediction ? mlCurrentPrediction.confidence : getCurrentBasedPrediction()?.confidence}%
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {mlCurrentPrediction
                    ? `ML reason: ${mlCurrentPrediction.reason}`
                    : getCurrentBasedPrediction()?.basedOn}
                </p>
              </div>

              <div className="p-5 border rounded-2xl border-emerald-600/40 bg-slate-950/55">
                <p className="text-xs uppercase tracking-[0.16em] text-emerald-300">Interpretation</p>
                <p className="mt-3 text-sm text-slate-200">
                  This prediction uses your latest mood entry and immediate trend. It is designed to reflect how you may feel in the near term (next day) based on current signals.
                </p>
                <p className="mt-3 text-sm text-slate-300">
                  Behavioral forecasts below use longer windows to estimate more stable emotional patterns.
                </p>
              </div>
            </div>

            <div>
              <p className="mb-3 text-xs uppercase tracking-[0.16em] text-slate-400">Behavioral History Forecast Tracks</p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {(mlBehavioralForecast.length > 0 ? mlBehavioralForecast : behavioralPredictions).map((prediction) => {
                  const isMlForecast = Object.prototype.hasOwnProperty.call(prediction, 'risk');
                  const score = isMlForecast
                    ? getRiskScoreFromLabel(prediction.risk)
                    : prediction.predictedScore;
                  const trendLabel = isMlForecast
                    ? prediction.risk || 'No Data'
                    : (prediction.trend === 'up' ? 'Improving' : prediction.trend === 'down' ? 'Declining' : 'Stable');

                  return (
                    <div key={prediction.days} className="p-4 border rounded-2xl border-slate-700 bg-slate-950/50">
                      <p className="text-sm font-semibold text-white">{prediction.days} Day Track</p>
                      <p className="mt-3 text-2xl font-bold text-emerald-300">{score}/5</p>
                      <p className="mt-1 text-xs text-slate-300">Trend: {trendLabel}</p>
                      <p className="mt-2 text-xs text-slate-500">Confidence: {prediction.confidence || 0}%</p>
                      {isMlForecast && prediction.reason && (
                        <p className="mt-2 text-xs text-slate-500 line-clamp-2">{prediction.reason}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <p className="py-8 text-center text-slate-400">Prediction will appear after a few mood entries are logged.</p>
        )}
      </div>

      {/* Resilience Score Card */}
      {resilienceScore && (
        <div className="p-6 border rounded-3xl border-slate-700/70 bg-slate-900/75 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-white">Resilience Score</h2>
              <p className="mt-1 text-sm text-slate-300">Your emotional strength & growth capacity</p>
            </div>
            {resilienceTrend && <p className="text-xs text-emerald-300">↑ Trending up</p>}
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="w-48 h-48">
              <Doughnut
                data={calculateResilienceGauge()}
                options={{
                  cutout: '75%',
                  plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false },
                  },
                }}
              />
              <div className="relative left-0 w-full text-center -top-36">
                <div className="text-4xl font-bold text-emerald-300">
                  {resilienceScore.score}
                </div>
                <div className="text-sm text-slate-400">/ 100</div>
              </div>
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex justify-between p-3 border rounded-xl border-slate-700 bg-slate-950/50">
                <span className="text-sm text-slate-400">Mood Consistency</span>
                <span className="font-semibold text-white">
                  {resilienceScore.metrics.moodConsistency}
                </span>
              </div>
              <div className="flex justify-between p-3 border rounded-xl border-slate-700 bg-slate-950/50">
                <span className="text-sm text-slate-400">Positive Sentiment</span>
                <span className="font-semibold text-white">
                  {resilienceScore.metrics.positiveSentimentPercent}%
                </span>
              </div>
              <div className="flex justify-between p-3 border rounded-xl border-slate-700 bg-slate-950/50">
                <span className="text-sm text-slate-400">Coping Actions</span>
                <span className="font-semibold text-white">
                  {resilienceScore.metrics.copingActionsCount}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Time Period Filter */}
      <div className="flex flex-wrap gap-2">
        <p className="w-full text-xs uppercase tracking-[0.16em] text-slate-400">Time period</p>
        {[7, 14, 30].map((period) => (
          <button
            key={period}
            onClick={() => setTimePeriod(period)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              timePeriod === period
                ? 'border-emerald-400/60 bg-emerald-500/20 text-white'
                : 'border-slate-600 bg-slate-800/60 text-slate-200 hover:bg-slate-700'
            } border`}
          >
            {period} days
          </button>
        ))}
        <button
          onClick={() => setTimePeriod(0)}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors border ${
            timePeriod === 0
              ? 'border-emerald-400/60 bg-emerald-500/20 text-white'
              : 'border-slate-600 bg-slate-800/60 text-slate-200 hover:bg-slate-700'
          }`}
        >
          All time
        </button>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Mood Trend */}
        <div className="p-6 border rounded-3xl border-slate-700/70 bg-slate-900/75 md:p-8">
          <h2 className="mb-4 text-xl font-semibold text-white">Mood Trend</h2>
          {moodData.length > 0 ? (
            <Line
              data={calculateMoodTrend()}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                  legend: { display: false },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 5,
                    ticks: { color: '#94a3b8' },
                    grid: { color: 'rgba(255, 255, 255, 0.08)' },
                  },
                  x: {
                    ticks: { color: '#94a3b8' },
                    grid: { color: 'rgba(255, 255, 255, 0.08)' },
                  },
                },
              }}
            />
          ) : (
            <p className="py-8 text-center text-slate-400">No mood data available. Start logging moods from the Wellness Coach.</p>
          )}
        </div>

        {/* Sentiment Distribution */}
        <div className="p-6 border rounded-3xl border-slate-700/70 bg-slate-900/75 md:p-8">
          <h2 className="mb-4 text-xl font-semibold text-white">Sentiment Pattern</h2>
          {journalData.length > 0 ? (
            <Bar
              data={calculateSentimentData()}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                  legend: { display: false },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: { color: '#94a3b8', stepSize: 1 },
                    grid: { color: 'rgba(255, 255, 255, 0.08)' },
                  },
                  x: {
                    ticks: { color: '#94a3b8' },
                    grid: { color: 'rgba(255, 255, 255, 0.08)' },
                  },
                },
              }}
            />
          ) : (
            <p className="py-8 text-center text-slate-400">No reflection data yet. Save reflections from the Wellness Coach.</p>
          )}
        </div>
      </div>

      {/* Insights Summary */}
      {insights.length > 0 && (
        <div className="p-6 border rounded-3xl border-slate-700/70 bg-slate-900/75 md:p-8">
          <h2 className="mb-4 text-xl font-semibold text-white">Personalized Insights</h2>
          <p className="mb-4 text-sm text-slate-300">Smart observations from your patterns</p>
          <div className="space-y-3">
            {insights.slice(0, 5).map((insight, index) => (
              <div
                key={index}
                className="p-4 transition-colors border rounded-2xl border-slate-700 bg-slate-950/50 hover:bg-slate-950/70"
              >
                <p className="text-sm text-slate-100">{insight.message}</p>
              </div>
            ))}
            {insights.length > 5 && (
              <p className="mt-3 text-xs text-slate-400">
                {insights.length - 5} more insights available. Check the app regularly for new observations.
              </p>
            )}
          </div>
        </div>
      )}

      {insights.length === 0 && (
        <div className="p-6 text-center border rounded-2xl border-slate-700/50 bg-slate-950/30">
          <p className="text-slate-400">Insights will appear as you log moods and reflections over time.</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

