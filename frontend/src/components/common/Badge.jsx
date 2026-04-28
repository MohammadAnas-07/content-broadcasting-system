import './Badge.css';

const variantMap = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  info: 'info',
  accent: 'accent',
};

export default function Badge({ children, variant = 'info', dot = false, live = false, className = '' }) {
  const v = variantMap[variant] || variant;
  return (
    <span className={`badge badge-${v} ${live ? 'badge-live' : ''} ${className}`}>
      {dot && <span className="badge-dot" />}
      {children}
    </span>
  );
}
