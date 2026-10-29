import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { taskAPI } from '../services/api';

const FALLBACK_TASKS = [
  { id: '1', title: '60-second mood check-in', completed: false },
  { id: '2', title: '2-minute breathing reset', completed: false },
  { id: '3', title: 'Write one kind sentence to yourself', completed: false },
  { id: '4', title: 'Review your insight before sleeping', completed: false },
];

const LOCAL_TASKS_KEY = 'homeDailyTasksFallback';

const moodActions = [
  {
    title: 'Track Mood',
    description: 'Capture your feelings in seconds and understand your emotional rhythm over time.',
    cta: 'Start Mood Check-In',
    secondaryCta: 'View Mood History',
    secondaryTo: '/dashboard',
    to: '/mood',
    color: 'from-[#F4DDD5] to-[#FFFFFF] border-[#8E929B]/40',
    iconBg: 'from-[#ECB7B3] to-[#F4DDD5] border-[#8E929B]',
    icon: 'mood',
  },
  {
    title: 'Talk to Coach',
    description: 'Get an AI-guided check-in with breathing, grounding, and calm action planning.',
    cta: 'Open Wellness Coach',
    secondaryCta: 'Quick 2-Min Session',
    secondaryTo: '/coach',
    to: '/coach',
    color: 'from-[#DCE1DA] to-[#FFFFFF] border-[#8E929B]/40',
    iconBg: 'from-[#A4BBAC] to-[#DCE1DA] border-[#8E929B]',
    icon: 'coach',
  },
  {
    title: 'Write Reflection',
    description: 'Write a private reflection to release mental load and observe emotional shifts.',
    cta: 'Open Journal',
    secondaryCta: 'See Insights',
    secondaryTo: '/insights',
    to: '/journal',
    color: 'from-[#ECB7B3]/40 to-[#FFFFFF] border-[#8E929B]/40',
    iconBg: 'from-[#ECB7B3] to-[#A4BBAC] border-[#8E929B]',
    icon: 'journal',
  },
  {
    title: 'Mind Care Studio',
    description: 'Use reframing, gratitude, and safety tools in one supportive mental wellness studio.',
    cta: 'Enter Studio',
    secondaryCta: 'Open Support',
    secondaryTo: '/crisis',
    to: '/mind-care',
    color: 'from-[#A4BBAC]/35 to-[#FFFFFF] border-[#8E929B]/40',
    iconBg: 'from-[#A4BBAC] to-[#F4DDD5] border-[#8E929B]',
    icon: 'mind',
  },
];

const ActionIcon = ({ type }) => {
  if (type === 'mood') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="w-6 h-6 text-black">
        <circle cx="12" cy="12" r="8.5" />
        <path d="M8.5 14.5c1.2 1.3 2.3 2 3.5 2s2.3-.7 3.5-2" />
        <circle cx="9" cy="10" r=".8" fill="currentColor" />
        <circle cx="15" cy="10" r=".8" fill="currentColor" />
      </svg>
    );
  }

  if (type === 'coach') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="w-6 h-6 text-black">
        <path d="M9.5 7.5A4.5 4.5 0 1 1 18 10.3c0 1.4-.6 2.4-1.5 3.4-.7.8-1.2 1.5-1.2 2.3H11c0-1.4.8-2.5 1.7-3.4.8-.8 1.2-1.3 1.2-2.2A2 2 0 0 0 10 10" />
        <path d="M10.5 19h4M10.8 21h3.4" />
      </svg>
    );
  }

  if (type === 'journal') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="w-6 h-6 text-black">
        <path d="M6 3.5h10a2 2 0 0 1 2 2V20a.5.5 0 0 1-.8.4L14 18H6a2 2 0 0 1-2-2V5.5a2 2 0 0 1 2-2Z" />
        <path d="M8 8h8M8 12h8" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="w-6 h-6 text-black">
      <path d="M12 21s-6.8-4.6-6.8-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 11c0 5.4-7 10-7 10Z" />
    </svg>
  );
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [syncingTaskId, setSyncingTaskId] = useState(null);
  const [taskError, setTaskError] = useState('');
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);
  const navigationTimerRef = useRef(null);

  const showToast = useCallback((message) => {
    setToast(message);
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const readFallbackTasks = () => {
    try {
      const stored = localStorage.getItem(LOCAL_TASKS_KEY);
      if (!stored) {
        return FALLBACK_TASKS;
      }

      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : FALLBACK_TASKS;
    } catch {
      return FALLBACK_TASKS;
    }
  };

  const writeFallbackTasks = (nextTasks) => {
    try {
      localStorage.setItem(LOCAL_TASKS_KEY, JSON.stringify(nextTasks));
    } catch {
      // Ignore local storage write errors; UI state remains usable.
    }
  };

  const fetchTasks = useCallback(async () => {
    setTaskError('');
    setLoadingTasks(true);

    try {
      const res = await taskAPI.getDaily();
      const apiTasks = res?.data?.dailyTask?.tasks;

      if (Array.isArray(apiTasks) && apiTasks.length > 0) {
        setTasks(apiTasks);
        writeFallbackTasks(apiTasks);
      } else {
        const fallbackTasks = readFallbackTasks();
        setTasks(fallbackTasks);
      }
    } catch (err) {
      console.error('Failed to load tasks', err);
      const fallbackTasks = readFallbackTasks();
      setTasks(fallbackTasks);
      setTaskError('Could not sync today\'s plan. Showing your saved local plan.');
    } finally {
      setLoadingTasks(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();

    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
      if (navigationTimerRef.current) {
        clearTimeout(navigationTimerRef.current);
      }
    };
  }, [fetchTasks]);

  const toggleTask = async (taskId) => {
    if (syncingTaskId) {
      return;
    }

    const previousTasks = tasks;
    try {
      setTaskError('');
      setSyncingTaskId(taskId);
      const updatedTasks = tasks.map(t =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      );
      setTasks(updatedTasks);
      writeFallbackTasks(updatedTasks);

      const response = await taskAPI.toggleTask(taskId);
      const apiTasks = response?.data?.dailyTask?.tasks;
      if (Array.isArray(apiTasks) && apiTasks.length > 0) {
        setTasks(apiTasks);
        writeFallbackTasks(apiTasks);
      }

      showToast('Task updated successfully!');
    } catch (error) {
      console.error('Failed to toggle task', error);
      setTasks(previousTasks);
      writeFallbackTasks(previousTasks);
      setTaskError('Task update failed. Please retry.');
      showToast('Could not update task right now.');
    } finally {
      setSyncingTaskId(null);
    }
  };

  const scheduleNavigation = (path, delay) => {
    if (navigationTimerRef.current) {
      clearTimeout(navigationTimerRef.current);
    }

    navigationTimerRef.current = setTimeout(() => {
      navigate(path);
    }, delay);
  };

  const handleMoodColorClick = (type) => {
    switch (type) {
      case 'Energy':
        showToast('Tip: Drink a glass of water, do a 5-minute stretch, or listen to upbeat music!');
        scheduleNavigation('/coach', 1800);
        break;
      case 'Calm':
        showToast('Initiating breathing exercise...');
        scheduleNavigation('/coach', 1200);
        break;
      case 'Clarity':
        showToast('Prompt: What is one thing taking up your mental space right now?');
        scheduleNavigation('/journal', 1800);
        break;
      case 'Immediate':
        if (navigationTimerRef.current) {
          clearTimeout(navigationTimerRef.current);
        }
        navigate('/crisis');
        break;
      default:
        break;
    }
  };

  return (
    <div className="relative space-y-8 lg:space-y-10">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed z-50 px-6 py-3 font-bold text-black transition-opacity bg-[#ECB7B3] border border-[#8E929B] shadow-2xl top-20 right-5 rounded-xl">
          {toast}
        </div>
      )}

      <section className="relative p-8 overflow-hidden border shadow-lg md:p-10 rounded-3xl border-[#8E929B]/40 mood-hero">
        <div className="absolute inset-0 mood-noise opacity-20"></div>
        <div className="absolute -top-14 right-10 h-56 w-56 rounded-full bg-[#ECB7B3]/40 blur-3xl"></div>
        <div className="absolute -bottom-20 left-8 h-64 w-64 rounded-full bg-[#A4BBAC]/40 blur-3xl"></div>
        <div className="relative z-10 max-w-3xl">
          <p className="text-sm uppercase tracking-[0.22em] text-black font-extrabold mb-3">AI Emotional Resilience Dashboard</p>
          <h1 className="text-3xl font-black leading-tight text-black md:text-5xl">
            {getGreeting()}, {user?.name || 'there'}.
            <span className="block mt-3 text-black">You&apos;re doing great today 💙</span>
          </h1>
          <p className="max-w-2xl mt-5 text-base leading-7 text-black font-semibold md:text-lg">
            This space is designed to help you stay grounded. Start with one small action and let the platform guide you toward steadier emotional balance.
          </p>
          <div className="flex flex-wrap gap-3 mt-7">
            <Link to="/coach" className="btn-primary">Start 2-Min Coach</Link>
            <Link to="/dashboard" className="btn-secondary">View Full Dashboard</Link>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-black text-black">Your Wellness Actions</h2>
          <p className="mt-2 text-black font-semibold">Choose one focused step and build momentum gently.</p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {moodActions.map((action) => (
          <article
            key={action.title}
            className={`group rounded-2xl border bg-gradient-to-br ${action.color} backdrop-blur-xl p-5 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-md`}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-xl font-black text-black">{action.title}</h3>
              <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border bg-gradient-to-br ${action.iconBg} text-black shadow-sm`}>
                <ActionIcon type={action.icon} />
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-black font-medium min-h-[96px]">{action.description}</p>
            <div className="mt-5 space-y-2">
              <Link to={action.to} className="btn-primary w-full inline-flex justify-center text-center">
                {action.cta}
              </Link>
              <Link to={action.secondaryTo} className="btn-secondary w-full inline-flex justify-center text-center text-sm">
                {action.secondaryCta}
              </Link>
            </div>
          </article>
        ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="transition-all card mood-calm hover:shadow-lg">
          <h3 className="text-xl font-black text-black">Mood color check</h3>
          <p className="mt-3 text-black font-semibold">
            Pick the color that matches your current state and take one action.
          </p>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <button onClick={() => handleMoodColorClick('Energy')} className="mood-chip mood-chip-sunrise text-left hover:scale-[1.02]">Need Energy</button>
            <button onClick={() => handleMoodColorClick('Calm')} className="mood-chip mood-chip-ocean text-left hover:scale-[1.02]">Need Calm</button>
            <button onClick={() => handleMoodColorClick('Clarity')} className="mood-chip mood-chip-forest text-left hover:scale-[1.02]">Need Clarity</button>
            <button onClick={() => handleMoodColorClick('Immediate')} className="mood-chip mood-chip-ember text-left hover:scale-[1.02]">Need Immediate Support</button>
          </div>
        </div>

        <div className="card mood-warm">
          <h3 className="flex items-center justify-between text-xl font-black text-black">
            Today&apos;s Plan
            {tasks.length > 0 && <span className="px-3 py-1 text-sm font-bold rounded-full bg-[#DCE1DA] border border-[#8E929B] text-black">{tasks.filter(t => t.completed).length}/{tasks.length} Completed</span>}
          </h3>
          {taskError && (
            <div className="flex items-center justify-between gap-3 px-3 py-2 mt-3 text-sm border rounded-lg border-[#8E929B] bg-[#ECB7B3]/30 text-black font-semibold">
              <span>{taskError}</span>
              <button onClick={fetchTasks} className="px-2 py-1 text-xs font-bold transition-colors rounded bg-white border border-[#8E929B] hover:bg-[#F4DDD5] text-black" type="button">
                Retry
              </button>
            </div>
          )}
          <ul className="mt-4 space-y-3 text-black">
            {loadingTasks ? (
              <div className="space-y-3 text-black animate-pulse opacity-60">
                <div className="h-6 w-[80%] bg-[#8E929B]/20 rounded"></div>
                <div className="h-6 w-[70%] bg-[#8E929B]/20 rounded"></div>
                <div className="h-6 w-[90%] bg-[#8E929B]/20 rounded"></div>
              </div>
            ) : tasks.length > 0 ? (
              tasks.map((task) => (
                <li key={task.id}>
                  <button
                    onClick={() => toggleTask(task.id)}
                    className={`w-full text-left plan-row cursor-pointer flex items-center gap-3 p-2 rounded-lg transition-all font-semibold disabled:opacity-60 disabled:cursor-not-allowed ${task.completed ? 'bg-[#DCE1DA]/70 line-through text-black' : 'hover:bg-[#F4DDD5]/60 text-black'}`}
                    type="button"
                    disabled={Boolean(syncingTaskId)}
                  >
                    <span className={`w-6 h-6 flex items-center justify-center rounded-full border border-[#8E929B] text-xs font-bold ${task.completed ? 'bg-[#A4BBAC] text-black' : 'bg-white text-black'}`}>
                      {syncingTaskId === task.id ? '...' : task.completed ? '✓' : task.id}
                    </span>
                    {task.title}
                  </button>
                </li>
              ))
            ) : (
              <p className="mt-2 text-sm font-semibold text-black">No tasks generated for today.</p>
            )}
          </ul>
        </div>
      </section>
    </div>
  );
};

export default Home;
