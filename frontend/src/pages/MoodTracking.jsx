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
    { value: 'Happy', emoji: '😊', color: 'from-[#A4BBAC] to-[#ECB7B3]' },
    { value: 'Neutral', emoji: '😐', color: 'from-[#DCE1DA] to-[#8E929B]' },
    { value: 'Sad', emoji: '😢', color: 'from-[#8E929B] to-[#DCE1DA]' },
    { value: 'Anxious', emoji: '😰', color: 'from-[#ECB7B3] to-[#F4DDD5]' },
    { value: 'Stressed', emoji: '😤', color: 'from-[#F4DDD5] to-[#ECB7B3]' },
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
        sleepHours: sleepHours ? parseFloat(sleepHours) : undefined,
        notes,
      });

      setMessage('Mood entry saved successfully!');
      setMessageType('success');
      loadTodayEntry();
      loadRecentEntries();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error saving mood entry');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const getSevenDayAverage = () => {
    if (!recentEntries.length) return '0.0';
    const total = recentEntries.reduce((sum, entry) => sum + (moodScores[entry.mood] || 3), 0);
    return (total / recentEntries.length).toFixed(1);
  };

  const getTrendLabel = () => {
    if (recentEntries.length < 2) return 'Stable';
    const recent = recentEntries.slice(0, 3);
    const previous = recentEntries.slice(3, 7);

    if (!previous.length) return 'Stable';

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
      {/* Heading only (card removed, dark yellow text) */}
      <div>
        <h1
          className="text-3xl md:text-5xl font-black text-dark-yellow tracking-tight"
          style={{ color: '#b45309', fontFamily: 'Poppins, Inter, sans-serif' }}
        >
          Mood Tracking
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Mood Selection Form */}
        <div className="p-6 border lg:col-span-2 rounded-2xl border-[#8E929B]/40 bg-white/85 md:p-8 shadow-sm">
          <h2 className="mb-2 text-xl font-black text-black">
            {todayEntry ? 'Update Today\'s Mood' : 'How are you feeling today?'}
          </h2>
          <p className="mb-6 text-sm text-black font-semibold">
            Track your feeling, sleep, and note context so the app can provide better prediction and support.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Mood Selection */}
            <div>
              <label className="block mb-3 text-sm font-bold text-black">
                Step 1: Select your mood
              </label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {moods.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMood(m.value)}
                    className={`p-4 rounded-xl border-2 transition-all font-bold ${
                      mood === m.value
                        ? 'border-black bg-[#ECB7B3] scale-[1.03] text-black shadow-sm'
                        : 'border-[#8E929B]/50 bg-[#DCE1DA]/60 hover:bg-[#F4DDD5] text-black'
                    }`}
                  >
                    <div className="mb-2 text-3xl">{m.emoji}</div>
                    <div className="text-sm font-bold text-black">{m.value}</div>
                  </button>
                ))}
              </div>
              <p className="p-3 mt-3 text-sm border rounded-xl border-[#8E929B]/40 bg-[#DCE1DA]/45 text-black font-semibold">
                {selectedMoodSupport}
              </p>
            </div>

            {/* Sleep Hours */}
            <div>
              <label className="block mb-2 text-sm font-bold text-black">
                Step 2: Sleep Hours (optional)
              </label>
              <input
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={sleepHours}
                onChange={(e) => setSleepHours(e.target.value)}
                className="input-field text-black font-semibold"
                placeholder="e.g., 7.5"
              />
              <p className="mt-2 text-xs text-black font-medium">
                Sleep is one of the strongest emotional stability signals in your prediction model.
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className="block mb-2 text-sm font-bold text-black">
                Step 3: Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows="4"
                className="input-field text-black font-medium"
                placeholder="How are you feeling? What's on your mind?"
                maxLength={500}
              />
              <p className="mt-1 text-xs text-black font-medium">{notes.length}/500</p>
            </div>

            <div className="p-4 border rounded-xl border-[#A4BBAC] bg-[#A4BBAC]/25">
              <p className="text-sm font-bold text-black">How this helps you</p>
              <p className="mt-1 text-sm text-black font-medium">
                Consistent mood logging helps detect emotional decline early, improves risk prediction quality,
                and gives you support recommendations that match your real pattern.
              </p>
            </div>

            {message && (
              <div
                className={`p-3 rounded-lg font-semibold text-sm ${
                  messageType === 'error'
                    ? 'bg-[#ECB7B3]/40 text-black border border-red-400'
                    : 'bg-[#A4BBAC]/40 text-black border border-[#A4BBAC]'
                }`}
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary text-center font-bold"
            >
              {loading ? 'Saving...' : todayEntry ? 'Update Entry' : 'Save Entry'}
            </button>
          </form>
        </div>

        {/* Insight Sidebar */}
        <div className="space-y-6">
          <div className="p-5 border rounded-2xl border-[#8E929B]/40 bg-white/85 shadow-sm">
            <h2 className="text-lg font-black text-black">Check-in Insights</h2>
            <div className="mt-4 space-y-3">
              <div className="p-3 border rounded-xl border-[#8E929B]/30 bg-[#DCE1DA]/60">
                <p className="text-xs uppercase tracking-[0.16em] text-black font-bold">7 Day Average</p>
                <p className="mt-2 text-2xl font-black text-black">{getSevenDayAverage()}/5</p>
              </div>
              <div className="p-3 border rounded-xl border-[#8E929B]/30 bg-[#DCE1DA]/60">
                <p className="text-xs uppercase tracking-[0.16em] text-black font-bold">Trend</p>
                <p className="mt-2 text-lg font-black text-black">{getTrendLabel()}</p>
              </div>
              <div className="p-3 border rounded-xl border-[#8E929B]/30 bg-[#DCE1DA]/60">
                <p className="text-xs uppercase tracking-[0.16em] text-black font-bold">Check-in Streak</p>
                <p className="mt-2 text-lg font-black text-black">{getCheckInStreak()} day(s)</p>
              </div>
            </div>
          </div>

          <div className="p-5 border rounded-2xl border-[#8E929B]/40 bg-white/85 shadow-sm">
            <h2 className="mb-4 text-lg font-black text-black">Recent Entries</h2>
            <div className="space-y-3">
            {recentEntries.length > 0 ? (
              recentEntries.map((entry) => {
                const moodObj = moods.find((m) => m.value === entry.mood);
                return (
                  <div
                    key={entry._id}
                    className="p-3 border rounded-xl bg-[#DCE1DA]/50 border-[#8E929B]/30"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-2xl">{moodObj?.emoji}</span>
                      <span className="text-xs text-black font-bold">
                        {new Date(entry.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="mb-0.5 text-sm font-bold text-black">
                      {entry.mood}
                    </div>
                    {entry.sleepHours && (
                      <div className="text-xs text-black font-semibold">
                        💤 {entry.sleepHours} hours
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="py-4 text-center text-black font-semibold text-sm">No entries yet</p>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoodTracking;
