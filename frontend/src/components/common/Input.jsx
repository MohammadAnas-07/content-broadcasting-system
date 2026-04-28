import { forwardRef } from 'react';
import './Input.css';

const Input = forwardRef(function Input(
  { label, error, icon: Icon, className = '', type = 'text', ...props },
  ref
) {
  const isTextarea = type === 'textarea';
  const isSelect = type === 'select';
  const Tag = isTextarea ? 'textarea' : isSelect ? 'select' : 'input';

  return (
    <div className={`input-group ${className}`}>
      {label && <label className="input-label">{label}</label>}
      <div style={{ position: 'relative' }}>
        {Icon && !isTextarea && !isSelect && (
          <span className="input-icon">
            <Icon size={16} />
          </span>
        )}
        <Tag
          ref={ref}
          type={isTextarea || isSelect ? undefined : type}
          className={[
            isTextarea ? 'input-field textarea-field' : isSelect ? 'input-field select-field' : 'input-field',
            Icon && !isTextarea && !isSelect ? 'has-icon' : '',
            error ? 'has-error' : '',
          ].filter(Boolean).join(' ')}
          {...props}
        />
      </div>
      {error && <p className="input-error">{error}</p>}
    </div>
  );
});

export default Input;
