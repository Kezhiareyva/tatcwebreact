export const formatDate = (dateString) => {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (isNaN(d)) return dateString;
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

export const formatTime = (timeString) => {
  if (!timeString) return '';
  if (timeString.includes('T')) {
    const d = new Date(timeString);
    return !isNaN(d) ? d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : timeString;
  }
  return timeString.substring(0, 5);
};
