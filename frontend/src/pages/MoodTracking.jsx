import { useState, useEffect } from 'react';
import { moodAPI } from '../services/api';

const MoodTracking = () => {
  const [mood, setMood] = useState('');
  const [sleepHours, setSleepHours] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [todayEntry, setTodayEntry] = useState(null);
  const [recentEntries, setRecentEntries] = useState([]);
  const [messageType, setMessageType] = useState('info');

  const moods = [
    { value: 'Happy', emoji: '😊', color: 'from-green-400 to-green-600' },
    { value: 'Neutral', emoji: '😐', color: 'from-gray-400 to-gray-600' },
    { value: 'Sad', emoji: '😢', color: 'from-blue-400 to-blue-600' },
    { value: 'Anxious', emoji: '😰', color: 'from-yellow-400 to-yellow-600' },
    { value: 'Stressed', emoji: '😤', color: 'from-red-400 to-red-600' },
  ];

  const moodScores = {
    Happy: 5,
    Neutral: 3,
    Sad: 2,
    Anxious: 1,
    Stressed: 1,
  };

  const moodSupport = {
    Happy: 'Great to see this. Keep the momentum with one small positive habit today.',
    Neutral: 'A steady day still matters. One mindful pause can lift your day.',
    Sad: 'You are not alone. A short walk or one honest journal entry can help release pressure.',
    Anxious: 'Try a 2-minute breathing reset: inhale 4s, hold 4s, exhale 6s.',
    Stressed: 'Break tasks into one next step. Small wins reduce stress load quickly.',
  };

  useEffect(() => {
    loadTodayEntry();
    loadRecentEntries();
  }, []);

  const loadTodayEntry = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await moodAPI.getAll({ startDate: today, endDate: today });
      if (response.data.data && response.data.data.length > 0) {
        const entry = response.data.data[0];
        setTodayEntry(entry);
        setMood(entry.mood);
        setSleepHours(entry.sleepHours || '');
        setNotes(entry.notes || '');
      }
    } catch (error) {
      console.error('Error loading today entry:', error);
    }
  };

  const loadRecentEntries = async () => {
    try {
      const response = await moodAPI.getAll({ limit: 7 });
      setRecentEntries(response.data.data || []);
    } catch (error) {
      console.error('Error loading recent entries:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!mood) {
      setMessage('Please select a mood');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await moodAPI.create({
        mood,
        sleepHours: sleepHours ? parseInt(sleepHours) : null,
        notes: notes.trim(),
      });

      setMessage(todayEntry
        ? 'Mood entry updated. Tracking regularly helps identify emotional patterns early.'
        : 'Mood entry saved. Daily check-ins build self-awareness and better support decisions.');
      setMessageType('success');
      loadTodayEntry();
      loadRecentEntries();

      // Clear form if new entry
      if (!todayEntry) {
        setSleepHours('');
        setNotes('');
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error saving mood entry');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const getSevenDayAverage = () => {
    const window = recentEntries.slice(0, 7);
    if (!window.length) return '0.00';
    const total = window.reduce((sum, entry) => sum + (moodScores[entry.mood] || 3), 0);
    return (total / window.length).toFixed(2);
  };

  const getTrendLabel = () => {
    if (recentEntries.length < 4) return 'Not enough data yet';
    const recent = recentEntries.slice(0, 3);
    const previous = recentEntries.slice(3, 6);
    if (!previous.length) return 'Not enough data yet';

    const recentAvg = recent.reduce((sum, entry) => sum + (moodScores[entry.mood] || 3), 0) / recent.length;
    const previousAvg = previous.reduce((sum, entry) => sum + (moodScores[entry.mood] || 3), 0) / previous.length;
    const delta = recentAvg - previousAvg;

    if (delta > 0.35) return 'Improving';
    if (delta < -0.35) return 'Needs attention';
    return 'Stable';
  };

  const getCheckInStreak = () => {
    if (!recentEntries.length) return 0;
    const uniqueDays = new Set(
      recentEntries.map((entry) => new Date(entry.date).toDateString())
    );

    let streak = 0;
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);

    while (uniqueDays.has(cursor.toDateString())) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
  };

  const selectedMoodSupport = mood ? moodSupport[mood] : 'Select a mood to get a personalized support tip.';

  return (
    <div className="space-y-6">
      <header className="relative p-6 overflow-hidden border rounded-3xl border-slate-700/70 bg-gradient-to-br from-slate-900/80 to-slate-950/70 md:p-8">
        <div className="absolute top-0 w-40 h-40 rounded-full -left-20 bg-emerald-500/15 blur-3xl"></div>
        <div className="absolute bottom-0 w-48 h-48 rounded-full -right-16 bg-cyan-500/15 blur-3xl"></div>
        <div className="relative z-10">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Daily Emotional Check-in</p>
          <h1 className="mt-2 text-3xl font-bold text-white md:text-4xl">Mood Tracking</h1>
          <p className="max-w-2xl mt-2 text-slate-300">
            A 60-second check-in to understand your emotional direction, sleep impact, and support needs.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Mood Selection Form */}
        <div className="p-6 border lg:col-span-2 rounded-3xl border-slate-700/70 bg-slate-900/75 md:p-8">
          <h2 className="mb-2 text-xl font-semibold text-white">
            {todayEntry ? 'Update Today\'s Mood' : 'How are you feeling today?'}
          </h2>
          <p className="mb-6 text-sm text-slate-300">
            Track your feeling, sleep, and note context so the app can provide better prediction and support.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Mood Selection */}
            <div>
              <label className="block mb-3 text-sm font-medium text-slate-300">
                Step 1: Select your mood
              </label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {moods.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMood(m.value)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      mood === m.value
                        ? `border-emerald-300 bg-gradient-to-br ${m.color} scale-[1.02] text-white`
                        : 'border-slate-700 bg-slate-950/40 hover:border-slate-500 text-slate-200'
                    }`}
                  >
                    <div className="mb-2 text-3xl">{m.emoji}</div>
                    <div className="text-sm font-medium">{m.value}</div>
                  </button>
                ))}
              </div>
              <p className="p-3 mt-3 text-sm border rounded-xl border-slate-700 bg-slate-950/40 text-slate-300">
                {selectedMoodSupport}
              </p>
            </div>

            {/* Sleep Hours */}
            <div>
              <label className="block mb-2 text-sm font-medium text-slate-300">
                Step 2: Sleep Hours (optional)
              </label>
              <input
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={sleepHours}
                onChange={(e) => setSleepHours(e.target.value)}
                className="input-field"
                placeholder="e.g., 7.5"
              />
              <p className="mt-2 text-xs text-slate-400">
                Sleep is one of the strongest emotional stability signals in your prediction model.
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className="block mb-2 text-sm font-medium text-slate-300">
                Step 3: Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows="4"
                className="input-field"
                placeholder="How are you feeling? What's on your mind?"
                maxLength={500}
              />
              <p className="mt-1 text-xs text-slate-400">{notes.length}/500</p>
            </div>

            <div className="p-4 border rounded-xl border-emerald-700/40 bg-emerald-500/10">
              <p className="text-sm font-semibold text-emerald-200">How this helps you</p>
              <p className="mt-1 text-sm text-slate-200">
                Consistent mood logging helps detect emotional decline early, improves risk prediction quality,
                and gives you support recommendations that match your real pattern.
              </p>
            </div>

            {message && (
              <div
                className={`p-3 rounded-lg ${
                  messageType === 'error'
                    ? 'bg-red-500/20 text-red-200 border border-red-500/30'
                    : 'bg-green-500/20 text-green-200 border border-green-500/30'
                }`}
              >
                {message}
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full px-4 py-3 font-semibold transition-colors rounded-xl bg-emerald-400 text-slate-950 hover:bg-emerald-300 disabled:opacity-70 disabled:cursor-not-allowed">
              {loading ? 'Saving...' : todayEntry ? 'Update Entry' : 'Save Entry'}
            </button>
          </form>
        </div>

        {/* Insight Sidebar */}
        <div className="space-y-6">
          <div className="p-5 border rounded-3xl border-slate-700/70 bg-slate-900/75">
            <h2 className="text-lg font-semibold text-white">Check-in Insights</h2>
            <div className="mt-4 space-y-3">
              <div className="p-3 border rounded-xl border-slate-700 bg-slate-950/50">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">7 Day Average</p>
                <p className="mt-2 text-2xl font-bold text-cyan-300">{getSevenDayAverage()}/5</p>
              </div>
              <div className="p-3 border rounded-xl border-slate-700 bg-slate-950/50">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Trend</p>
                <p className="mt-2 text-lg font-semibold text-emerald-300">{getTrendLabel()}</p>
              </div>
              <div className="p-3 border rounded-xl border-slate-700 bg-slate-950/50">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Check-in Streak</p>
                <p className="mt-2 text-lg font-semibold text-white">{getCheckInStreak()} day(s)</p>
              </div>
            </div>
          </div>

          <div className="p-5 border rounded-3xl border-slate-700/70 bg-slate-900/75">
            <h2 className="mb-4 text-lg font-semibold text-white">Recent Entries</h2>
            <div className="space-y-3">
            {recentEntries.length > 0 ? (
              recentEntries.map((entry) => {
                const moodObj = moods.find((m) => m.value === entry.mood);
                return (
                  <div
                    key={entry._id}
                    className="p-3 border rounded-lg bg-slate-950/50 border-slate-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{moodObj?.emoji}</span>
                      <span className="text-xs text-slate-400">
                        {new Date(entry.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="mb-1 text-sm font-medium text-slate-200">
                      {entry.mood}
                    </div>
                    {entry.sleepHours && (
                      <div className="text-xs text-slate-400">
                        💤 {entry.sleepHours} hours
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="py-4 text-center text-slate-400">No entries yet</p>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoodTracking;

