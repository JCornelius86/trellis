import type { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet';
export type ButtonSize = 'md' | 'sm' | 'lg';

/** Class names for a button. Use this to style a link as a button. */
export function buttonClass(variant: ButtonVariant = 'secondary', size: ButtonSize = 'md', extra = ''): string {
  return `t-btn t-btn--${variant} t-btn--${size} ${extra}`.trim();
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  busy?: boolean;
}

export function Button({ variant = 'secondary', size = 'md', busy = false, className = '', type = 'button', children, ...rest }: ButtonProps) {
  return (
    <button type={type} className={buttonClass(variant, size, className)} aria-busy={busy || undefined} disabled={rest.disabled || busy} {...rest}>
      {children}
    </button>
  );
}
