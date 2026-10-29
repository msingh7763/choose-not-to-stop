import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { journalAPI, moodAPI, riskAPI } from '../services/api';

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

  const supportChecklist = [
    'Put the phone down for 60 seconds and focus on breathing.',
    'Move to a safer, quieter space if possible.',
    'Contact your trusted support person or emergency services.',
    'Open your personal safety plan and follow the next step.',
  ];

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
      const [journalsResult, moodsResult, riskResult] = await Promise.allSettled([
        journalAPI.getAll({ limit: 5 }),
        moodAPI.getAll({ limit: 3 }),
        riskAPI.evaluate(),
      ]);

      const recentJournals = journalsResult.status === 'fulfilled'
        ? journalsResult.value.data.data || []
        : [];
      const recentMoods = moodsResult.status === 'fulfilled'
        ? moodsResult.value.data.data || []
        : [];
      const currentRisk = riskResult.status === 'fulfilled'
        ? riskResult.value.data?.risk
        : null;

      const negativeCount = recentJournals.filter((entry) => entry.sentimentLabel === 'negative').length;
      const lowMoods = ['Sad', 'Anxious', 'Stressed'];
      const lowMoodCount = recentMoods.filter((entry) => lowMoods.includes(entry.mood)).length;

      const riskIsCritical = currentRisk === 'CRITICAL';
      const riskIsWarningWithSignals = currentRisk === 'WARNING' && (negativeCount >= 2 || lowMoodCount >= 1);

      // Activate when objective risk or recent emotional signals cross a threshold.
      if (riskIsCritical || riskIsWarningWithSignals || negativeCount >= 3 || lowMoodCount >= 2) {
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
        <h1 className="text-3xl font-black text-black" style={{ fontFamily: 'Poppins, Inter, sans-serif' }}>
          Crisis Support
        </h1>
        {!isActive && (
          <button onClick={handleActivate} className="btn-crisis-red">
            I&apos;m Overwhelmed
          </button>
        )}
      </div>

      {isActive ? (
        <div className="space-y-8">
          {/* Urgent Red Safety Alert */}
          <div className="card-crisis-red">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-3.5 h-3.5 rounded-full bg-red-600 animate-pulse"></span>
              <h2 className="text-2xl font-black text-red-700">Safety First</h2>
            </div>
            <p className="text-black font-semibold text-base">
              This is support, not emergency care. If you may act on thoughts of self-harm or feel unsafe, call emergency services now or reach someone nearby immediately.
            </p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {supportChecklist.map((step, index) => (
                <div key={index} className="rounded-xl border-2 border-red-400 bg-white/95 px-4 py-3 text-black font-bold shadow-xs flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-xs font-black shrink-0">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Breathing Exercise Card */}
          <div className="card text-center border-2 border-[#8E929B] bg-white/90">
            <h2 className="text-2xl font-black text-black mb-6">Breathing Exercise</h2>
            <div className="flex items-center justify-center mb-8">
              <div
                className={`w-48 h-48 rounded-full bg-gradient-to-br from-[#ECB7B3] via-[#F4DDD5] to-[#A4BBAC] border-4 border-[#8E929B] transition-all duration-4000 ease-in-out ${getBreathingSize()} animate-breathe flex items-center justify-center shadow-lg`}
              >
                <span className="text-2xl font-black text-black">
                  {getBreathingText()}
                </span>
              </div>
            </div>
            <p className="text-black font-bold text-base">Cycle {cycle + 1} - Follow the circle</p>
            <button
              onClick={() => setIsActive(false)}
              className="mt-4 btn-secondary"
            >
              I&apos;m Feeling Better
            </button>
          </div>

          {/* Coping Strategies */}
          <div className="card border-2 border-[#A4BBAC] bg-white/90">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-black text-black">Coping Strategies</h2>
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
                    className="bg-[#DCE1DA]/80 p-4 rounded-xl border border-[#8E929B]"
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-[#A4BBAC] text-xl font-black">✓</span>
                      <p className="text-black font-semibold">{strategy}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Personal Safety Plan Snapshot */}
          <div className="card border-2 border-[#8E929B] bg-[#F4DDD5]/40">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="text-2xl font-black text-black">Your Personal Safety Plan</h2>
              <Link to="/mind-care" className="btn-secondary text-sm">
                Edit in Mind Care
              </Link>
            </div>

            {hasSafetyPlan ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/90 p-4 rounded-xl border border-[#8E929B]">
                  <p className="text-xs uppercase tracking-wide text-black font-black">Warning Signs</p>
                  <p className="text-black font-semibold mt-2">{safetyPlan.warningSigns || 'Not added yet'}</p>
                </div>
                <div className="bg-white/90 p-4 rounded-xl border border-[#8E929B]">
                  <p className="text-xs uppercase tracking-wide text-black font-black">Calm Actions</p>
                  <p className="text-black font-semibold mt-2">{safetyPlan.calmActions || 'Not added yet'}</p>
                </div>
                <div className="bg-white/90 p-4 rounded-xl border border-[#8E929B]">
                  <p className="text-xs uppercase tracking-wide text-black font-black">Trusted Contact</p>
                  <p className="text-black font-semibold mt-2">
                    {safetyPlan.supportPerson || 'Not added yet'}
                    {safetyPlan.supportPhone ? ` (${safetyPlan.supportPhone})` : ''}
                  </p>
                </div>
                <div className="bg-white/90 p-4 rounded-xl border border-[#8E929B]">
                  <p className="text-xs uppercase tracking-wide text-black font-black">Emergency Steps</p>
                  <p className="text-black font-semibold mt-2">{safetyPlan.emergencySteps || 'Not added yet'}</p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-[#8E929B] bg-white/90 px-4 py-3 text-black font-semibold">
                No safety plan found yet. Add it in Mind Care so it appears here during support mode.
              </div>
            )}
          </div>

          {/* Emergency Helplines (India) with Prominent Red Alert */}
          <div className="card-crisis-red">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🚨</span>
              <h2 className="text-2xl font-black text-red-700">
                Emergency Helplines (India)
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {emergencyHelplines.map((helpline, index) => (
                <div
                  key={index}
                  className="bg-white/95 p-4 rounded-xl border-2 border-red-300 shadow-xs"
                >
                  <h3 className="font-black text-black mb-1">
                    {helpline.name}
                  </h3>
                  <p className="text-red-600 text-xl font-black font-mono tracking-tight mb-1">
                    {helpline.phone}
                  </p>
                  <p className="text-sm text-black font-semibold">{helpline.available}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 p-3 rounded-xl bg-red-100/90 border border-red-400 text-black font-bold text-sm flex items-center gap-2">
              <span>⚠️ If you&apos;re in immediate danger, please call emergency services at</span>
              <span className="bg-red-600 text-white px-2 py-0.5 rounded text-xs font-black">100</span>
              <span>or</span>
              <span className="bg-red-600 text-white px-2 py-0.5 rounded text-xs font-black">102</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="card text-center py-12 border-2 border-[#8E929B] bg-white/90">
          <div className="text-6xl mb-4">💙</div>
          <h2 className="text-2xl font-black text-black mb-4">You&apos;re Safe Here</h2>
          <p className="text-black font-semibold mb-6 max-w-2xl mx-auto">
            If you&apos;re feeling overwhelmed, anxious, or in crisis, click the button below
            to access breathing exercises, coping strategies, and emergency resources.
          </p>
          <div className="flex justify-center space-x-4">
            <button onClick={handleActivate} className="btn-crisis-red">
              I Need Support
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrisisMode;
