import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { journalAPI, moodAPI } from '../services/api';

const SAFETY_PLAN_KEY = 'mindcare_safety_plan_v1';

const defaultSafetyPlan = {
  warningSigns: '',
  calmActions: '',
  supportPerson: '',
  supportPhone: '',
  emergencySteps: '',
};

const CrisisMode = () => {
  const [isActive, setIsActive] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState('inhale'); // inhale, hold, exhale
  const [cycle, setCycle] = useState(0);
  const [showCoping, setShowCoping] = useState(false);
  const [safetyPlan, setSafetyPlan] = useState(defaultSafetyPlan);

  const copingStrategies = [
    'Take deep, slow breaths',
    'Focus on the present moment',
    'Remember: This feeling will pass',
    'You are stronger than you think',
    'Reach out to someone you trust',
    'Practice grounding: Name 5 things you can see, 4 you can touch, 3 you can hear',
    'Take a short walk if possible',
    'Listen to calming music',
    'Write down your thoughts',
    'Remember your past successes',
  ];

  const emergencyHelplines = [
    {
      name: 'Vandrevala Foundation',
      phone: '1860-2662-345 / 1800-2333-330',
      available: '24/7',
    },
    {
      name: 'iCall',
      phone: '022-2552-1111',
      available: 'Mon-Sat, 8am-10pm',
    },
    {
      name: 'AASRA',
      phone: '91-22-2754-6669',
      available: '24/7',
    },
    {
      name: 'Sneha',
      phone: '044-2464-0050',
      available: '24/7',
    },
  ];

  useEffect(() => {
    checkCrisisMode();

    try {
      const savedPlan = localStorage.getItem(SAFETY_PLAN_KEY);
      if (savedPlan) {
        const parsed = JSON.parse(savedPlan);
        setSafetyPlan({ ...defaultSafetyPlan, ...parsed });
      }
    } catch {
      setSafetyPlan(defaultSafetyPlan);
    }
  }, []);

  const hasSafetyPlan = Object.values(safetyPlan).some((value) => String(value || '').trim().length > 0);

  const checkCrisisMode = async () => {
    try {
      // Check recent journal entries for negative sentiment
      const journalsRes = await journalAPI.getAll({ limit: 5 });
      const recentJournals = journalsRes.data.data || [];

      const negativeCount = recentJournals.filter(
        (entry) => entry.sentimentLabel === 'negative'
      ).length;

      // Check recent mood entries
      const moodsRes = await moodAPI.getAll({ limit: 3 });
      const recentMoods = moodsRes.data.data || [];

      const lowMoods = ['Sad', 'Anxious', 'Stressed'];
      const lowMoodCount = recentMoods.filter((entry) =>
        lowMoods.includes(entry.mood)
      ).length;

      // Activate if 3+ negative journals or 2+ low moods
      if (negativeCount >= 3 || lowMoodCount >= 2) {
        setIsActive(true);
      }
    } catch (error) {
      console.error('Error checking crisis mode:', error);
    }
  };

  useEffect(() => {
    if (!isActive) return;

    const breathingCycle = () => {
      if (breathingPhase === 'inhale') {
        setTimeout(() => setBreathingPhase('hold'), 4000);
      } else if (breathingPhase === 'hold') {
        setTimeout(() => setBreathingPhase('exhale'), 2000);
      } else {
        setTimeout(() => {
          setBreathingPhase('inhale');
          setCycle((prev) => prev + 1);
        }, 4000);
      }
    };

    const timer = setTimeout(breathingCycle, 100);
    return () => clearTimeout(timer);
  }, [isActive, breathingPhase]);

  const handleActivate = () => {
    setIsActive(true);
    setCycle(0);
    setBreathingPhase('inhale');
  };

  const getBreathingSize = () => {
    if (breathingPhase === 'inhale') return 'scale-150';
    if (breathingPhase === 'hold') return 'scale-150';
    return 'scale-100';
  };

  const getBreathingText = () => {
    if (breathingPhase === 'inhale') return 'Breathe In';
    if (breathingPhase === 'hold') return 'Hold';
    return 'Breathe Out';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Crisis Support</h1>
        {!isActive && (
          <button onClick={handleActivate} className="btn-primary">
            I&apos;m Overwhelmed
          </button>
        )}
      </div>

      {isActive ? (
        <div className="space-y-8">
          {/* Breathing Exercise */}
          <div className="card text-center">
            <h2 className="text-2xl font-semibold mb-6">Breathing Exercise</h2>
            <div className="flex items-center justify-center mb-8">
              <div
                className={`w-48 h-48 rounded-full bg-gradient-to-br from-electric-400 to-electric-600 transition-all duration-4000 ease-in-out ${getBreathingSize()} animate-breathe flex items-center justify-center`}
              >
                <span className="text-2xl font-bold text-white">
                  {getBreathingText()}
                </span>
              </div>
            </div>
            <p className="text-gray-300">Cycle {cycle + 1} - Follow the circle</p>
            <button
              onClick={() => setIsActive(false)}
              className="mt-4 btn-secondary"
            >
              I&apos;m Feeling Better
            </button>
          </div>

          {/* Coping Strategies */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Coping Strategies</h2>
              <button
                onClick={() => setShowCoping(!showCoping)}
                className="btn-secondary text-sm"
              >
                {showCoping ? 'Hide' : 'Show'} Strategies
              </button>
            </div>
            {showCoping && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {copingStrategies.map((strategy, index) => (
                  <div
                    key={index}
                    className="bg-navy-800/50 p-4 rounded-lg border border-navy-700"
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-electric-400 text-xl">✓</span>
                      <p className="text-gray-200">{strategy}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Personal Safety Plan Snapshot */}
          <div className="card border-2 border-electric-500/30 bg-electric-500/10">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="text-2xl font-semibold text-electric-100">Your Personal Safety Plan</h2>
              <Link to="/mind-care" className="btn-secondary text-sm">
                Edit in Mind Care
              </Link>
            </div>

            {hasSafetyPlan ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-navy-800/50 p-4 rounded-lg border border-navy-700">
                  <p className="text-xs uppercase tracking-wide text-gray-400">Warning Signs</p>
                  <p className="text-gray-100 mt-2">{safetyPlan.warningSigns || 'Not added yet'}</p>
                </div>
                <div className="bg-navy-800/50 p-4 rounded-lg border border-navy-700">
                  <p className="text-xs uppercase tracking-wide text-gray-400">Calm Actions</p>
                  <p className="text-gray-100 mt-2">{safetyPlan.calmActions || 'Not added yet'}</p>
                </div>
                <div className="bg-navy-800/50 p-4 rounded-lg border border-navy-700">
                  <p className="text-xs uppercase tracking-wide text-gray-400">Trusted Contact</p>
                  <p className="text-gray-100 mt-2">
                    {safetyPlan.supportPerson || 'Not added yet'}
                    {safetyPlan.supportPhone ? ` (${safetyPlan.supportPhone})` : ''}
                  </p>
                </div>
                <div className="bg-navy-800/50 p-4 rounded-lg border border-navy-700">
                  <p className="text-xs uppercase tracking-wide text-gray-400">Emergency Steps</p>
                  <p className="text-gray-100 mt-2">{safetyPlan.emergencySteps || 'Not added yet'}</p>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-navy-700 bg-navy-800/40 px-4 py-3 text-gray-300">
                No safety plan found yet. Add it in Mind Care so it appears here during support mode.
              </div>
            )}
          </div>

          {/* Emergency Helplines */}
          <div className="card border-2 border-red-500/50 bg-red-500/10">
            <h2 className="text-2xl font-semibold mb-4 text-red-200">
              Emergency Helplines (India)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {emergencyHelplines.map((helpline, index) => (
                <div
                  key={index}
                  className="bg-navy-800/50 p-4 rounded-lg border border-navy-700"
                >
                  <h3 className="font-semibold text-white mb-2">
                    {helpline.name}
                  </h3>
                  <p className="text-electric-400 text-lg font-mono mb-1">
                    {helpline.phone}
                  </p>
                  <p className="text-sm text-gray-400">{helpline.available}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-gray-300">
              If you&apos;re in immediate danger, please call emergency services at{' '}
              <span className="text-red-400 font-bold">100</span> or{' '}
              <span className="text-red-400 font-bold">102</span>
            </p>
          </div>
        </div>
      ) : (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">💙</div>
          <h2 className="text-2xl font-semibold mb-4">You&apos;re Safe Here</h2>
          <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
            If you&apos;re feeling overwhelmed, anxious, or in crisis, click the button above
            to access breathing exercises, coping strategies, and emergency resources.
          </p>
          <div className="flex justify-center space-x-4">
            <button onClick={handleActivate} className="btn-primary">
              I Need Support
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrisisMode;

