import React, { useState, useEffect } from 'react';
import apiClient, { animalsAPI } from '../api-service';

const HealthPage = () => {
  const [animals, setAnimals] = useState([]);
  const [vetRecords, setVetRecords] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('calendar'); // 'calendar', 'log'

  // Form states
  const [selectedAnimalId, setSelectedAnimalId] = useState('');
  const [vaccinationName, setVaccinationName] = useState('');
  const [dateAdministered, setDateAdministered] = useState(new Date().toISOString().split('T')[0]);
  const [nextDueDate, setNextDueDate] = useState('');
  const [vetNotes, setVetNotes] = useState('');
  const [cost, setCost] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [animalsRes, vetRes, upcomingRes] = await Promise.all([
        animalsAPI.getAll(1, 100),
        apiClient.get('/api/vet-records'),
        apiClient.get('/api/analytics/alerts'), // includes overdue counts / alert categories
      ]);
      const activeCattle = (animalsRes.data.data || []).filter(a => a.status === 'active');
      setAnimals(activeCattle);
      if (activeCattle.length > 0) setSelectedAnimalId(activeCattle[0].id);
      setVetRecords(vetRes.data || []);
      
      // Compute due tasks from overdue vaccines query
      setUpcoming(vetRes.data.filter(r => r.next_due_date && new Date(r.next_due_date) >= new Date()) || []);
    } catch (err) {
      console.error('Failed to load vet records:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveVet = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setIsSubmitting(true);

    if (!selectedAnimalId || !vaccinationName || !dateAdministered) {
      setFormError('Animal, vaccination/treatment name, and date administered are required.');
      setIsSubmitting(false);
      return;
    }

    try {
      await apiClient.post('/api/vet-records', {
        animal_id: selectedAnimalId,
        vaccination_name: vaccinationName,
        date_administered: dateAdministered,
        next_due_date: nextDueDate || undefined,
        vet_notes: vetNotes,
        cost: cost ? parseFloat(cost) : 0,
      });

      setFormSuccess('Health record saved successfully!');
      setVaccinationName('');
      setNextDueDate('');
      setVetNotes('');
      setCost('');
      fetchData();
      setTimeout(() => setFormSuccess(''), 2000);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to record health event.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-10 h-10 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-primary font-semibold uppercase tracking-wider">Loading health records...</p>
      </div>
    );
  }

  // Basic calendar calculation for the current month
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  // Create an array representing calendar days
  const calendarDays = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(d);
  }

  const getVaccinationsOnDay = (day) => {
    if (!day) return [];
    return upcoming.filter(r => {
      const d = new Date(r.next_due_date);
      return d.getDate() === day && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-3 animate-fade-in pb-20 md:pb-0 h-full">
      
      {/* Sub tabs */}
      <div className="tab-bar">
        <button
          onClick={() => setActiveSubTab('calendar')}
          className={`tab-item ${activeSubTab === 'calendar' ? 'active' : ''}`}
        >
          📅 Vaccination Calendar & Due Tasks
        </button>
        <button
          onClick={() => setActiveSubTab('log')}
          className={`tab-item ${activeSubTab === 'log' ? 'active' : ''}`}
        >
          💊 Treatment & Vaccination Log
        </button>
      </div>

      {activeSubTab === 'calendar' && (
        <div className="flex-1 flex flex-col lg:flex-row gap-3 min-h-0">
          {/* Calendar View */}
          <div className="flex-[2] card p-3 flex flex-col min-h-0">
            <h3 className="text-xs font-bold text-primary mb-2 flex-shrink-0">
              <span>📅</span> {today.toLocaleString('en-US', { month: 'long', year: 'numeric' })} Calendar
            </h3>
            
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-500 uppercase pb-1 border-b flex-shrink-0">
              <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
            </div>
            
            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="grid grid-cols-7 gap-1 pt-1 h-full">
                {calendarDays.map((day, i) => {
                  const vaccs = getVaccinationsOnDay(day);
                  const isToday = day === today.getDate();
                  return (
                    <div
                      key={i}
                      className={`min-h-[40px] md:min-h-[50px] p-1 rounded-md border flex flex-col transition-all ${
                        day ? 'bg-white hover:border-primary border-black/5' : 'bg-gray-50/30 border-transparent'
                      } ${isToday ? 'ring-1 ring-primary border-transparent' : ''}`}
                    >
                      {day && (
                        <>
                          <span className={`text-[10px] font-bold ${isToday ? 'text-primary' : 'text-gray-500'}`}>
                            {day}
                          </span>
                          {vaccs.length > 0 && (
                            <div className="bg-yellow-100 text-yellow-800 text-[8px] font-extrabold uppercase rounded px-1 py-0.5 mt-auto truncate">
                              📢 {vaccs.length} Due
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Schedule info */}
          <div className="flex-[1] flex flex-col min-h-0 overflow-auto pr-1">
            {/* Record Health Event Form */}
            <div className="card p-3 space-y-2">
              <h4 className="text-[11px] font-bold text-primary mb-1"><span>💊</span> Log Treatment</h4>
              
              {formError && <div className="alert-banner alert-danger text-xs">{formError}</div>}
              {formSuccess && <div className="alert-banner alert-success text-xs font-semibold">{formSuccess}</div>}

              <form onSubmit={handleSaveVet} className="space-y-2.5">
                <div>
                  <label className="block text-[9px] font-bold uppercase text-primary mb-1">Select Cattle *</label>
                  <select
                    value={selectedAnimalId}
                    onChange={(e) => setSelectedAnimalId(e.target.value)}
                    className="input-field bg-white !py-1 text-[10px]"
                    required
                  >
                    {animals.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.tag_number} ({a.breed || 'Angus cross'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-bold uppercase text-primary mb-1">Medication / Vaccine Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Anthrax Vaccine, Dewormer"
                    value={vaccinationName}
                    onChange={(e) => setVaccinationName(e.target.value)}
                    className="input-field !py-1 text-[10px]"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-primary mb-1">Date Logged *</label>
                    <input
                      type="date"
                      value={dateAdministered}
                      onChange={(e) => setDateAdministered(e.target.value)}
                      className="input-field !py-1 text-[10px]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-primary mb-1">Next Due Date</label>
                    <input
                      type="date"
                      value={nextDueDate}
                      onChange={(e) => setNextDueDate(e.target.value)}
                      className="input-field !py-1 text-[10px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-primary mb-1">Cost ($ USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 15.00"
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                      className="input-field !py-1 text-[10px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-bold uppercase text-primary mb-1">Vet Treatment Notes</label>
                  <textarea
                    rows="2"
                    placeholder="e.g. Administered dosage 2ml, checked joints"
                    value={vetNotes}
                    onChange={(e) => setVetNotes(e.target.value)}
                    className="input-field text-[10px] !py-1"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn-premium py-1.5 rounded-lg bg-primary hover:bg-primary-light text-white font-bold text-[10px] shadow-sm transition-all flex items-center justify-center gap-1.5 mt-1"
                >
                  {isSubmitting ? (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span>Log Treatment 💾</span>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'log' && (
        <div className="flex-1 flex flex-col min-h-0 card p-3 md:p-4 space-y-3">
          <div className="flex-shrink-0">
            <h3 className="section-title !mb-1"><span>📋</span> Herd Medical Registry</h3>
            <p className="text-xs text-gray-500">Historical records of all treatments, vaccinations, and veterinary actions administered.</p>
          </div>

          {vetRecords.length === 0 ? (
            <div className="flex-1 empty-state border border-dashed rounded-xl">
              <span className="empty-state-icon">💊</span>
              <p className="text-sm text-gray-500 font-medium">No medical treatments recorded yet.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-auto border border-black/5 rounded-xl min-h-0">
              <table className="table-pro">
                <thead>
                  <tr>
                    <th>Tag Number</th>
                    <th>Medication / Treatment</th>
                    <th>Date Administered</th>
                    <th>Next Due Date</th>
                    <th>Cost</th>
                    <th>Treatment Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {vetRecords.map((record) => (
                    <tr key={record.id}>
                      <td className="font-mono font-bold text-primary">{record.tag_number}</td>
                      <td className="font-semibold text-gray-700">{record.vaccination_name}</td>
                      <td>
                        {new Date(record.date_administered).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td>
                        {record.next_due_date ? (
                          <span className={`badge ${new Date(record.next_due_date) < new Date() ? 'badge-danger' : 'badge-ready'}`}>
                            📅 {new Date(record.next_due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        ) : (
                          <span className="text-gray-400 font-medium">—</span>
                        )}
                      </td>
                      <td className="font-semibold text-gray-700">${parseFloat(record.cost || 0).toFixed(2)}</td>
                      <td className="text-xs text-gray-500 max-w-[200px] truncate" title={record.vet_notes}>
                        {record.vet_notes || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default HealthPage;
