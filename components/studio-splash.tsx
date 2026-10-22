'use client'

import React, { useEffect, useRef, useState } from 'react'
import { soundEngine } from '@/lib/sound-engine'

interface StudioSplashProps {
  onComplete: () => void
}

export function StudioSplash({ onComplete }: StudioSplashProps) {
  const [phase, setPhase] = useState<'hold' | 'exit'>('hold')
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    soundEngine.playStudioIntro()

    const exitTimer = setTimeout(() => {
      setPhase('exit')
    }, 1800)

    const doneTimer = setTimeout(() => {
      onCompleteRef.current()
    }, 2400)

    return () => {
      clearTimeout(exitTimer)
      clearTimeout(doneTimer)
    }
  }, [])

  const handleDismissAndFullscreen = () => {
    try {
      if (typeof document !== 'undefined' && !document.fullscreenElement) {
        document.documentElement
          .requestFullscreen?.({ navigationUI: 'hide' })
          .catch(() => {})
      }
      if (
        typeof screen !== 'undefined' &&
        'orientation' in screen &&
        typeof (screen.orientation as unknown as { lock?: (o: string) => Promise<void> }).lock === 'function'
      ) {
        ;(screen.orientation as unknown as { lock: (o: string) => Promise<void> })
          .lock('portrait')
          .catch(() => {})
      }
    } catch {
      // Ignore fullscreen/orientation restriction if already in native immersive activity
    }
    onCompleteRef.current()
  }

  return (
    <div
      onClick={handleDismissAndFullscreen}
      onTouchStart={handleDismissAndFullscreen}
      role="presentation"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black select-none cursor-pointer overflow-hidden"
    >
      <div
        className={`transition-all duration-500 ease-out transform ${
          phase === 'hold'
            ? 'opacity-100 scale-100 tracking-[0.32em]'
            : 'opacity-0 scale-105 tracking-[0.38em]'
        }`}
      >
        <span
          className="font-display font-bold text-2xl sm:text-4xl md:text-5xl text-white uppercase whitespace-nowrap"
          style={{
            textShadow: '0 0 38px rgba(255, 255, 255, 0.25)',
          }}
        >
          THE UMAIR CODE®
        </span>
      </div>
    </div>
  )
}
