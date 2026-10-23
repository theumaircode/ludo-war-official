'use client'

import React, { useEffect, useRef, useState } from 'react'
import { soundEngine } from '@/lib/sound-engine'

interface StudioSplashProps {
  onComplete: () => void
}

export function StudioSplash({ onComplete }: StudioSplashProps) {
  const [phase, setPhase] = useState<'hold' | 'glitch-exit'>('hold')
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    soundEngine.playStudioIntro()

    // Hold pure white "THE UMAIR CODE®" for ~4 seconds, then fade with elite Glitch animation (~5s total)
    const glitchTimer = setTimeout(() => {
      soundEngine.playStudioGlitchExit()
      setPhase('glitch-exit')
    }, 4000)

    const doneTimer = setTimeout(() => {
      onCompleteRef.current()
    }, 5000)

    return () => {
      clearTimeout(glitchTimer)
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
        typeof (
          screen.orientation as unknown as {
            lock?: (o: string) => Promise<void>
          }
        ).lock === 'function'
      ) {
        ;(
          screen.orientation as unknown as {
            lock: (o: string) => Promise<void>
          }
        )
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
      {/* Subtle Horizontal Scanline Flash During Glitch Fade */}
      {phase === 'glitch-exit' && (
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-center items-center opacity-75">
          <div className="w-full h-[1px] bg-cyan-400/75 animate-glitch-scanline" />
          <div className="w-2/3 h-[2px] bg-red-500/65 mt-3 animate-glitch-scanline-rev" />
        </div>
      )}

      <div
        className={`relative flex items-center justify-center px-6 ${
          phase === 'hold'
            ? 'opacity-100 scale-100 tracking-[0.32em] transition-all duration-500'
            : 'animate-studio-glitch-fadeout'
        }`}
      >
        {/* Chromatic Cyan Ghost Slice (Active during glitch-exit) */}
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 flex items-center justify-center font-display font-bold text-2xl sm:text-4xl md:text-5xl uppercase whitespace-nowrap tracking-[0.32em] text-cyan-400 select-none ${
            phase === 'glitch-exit'
              ? 'opacity-95 animate-glitch-slice-cyan'
              : 'opacity-0'
          }`}
        >
          THE UMAIR CODE®
        </span>

        {/* Chromatic Crimson Ghost Slice (Active during glitch-exit) */}
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 flex items-center justify-center font-display font-bold text-2xl sm:text-4xl md:text-5xl uppercase whitespace-nowrap tracking-[0.32em] text-red-500 select-none ${
            phase === 'glitch-exit'
              ? 'opacity-95 animate-glitch-slice-red'
              : 'opacity-0'
          }`}
        >
          THE UMAIR CODE®
        </span>

        {/* Primary Pure White Studio Brand Title */}
        <span
          className="relative z-10 font-display font-bold text-2xl sm:text-4xl md:text-5xl text-white uppercase whitespace-nowrap tracking-[0.32em]"
          style={{
            textShadow:
              phase === 'glitch-exit'
                ? '-3px 0 #00f0ff, 3px 0 #ff003c, 0 0 32px rgba(255,255,255,0.6)'
                : '0 0 38px rgba(255, 255, 255, 0.25)',
          }}
        >
          THE UMAIR CODE®
        </span>
      </div>
    </div>
  )
}
