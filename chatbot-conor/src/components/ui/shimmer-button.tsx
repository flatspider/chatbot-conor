import * as React from 'react'

import { motion, useAnimationControls, type HTMLMotionProps } from 'motion/react'

import { cn } from '@/lib/utils'

interface ShimmerButtonProps extends HTMLMotionProps<'button'> {
  children: React.ReactNode
  shimmer?: boolean
}

function ShimmerButton({ children, className, shimmer, ...props }: ShimmerButtonProps) {
  const controls = useAnimationControls()

  React.useEffect(() => {
    if (shimmer) {
      controls.set({ '--shimmer-button-x': '-100%' })
      controls.start({
        '--shimmer-button-x': '200%',
        transition: {
          duration: 3,
          ease: [0.445, 0.05, 0.55, 0.95],
        },
      })
    }
  }, [shimmer, controls])

  return (
    <motion.button
      className='relative inline-flex overflow-hidden rounded-lg bg-[linear-gradient(120deg,var(--primary)_calc(var(--shimmer-button-x)-25%),var(--primary-foreground)_var(--shimmer-button-x),var(--primary)_calc(var(--shimmer-button-x)+25%))] [--shimmer-button-x:0%]'
      initial={{
        scale: 1,
        '--shimmer-button-x': '-100%'
      }}
      animate={controls}
      transition={{
        stiffness: 500,
        damping: 20,
        type: 'spring',
      }}
      whileTap={{
        scale: 0.95
      }}
      whileHover={{
        scale: 1.05
      }}
      {...props}
    >
      <span
        className={cn(
          'bg-destructive m-0.5 rounded-md px-4 py-2 text-sm font-medium text-white backdrop-blur-sm',
          className
        )}
      >
        {children}
      </span>
    </motion.button>
  )
}

export { ShimmerButton, type ShimmerButtonProps }
