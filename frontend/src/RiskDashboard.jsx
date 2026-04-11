import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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

      // Keep dashboard useful even when live prediction fails by reusing latest saved score.
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
    switch(risk) {
      case 'SAFE': return 'bg-green-100 text-green-800 border-green-300';
      case 'WARNING': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRecommendations = (risk) => {
    if (risk === 'CRITICAL') {
      return (
        <div className="bg-red-50 p-4 rounded-xl border border-red-200 mt-4">
          <h4 className="font-bold text-red-700">🚨 Immediate Action Recommended</h4>
          <ul className="list-disc pl-5 mt-2 text-red-600">
            <li>Please reach out to a professional counselor or therapist.</li>
            <li>Call the national mental health hotline.</li>
            <li>Connect with your trusted friends or family.</li>
          </ul>
        </div>
      );
    }
    if (risk === 'WARNING') {
      return (
        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 mt-4">
          <h4 className="font-bold text-yellow-700">⚠️ Suggestions for Improvement</h4>
          <ul className="list-disc pl-5 mt-2 text-yellow-700">
            <li>Try to establish a consistent sleep schedule of 7-8 hours.</li>
            <li>Take 10 minutes for mindful breathing exercises.</li>
            <li>Engage in journaling to process these negative emotions.</li>
          </ul>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return <div className="p-8 text-center">Loading Early Warning System...</div>;
  }

  return (
    <div className="p-6 bg-white rounded-2xl shadow-lg w-full max-w-4xl mx-auto border border-gray-100 font-sans">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Mental Health Risk Detection (Early Warning System)</h2>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          <div className="flex items-center justify-between gap-3">
            <span>{error}</span>
            <button
              type="button"
              onClick={loadRiskData}
              className="rounded-md border border-red-300 bg-white px-3 py-1 text-sm font-medium text-red-700 hover:bg-red-100"
            >
              Retry
            </button>
          </div>
        </div>
      )}
      
      {riskData ? (
        <div className="mb-8">
          <div className={`p-5 rounded-xl border-l-8 ${getBadgeStyle(riskData.risk)} flex items-center justify-between`}>
            <div>
              <p className="text-sm uppercase font-bold tracking-wider mb-1 opacity-80">Current Status</p>
              <h3 className="text-3xl font-black">{riskData.risk}</h3>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold opacity-80">Algorithm Reason</p>
              <p className="text-lg italic mt-1 font-medium">{riskData.reason}</p>
            </div>
          </div>

          {getRecommendations(riskData.risk)}
        </div>
      ) : (
        <div className="p-4 bg-gray-50 rounded-xl mb-8">
          <p className="text-gray-500">Not enough data to calculate risk yet. Add mood entries and journal entries for a few days.</p>
        </div>
      )}

      <div className="mt-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Risk Level Trend (Last 7 Days)</h3>
        {history.length > 0 ? (
          <div className="h-64 bg-gray-50 p-4 rounded-xl shadow-inner border border-gray-200">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
                <XAxis dataKey="date" />
                <YAxis dataKey="riskScale" domain={[0, 4]} ticks={[1, 2, 3]} tickFormatter={(val) => {
                  if (val === 1) return 'SAFE';
                  if (val === 2) return 'WARNING';
                  if (val === 3) return 'CRITICAL';
                  return '';
                }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="riskScale" stroke="#6366f1" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} name="Risk Level" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-gray-500">No historical data available to show trends.</p>
        )}
      </div>

    </div>
  );
};

export default RiskDashboard;
