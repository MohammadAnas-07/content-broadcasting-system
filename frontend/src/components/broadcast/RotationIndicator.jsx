import './RotationIndicator.css';

export default function RotationIndicator({ current, total }) {
  if (!total || total <= 1) return null;

  return (
    <div className="rotation-indicator">
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={`rotation-dot ${i + 1 === current ? 'active' : ''}`} />
      ))}
      <span className="rotation-text">{current} / {total}</span>
    </div>
  );
}
