import { Loader2 } from 'lucide-react';
import './Button.css';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  className = '',
  type = 'button',
  ...props
}) {
  const classes = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    loading ? 'btn-loading' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="btn-spinner-overlay">
          <Loader2 size={size === 'sm' ? 14 : 18} className="spin-icon" style={{ animation: 'spin 1s linear infinite' }} />
        </span>
      )}
      <span className="btn-text" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {Icon && <Icon size={size === 'sm' ? 14 : 16} />}
        {children}
      </span>
    </button>
  );
}
