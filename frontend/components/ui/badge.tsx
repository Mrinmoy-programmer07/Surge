import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-all duration-300 overflow-hidden',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90',
        destructive:
          'border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'text-foreground border-border [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
        // Difficulty level badges
        easy:
          'bg-accent/15 text-accent border border-accent/40 hover:bg-accent/25 hover:shadow-[0_0_10px_rgba(57,255,20,0.3)]',
        medium:
          'bg-primary/15 text-primary border border-primary/40 hover:bg-primary/25 hover:shadow-[0_0_10px_rgba(0,240,255,0.3)]',
        hard:
          'bg-secondary/15 text-secondary border border-secondary/40 hover:bg-secondary/25 hover:shadow-[0_0_10px_rgba(255,0,128,0.3)]',
        // Game category badges  
        'neon-cyan':
          'bg-primary/20 text-primary border border-primary/50 hover:shadow-[0_0_10px_rgba(0,240,255,0.4)]',
        'neon-pink':
          'bg-secondary/20 text-secondary border border-secondary/50 hover:shadow-[0_0_10px_rgba(255,0,128,0.4)]',
        'neon-green':
          'bg-accent/20 text-accent border border-accent/50 hover:shadow-[0_0_10px_rgba(57,255,20,0.4)]',
        'neon-orange':
          'bg-warning/20 text-warning border border-warning/50 hover:shadow-[0_0_10px_rgba(255,107,0,0.4)]',
        'neon-gold':
          'bg-gold/20 text-gold border border-gold/50 hover:shadow-[0_0_10px_rgba(255,215,0,0.4)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span'

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }

