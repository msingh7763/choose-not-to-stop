import { useEffect, useMemo, useState } from 'react';

const SAFETY_PLAN_KEY = 'mindcare_safety_plan_v1';
const GRATITUDE_KEY = 'mindcare_gratitude_v1';

const reframingTemplates = [
  'A more balanced way to see this is: {{thought}}, and I can take one small helpful step now.',
  'Even if this feels hard, it does not define me. I can respond with: {{thought}}.',
  'What I would tell a friend in this moment is: {{thought}}.',
];

const defaultSafetyPlan = {
  warningSigns: '',
  calmActions: '',
  supportPerson: '',
  supportPhone: '',
  emergencySteps: '',
};

const MindCareStudio = () => {
  const [negativeThought, setNegativeThought] = useState('');
  const [reframedThought, setReframedThought] = useState('');
  const [gratitudeText, setGratitudeText] = useState('');
  const [gratitudeList, setGratitudeList] = useState([]);
  const [safetyPlan, setSafetyPlan] = useState(defaultSafetyPlan);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    try {
      const savedPlan = localStorage.getItem(SAFETY_PLAN_KEY);
      const savedGratitude = localStorage.getItem(GRATITUDE_KEY);

      if (savedPlan) {
        setSafetyPlan(JSON.parse(savedPlan));
      }
      if (savedGratitude) {
        setGratitudeList(JSON.parse(savedGratitude));
      }
    } catch {
      setSafetyPlan(defaultSafetyPlan);
      setGratitudeList([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(SAFETY_PLAN_KEY, JSON.stringify(safetyPlan));
  }, [safetyPlan]);

  useEffect(() => {
    localStorage.setItem(GRATITUDE_KEY, JSON.stringify(gratitudeList));
  }, [gratitudeList]);

  const suggestedAction = useMemo(() => {
    if (!negativeThought.trim()) {
      return 'Write one current thought and reframe it into a kinder, more realistic statement.';
    }
    if (negativeThought.length < 20) {
      return 'Try adding a bit more detail about the situation for a stronger reframe.';
    }
    return 'Great awareness. Take one action in the next 10 minutes that supports your reframe.';
  }, [negativeThought]);

  const handleReframe = () => {
    if (!negativeThought.trim()) {
      setReframedThought('Please write your thought first.');
      return;
    }

    const template = reframingTemplates[Math.floor(Math.random() * reframingTemplates.length)];
    const balanced = negativeThought.trim().replace(/\bi always\b/gi, 'I sometimes').replace(/\bi never\b/gi, 'I have not yet');
    setReframedThought(template.replace('{{thought}}', balanced));
  };

  const addGratitude = () => {
    const text = gratitudeText.trim();
    if (!text) return;

    setGratitudeList((prev) => [{ id: Date.now(), text }, ...prev].slice(0, 15));
    setGratitudeText('');
  };

  const removeGratitude = (id) => {
    setGratitudeList((prev) => prev.filter((item) => item.id !== id));
  };

  const handlePlanFieldChange = (field, value) => {
    setSafetyPlan((prev) => ({ ...prev, [field]: value }));
    setSaveMessage('');
  };

  const handleSavePlanFeedback = () => {
    setSaveMessage('Saved. Your plan is stored privately on this device.');
    setTimeout(() => setSaveMessage(''), 2600);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">Mind Care Studio</h1>
          <p className="mt-2 text-gray-300">Interactive tools for emotional regulation, reflection, and crisis readiness.</p>
        </div>
        <span className="text-xs uppercase tracking-[0.18em] text-electric-200 bg-electric-900/30 border border-electric-700/40 px-3 py-2 rounded-full">
          private self-help toolkit
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="card xl:col-span-2">
          <h2 className="text-xl font-semibold text-white">Thought Reframing</h2>
          <p className="mt-2 text-gray-300">Turn a stressful thought into a realistic and compassionate response.</p>
          <textarea
            className="input-field mt-4 min-h-[120px]"
            placeholder="Example: I always fail when things get tough."
            value={negativeThought}
            onChange={(e) => setNegativeThought(e.target.value)}
          />
          <div className="mt-3 text-sm text-emerald-200">{suggestedAction}</div>
          <button type="button" onClick={handleReframe} className="mt-4 btn-primary">
            Generate Reframe
          </button>

          {reframedThought && (
            <div className="p-4 mt-4 border rounded-xl border-emerald-400/30 bg-emerald-500/10">
              <p className="text-white">{reframedThought}</p>
            </div>
          )}
        </section>

        <section className="card">
          <h2 className="text-xl font-semibold text-white">Gratitude Booster</h2>
          <p className="mt-2 text-gray-300">Capture small positive moments to rebalance attention.</p>
          <div className="flex gap-2 mt-4">
            <input
              type="text"
              className="input-field"
              value={gratitudeText}
              onChange={(e) => setGratitudeText(e.target.value)}
              placeholder="One thing I appreciate today..."
            />
            <button type="button" onClick={addGratitude} className="px-4 btn-primary">
              Add
            </button>
          </div>

          <ul className="mt-4 space-y-2 max-h-[280px] overflow-auto pr-1">
            {gratitudeList.length === 0 && (
              <li className="text-sm text-gray-400">No entries yet. Start with one small win.</li>
            )}
            {gratitudeList.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-3 p-3 border rounded-lg bg-navy-800/60 border-navy-700">
                <span className="text-sm text-gray-200">{item.text}</span>
                <button
                  type="button"
                  onClick={() => removeGratitude(item.id)}
                  className="text-xs text-red-300 hover:text-red-200"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-white">Personal Safety Plan</h2>
          <button type="button" onClick={handleSavePlanFeedback} className="text-sm btn-secondary">
            Save Plan
          </button>
        </div>
        <p className="mt-2 text-gray-300">
          Prepare this once while calm so it is easier to follow during difficult moments.
        </p>

        {saveMessage && (
          <div className="px-4 py-3 mt-4 text-sm border rounded-lg border-emerald-400/30 bg-emerald-500/10 text-emerald-100">
            {saveMessage}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-2">
          <textarea
            className="input-field min-h-[100px]"
            placeholder="My warning signs (thoughts, body sensations, behaviors)"
            value={safetyPlan.warningSigns}
            onChange={(e) => handlePlanFieldChange('warningSigns', e.target.value)}
          />
          <textarea
            className="input-field min-h-[100px]"
            placeholder="Actions that calm me quickly"
            value={safetyPlan.calmActions}
            onChange={(e) => handlePlanFieldChange('calmActions', e.target.value)}
          />
          <input
            type="text"
            className="input-field"
            placeholder="Trusted person name"
            value={safetyPlan.supportPerson}
            onChange={(e) => handlePlanFieldChange('supportPerson', e.target.value)}
          />
          <input
            type="text"
            className="input-field"
            placeholder="Trusted person phone"
            value={safetyPlan.supportPhone}
            onChange={(e) => handlePlanFieldChange('supportPhone', e.target.value)}
          />
        </div>

        <textarea
          className="input-field min-h-[110px] mt-4"
          placeholder="Emergency steps (example: call support person, contact helpline, move to safe place)"
          value={safetyPlan.emergencySteps}
          onChange={(e) => handlePlanFieldChange('emergencySteps', e.target.value)}
        />
      </section>
    </div>
  );
};

export default MindCareStudio;
