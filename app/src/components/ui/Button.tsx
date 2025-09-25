import React from 'react'

type Variant = 'default' | 'secondary' | 'ghost' | 'destructive'
type Size = 'sm' | 'md' | 'lg'

const base = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ring-offset-neutral-950'

const variantClasses: Record<Variant, string> = {
  default: 'bg-indigo-600 text-white hover:bg-indigo-500',
  secondary: 'bg-neutral-800 text-neutral-100 hover:bg-neutral-700',
  ghost: 'bg-transparent hover:bg-white/5 text-neutral-200',
  destructive: 'bg-red-600 text-white hover:bg-red-500',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-4 text-sm',
  lg: 'h-11 px-6 text-base',
}

export function Button({ variant = 'default', size = 'md', className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  const cls = `${base} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`
  return <button className={cls} {...props} />
}


