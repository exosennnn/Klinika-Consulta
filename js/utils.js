// Klinika Consulta - small pure helpers (no Vue, no network).
(function () {
  const CLINIC_HOURS = [
    { start: 9 * 60, end: 12 * 60 },
    { start: 13 * 60 + 30, end: 16 * 60 }
  ];
  const TIME_SLOTS = CLINIC_HOURS.flatMap(({ start, end }) => {
    const slots = [];
    for (let minutes = start; minutes < end; minutes += 30) {
      const hour = Math.floor(minutes / 60);
      const minute = minutes % 60;
      const value = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
      slots.push({
        value,
        label: `${String(hour % 12 || 12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`
      });
    }
    return slots;
  });

  const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const esc = (str) => String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const fmtTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    return `${String(h % 12 || 12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
  };

  const STATUS_INFO = {
    Pending:            { label: 'Waiting for doctor approval', help: 'Your request was received. The doctor will review it shortly.' },
    Booked:             { label: 'Confirmed', help: 'Your appointment is set. Please arrive on time.' },
    Proposed:           { label: 'New time suggested', help: 'The clinic suggested a different time. Please accept or decline it.' },
    Needs_Reassignment: { label: 'Being moved to another doctor', help: 'Your doctor is unavailable. The clinic is arranging a new doctor or time for you.' },
    Checked_In:         { label: 'Checked in', help: 'You are in the clinic queue. Please wait to be called.' },
    Completed:          { label: 'Completed', help: 'Your visit is complete.' },
    Cancelled:          { label: 'Cancelled', help: 'This appointment was cancelled. The slot has been released.' },
    Declined:           { label: 'Not accepted', help: 'The doctor could not accept this request. You can book another time.' },
  };
  const statusLabel = (st) => (STATUS_INFO[st] ? STATUS_INFO[st].label : (st || '').replace(/_/g, ' '));
  const statusHelp = (st) => (STATUS_INFO[st] ? STATUS_INFO[st].help : '');
  const statusClass = (st) => ({
    Pending: 'bg-amber-950 text-amber-400 border-amber-800',
    Booked: 'bg-emerald-950 text-emerald-400 border-emerald-800',
    Needs_Reassignment: 'bg-red-950 text-red-400 border-red-800',
    Proposed: 'bg-sky-950 text-sky-400 border-sky-800',
    Checked_In: 'bg-cyan-950 text-cyan-400 border-cyan-800',
    Completed: 'bg-purple-950 text-purple-300 border-purple-800',
    Cancelled: 'bg-zinc-800 text-zinc-500 border-zinc-700'
  }[st] || 'bg-zinc-800 text-zinc-400 border-zinc-700');
  const canModify = (app) => ['Pending', 'Booked', 'Needs_Reassignment'].includes(app.status);


  window.KlinikaConsultaUtils = { TIME_SLOTS, DAY_NAMES, esc, fmtTime, statusLabel, statusHelp, statusClass, canModify };
})();
