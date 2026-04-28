import './Skeleton.css';

export default function Skeleton({ type = 'text', width, height, count = 1, className = '' }) {
  if (type === 'card') {
    return (
      <div className={`skeleton-card ${className}`}>
        <div className="skeleton skeleton-image" />
        <div className="skeleton-card-body">
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-text" style={{ width: '80%' }} />
          <div className="skeleton skeleton-text" style={{ width: '50%' }} />
        </div>
      </div>
    );
  }

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`skeleton skeleton-${type} ${className}`}
          style={{ width, height }}
        />
      ))}
    </>
  );
}
