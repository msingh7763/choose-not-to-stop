import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { riskAPI } from './services/api';

const RiskDashboard = () => {
  const [riskData, setRiskData] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadRiskData = async () => {
    setLoading(true);
    setError('');

    try {
      const [evaluateResult, historyResult] = await Promise.allSettled([
        riskAPI.evaluate(),
        riskAPI.getHistory(),
      ]);

      if (evaluateResult.status === 'fulfilled') {
        setRiskData(evaluateResult.value.data || null);
      } else {
        setRiskData(null);
      }

      if (historyResult.status === 'fulfilled') {
        setHistory((historyResult.value.data?.history || []).map((item) => ({
          date: new Date(item.date).toLocaleDateString(),
          riskScale: item.risk === 'CRITICAL' ? 3 : item.risk === 'WARNING' ? 2 : 1,
          risk: item.risk,
        })));
      } else {
        setHistory([]);
      }

      const evaluateError = evaluateResult.status === 'rejected'
        ? evaluateResult.reason?.response?.data?.message || evaluateResult.reason?.message
        : '';
      const historyError = historyResult.status === 'rejected'
        ? historyResult.reason?.response?.data?.message || historyResult.reason?.message
        : '';

      if (evaluateError || historyError) {
        const mergedError = [evaluateError, historyError]
          .filter(Boolean)
          .join(' ')
          .trim();
        setError(mergedError || 'Unable to load complete risk insights right now.');
      }

      if (
        evaluateResult.status === 'rejected'
        && historyResult.status === 'fulfilled'
        && (historyResult.value.data?.history || []).length > 0
      ) {
        const historyItems = historyResult.value.data.history;
        const latest = historyItems[historyItems.length - 1];
        setRiskData({
          risk: latest.risk,
          reason: `${latest.reason} (latest saved result)`,
        });
      }
    } catch (err) {
      console.error('Error loading risk data:', err);
      setError('Unable to load risk insights right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRiskData();
  }, []);

  const getBadgeStyle = (risk) => {
    switch (risk) {
      case 'SAFE':
        return 'bg-[#A4BBAC]/35 text-black border-[#A4BBAC]';
      case 'WARNING':
        return 'bg-[#ECB7B3]/45 text-black border-[#8E929B]';
      case 'CRITICAL':
        return 'bg-red-100 text-red-700 border-red-500';
      default:
        return 'bg-[#DCE1DA] text-black border-[#8E929B]';
    }
  };

  const getRecommendations = (risk) => {
    if (risk === 'CRITICAL') {
      return (
        <div className="bg-red-50 p-4 rounded-xl border border-red-300 mt-4 text-black">
          <h4 className="font-black text-red-700">Immediate Action Recommended</h4>
          <ul className="list-disc pl-5 mt-2 space-y-1 font-semibold text-sm">
            <li>Please reach out to a professional counselor or therapist.</li>
            <li>Call the national mental health hotline.</li>
            <li>Connect with trusted friends or family.</li>
          </ul>
        </div>
      );
    }
    if (risk === 'WARNING') {
      return (
        <div className="bg-[#F4DDD5]/60 p-4 rounded-xl border border-[#8E929B] mt-4 text-black">
          <h4 className="font-bold text-black">Early Support Recommended</h4>
          <ul className="list-disc pl-5 mt-2 space-y-1 font-medium text-sm">
            <li>Take extra time for self-care and rest today.</li>
            <li>Try guided breathing or journal in the Wellness Coach.</li>
            <li>Reach out to someone you trust if feelings linger.</li>
          </ul>
        </div>
      );
    }
    return (
      <div className="bg-[#A4BBAC]/25 p-4 rounded-xl border border-[#A4BBAC] mt-4 text-black">
        <h4 className="font-bold text-black">Healthy Baseline Detected</h4>
        <p className="mt-1 font-medium text-sm">Your recent signals indicate emotional stability. Keep up your healthy routines.</p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6 rounded-2xl border border-[#8E929B]/40 bg-white/80 animate-pulse text-black">
        <div className="h-6 w-1/3 bg-[#8E929B]/20 rounded mb-4"></div>
        <div className="h-16 bg-[#8E929B]/10 rounded"></div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 rounded-2xl border border-[#8E929B]/40 bg-white/85 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-xl font-black text-black">Early Warning Risk Detection</h3>
          <p className="text-sm text-black font-medium">ML-driven evaluation of emotional and behavioral stability</p>
        </div>
        {error && (
          <button
            type="button"
            onClick={loadRiskData}
            className="btn-secondary text-xs px-3 py-1.5"
          >
            Retry
          </button>
        )}
      </div>

      {riskData ? (
        <div>
          <div className={`p-4 rounded-xl border-l-4 ${getBadgeStyle(riskData.risk)} flex flex-wrap items-center justify-between gap-4`}>
            <div>
              <p className="text-xs uppercase font-bold tracking-wider opacity-75">Current Risk Status</p>
              <h4 className="text-2xl font-black">{riskData.risk}</h4>
            </div>
            <div className="text-right max-w-md">
              <p className="text-xs font-bold uppercase tracking-wider opacity-75">Evaluation Reason</p>
              <p className="text-sm font-semibold italic mt-0.5">{riskData.reason}</p>
            </div>
          </div>

          {getRecommendations(riskData.risk)}
        </div>
      ) : (
        <div className="p-4 bg-[#DCE1DA]/50 rounded-xl border border-[#8E929B]/40">
          <p className="text-black font-semibold text-sm">Not enough data to calculate risk yet. Add mood and journal entries for a few days.</p>
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-6 pt-4 border-t border-[#8E929B]/30">
          <h4 className="text-base font-bold text-black mb-3">Risk Trend (Last 7 Days)</h4>
          <div className="h-56 bg-white/60 p-3 rounded-xl border border-[#8E929B]/30">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#8E929B" opacity={0.3} />
                <XAxis dataKey="date" stroke="#000000" fontSize={12} />
                <YAxis dataKey="riskScale" domain={[0, 4]} ticks={[1, 2, 3]} stroke="#000000" fontSize={12} tickFormatter={(val) => {
                  if (val === 1) return 'SAFE';
                  if (val === 2) return 'WARNING';
                  if (val === 3) return 'CRITICAL';
                  return '';
                }} />
                <Tooltip />
                <Line type="monotone" dataKey="riskScale" stroke="#ECB7B3" strokeWidth={3} dot={{ r: 5, fill: '#8E929B' }} activeDot={{ r: 7 }} name="Risk Level" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskDashboard;
