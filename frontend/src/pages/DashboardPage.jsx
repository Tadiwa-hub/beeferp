import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import apiClient, { animalsAPI, analyticsAPI } from '../api-service';

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [recentAnimals, setRecentAnimals] = useState([]);
  const [telemetry, setTelemetry] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [systemAlerts, setSystemAlerts] = useState([]);
  const [aiInsights, setAiInsights] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // AI Chat States
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', content: "Hello! I'm your BeefERP Farm Manager AI. How can I help you analyze your feedlot today?" }
  ]);
  const [isChatSending, setIsChatSending] = useState(false);
  const chatEndRef = useRef(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tagNumber, setTagNumber] = useState('');
  const [breed, setBreed] = useState('');
  const [initialWeight, setInitialWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [statsRes, animalsRes, telRes, forecastRes, alertsRes] = await Promise.allSettled([
        apiClient.get('/api/animals/stats/overview'),
        animalsAPI.getAll(1, 5),
        apiClient.get('/api/analytics/overview'),
        apiClient.get('/api/analytics/financials'),
        apiClient.get('/api/analytics/alerts'),
      ]);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (animalsRes.status === 'fulfilled') setRecentAnimals(animalsRes.value.data.data || []);
      if (telRes.status === 'fulfilled') setTelemetry(telRes.value.data);
      if (forecastRes.status === 'fulfilled') setForecast(forecastRes.value.data.forecast || []);
      if (alertsRes.status === 'fulfilled') setSystemAlerts(alertsRes.value.data.alerts || []);
    } catch (err) {
      console.error('Dashboard load error:', err);
      setError('Failed to load metrics. Ensure backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Fetch real AI insights when the user switches to the Predictive AI tab
  useEffect(() => {
    const fetchAI = async () => {
      if (activeTab === 'predictive' && !aiInsights && !isAiLoading) {
        setIsAiLoading(true);
        try {
          const res = await analyticsAPI.getAIInsights();
          setAiInsights(res.data.insights || []);
        } catch (err) {
          console.error("Failed to load AI insights", err);
          setAiInsights([{ title: 'AI Offline', type: 'warning', description: 'Could not connect to the Meta Llama 3.3 model. Please check API keys.' }]);
        } finally {
          setIsAiLoading(false);
        }
      }
    };
    fetchAI();
  }, [activeTab, aiInsights, isAiLoading]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, activeTab]);

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || isChatSending) return;
    
    const userMsg = { role: 'user', content: chatMessage };
    setChatHistory(prev => [...prev, userMsg]);
    setChatMessage('');
    setIsChatSending(true);
    
    try {
      // Filter out intro message from history sent to API if needed, or send all
      const payloadHistory = chatHistory.filter(m => m.role !== 'system');
      const res = await analyticsAPI.sendAIChat({ message: userMsg.content, history: payloadHistory });
      setChatHistory(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'assistant', content: '⚠️ Sorry, I encountered a network error or rate limit. Please try again.' }]);
    } finally {
      setIsChatSending(false);
    }
  };

  const handleAddAnimal = async (e) => {
    e.preventDefault();
    setModalError(''); setModalSuccess(''); setIsSubmitting(true);
    if (!tagNumber) { setModalError('Tag number is required.'); setIsSubmitting(false); return; }
    try {
      await animalsAPI.create({
        tag_number: tagNumber, breed: breed || undefined,
        current_weight: initialWeight ? parseFloat(initialWeight) : undefined,
        target_weight: targetWeight ? parseFloat(targetWeight) : undefined,
      });
      setModalSuccess('Animal registered!');
      setTagNumber(''); setBreed(''); setInitialWeight(''); setTargetWeight('');
      fetchData();
      setTimeout(() => { setIsModalOpen(false); setModalSuccess(''); }, 1500);
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to register animal.');
    } finally { setIsSubmitting(false); }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-10 h-10 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-primary font-medium">Loading enterprise telemetry...</p>
      </div>
    );
  }

  const m = telemetry?.metrics || {};

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-3 animate-fade-in pb-20 lg:pb-0 h-full">

      {/* Top Navigation Row (Tab bar + Alerts if any) */}
      <div className="flex-shrink-0 flex flex-col gap-2 w-full max-w-full overflow-hidden">
        {/* System Alerts Banner */}
        {systemAlerts.map((alert, i) => (
          <div key={i} className={`alert-banner ${alert.type === 'DANGER' ? 'alert-danger' : alert.type === 'WARNING' ? 'alert-warning' : 'alert-success'} py-1.5 px-3 text-[11px] flex-wrap md:flex-nowrap`}>
            <span className="text-sm flex-shrink-0">{alert.type === 'DANGER' ? '🚨' : alert.type === 'WARNING' ? '⚠️' : '🎉'}</span>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-[9px] uppercase tracking-wider m-0">{alert.category} Alert</p>
              <p className="text-[10px] mt-0.5 m-0 font-medium break-words leading-tight">{alert.message}</p>
            </div>
          </div>
        ))}

        {/* Tab Navigation */}
        <div className="tab-bar !p-1 !gap-1 w-full">
          {[
            { id: 'overview', label: '📊 Overview', mobileLabel: '📊 Overview' },
            { id: 'predictive', label: '🔮 Predictive AI', mobileLabel: '🔮 AI' },
            { id: 'financials', label: '💰 Financials', mobileLabel: '💰 Cost' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`tab-item !py-1.5 !px-3 text-[10px] ${activeTab === tab.id ? 'active shadow-sm' : ''}`}>
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.mobileLabel}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ===== OVERVIEW TAB ===== */}
      {activeTab === 'overview' && (
        <div className="flex-1 flex flex-col lg:flex-row gap-3 min-h-0">
          
          {/* Left Column: Stats & Herd Grid */}
          <div className="flex-[1.8] flex flex-col gap-3 min-h-0 min-w-0">
            {/* Stats Cards (Compact Row) */}
            <section className="flex-shrink-0 grid grid-cols-2 lg:grid-cols-4 gap-2 stagger-children">
              {[
                { icon: '🐂', bg: 'bg-blue-50', color: 'text-blue-700', label: 'Total Registered', value: `${stats?.total_animals || 0}`, unit: 'Head' },
                { icon: '🌾', bg: 'bg-green-50', color: 'text-green-700', label: 'Active Feeders', value: `${stats?.active_count || 0}`, unit: 'Head' },
                { icon: '💰', bg: 'bg-amber-50', color: 'text-amber-700', label: 'Market Ready', value: `${stats?.ready_for_sale_count || 0}`, unit: 'Head' },
                { icon: '⚖️', bg: 'bg-purple-50', color: 'text-purple-700', label: 'Avg Weight', value: `${stats?.avg_weight || 0}`, unit: 'kg' },
              ].map((s, i) => (
                <div key={i} className="card p-2 flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${s.bg} ${s.color}`}>{s.icon}</div>
                  <div className="min-w-0">
                    <p className="text-[9px] text-[#64748B] font-bold uppercase tracking-wider truncate">{s.label}</p>
                    <p className="text-sm font-black font-serif text-primary leading-tight mt-0.5">
                      {s.value} <span className="text-[9px] font-semibold text-[#94A3B8]">{s.unit}</span>
                    </p>
                  </div>
                </div>
              ))}
            </section>

            {/* Recent Animals Table (Constrained & Scrollable Body) */}
            <div className="flex-1 flex flex-col card overflow-hidden min-h-0">
              <div className="p-2 border-b border-[#E2E8F0] flex items-center justify-between flex-shrink-0 bg-background-dark/50">
                <h3 className="text-xs font-bold text-primary flex items-center gap-1.5"><span>📋</span> Recent Herd Registry</h3>
                <Link to="/animals" className="text-[9px] font-bold text-primary hover:underline">View Full Registry →</Link>
              </div>
              <div className="flex-1 overflow-auto bg-white">
                {recentAnimals.length === 0 ? (
                  <div className="empty-state py-8"><span className="empty-state-icon text-lg">🐂</span><p className="text-xs text-[#64748B] font-medium">No animals registered yet</p></div>
                ) : (
                  <table className="table-pro w-full text-left">
                    <thead className="bg-[#F8FAFC] sticky top-0 z-10 border-b border-[#E2E8F0]"><tr>
                      <th className="py-1.5 px-2 text-[9px] font-bold text-primary uppercase tracking-wider">Tag</th>
                      <th className="py-1.5 px-2 text-[9px] font-bold text-primary uppercase tracking-wider hide-mobile">Breed</th>
                      <th className="py-1.5 px-2 text-[9px] font-bold text-primary uppercase tracking-wider">Weight</th>
                      <th className="py-1.5 px-2 text-[9px] font-bold text-primary uppercase tracking-wider">Target</th>
                      <th className="py-1.5 px-2 text-[9px] font-bold text-primary uppercase tracking-wider">Status</th>
                    </tr></thead>
                    <tbody className="divide-y divide-[#E2E8F0]">
                      {recentAnimals.map(a => (
                        <tr key={a.id} className="hover:bg-blue-50/50 transition-colors">
                          <td className="py-1.5 px-2 font-mono font-bold text-xs text-primary">{a.tag_number}</td>
                          <td className="py-1.5 px-2 text-[10px] font-medium text-[#475569] hide-mobile">{a.breed || 'N/A'}</td>
                          <td className="py-1.5 px-2 text-[10px] font-semibold text-[#0F172A]">{a.current_weight ? `${a.current_weight} kg` : '—'}</td>
                          <td className="py-1.5 px-2 text-[10px] font-semibold text-[#0F172A]">{a.target_weight ? `${a.target_weight} kg` : '—'}</td>
                          <td className="py-1.5 px-2">
                            <span className={`badge !py-0.5 !px-1.5 !text-[9px] ${a.status === 'active' ? 'bg-green-100 text-green-800 border-green-200' : a.status === 'ready_for_sale' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 'bg-red-100 text-red-800 border-red-200'}`}>
                              {a.status?.replace(/_/g, ' ')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Command Hub & Alerts */}
          <div className="flex-[1.2] flex flex-col gap-3 min-h-0 min-w-0">
            {/* Quick Actions / Command Hub */}
            <div className="card p-2 flex-shrink-0">
              <h3 className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5"><span>⚡</span> Command Hub</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Register Cattle', icon: '➕', action: () => setIsModalOpen(true), bg: 'bg-primary hover:bg-primary-light text-white border border-transparent' },
                  { label: 'Daily Weighing', icon: '⚖️', link: '/weights', bg: 'bg-white hover:bg-blue-50 text-primary border border-[#E2E8F0]' },
                  { label: 'Herd Registry', icon: '🐂', link: '/animals', bg: 'bg-white hover:bg-blue-50 text-primary border border-[#E2E8F0]' },
                  { label: 'View Analytics', icon: '📈', action: () => setActiveTab('financials'), bg: 'bg-white hover:bg-blue-50 text-primary border border-[#E2E8F0]' },
                ].map((btn, i) => btn.link ? (
                  <Link key={i} to={btn.link} className={`flex items-center gap-1.5 p-1.5 rounded-lg shadow-sm transition-all ${btn.bg}`}>
                    <span className="text-sm">{btn.icon}</span>
                    <span className="font-bold text-[9px] leading-tight">{btn.label}</span>
                  </Link>
                ) : (
                  <button key={i} onClick={btn.action} className={`flex items-center gap-1.5 p-1.5 rounded-lg shadow-sm transition-all ${btn.bg}`}>
                    <span className="text-sm">{btn.icon}</span>
                    <span className="font-bold text-[9px] leading-tight">{btn.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Benchmarks / System Alert Diagnostics */}
            <div className="flex-1 flex flex-col card overflow-hidden min-h-0">
              <div className="p-2 border-b border-[#E2E8F0] flex-shrink-0 bg-background-dark/50">
                <h4 className="text-[11px] font-bold font-serif text-primary flex items-center gap-1.5"><span>💡</span> Enterprise Benchmarks</h4>
              </div>
              <div className="flex-1 overflow-auto p-2 space-y-2">
                <p className="text-[10px] text-[#475569] leading-relaxed m-0">
                  Your Feed Conversion Ratio (FCR) is <strong className="text-primary font-bold">{telemetry?.benchmarks?.user_fcr || '6.2'}</strong> vs the regional average of <strong className="text-[#64748B] font-bold">7.5</strong>. Lower FCR signifies highly efficient feed usage.
                </p>
                <div className="p-2 rounded-lg bg-green-50 border border-green-100">
                  <p className="text-[9px] font-bold text-green-800 m-0 flex items-center gap-1"><span>📈</span> ADG Metric</p>
                  <p className="text-[10px] text-green-900 mt-0.5 m-0 leading-snug">
                    Your Average Daily Gain is <strong className="font-black">{telemetry?.benchmarks?.user_adg || '1.34'} kg/day</strong>, outperforming the industry standard of <strong>1.05 kg/day</strong> by +27%.
                  </p>
                </div>
                <div className="flex justify-between items-center text-[8px] text-[#94A3B8] font-bold pt-1 border-t border-[#E2E8F0] mt-auto">
                  <span>BeefERP v2.0</span>
                  <span className="text-success">Cloud Sync ✓</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== PREDICTIVE AI TAB ===== */}
      {activeTab === 'predictive' && (
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 gap-3 animate-fade-in">
          
          {/* Left Column: Culling & Market Projections */}
          <div className="flex-[1.5] flex flex-col min-h-0 gap-3">
            {/* Culling Warnings */}
            <div className="card p-3 flex flex-col min-h-0 flex-[1]">
              <h3 className="section-title text-danger !mb-2 text-xs"><span>☠️</span> Predictive Culling Candidates</h3>
              <div className="flex-1 overflow-auto pr-1">
                {(!telemetry?.culling_warnings?.length) ? (
                  <div className="alert-banner alert-success !py-1.5"><span className="text-sm">✓</span>
                    <div><p className="font-bold text-[10px] m-0">All feeders performing well</p><p className="text-[9px] mt-0.5 m-0">No animals below the 0.8 kg/day ADG threshold.</p></div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {telemetry.culling_warnings.map((w, i) => (
                      <div key={i} className="alert-banner alert-danger flex-col sm:flex-row sm:items-center gap-2 !py-2 !px-2 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <p className="font-mono font-bold text-[11px] m-0 truncate">Tag: {w.tag_number}</p>
                          <p className="text-[10px] mt-0.5 m-0 truncate">ADG: {w.adg} kg/day • Cost: ${w.total_cost}</p>
                          <p className="text-[9px] mt-1 m-0 bg-white/60 p-1.5 rounded break-words whitespace-normal leading-tight">{w.recommendation}</p>
                        </div>
                        <button onClick={async () => { if(window.confirm('Confirm culling?')){ await apiClient.put(`/api/animals/${w.id}`,{status:'culled'}); fetchData(); }}}
                          className="btn-premium py-1 px-2.5 rounded-md bg-danger text-white text-[10px] font-bold shadow-sm self-stretch sm:self-center flex-shrink-0 text-center mt-1 sm:mt-0">
                          Dispatch Cull ❌
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Market Projections */}
            <div className="card flex flex-col min-h-0 flex-[1.5]">
              <div className="p-2.5 border-b border-[#E2E8F0] flex-shrink-0 bg-background-dark/50">
                <h3 className="text-xs font-bold text-primary flex items-center gap-1.5"><span>🔮</span> Market Readiness Projections</h3>
              </div>
              <div className="flex-1 overflow-auto bg-white">
                {(!telemetry?.ready_projections?.length) ? (
                  <div className="empty-state py-8"><span className="empty-state-icon">📅</span><p className="text-xs text-gray-500">No active projections</p></div>
                ) : (
                  <table className="table-pro w-full text-left">
                    <thead className="bg-[#F8FAFC] sticky top-0 z-10 border-b border-[#E2E8F0]"><tr>
                      <th className="py-1.5 px-2 text-[9px]">Tag</th>
                      <th className="py-1.5 px-2 text-[9px]">Current</th>
                      <th className="py-1.5 px-2 text-[9px]">Target</th>
                      <th className="py-1.5 px-2 text-[9px]">ADG</th>
                      <th className="py-1.5 px-2 text-[9px] hide-mobile">Days Left</th>
                      <th className="py-1.5 px-2 text-[9px]">Ready Date</th>
                    </tr></thead>
                    <tbody className="divide-y divide-[#E2E8F0]">
                      {telemetry.ready_projections.map((p, i) => (
                        <tr key={i} className="hover:bg-blue-50/50">
                          <td className="py-1.5 px-2 font-mono font-bold text-xs text-primary">{p.tag_number}</td>
                          <td className="py-1.5 px-2 text-[10px] text-[#0F172A]">{p.current_weight} kg</td>
                          <td className="py-1.5 px-2 text-[10px] text-[#0F172A]">{p.target_weight} kg</td>
                          <td className="py-1.5 px-2 font-bold text-primary text-[10px]">{p.adg} kg/d</td>
                          <td className="py-1.5 px-2 text-[10px] text-[#64748B] hide-mobile">{p.projected_days}d</td>
                          <td className="py-1.5 px-2"><span className="badge badge-success font-mono !text-[8px]">📅 {p.projected_date}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: AI Insights & Chat */}
          <div className="flex-[1] flex flex-col min-h-0 gap-3">
            {/* AI Farm Manager Insights */}
            <div className="card p-3 flex flex-col min-h-0 flex-shrink-0 max-h-[40%]">
              <h3 className="section-title !mb-2 text-xs flex items-center justify-between">
                <span className="flex items-center gap-1.5"><span>🧠</span> Meta Llama Insights</span>
                {isAiLoading && <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>}
              </h3>
              <div className="flex-1 overflow-auto space-y-2 pr-1">
                {isAiLoading && !aiInsights ? (
                  <div className="flex flex-col gap-2 animate-pulse">
                    <div className="h-12 bg-gray-100 rounded-lg w-full"></div>
                    <div className="h-12 bg-gray-100 rounded-lg w-full"></div>
                  </div>
                ) : aiInsights && aiInsights.length > 0 ? (
                  aiInsights.map((insight, idx) => (
                    <div key={idx} className={`p-2 rounded-lg border ${
                      insight.type === 'success' ? 'bg-green-50 border-green-200' :
                      insight.type === 'warning' ? 'bg-amber-50 border-amber-200' :
                      'bg-blue-50 border-blue-200'
                    }`}>
                      <h4 className={`text-[9px] font-bold ${
                        insight.type === 'success' ? 'text-green-900' :
                        insight.type === 'warning' ? 'text-amber-900' :
                        'text-blue-900'
                      }`}>
                        {insight.type === 'success' ? '✓ ' : insight.type === 'warning' ? '⚠️ ' : '💡 '}{insight.title}
                      </h4>
                      <p className="text-[9px] text-gray-700 mt-0.5 leading-relaxed">
                        {insight.description}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-[10px] text-gray-500">No AI insights available.</p>
                  </div>
                )}
              </div>
            </div>

            {/* AI Chat Interface */}
            <div className="card flex flex-col min-h-0 flex-1 border-primary/20">
              <div className="p-2.5 border-b border-[#E2E8F0] flex-shrink-0 bg-blue-50/50 flex justify-between items-center">
                <h3 className="text-xs font-bold text-primary flex items-center gap-1.5"><span>💬</span> Ask Farm Manager AI</h3>
                <span className="text-[8px] font-bold uppercase tracking-wider text-primary px-1.5 py-0.5 bg-blue-100 rounded">Meta Llama 70B</span>
              </div>
              
              <div className="flex-1 overflow-auto p-3 space-y-3 bg-gray-50/30">
                {chatHistory.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-xl px-3 py-2 text-[10px] ${
                      msg.role === 'user' ? 'bg-primary text-white rounded-br-none' : 'bg-white border border-[#E2E8F0] text-gray-800 rounded-bl-none shadow-sm'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isChatSending && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-[#E2E8F0] rounded-xl rounded-bl-none px-3 py-2 shadow-sm flex gap-1">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="p-2 border-t border-[#E2E8F0] bg-white flex-shrink-0">
                <form onSubmit={handleSendChat} className="flex gap-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Ask about feed costs, culling, or ADG..."
                    className="flex-1 bg-gray-50 border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-[10px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    disabled={isChatSending}
                  />
                  <button
                    type="submit"
                    disabled={!chatMessage.trim() || isChatSending}
                    className="bg-primary hover:bg-primary-light disabled:opacity-50 text-white rounded-lg px-3 py-1.5 flex items-center justify-center transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== FINANCIALS TAB ===== */}
      {activeTab === 'financials' && (
        <div className="flex-1 flex flex-col min-h-0 gap-3 animate-fade-in">
          {/* Financial KPI Cards */}
          <section className="flex-shrink-0 grid grid-cols-2 lg:grid-cols-4 gap-2 stagger-children">
            <div className="card-gradient-primary rounded-xl p-3 shadow-glow-primary">
              <p className="text-[9px] uppercase tracking-widest font-bold text-blue-200">Net Profit</p>
              <p className="text-lg md:text-xl font-black font-serif text-white mt-0.5">${m.total_profitability || 0}</p>
              <p className="text-[8px] text-white/50 mt-0.5">Revenue − All Costs</p>
            </div>
            <div className="card p-3">
              <p className="text-[9px] uppercase tracking-wider font-bold text-[#64748B]">Cost/kg Gained</p>
              <p className="text-lg md:text-xl font-black font-serif text-primary mt-0.5">${m.avg_cost_per_kg_gained || 0}</p>
              <p className="text-[8px] text-[#94A3B8] mt-0.5">Feed + Vet + Overhead</p>
            </div>
            <div className="card p-3">
              <p className="text-[9px] uppercase tracking-wider font-bold text-[#64748B]">Total Costs</p>
              <p className="text-lg md:text-xl font-black font-serif text-danger mt-0.5">
                ${((m.total_feed_costs||0) + (m.total_vet_costs||0) + (m.fixed_overhead||0)).toFixed(2)}
              </p>
              <p className="text-[8px] text-[#94A3B8] mt-0.5">All operational inputs</p>
            </div>
            <div className="card p-3">
              <p className="text-[9px] uppercase tracking-wider font-bold text-[#64748B]">Feed ROI</p>
              <p className="text-lg md:text-xl font-black font-serif text-success mt-0.5">
                {m.feed_investment_roi ? `${(m.feed_investment_roi * 100).toFixed(0)}%` : 'N/A'}
              </p>
              <p className="text-[8px] text-[#94A3B8] mt-0.5">Weight value / feed spend</p>
            </div>
          </section>

          {/* Chart Grid */}
          <div className="flex-1 flex flex-col lg:flex-row gap-3 min-h-0">
            <div className="flex-[2] flex flex-col card p-3 min-h-0">
              <h3 className="text-[11px] font-bold text-primary mb-1 flex-shrink-0 flex items-center gap-1.5"><span>📈</span> 6-Month Cash Flow Forecast</h3>
              <p className="text-[9px] text-[#64748B] mb-2 flex-shrink-0">Projected at {telemetry?.benchmarks?.user_adg || 1.35} kg/day ADG on active cattle.</p>
              <div className="w-full h-[250px] lg:h-auto lg:flex-1 lg:min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={forecast}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="month" tick={{ fontSize: 9, fontWeight: 600 }} stroke="#94A3B8" />
                    <YAxis tick={{ fontSize: 9, fontWeight: 600 }} stroke="#94A3B8" />
                    <Tooltip />
                    <Line type="monotone" dataKey="projected_revenue" stroke="#2563EB" name="Revenue" strokeWidth={2.5} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="projected_feed_costs" stroke="#DC2626" name="Feed Cost" strokeWidth={2} dot={{ r: 2 }} />
                    <Line type="monotone" dataKey="projected_margin" stroke="#D97706" name="Net Margin" strokeWidth={2} dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="flex-[1] flex flex-col card p-3 min-h-0">
              <h3 className="text-[11px] font-bold text-primary mb-1 flex-shrink-0 flex items-center gap-1.5"><span>🏆</span> ADG Benchmark</h3>
              <p className="text-[9px] text-[#64748B] mb-2 flex-shrink-0">Your feedlot vs Regional average.</p>
              <div className="w-full h-[250px] lg:h-auto lg:flex-1 lg:min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Your ADG', value: telemetry?.benchmarks?.user_adg || 1.34, fill: '#2563EB' },
                    { name: 'Avg', value: telemetry?.benchmarks?.industry_avg_adg || 1.05, fill: '#94A3B8' },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 600 }} stroke="#94A3B8" />
                    <YAxis tick={{ fontSize: 9, fontWeight: 600 }} stroke="#94A3B8" />
                    <Tooltip />
                    <Bar dataKey="value" name="kg/day" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== ADD ANIMAL MODAL ===== */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}>
          <div className="modal-content !p-5">
            <div className="modal-handle" />
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-primary text-xl font-bold">✕</button>
            <h3 className="text-base font-bold font-serif text-primary mb-4 flex items-center gap-2"><span>🐂</span> Register Animal</h3>
            {modalError && <div className="alert-banner alert-danger !py-1 mb-3 text-[10px]">{modalError}</div>}
            {modalSuccess && <div className="alert-banner alert-success !py-1 mb-3 text-[10px] font-semibold">{modalSuccess}</div>}
            <form onSubmit={handleAddAnimal} className="space-y-2.5">
              <div>
                <label className="block text-[10px] font-bold uppercase text-primary mb-1">Cattle Tag *</label>
                <input type="text" placeholder="e.g. FL-1002" value={tagNumber} onChange={e => setTagNumber(e.target.value)} className="input-field !py-1.5 text-xs" required />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-primary mb-1">Breed</label>
                <input type="text" placeholder="e.g. Brahman" value={breed} onChange={e => setBreed(e.target.value)} className="input-field !py-1.5 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-primary mb-1">Weight (kg)</label>
                  <input type="number" step="0.01" inputMode="decimal" placeholder="245.5" value={initialWeight} onChange={e => setInitialWeight(e.target.value)} className="input-field !py-1.5 text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-primary mb-1">Target (kg)</label>
                  <input type="number" step="0.01" inputMode="decimal" placeholder="500" value={targetWeight} onChange={e => setTargetWeight(e.target.value)} className="input-field !py-1.5 text-xs" />
                </div>
              </div>
              <div className="pt-2 flex gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="w-1/2 py-2 rounded-lg border border-[#E2E8F0] text-[#64748B] font-bold text-xs hover:bg-[#F8FAFC] transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="w-1/2 py-2 rounded-lg bg-primary hover:bg-primary-light text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5">
                  {isSubmitting ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Register 🐂'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
