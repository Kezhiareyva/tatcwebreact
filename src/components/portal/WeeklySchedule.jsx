import React, { useState } from 'react';

const START_HOUR = 7;
const END_HOUR = 20; // 07:00 to 20:00
const HOUR_WIDTH = 120; // pixels per hour
const ROW_HEIGHT = 80;

/**
 * Normalize a session_date value (Date object or string) to "YYYY-MM-DD"
 */
function toDateString(val) {
  if (!val) return '';
  // If it's already a string in YYYY-MM-DD format
  if (typeof val === 'string') {
    // Handle ISO string like "2026-10-08T00:00:00.000Z"
    return val.slice(0, 10);
  }
  // If it's a Date object
  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return String(val).slice(0, 10);
}

export default function WeeklySchedule({ sessions = [] }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getMonday = (d) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  };

  const currentMonday = getMonday(currentDate);
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(currentMonday);
    d.setDate(currentMonday.getDate() + i);
    return d;
  });

  const nextWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };

  const prevWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };

  const parseTime = (timeStr) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h + m / 60;
  };

  const isToday = (d) => {
    const today = new Date();
    return d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
  };

  const formatDateLabel = (d) => {
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const formatHourLabel = (hour) => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
    return `${String(h).padStart(2, '0')}:00 ${ampm}`;
  };

  const totalHours = END_HOUR - START_HOUR + 1;
  const calendarWidth = totalHours * HOUR_WIDTH;

  return (
    <div style={{ background: 'var(--surface-color)', color: 'var(--text-main)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
      {/* Header Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', background: 'var(--background-color)', borderBottom: '1px solid var(--border-color)' }}>
        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)' }}>Jadwal Mingguan</h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={prevWeek} className="btn" style={{ background: 'var(--surface-hover)', border: '1px solid var(--border-color)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>&larr; Prev</button>
          <button onClick={() => setCurrentDate(new Date())} className="btn btn-primary" style={{ padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>Today</button>
          <button onClick={nextWeek} className="btn" style={{ background: 'var(--surface-hover)', border: '1px solid var(--border-color)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>Next &rarr;</button>
        </div>
      </div>

      <div style={{ overflowX: 'auto', position: 'relative' }}>
        <div style={{ display: 'flex', minWidth: `${calendarWidth + 140}px` }}>
          {/* Top-Left Empty Corner */}
          <div style={{ width: '140px', flexShrink: 0, borderRight: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', background: 'var(--background-color)', zIndex: 2, position: 'sticky', left: 0 }}></div>

          {/* Hour Headers (Columns) */}
          <div style={{ display: 'flex', width: `${calendarWidth}px`, borderBottom: '1px solid var(--border-color)', background: 'var(--background-color)' }}>
            {Array.from({ length: totalHours }).map((_, i) => (
              <div key={i} style={{ width: `${HOUR_WIDTH}px`, flexShrink: 0, borderRight: '1px solid var(--border-color)', padding: '0.75rem 0.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
                {formatHourLabel(START_HOUR + i)}
              </div>
            ))}
          </div>
        </div>

        {/* Calendar Body (Rows = Days) */}
        <div style={{ minWidth: `${calendarWidth + 140}px`, position: 'relative' }}>
          {/* Background vertical grid lines */}
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: '140px', right: 0, display: 'flex', pointerEvents: 'none' }}>
            {Array.from({ length: totalHours }).map((_, i) => (
              <div key={i} style={{ width: `${HOUR_WIDTH}px`, flexShrink: 0, borderRight: '1px dashed var(--border-color)', opacity: 0.5 }}></div>
            ))}
          </div>

          {weekDays.map((day, rowIdx) => {
            // Build YYYY-MM-DD from local date (not UTC) to avoid timezone shift
            const year = day.getFullYear();
            const month = String(day.getMonth() + 1).padStart(2, '0');
            const dt = String(day.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${dt}`;

            // Normalize each session's date for comparison
            const daySessions = sessions.filter(s => toDateString(s.session_date) === dateStr);
            const todayFlag = isToday(day);

            return (
              <div key={rowIdx} style={{ display: 'flex', width: '100%', height: `${ROW_HEIGHT}px`, borderBottom: rowIdx === 6 ? 'none' : '1px solid var(--border-color)', background: todayFlag ? 'rgba(59, 130, 246, 0.03)' : 'transparent', position: 'relative' }}>

                {/* Day Header (Y-axis sticky) */}
                <div style={{
                  width: '140px',
                  flexShrink: 0,
                  borderRight: '1px solid var(--border-color)',
                  background: todayFlag ? 'rgba(59, 130, 246, 0.08)' : 'var(--surface-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  position: 'sticky',
                  left: 0,
                  zIndex: 2,
                  boxShadow: '2px 0 5px rgba(0,0,0,0.02)'
                }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: todayFlag ? '#2563eb' : 'var(--text-main)' }}>
                    {day.toLocaleDateString('id-ID', { weekday: 'long' })}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: todayFlag ? '#3b82f6' : 'var(--text-muted)', marginTop: '2px' }}>
                    {formatDateLabel(day)}
                  </div>
                </div>

                {/* Events Container for this Day */}
                <div style={{ position: 'relative', width: `${calendarWidth}px`, flexShrink: 0 }}>
                  {daySessions.map((s) => {
                    const startH = parseTime(s.start_time);
                    const endH = parseTime(s.end_time);

                    const safeStart = Math.max(START_HOUR, startH);
                    const safeEnd = Math.min(END_HOUR + 1, endH);
                    if (safeStart >= safeEnd) return null;

                    const left = (safeStart - START_HOUR) * HOUR_WIDTH;
                    const width = (safeEnd - safeStart) * HOUR_WIDTH;

                    return (
                      <div key={s.id} title={`${s.title}${s.batch_name ? ` (${s.batch_name})` : ''}\n${s.start_time?.slice(0,5)} - ${s.end_time?.slice(0,5)}`} style={{
                        position: 'absolute',
                        left: `${left + 2}px`,
                        width: `${width - 6}px`,
                        top: '8px',
                        bottom: '8px',
                        background: 'var(--primary-color)',
                        borderRadius: '6px',
                        padding: '5px 8px',
                        color: '#fff',
                        fontSize: '0.72rem',
                        overflow: 'hidden',
                        boxShadow: '0 2px 6px rgba(59, 130, 246, 0.35)',
                        borderLeft: '3px solid rgba(255,255,255,0.4)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        cursor: 'default',
                      }}>
                        <div style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '1px' }}>
                          {s.start_time?.slice(0, 5)} – {s.end_time?.slice(0, 5)}
                        </div>
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', opacity: 0.92 }}>
                          {s.title}
                        </div>
                        {s.batch_name && (
                          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', opacity: 0.75, fontSize: '0.68rem' }}>
                            {s.batch_name}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
