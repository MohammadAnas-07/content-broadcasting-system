import { useState, useEffect, useRef } from 'react';
import { Radio, MonitorOff } from 'lucide-react';
import CountdownTimer from './CountdownTimer';
import RotationIndicator from './RotationIndicator';
import SubjectFilter from './SubjectFilter';
import './LivePlayer.css';

export default function LivePlayer({ data, isEmpty, isLoading, countdown, subject, onSubjectChange }) {
  const [clock, setClock] = useState(new Date());
  const [cursorHidden, setCursorHidden] = useState(false);
  const timerRef = useRef(null);
  const cursorTimerRef = useRef(null);

  // Clock ticker
  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Auto-hide cursor after 3s
  useEffect(() => {
    const handleMove = () => {
      setCursorHidden(false);
      clearTimeout(cursorTimerRef.current);
      cursorTimerRef.current = setTimeout(() => setCursorHidden(true), 3000);
    };
    window.addEventListener('mousemove', handleMove);
    cursorTimerRef.current = setTimeout(() => setCursorHidden(true), 3000);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      clearTimeout(cursorTimerRef.current);
    };
  }, []);

  const item = data?.[0];

  // Collect unique subjects from all items for filter
  const subjects = [...new Set(data?.map((d) => d.subject) || [])];

  return (
    <div className={`live-player ${cursorHidden ? 'cursor-hidden' : ''}`}>
      {/* Live badge */}
      <div className="live-player-badge">
        <span className="live-player-badge-dot" />
        LIVE
      </div>

      {/* Clock */}
      <div className="live-player-clock">
        {clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </div>

      {/* Subject filter */}
      {subjects.length > 0 && (
        <SubjectFilter subjects={subjects} active={subject} onChange={onSubjectChange} />
      )}

      {/* Main content */}
      {isLoading ? (
        <div className="live-player-empty">
          <div className="live-player-empty-icon">
            <Radio size={40} />
          </div>
          <h2>Loading broadcast…</h2>
        </div>
      ) : isEmpty ? (
        <div className="live-player-empty">
          <div className="live-player-empty-icon">
            <MonitorOff size={40} />
          </div>
          <h2>No content is currently being broadcast</h2>
          <p>Check back later or try a different teacher channel</p>
        </div>
      ) : item ? (
        <div className="live-player-content" key={item.id}>
          <div className="live-player-image-wrapper">
            <img className="live-player-image" src={item.fileUrl} alt={item.title} />
          </div>
          <h1 className="live-player-title">{item.title}</h1>
          <div className="live-player-subject">{item.subject}</div>
          {item.description && <p className="live-player-description">{item.description}</p>}

          <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <CountdownTimer seconds={countdown} total={countdown + (item.secondsRemainingInSlot - countdown)} />
            <RotationIndicator current={item.rotationOrder} total={item.totalInRotation} />
          </div>
        </div>
      ) : null}

      {/* Watermark */}
      <div className="live-player-watermark">Powered by CBS</div>
    </div>
  );
}
