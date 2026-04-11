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
    title: 'Track My Mood',
    description: 'Log how you feel and turn emotions into patterns you can understand.',
    cta: 'Open Mood Tracker',
    to: '/mood',
    color: 'from-amber-400/30 to-rose-400/20 border-amber-300/30',
  },
  {
    title: 'Talk To Coach',
    description: 'Run a guided check-in with breathing, grounding, and a mini support plan.',
    cta: 'Start Coaching',
    to: '/coach',
    color: 'from-cyan-400/30 to-blue-400/20 border-cyan-300/30',
  },
  {
    title: 'Write Reflection',
    description: 'Release stress through a private journal and track sentiment over time.',
    cta: 'Go To Journal',
    to: '/journal',
    color: 'from-emerald-400/30 to-lime-400/20 border-emerald-300/30',
  },
  {
    title: 'Mind Care Studio',
    description: 'Practice thought reframing, gratitude logging, and safety planning in one place.',
    cta: 'Open Studio',
    to: '/mind-care',
    color: 'from-fuchsia-400/25 to-indigo-400/20 border-fuchsia-300/30',
  },
];

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
    <div className="relative space-y-8">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed z-50 px-6 py-3 text-white transition-opacity bg-gray-800 shadow-2xl top-20 right-5 rounded-xl animate-pulse">
          {toast}
        </div>
      )}

      <section className="relative p-8 overflow-hidden border shadow-2xl mood-hero md:p-10 rounded-2xl border-white/20">
        <div className="absolute inset-0 mood-noise opacity-20"></div>
        <div className="relative z-10 max-w-3xl">
          <p className="text-sm uppercase tracking-[0.2em] text-white/80 mb-2">Your wellness home</p>
          <h1 className="text-3xl font-bold leading-tight text-white md:text-5xl">
            {getGreeting()}, {user?.name || 'there'}.
            <span className="block mt-2 text-emerald-100">Let us build a calmer day together.</span>
          </h1>
          <p className="max-w-2xl mt-5 text-base text-white/85 md:text-lg">
            Start with one small action: a quick check-in, a short reflection, or a breathing reset.
            Small steps done daily create real emotional resilience.
          </p>
          <div className="flex flex-wrap gap-3 mt-7">
            <Link to="/coach" className="btn-primary">Start 2-Min Coach</Link>
            <Link to="/dashboard" className="btn-secondary">View Progress</Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {moodActions.map((action) => (
          <article
            key={action.title}
            className={`rounded-2xl border bg-gradient-to-br ${action.color} backdrop-blur-md p-5 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1`}
          >
            <h2 className="text-xl font-semibold text-white">{action.title}</h2>
            <p className="mt-3 text-white/85 min-h-[72px]">{action.description}</p>
            <Link to={action.to} className="inline-flex mt-4 text-sm font-semibold text-electric-200 hover:text-white">
              {action.cta} {'>'}
            </Link>
          </article>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="transition-all card mood-calm hover:shadow-2xl">
          <h3 className="text-xl font-semibold text-white">Mood color check</h3>
          <p className="mt-3 text-gray-200">
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
          <h3 className="flex items-center justify-between text-xl font-semibold text-white">
            Today&apos;s Plan
            {tasks.length > 0 && <span className="px-3 py-1 text-sm font-normal rounded-full bg-white/20">{tasks.filter(t => t.completed).length}/{tasks.length} Completed</span>}
          </h3>
          {taskError && (
            <div className="flex items-center justify-between gap-3 px-3 py-2 mt-3 text-sm border rounded-lg border-amber-200/40 bg-amber-300/10 text-amber-100">
              <span>{taskError}</span>
              <button onClick={fetchTasks} className="px-2 py-1 text-xs transition-colors rounded bg-white/20 hover:bg-white/30" type="button">
                Retry
              </button>
            </div>
          )}
          <ul className="mt-4 space-y-3 text-gray-100">
            {loadingTasks ? (
              <div className="space-y-3 text-gray-200 animate-pulse opacity-60">
                <div className="h-6 w-[80%] bg-white/20 rounded"></div>
                <div className="h-6 w-[70%] bg-white/20 rounded"></div>
                <div className="h-6 w-[90%] bg-white/20 rounded"></div>
              </div>
            ) : tasks.length > 0 ? (
              tasks.map((task) => (
                <li key={task.id}>
                  <button
                    onClick={() => toggleTask(task.id)}
                    className={`w-full text-left plan-row cursor-pointer flex items-center gap-3 p-2 rounded-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed ${task.completed ? 'bg-white/10 opacity-70 line-through' : 'hover:bg-white/5'}`}
                    type="button"
                    disabled={Boolean(syncingTaskId)}
                  >
                    <span className={`w-6 h-6 flex items-center justify-center rounded-full border border-white/40 text-xs ${task.completed ? 'bg-white/30 text-white' : ''}`}>
                      {syncingTaskId === task.id ? '...' : task.completed ? '✓' : task.id}
                    </span>
                    {task.title}
                  </button>
                </li>
              ))
            ) : (
             <p className="mt-2 text-sm opacity-80">No tasks generated for today.</p>
            )}
          </ul>
        </div>
      </section>
    </div>
  );
};

export default Home;
