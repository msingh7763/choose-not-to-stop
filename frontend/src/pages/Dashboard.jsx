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
import { moodAPI, journalAPI, resilienceAPI, insightsAPI } from '../services/api';
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

      const mockTrendScore = (resilienceRes.data.data?.score || 0) + 5;
      setResilienceTrend(mockTrendScore > resilienceRes.data.data?.score);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
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

  const getMoodValue = (mood) => {
    const moodValues = { Happy: 5, Neutral: 3, Sad: 2, Anxious: 1, Stressed: 1 };
    return moodValues[mood] || 3;
  };

  const getAverageMoodForPeriod = (days) => {
    const periodData = days === 0 ? moodData : moodData.slice(0, days);
    if (periodData.length === 0) return '0.0';
    const total = periodData.reduce((sum, entry) => sum + getMoodValue(entry.mood), 0);
    return (total / periodData.length).toFixed(1);
  };

  const getAverageSleepForPeriod = (days) => {
    const periodData = days === 0 ? moodData : moodData.slice(0, days);
    const sleepValues = periodData
      .map((entry) => Number(entry.sleepHours))
      .filter((value) => Number.isFinite(value) && value >= 0);

    if (sleepValues.length === 0) return null;
    const total = sleepValues.reduce((sum, value) => sum + value, 0);
    return (total / sleepValues.length).toFixed(1);
  };

  const getMostCommonMoodForPeriod = (days) => {
    const periodData = days === 0 ? moodData : moodData.slice(0, days);
    if (periodData.length === 0) return 'No data';

    const counts = periodData.reduce((acc, entry) => {
      acc[entry.mood] = (acc[entry.mood] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'No data';
  };

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

  const getInsightNarrative = () => {
    if (moodData.length === 0) {
      return 'Log a few mood entries and reflections to unlock tailored resilience insights.';
    }

    const avgMood = getAverageMoodForPeriod(7);
    const avgSleep = getAverageSleepForPeriod(7);
    const commonMood = getMostCommonMoodForPeriod(7);
    const positiveSentiment = getSentimentAnalyticsForPeriod(7).positive;

    return `Your last 7 days average ${avgMood}/5 mood with ${avgSleep ? `${avgSleep} hours` : 'unrecorded'} sleep. ${commonMood} is your most frequent mood, and ${positiveSentiment}% of recent entries reflect positive sentiment.`;
  };

  const getSentimentTrend = () => {
    if (moodData.length < 2) return 'Stable';
    const recent = moodData.slice(0, 7);
    const older = moodData.slice(7, 14);
    const recentPositive = recent.filter((e) => e.mood === 'Happy').length;
    const olderPositive = older.filter((e) => e.mood === 'Happy').length;
    return recentPositive > olderPositive ? 'Improving ↑' : olderPositive > recentPositive ? 'Declining ↓' : 'Stable →';
  };

  const calculateMoodTrend = () => {
    const moodValues = { Happy: 5, Neutral: 3, Sad: 2, Anxious: 1, Stressed: 1 };
    const filteredData = getFilteredMoodData().slice().reverse();

    return {
      labels: filteredData.map((entry) =>
        new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      ),
      datasets: [
        {
          label: 'Mood Score',
          data: filteredData.map((entry) => moodValues[entry.mood] || 3),
          borderColor: '#8E929B',
          backgroundColor: 'rgba(236, 183, 179, 0.35)',
          pointBackgroundColor: '#ECB7B3',
          pointBorderColor: '#000000',
          pointRadius: 4,
          tension: 0.3,
          fill: true,
        },
      ],
    };
  };

  const calculateSentimentData = () => {
    const sentimentCounts = getFilteredMoodData().reduce(
      (acc, entry) => {
        const key = String(entry.sentimentLabel || 'neutral').toLowerCase();
        if (key in acc) acc[key]++;
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
            'rgba(164, 187, 172, 0.85)',
            'rgba(142, 146, 155, 0.75)',
            'rgba(236, 183, 179, 0.85)',
          ],
          borderColor: ['#A4BBAC', '#8E929B', '#ECB7B3'],
          borderWidth: 1.5,
        },
      ],
    };
  };

  const calculateResilienceGauge = () => {
    const score = resilienceScore?.score || 0;
    return {
      labels: ['Resilience Score'],
      datasets: [
        {
          data: [score, 100 - score],
          backgroundColor: ['#A4BBAC', 'rgba(142, 146, 155, 0.2)'],
          borderWidth: 0,
        },
      ],
    };
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-14 w-1/3 bg-black/10 rounded"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-white/70 rounded-2xl border border-black/10"></div>
          ))}
        </div>
        <div className="h-72 bg-white/70 rounded-2xl border border-black/10"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 1. Page Header (Rendered directly on screen WITHOUT a card) */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] font-extrabold text-black">
            Progress & Insights
          </p>
          <h1
            className="mt-1 text-3xl md:text-5xl font-black text-black tracking-tight"
            style={{ fontFamily: 'Poppins, Inter, sans-serif' }}
          >
            Wellness Dashboard
          </h1>
          <p className="max-w-2xl mt-1.5 text-black font-semibold text-sm md:text-base">
            Weekly summary of your emotional patterns, resilience growth, and recommended actions.
          </p>
        </div>

        <button
          onClick={handleRecalculate}
          disabled={isRecalculating}
          className="btn-secondary text-sm"
        >
          {isRecalculating ? 'Recalculating...' : 'Recalculate'}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-400 bg-red-100/80 text-black font-semibold">
          <p className="font-bold">{error}</p>
          <button
            onClick={loadDashboardData}
            className="mt-2 text-xs font-bold underline"
          >
            Try reloading data
          </button>
        </div>
      )}

      {/* 2. Unified Key Metrics Strip (Clean, minimal stat row instead of nested cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
        <div className="p-4 rounded-2xl bg-white/80 border border-[#8E929B]/40">
          <p className="text-xs uppercase tracking-wider font-extrabold text-black opacity-75">Total Logged</p>
          <p className="mt-1.5 text-3xl font-black text-black">{getMoodEntriesCount()}</p>
          <p className="text-xs text-black font-medium">mood entries</p>
        </div>

        <div className="p-4 rounded-2xl bg-white/80 border border-[#8E929B]/40">
          <p className="text-xs uppercase tracking-wider font-extrabold text-black opacity-75">Current Streak</p>
          <p className="mt-1.5 text-3xl font-black text-black">{getStreakCount()}</p>
          <p className="text-xs text-black font-medium">consecutive days</p>
        </div>

        <div className="p-4 rounded-2xl bg-white/80 border border-[#8E929B]/40">
          <p className="text-xs uppercase tracking-wider font-extrabold text-black opacity-75">Avg Mood (7d)</p>
          <p className="mt-1.5 text-3xl font-black text-black">{getAverageMoodForPeriod(7)}/5</p>
          <p className="text-xs text-black font-medium">based on check-ins</p>
        </div>

        <div className="p-4 rounded-2xl bg-white/80 border border-[#8E929B]/40">
          <p className="text-xs uppercase tracking-wider font-extrabold text-black opacity-75">Avg Sleep (7d)</p>
          <p className="mt-1.5 text-3xl font-black text-black">
            {getAverageSleepForPeriod(7) ? `${getAverageSleepForPeriod(7)}h` : 'N/A'}
          </p>
          <p className="text-xs text-black font-medium">hours per night</p>
        </div>

        <div className="col-span-2 lg:col-span-1 p-4 rounded-2xl bg-white/80 border border-[#8E929B]/40">
          <p className="text-xs uppercase tracking-wider font-extrabold text-black opacity-75">Sentiment Trend</p>
          <p className="mt-1.5 text-2xl font-black text-black">{getSentimentTrend()}</p>
          <p className="text-xs text-black font-medium">reflection signals</p>
        </div>
      </div>

      {/* 3. Actionable Insight Narrative (Single clean highlight banner) */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#F4DDD5]/85 via-[#DCE1DA]/80 to-[#A4BBAC]/50 border border-[#8E929B]/45">
        <p className="text-xs uppercase tracking-widest font-black text-black mb-1">Key Observation</p>
        <p className="text-black font-semibold text-base leading-relaxed">
          {getInsightNarrative()}
        </p>
      </div>

      {/* 4. Analytics & Trends Section (Clean 2-card layout with time period filter) */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-black text-black">Emotional & Sentiment Trends</h2>
          <div className="flex items-center gap-1.5">
            {[7, 14, 30].map((period) => (
              <button
                key={period}
                onClick={() => setTimePeriod(period)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  timePeriod === period
                    ? 'bg-[#ECB7B3] border-[#8E929B] text-black shadow-xs'
                    : 'bg-white/80 border-[#8E929B]/40 text-black hover:bg-[#F4DDD5]'
                }`}
              >
                {period}d
              </button>
            ))}
            <button
              onClick={() => setTimePeriod(0)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                timePeriod === 0
                  ? 'bg-[#ECB7B3] border-[#8E929B] text-black shadow-xs'
                  : 'bg-white/80 border-[#8E929B]/40 text-black hover:bg-[#F4DDD5]'
              }`}
            >
              All
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-white/85 border border-[#8E929B]/40 shadow-sm">
            <h3 className="text-lg font-bold text-black mb-4">Mood Trend</h3>
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
                      ticks: { color: '#000000', font: { weight: 'bold' } },
                      grid: { color: 'rgba(142, 146, 155, 0.2)' },
                    },
                    x: {
                      ticks: { color: '#000000', font: { weight: 'bold' } },
                      grid: { color: 'rgba(142, 146, 155, 0.2)' },
                    },
                  },
                }}
              />
            ) : (
              <p className="py-12 text-center text-black font-medium">No mood data recorded yet.</p>
            )}
          </div>

          <div className="p-6 rounded-2xl bg-white/85 border border-[#8E929B]/40 shadow-sm">
            <h3 className="text-lg font-bold text-black mb-4">Sentiment Pattern</h3>
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
                      ticks: { color: '#000000', stepSize: 1, font: { weight: 'bold' } },
                      grid: { color: 'rgba(142, 146, 155, 0.2)' },
                    },
                    x: {
                      ticks: { color: '#000000', font: { weight: 'bold' } },
                      grid: { color: 'rgba(142, 146, 155, 0.2)' },
                    },
                  },
                }}
              />
            ) : (
              <p className="py-12 text-center text-black font-medium">No journal reflections recorded yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* 5. Resilience Score & Metrics (Single Unified Card) */}
      {resilienceScore && (
        <div className="p-6 md:p-8 rounded-2xl bg-white/85 border border-[#8E929B]/40 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black text-black">Resilience Score</h2>
              <p className="text-sm text-black font-semibold">Your emotional strength & coping consistency</p>
            </div>
            {resilienceTrend && (
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-[#A4BBAC]/35 border border-[#A4BBAC] text-black">
                ↑ Trending up
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="flex flex-col items-center justify-center">
              <div className="w-44 h-44 relative flex items-center justify-center">
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
                <div className="absolute text-center">
                  <div className="text-4xl font-black text-black">{resilienceScore.score}</div>
                  <div className="text-xs font-bold text-black opacity-75">/ 100</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-xl bg-[#DCE1DA]/60 border border-[#8E929B]/30">
                <span className="text-sm font-bold text-black">Mood Consistency</span>
                <span className="text-base font-black text-black">{resilienceScore.metrics.moodConsistency}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-[#DCE1DA]/60 border border-[#8E929B]/30">
                <span className="text-sm font-bold text-black">Positive Sentiment</span>
                <span className="text-base font-black text-black">{resilienceScore.metrics.positiveSentimentPercent}%</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-[#DCE1DA]/60 border border-[#8E929B]/30">
                <span className="text-sm font-bold text-black">Coping Actions</span>
                <span className="text-base font-black text-black">{resilienceScore.metrics.copingActionsCount}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Early Warning Risk Evaluation */}
      <RiskDashboard />

      {/* 7. Personalized Insights List */}
      {insights.length > 0 && (
        <div className="p-6 rounded-2xl bg-white/85 border border-[#8E929B]/40 shadow-sm">
          <h2 className="text-xl font-black text-black mb-1">Personalized Observations</h2>
          <p className="text-sm text-black font-semibold mb-4">Smart insights deduced from your check-ins</p>
          <div className="space-y-2.5">
            {insights.slice(0, 4).map((insight, index) => (
              <div
                key={index}
                className="p-3.5 rounded-xl bg-[#DCE1DA]/50 border border-[#8E929B]/30 flex items-start gap-3"
              >
                <span className="text-[#A4BBAC] font-black text-lg">💡</span>
                <p className="text-sm font-semibold text-black leading-snug">{insight.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
