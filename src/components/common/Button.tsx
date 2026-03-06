import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'accent';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'sm' | 'md';
}

const variantClass: Record<Variant, string> = {
  primary: 'bg-[#1e3a5f] text-white hover:bg-[#162d4a]',
  secondary: 'bg-white text-[#1e3a5f] border border-[#1e3a5f] hover:bg-[#f0f4f8]',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'text-[#1e3a5f] hover:bg-blue-50',
  accent: 'bg-[#f59e0b] text-[#0f172a] hover:bg-[#d97706]',
};

const sizeClass = { sm: 'px-2 py-1 text-sm', md: 'px-4 py-2' };

export function Button({ variant = 'primary', size = 'md', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variantClass[variant]} ${sizeClass[size]} ${className}`}
      {...props}
    />
  );
}
