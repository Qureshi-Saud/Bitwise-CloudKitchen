import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../../lib/utils';

const Hint = ({ error, hint }) =>
  error ? <p className="error-text">{error}</p>
  : hint ? <p className="mt-1.5 text-xs text-charcoal/50">{hint}</p>
  : null;

export const Input = forwardRef(function Input({ label, error, hint, icon: Icon, className, id, ...rest }, ref) {
  const inputId = id || rest.name;
  return (
    <div className={className}>
      {label && <label htmlFor={inputId} className="label">{label}</label>}
      <div className="relative">
        {Icon && (
          <Icon size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal/35" />
        )}
        <input
          id={inputId}
          ref={ref}
          aria-invalid={Boolean(error)}
          className={cn('input', Icon && 'pl-11', error && 'border-red-400 focus:border-red-500 focus:ring-red-100')}
          {...rest}
        />
      </div>
      <Hint error={error} hint={hint} />
    </div>
  );
});

export const PasswordInput = forwardRef(function PasswordInput({ label, error, hint, className, ...rest }, ref) {
  const [visible, setVisible] = useState(false);
  return (
    <div className={className}>
      {label && <label htmlFor={rest.name} className="label">{label}</label>}
      <div className="relative">
        <input
          id={rest.name}
          ref={ref}
          type={visible ? 'text' : 'password'}
          aria-invalid={Boolean(error)}
          className={cn('input pr-12', error && 'border-red-400 focus:border-red-500 focus:ring-red-100')}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-charcoal/40 transition hover:text-charcoal"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      <Hint error={error} hint={hint} />
    </div>
  );
});

export const Textarea = forwardRef(function Textarea({ label, error, hint, className, rows = 4, ...rest }, ref) {
  return (
    <div className={className}>
      {label && <label htmlFor={rest.name} className="label">{label}</label>}
      <textarea
        id={rest.name}
        ref={ref}
        rows={rows}
        aria-invalid={Boolean(error)}
        className={cn('input resize-none', error && 'border-red-400 focus:border-red-500 focus:ring-red-100')}
        {...rest}
      />
      <Hint error={error} hint={hint} />
    </div>
  );
});

export const Select = forwardRef(function Select({ label, error, hint, className, children, ...rest }, ref) {
  return (
    <div className={className}>
      {label && <label htmlFor={rest.name} className="label">{label}</label>}
      <select id={rest.name} ref={ref} className={cn('input bg-white', error && 'border-red-400')} {...rest}>
        {children}
      </select>
      <Hint error={error} hint={hint} />
    </div>
  );
});
