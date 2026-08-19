import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

import { cx } from '../../lib/classNames';

type ButtonVariant = 'primary' | 'secondary' | 'quiet';
type ButtonSize = 'md' | 'sm' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  iconPosition?: 'start' | 'end';
  size?: ButtonSize;
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-hoopnote-orange text-hoopnote-ink shadow-control hover:-translate-y-0.5 hover:bg-[#ff8b1f] active:translate-y-0',
  secondary:
    'border-2 border-hoopnote-ink bg-hoopnote-surface text-hoopnote-ink hover:-translate-y-0.5 hover:bg-hoopnote-ink hover:text-white active:translate-y-0',
  quiet: 'bg-transparent text-hoopnote-ink hover:bg-hoopnote-ink/8 active:bg-hoopnote-ink/12'
};

const sizeClasses: Record<ButtonSize, string> = {
  md: 'min-h-12 px-5 py-3 text-sm',
  sm: 'min-h-11 px-4 py-2 text-sm',
  icon: 'h-11 w-11 p-0'
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    children,
    className,
    icon,
    iconPosition = 'start',
    size = 'md',
    type = 'button',
    variant = 'primary',
    ...props
  },
  ref,
) {
  return (
    <button
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-control font-bold leading-none outline-none motion-safe:transition',
        'focus-visible:ring-4 focus-visible:ring-hoopnote-blue/30 disabled:pointer-events-none disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      ref={ref}
      type={type}
      {...props}
    >
      {icon && iconPosition === 'start' ? <span className="shrink-0">{icon}</span> : null}
      {children}
      {icon && iconPosition === 'end' ? <span className="shrink-0">{icon}</span> : null}
    </button>
  );
});

