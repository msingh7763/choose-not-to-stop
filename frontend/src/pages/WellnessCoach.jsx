import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { journalAPI, moodAPI } from '../services/api';

const GROUNDING_STEPS = [
  'Name 5 things you can see around you.',
  'Name 4 things you can touch right now.',
  'Name 3 things you can hear.',
  'Name 2 things you can smell.',
  'Name 1 thing you can taste.',
];

const MOOD_TO_SCORE = {
  Happy: 5,
  Neutral: 3,
  Sad: 2,
  Anxious: 1,
  Stressed: 1,
};

const REFLECTION_PROMPTS = [
  'What is one thing that felt heavy today, and what is one thing that helped?',
  'What does your body need most right now: rest, movement, food, or connection?',
  'What is one small action you can take in the next 30 minutes to support yourself?',
  'What thought is repeating today, and how can you respond to it with kindness?',
];

const COACH_STEPS = [
  { id: 1, title: 'Quick check-in', subtitle: 'Understand your current state' },
  { id: 2, title: 'Calming tools', subtitle: 'Regulate your body and mind' },
  { id: 3, title: 'Reflection', subtitle: 'Capture your progress' },
];

const BREATHING_PATTERNS = {
  box: {
    label: 'Box 4-4-4',
    phases: [
      { name: 'Inhale', seconds: 4 },
      { name: 'Hold', seconds: 4 },
      { name: 'Exhale', seconds: 4 },
    ],
  },
  calm478: {
    label: 'Calm 4-7-8',
    phases: [
      { name: 'Inhale', seconds: 4 },
      { name: 'Hold', seconds: 7 },
      { name: 'Exhale', seconds: 8 },
    ],
  },
};

const REFLECTION_TARGET = 80;

const average = (values, fallback = 0) => {
  if (!values.length) {
    return fallback;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
};

const deriveMoodAssessment = (checkIn, moodEntries, journalEntries) => {
  const moodHistoryScores = moodEntries
    .map((entry) => MOOD_TO_SCORE[entry.mood])
    .filter((value) => Number.isFinite(value));

  const baselineMood = average(moodHistoryScores, checkIn.mood / 2);
  const sentimentScores = journalEntries
    .map((entry) => entry.sentimentScore)
    .filter((value) => Number.isFinite(value));
  const avgSentiment = average(sentimentScores, 0);

  const weightedMood = checkIn.mood * 0.35;
  const weightedEnergy = checkIn.energy * 0.2;
  const weightedStress = (11 - checkIn.stress) * 0.3;
  const weightedSleep = Math.min(checkIn.sleepHours, 10) * 0.15;
  const trendLift = baselineMood * 0.2;
  const sentimentLift = avgSentiment * 0.3;

  const score = weightedMood + weightedEnergy + weightedStress + weightedSleep + trendLift + sentimentLift;

  let label = 'Happy';
  if (score < 4.2) {
    label = checkIn.stress >= 7 ? 'Stressed' : 'Sad';
  } else if (score < 5.8) {
    label = checkIn.stress >= 6 ? 'Anxious' : 'Neutral';
  }

  const reasons = [];
  if (checkIn.stress >= 7) reasons.push('high stress reported');
  if (checkIn.sleepHours < 6) reasons.push('low sleep');
  if (checkIn.energy <= 4) reasons.push('low energy');
  if (avgSentiment < -0.5) reasons.push('negative reflection trend');
  if (!reasons.length) reasons.push('balanced check-in indicators');

  return {
    label,
    score,
    reason: reasons.join(', '),
    baselineMood,
    avgSentiment,
  };
};

const buildPlan = ({ mood, stress, energy, sleepHours, assessment, moodEntries, journalEntries }) => {
  const plan = [];
  const moodHistoryScores = moodEntries
    .map((entry) => MOOD_TO_SCORE[entry.mood])
    .filter((value) => Number.isFinite(value));
  const moodTrend = average(moodHistoryScores, assessment.baselineMood) - assessment.baselineMood;
  const negativeJournalRatio = journalEntries.length
    ? journalEntries.filter((entry) => entry.sentimentLabel === 'negative').length / journalEntries.length
    : 0;

  if (stress >= 7) {
    plan.push('Take 2 minutes for slow box breathing (4s in, 4s hold, 4s out).');
  }
  if (mood <= 4) {
    plan.push('Write one short sentence about what feels hardest right now.');
  }
  if (energy <= 4) {
    plan.push('Do a light 5-minute movement break and drink a glass of water.');
  }
  if (sleepHours < 6) {
    plan.push('Prioritize a wind-down routine tonight: dim lights and no screens for 30 minutes.');
  }
  if (negativeJournalRatio >= 0.6) {
    plan.push('Your recent reflections look heavy. Reach out to one trusted person today.');
  }
  if (moodTrend < -0.3) {
    plan.push('Your recent mood trend dipped. Keep tomorrow simple with one realistic priority.');
  }

  if (plan.length === 0) {
    plan.push('Keep your momentum: do one gratitude note and one healthy action today.');
  }

  return plan;
};

const WellnessCoach = () => {
  const [checkIn, setCheckIn] = useState({
    mood: 6,
    stress: 5,
    energy: 6,
    sleepHours: 7,
  });
  const [journalText, setJournalText] = useState('');
  const [loadingMood, setLoadingMood] = useState(false);
  const [loadingJournal, setLoadingJournal] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [moodEntries, setMoodEntries] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const [moodStatus, setMoodStatus] = useState({ message: '', error: '' });
  const [journalStatus, setJournalStatus] = useState({ message: '', error: '' });
  const [exerciseStatus, setExerciseStatus] = useState({ message: '', error: '' });
  const [groundingStep, setGroundingStep] = useState(0);
  const [groundingPaused, setGroundingPaused] = useState(false);
  const [breathingOn, setBreathingOn] = useState(false);
  const [breathingPatternKey, setBreathingPatternKey] = useState('box');
  const [breathingPhaseIndex, setBreathingPhaseIndex] = useState(0);
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState(BREATHING_PATTERNS.box.phases[0].seconds);
  const [completedCycles, setCompletedCycles] = useState(0);
  const [reflectionPromptIndex, setReflectionPromptIndex] = useState(0);
  const [activeStep, setActiveStep] = useState(1);

  const selectedPattern = useMemo(() => BREATHING_PATTERNS[breathingPatternKey], [breathingPatternKey]);
  const reflectionPrompt = useMemo(() => REFLECTION_PROMPTS[reflectionPromptIndex], [reflectionPromptIndex]);

  const assessment = useMemo(
    () => deriveMoodAssessment(checkIn, moodEntries, journalEntries),
    [checkIn, moodEntries, journalEntries]
  );
  const moodLabel = assessment.label;

  const plan = useMemo(
    () => buildPlan({ ...checkIn, assessment, moodEntries, journalEntries }),
    [checkIn, assessment, moodEntries, journalEntries]
  );

  useEffect(() => {
    const loadHistory = async () => {
      setLoadingHistory(true);
      try {
        const [moodsRes, journalsRes] = await Promise.all([
          moodAPI.getAll({ limit: 7 }),
          journalAPI.getAll({ limit: 7 }),
        ]);
        setMoodEntries(moodsRes.data?.data || []);
        setJournalEntries(journalsRes.data?.data || []);
      } catch {
        setExerciseStatus({
          message: '',
          error: 'Could not load recent history. Coach suggestions use current inputs only.',
        });
      } finally {
        setLoadingHistory(false);
      }
    };

    loadHistory();
  }, []);

  useEffect(() => {
    if (!breathingOn) {
      setBreathingPhaseIndex(0);
      setPhaseSecondsLeft(selectedPattern.phases[0].seconds);
      return undefined;
    }

    const currentPhase = selectedPattern.phases[breathingPhaseIndex];
    setPhaseSecondsLeft(currentPhase.seconds);

    const countdown = setInterval(() => {
      setPhaseSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    const transition = setTimeout(() => {
      setBreathingPhaseIndex((prev) => {
        const next = (prev + 1) % selectedPattern.phases.length;
        if (next === 0) {
          setCompletedCycles((cycles) => cycles + 1);
        }
        return next;
      });
    }, currentPhase.seconds * 1000);

    return () => {
      clearInterval(countdown);
      clearTimeout(transition);
    };
  }, [breathingOn, breathingPhaseIndex, selectedPattern]);

  const startGrounding = () => {
    setGroundingStep(1);
    setGroundingPaused(false);
    setExerciseStatus({
      message: 'Grounding started. Move through each step slowly.',
      error: '',
    });
  };

  const nextGroundingStep = () => {
    if (groundingPaused) {
      return;
    }

    setGroundingStep((prev) => {
      if (prev >= GROUNDING_STEPS.length) {
        setExerciseStatus({
          message: 'Great work. You completed the grounding exercise.',
          error: '',
        });
        return 0;
      }
      return prev + 1;
    });
  };

  const previousGroundingStep = () => {
    setGroundingStep((prev) => (prev > 1 ? prev - 1 : prev));
  };

  const restartGrounding = () => {
    setGroundingStep(1);
    setGroundingPaused(false);
    setExerciseStatus({
      message: 'Grounding restarted from step 1.',
      error: '',
    });
  };

  const exitGrounding = () => {
    setGroundingStep(0);
    setGroundingPaused(false);
  };

  const toggleGroundingPause = () => {
    setGroundingPaused((prev) => !prev);
  };

  const toggleBreathing = () => {
    setBreathingOn((prev) => {
      const next = !prev;
      if (next) {
        setBreathingPhaseIndex(0);
        setPhaseSecondsLeft(selectedPattern.phases[0].seconds);
        setCompletedCycles(0);
        setExerciseStatus({ message: '', error: '' });
      }
      return next;
    });
  };

  const handleSaveMood = async () => {
    setLoadingMood(true);
    setMoodStatus({ message: '', error: '' });

    try {
      await moodAPI.create({
        mood: moodLabel,
        sleepHours: checkIn.sleepHours,
        notes: `Coach check-in: mood ${checkIn.mood}/10, stress ${checkIn.stress}/10, energy ${checkIn.energy}/10`,
      });
      setMoodStatus({ message: 'Mood check-in saved successfully.', error: '' });
    } catch (apiError) {
      setMoodStatus({
        message: '',
        error: apiError.response?.data?.message || 'Could not save mood check-in.',
      });
    } finally {
      setLoadingMood(false);
    }
  };

  const handleSaveJournal = async () => {
    if (journalText.trim().length < 10) {
      setJournalStatus({ message: '', error: 'Reflection should be at least 10 characters.' });
      return;
    }

    setLoadingJournal(true);
    setJournalStatus({ message: '', error: '' });

    try {
      await journalAPI.create({ content: journalText.trim() });
      setJournalText('');
      setReflectionPromptIndex((prev) => (prev + 1) % REFLECTION_PROMPTS.length);
      setJournalStatus({ message: 'Reflection saved to your journal.', error: '' });
    } catch (apiError) {
      setJournalStatus({
        message: '',
        error: apiError.response?.data?.message || 'Could not save reflection.',
      });
    } finally {
      setLoadingJournal(false);
    }
  };

  const activeBreathingPhase = selectedPattern.phases[breathingPhaseIndex];
  const highStress = checkIn.stress >= 8;
  const primarySupportAction = plan[0] || 'Take one small action: pause, breathe slowly, and drink water.';
  const completionPercent = Math.round((activeStep / COACH_STEPS.length) * 100);
  const totalReflectionQuestions = REFLECTION_PROMPTS.length;
  const currentQuestionNumber = reflectionPromptIndex + 1;
  const reflectionCompleted = journalStatus.message && journalStatus.message.includes('saved');

  const getCompletionMessage = () => {
    const messages = [
      'Beautiful reflection. You\'re building emotional awareness.',
      'Great work. Small reflections compound into growth.',
      'You\'re getting clearer about what you need.',
      'Each reflection brings you closer to resilience.',
    ];
    return messages[reflectionPromptIndex % messages.length];
  };

  const getPanelTone = (status) => {
    if (status.error) {
      return 'border-red-500/50 bg-red-500/15 text-red-100';
    }
    return 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100';
  };

  return (
    <div className="space-y-6">
      <header className="relative p-6 overflow-hidden border rounded-3xl border-slate-700/70 bg-slate-900/80 md:p-8">
        <div className="absolute rounded-full -left-16 top-6 h-44 w-44 bg-emerald-500/15 blur-3xl"></div>
        <div className="absolute bottom-0 w-56 h-56 rounded-full -right-12 bg-cyan-500/15 blur-3xl"></div>
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Guided emotional support</p>
            <h1 className="mt-2 text-3xl font-bold text-white md:text-4xl">Wellness Coach</h1>
            <p className="max-w-2xl mt-3 text-slate-300">
              Check in, regulate, and reflect with one focused action at a time.
            </p>
          </div>
          <div className="min-w-[240px] rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
            <p className="text-sm text-slate-400">Session progress</p>
            <p className="mt-1 text-2xl font-semibold text-white">{completionPercent}%</p>
            <div className="w-full h-2 mt-3 overflow-hidden rounded-full bg-slate-800">
              <div className="h-2 transition-all duration-500 rounded-full bg-emerald-400" style={{ width: `${completionPercent}%` }}></div>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="p-4 border rounded-3xl border-slate-700/70 bg-slate-900/80 md:p-5 xl:sticky xl:top-24 xl:self-start">
          <p className="px-2 text-xs uppercase tracking-[0.18em] text-slate-400">Journey</p>
          <div className="mt-4 space-y-3">
            {COACH_STEPS.map((step) => (
              <button
                key={step.id}
                type="button"
                className={`w-full rounded-2xl border p-3 text-left transition-all ${activeStep === step.id ? 'border-emerald-400/60 bg-emerald-500/10' : 'border-slate-700 bg-slate-950/50 hover:border-slate-500'}`}
                onClick={() => setActiveStep(step.id)}
              >
                <p className={`text-xs ${activeStep === step.id ? 'text-emerald-300' : 'text-slate-400'}`}>Step {step.id}</p>
                <p className={`mt-1 font-semibold ${activeStep === step.id ? 'text-white' : 'text-slate-200'}`}>{step.title}</p>
                <p className="mt-1 text-xs text-slate-400">{step.subtitle}</p>
              </button>
            ))}
          </div>

          <div className="p-4 mt-5 border rounded-2xl border-slate-700 bg-slate-950/60">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Current state</p>
            <p className="mt-2 text-2xl font-semibold text-white">{moodLabel}</p>
            <p className="mt-2 text-sm text-slate-300">{primarySupportAction}</p>
            {loadingHistory && <p className="mt-2 text-xs text-slate-500">Updating trend context...</p>}
          </div>
        </aside>

        <main className="space-y-6">
          {activeStep === 1 && (
            <section className="p-5 space-y-6 border rounded-3xl border-slate-700/70 bg-slate-900/75 md:p-7">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold text-white">Quick check-in</h2>
                  <p className="mt-1 text-sm text-slate-300">Set each meter once so we can guide you better.</p>
                </div>
                <span className="px-3 py-1 text-xs border rounded-full border-slate-600 text-slate-300">2 mins</span>
              </div>

              {(moodStatus.message || moodStatus.error) && (
                <div className={`w-full rounded-2xl border px-4 py-3 text-left ${getPanelTone(moodStatus)}`}>
                  {moodStatus.error || moodStatus.message}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="p-4 border rounded-2xl border-slate-700 bg-slate-950/55">
                  <label htmlFor="coach-mood" className="block mb-2 text-sm text-slate-300">Mood level <span className="font-semibold text-white">{checkIn.mood}/10</span></label>
                  <input id="coach-mood" type="range" min="1" max="10" value={checkIn.mood} onChange={(e) => setCheckIn((prev) => ({ ...prev, mood: Number(e.target.value) }))} className="w-full accent-emerald-400" />
                </div>
                <div className="p-4 border rounded-2xl border-slate-700 bg-slate-950/55">
                  <label htmlFor="coach-stress" className="block mb-2 text-sm text-slate-300">Stress load <span className="font-semibold text-white">{checkIn.stress}/10</span></label>
                  <input id="coach-stress" type="range" min="1" max="10" value={checkIn.stress} onChange={(e) => setCheckIn((prev) => ({ ...prev, stress: Number(e.target.value) }))} className="w-full accent-emerald-400" />
                </div>
                <div className="p-4 border rounded-2xl border-slate-700 bg-slate-950/55">
                  <label htmlFor="coach-energy" className="block mb-2 text-sm text-slate-300">Energy level <span className="font-semibold text-white">{checkIn.energy}/10</span></label>
                  <input id="coach-energy" type="range" min="1" max="10" value={checkIn.energy} onChange={(e) => setCheckIn((prev) => ({ ...prev, energy: Number(e.target.value) }))} className="w-full accent-emerald-400" />
                </div>
                <div className="p-4 border rounded-2xl border-slate-700 bg-slate-950/55">
                  <label htmlFor="coach-sleep" className="block mb-2 text-sm text-slate-300">Sleep last night <span className="font-semibold text-white">{checkIn.sleepHours}h</span></label>
                  <input id="coach-sleep" type="range" min="0" max="12" step="0.5" value={checkIn.sleepHours} onChange={(e) => setCheckIn((prev) => ({ ...prev, sleepHours: Number(e.target.value) }))} className="w-full accent-emerald-400" />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={handleSaveMood} disabled={loadingMood} className="rounded-xl bg-emerald-400 px-5 py-2.5 font-semibold text-slate-950 transition-colors hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70">
                  {loadingMood ? 'Saving...' : 'Save check-in'}
                </button>
                <button type="button" className="rounded-xl border border-slate-500 bg-slate-800/70 px-5 py-2.5 font-semibold text-slate-100 transition-colors hover:bg-slate-700" onClick={() => setActiveStep(2)}>
                  Go to calming tools
                </button>
              </div>
            </section>
          )}

          {activeStep === 2 && (
            <section className="p-5 space-y-6 border rounded-3xl border-slate-700/70 bg-slate-900/75 md:p-7">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold text-white">Calming tools</h2>
                  <p className="mt-1 text-sm text-slate-300">Choose breathing or grounding. Start with one cycle.</p>
                </div>
                <span className="px-3 py-1 text-xs border rounded-full border-slate-600 text-slate-300">3 mins</span>
              </div>

              {highStress && (
                <div className="p-4 text-red-100 border rounded-2xl border-red-500/45 bg-red-500/15">
                  <p className="font-semibold">High stress detected.</p>
                  <p className="mt-1 text-sm">If you feel unsafe right now, open crisis support.</p>
                  <Link to="/crisis" className="inline-block px-4 py-2 mt-3 font-semibold text-white bg-red-500 rounded-lg hover:bg-red-400">Open crisis support</Link>
                </div>
              )}

              {(exerciseStatus.message || exerciseStatus.error) && (
                <div className={`rounded-2xl border px-4 py-3 ${getPanelTone(exerciseStatus)}`}>
                  {exerciseStatus.error || exerciseStatus.message}
                </div>
              )}

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.2fr_1fr]">
                <div className="p-4 border rounded-2xl border-slate-700 bg-slate-950/55">
                  <label htmlFor="breathing-pattern" className="block mb-2 text-sm text-slate-300">Breathing pattern</label>
                  <select
                    id="breathing-pattern"
                    value={breathingPatternKey}
                    onChange={(e) => {
                      const nextPattern = e.target.value;
                      setBreathingPatternKey(nextPattern);
                      setBreathingOn(false);
                      setBreathingPhaseIndex(0);
                      setCompletedCycles(0);
                      setPhaseSecondsLeft(BREATHING_PATTERNS[nextPattern].phases[0].seconds);
                    }}
                    className="input-field"
                  >
                    {Object.entries(BREATHING_PATTERNS).map(([key, value]) => (
                      <option key={key} value={key}>{value.label}</option>
                    ))}
                  </select>

                  <div className="flex items-center justify-center py-6">
                    <div className={`flex h-36 w-36 items-center justify-center rounded-full border border-emerald-300/40 bg-gradient-to-br from-emerald-400/30 to-cyan-400/20 transition-all duration-1000 ${breathingOn ? 'scale-110 shadow-[0_0_40px_rgba(74,222,128,0.35)]' : 'scale-100'}`}>
                      <span className="text-lg font-bold text-white">{activeBreathingPhase.name}</span>
                    </div>
                  </div>

                  <div className="p-3 text-sm text-center border rounded-xl border-slate-700 bg-slate-900/70 text-slate-300">
                    <div>{activeBreathingPhase.name} - {phaseSecondsLeft}s left</div>
                    <div>Completed cycles: {completedCycles}</div>
                  </div>

                  <div className="flex flex-wrap gap-3 mt-4">
                    <button type="button" onClick={toggleBreathing} className="rounded-xl bg-emerald-400 px-5 py-2.5 font-semibold text-slate-950 transition-colors hover:bg-emerald-300">
                      {breathingOn ? 'Stop breathing' : 'Start breathing'}
                    </button>
                    <button type="button" onClick={startGrounding} className="rounded-xl border border-slate-500 bg-slate-800/70 px-5 py-2.5 font-semibold text-slate-100 transition-colors hover:bg-slate-700">Start grounding</button>
                  </div>
                </div>

                <div className="p-4 border rounded-2xl border-slate-700 bg-slate-950/55">
                  <h3 className="text-lg font-semibold text-white">Suggested actions</h3>
                  <p className="mt-2 text-sm text-slate-300">Start with action 1. Continue only if needed.</p>
                  <ul className="mt-4 space-y-3">
                    {plan.map((item, index) => (
                      <li key={item} className="p-3 border rounded-xl border-slate-700 bg-slate-900/70 text-slate-200">
                        <span className="mr-2 font-semibold text-emerald-300">{index + 1}.</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <button type="button" className="rounded-xl border border-slate-500 bg-slate-800/70 px-5 py-2.5 font-semibold text-slate-100 transition-colors hover:bg-slate-700" onClick={() => setActiveStep(3)}>
                Continue to reflection
              </button>
            </section>
          )}

          {activeStep === 3 && (
            <section className="p-5 space-y-6 border rounded-3xl border-slate-700/70 bg-slate-900/75 md:p-7">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold text-white">Reflection</h2>
                  <p className="mt-1 text-sm text-slate-300">Write one meaningful line to close this check-in.</p>
                </div>
                <div className="px-3 py-1 text-center border rounded-full border-slate-600">
                  <p className="text-xs text-slate-300">
                    <span className="font-semibold text-emerald-300">{currentQuestionNumber}</span> of <span className="font-semibold text-emerald-300">{totalReflectionQuestions}</span>
                  </p>
                  <p className="text-xs text-slate-500">questions</p>
                </div>
              </div>

              {reflectionCompleted && (
                <div className="p-4 border rounded-2xl border-emerald-400/50 bg-emerald-500/15 text-emerald-100">
                  <p className="font-semibold">✨ Reflection saved!</p>
                  <p className="mt-2 text-sm">{getCompletionMessage()}</p>
                  <p className="mt-2 text-xs text-emerald-300/80">
                    You&apos;re on question {currentQuestionNumber} of {totalReflectionQuestions}. Come back tomorrow for more.
                  </p>
                </div>
              )}

              {(journalStatus.message || journalStatus.error) && !reflectionCompleted && (
                <div className={`rounded-2xl border px-4 py-3 ${getPanelTone(journalStatus)}`}>
                  {journalStatus.error || journalStatus.message}
                </div>
              )}

              <div className="p-4 border rounded-2xl border-slate-700 bg-slate-950/55">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-300">Prompt</p>
                    <p className="mt-2 text-slate-100">{reflectionPrompt}</p>
                  </div>
                </div>
              </div>

              <textarea
                className="input-field mt-1 min-h-[180px]"
                placeholder="Write one meaningful sentence about what you need right now..."
                value={journalText}
                onChange={(e) => setJournalText(e.target.value)}
              />

              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-slate-400">{journalText.trim().length} chars (target: {REFLECTION_TARGET}+)</span>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setActiveStep(2)} className="rounded-xl border border-slate-500 bg-slate-800/70 px-5 py-2.5 font-semibold text-slate-100 transition-colors hover:bg-slate-700">Back</button>
                  <button type="button" onClick={handleSaveJournal} disabled={loadingJournal} className="rounded-xl bg-emerald-400 px-5 py-2.5 font-semibold text-slate-950 transition-colors hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70">
                    {loadingJournal ? 'Saving...' : 'Save reflection'}
                  </button>
                </div>
              </div>
            </section>
          )}

          {groundingStep > 0 && (
            <section className="p-5 border rounded-3xl border-emerald-300/40 bg-slate-900/85 md:p-7">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Grounding exercise</h2>
                <span className="text-sm text-slate-300">Step {groundingStep} of {GROUNDING_STEPS.length}</span>
              </div>

              <p className="mb-4 text-lg text-emerald-200">{GROUNDING_STEPS[groundingStep - 1]}</p>

              <div className="w-full h-2 mb-5 overflow-hidden rounded-full bg-slate-800">
                <div className="h-2 transition-all duration-300 bg-emerald-400" style={{ width: `${(groundingStep / GROUNDING_STEPS.length) * 100}%` }}></div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={previousGroundingStep} disabled={groundingStep <= 1} className="px-4 py-2 font-semibold transition-colors border rounded-lg border-slate-500 bg-slate-800/70 text-slate-100 hover:bg-slate-700 disabled:opacity-60">Previous</button>
                <button type="button" onClick={nextGroundingStep} className="px-4 py-2 font-semibold transition-colors rounded-lg bg-emerald-400 text-slate-950 hover:bg-emerald-300">{groundingStep === GROUNDING_STEPS.length ? 'Finish' : 'Next'}</button>
                <button type="button" onClick={toggleGroundingPause} className="px-4 py-2 font-semibold transition-colors border rounded-lg border-slate-500 bg-slate-800/70 text-slate-100 hover:bg-slate-700">{groundingPaused ? 'Resume' : 'Pause'}</button>
                <button type="button" onClick={restartGrounding} className="px-4 py-2 font-semibold transition-colors border rounded-lg border-slate-500 bg-slate-800/70 text-slate-100 hover:bg-slate-700">Restart</button>
                <button type="button" onClick={exitGrounding} className="px-4 py-2 font-semibold transition-colors border rounded-lg border-slate-500 bg-slate-800/70 text-slate-100 hover:bg-slate-700">Close</button>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default WellnessCoach;
