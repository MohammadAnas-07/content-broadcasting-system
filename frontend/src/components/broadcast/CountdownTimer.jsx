import './CountdownTimer.css';

const RADIUS = 34;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function CountdownTimer({ seconds, total }) {
  const safeTotal = total && total > 0 ? total : seconds || 1;
  const progress = seconds != null ? seconds / safeTotal : 1;
  const offset = CIRCUMFERENCE * (1 - progress);

  const formatTime = (s) => {
    if (s == null) return '--:--';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div className="countdown-timer">
      <div className="countdown-ring">
        <svg width="80" height="80" viewBox="0 0 80 80">
          <defs>
            <linearGradient id="countdownGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          <circle className="countdown-ring-bg" cx="40" cy="40" r={RADIUS} />
          <circle
            className="countdown-ring-fill"
            cx="40" cy="40" r={RADIUS}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
          />
        </svg>
        <span className="countdown-ring-text">{formatTime(seconds)}</span>
      </div>
      <span className="countdown-label">Next rotation</span>
    </div>
  );
}
