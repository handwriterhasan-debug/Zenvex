export const formatTime12Hour = (timeStr: string) => {
  if (!timeStr) return '';
  if (timeStr.toLowerCase().includes('am') || timeStr.toLowerCase().includes('pm')) {
    return timeStr; // Already formatted
  }
  const parts = timeStr.split(':');
  if (parts.length !== 2) return timeStr;
  
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  
  if (isNaN(h) || isNaN(m)) return timeStr;
  
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
};

