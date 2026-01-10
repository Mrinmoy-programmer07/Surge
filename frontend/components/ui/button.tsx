import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive cursor-pointer",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] active:scale-[0.98]',
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 hover:shadow-[0_0_20px_rgba(255,51,102,0.4)] focus-visible:ring-destructive/50 dark:bg-destructive/60 active:scale-[0.98]',
        outline:
          'border border-border bg-transparent hover:bg-primary/10 hover:border-primary/50 hover:text-primary hover:shadow-[0_0_15px_rgba(0,240,255,0.2)] active:scale-[0.98]',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-[0_0_20px_rgba(255,0,128,0.4)] active:scale-[0.98]',
        ghost:
          'hover:bg-primary/10 hover:text-primary active:scale-[0.98]',
        link:
          'text-primary underline-offset-4 hover:underline hover:text-primary/80',
        // New cyberpunk-specific variants
        'neon-cyan':
          'bg-primary/20 text-primary border border-primary/50 hover:bg-primary/30 hover:border-primary hover:shadow-[0_0_25px_rgba(0,240,255,0.5)] active:scale-[0.98]',
        'neon-pink':
          'bg-secondary/20 text-secondary border border-secondary/50 hover:bg-secondary/30 hover:border-secondary hover:shadow-[0_0_25px_rgba(255,0,128,0.5)] active:scale-[0.98]',
        'neon-green':
          'bg-accent/20 text-accent border border-accent/50 hover:bg-accent/30 hover:border-accent hover:shadow-[0_0_25px_rgba(57,255,20,0.5)] active:scale-[0.98]',
        'gradient':
          'bg-gradient-to-r from-primary to-secondary text-white border-0 hover:opacity-90 hover:shadow-[0_0_30px_rgba(0,240,255,0.3),0_0_30px_rgba(255,0,128,0.3)] active:scale-[0.98]',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        xl: 'h-12 rounded-lg px-8 text-base has-[>svg]:px-5',
        icon: 'size-9',
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

