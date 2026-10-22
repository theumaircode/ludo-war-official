'use client'

import React from 'react'
import { DICE_SKINS, DiceSkinId } from '@/lib/game-types'

interface RoyalCarvedDiceProps {
  value: number
  isRolling: boolean
  canRoll: boolean
  onRoll: () => void
  skinId: DiceSkinId
  activeFactionColor: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

const PIP_LAYOUTS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
}

export function RoyalCarvedDice({
  value,
  isRolling,
  canRoll,
  onRoll,
  skinId,
  activeFactionColor,
  size = 'md',
  showLabel = true,
}: RoyalCarvedDiceProps) {
  const skin = DICE_SKINS[skinId] || DICE_SKINS['ruby-diamond']
  const pips = PIP_LAYOUTS[value] || PIP_LAYOUTS[6]

  const dimensions =
    size === 'lg'
      ? 'w-20 h-20 sm:w-24 sm:h-24'
      : size === 'md'
        ? 'w-14 h-14 sm:w-16 sm:h-16'
        : size === 'sm'
          ? 'w-11 h-11 sm:w-12 sm:h-12'
          : 'w-9 h-9 sm:w-10 sm:h-10'

  const pipSize =
    size === 'lg'
      ? 'w-3 h-3 sm:w-3.5 sm:h-3.5'
      : size === 'md'
        ? 'w-2.5 h-2.5 sm:w-3 sm:h-3'
        : 'w-2 h-2 sm:w-2.5 sm:h-2.5'

  return (
    <div className="relative flex flex-col items-center select-none shrink-0">
      {/* Active turn pulsing halo beneath the Cosmic Dice */}
      {canRoll && (
        <div
          className="absolute -inset-2 rounded-2xl blur-md animate-pulse-aura pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${activeFactionColor}bb 0%, transparent 72%)`,
          }}
        />
      )}

      <button
        type="button"
        disabled={!canRoll || isRolling}
        onClick={onRoll}
        aria-label={`Roll Cosmic Dice, current value ${value}`}
        className={`relative ${dimensions} rounded-[26%] p-1 sm:p-1.5 transition-all duration-300 ${
          canRoll
            ? 'cursor-pointer hover:scale-108 active:scale-95 ring-2 ring-amber-300'
            : 'cursor-default opacity-95'
        } ${isRolling ? 'animate-spin' : ''}`}
        style={{
          background: skin.frameGradient,
          boxShadow: canRoll
            ? `0 8px 22px rgba(0,0,0,0.9), 0 0 18px ${activeFactionColor}99, inset 0 2px 3px rgba(255,255,255,0.65)`
            : '0 6px 14px rgba(0,0,0,0.85), inset 0 1px 2px rgba(255,255,255,0.35)',
        }}
      >
        {/* Planetary Rings / Meteor Cracks / Pulsar Motif Overlay */}
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full pointer-events-none opacity-90"
        >
          <rect
            x="4"
            y="4"
            width="92"
            height="92"
            rx="24"
            fill="none"
            stroke={skin.ringAccent}
            strokeWidth="1.6"
            strokeOpacity="0.65"
          />

          {skin.planetTheme === 'saturn' && (
            <ellipse
              cx="50"
              cy="50"
              rx="46"
              ry="16"
              transform="rotate(-24 50 50)"
              fill="none"
              stroke="#fef08a"
              strokeWidth="2.2"
              strokeDasharray="6 3"
              opacity="0.75"
            />
          )}

          {skin.planetTheme === 'meteor' && (
            <path
              d="M15,20 L38,42 L28,72 M85,24 L62,48 L78,82 M38,42 L62,48"
              stroke="#f97316"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              opacity="0.8"
            />
          )}

          {skin.planetTheme === 'black-hole' && (
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="#c084fc"
              strokeWidth="2"
              strokeDasharray="3 4"
            />
          )}

          <circle cx="14" cy="14" r="2.2" fill={skin.ringAccent} />
          <circle cx="86" cy="14" r="2.2" fill={skin.ringAccent} />
          <circle cx="14" cy="86" r="2.2" fill={skin.ringAccent} />
          <circle cx="86" cy="86" r="2.2" fill={skin.ringAccent} />
        </svg>

        {/* Recessed Planetary / Meteor Core with Starlight Pips */}
        <div
          className="relative w-full h-full rounded-full p-1.5 sm:p-2 grid grid-cols-3 grid-rows-3 gap-0.5 items-center justify-items-center border"
          style={{
            background: skin.coreBg,
            borderColor: `${skin.ringAccent}66`,
            boxShadow:
              'inset 0 4px 10px rgba(0,0,0,0.92), 0 1px 2px rgba(255,255,255,0.35)',
          }}
        >
          {Array.from({ length: 9 }).map((_, idx) => {
            const hasPip = pips.includes(idx)
            return (
              <div
                key={idx}
                className="w-full h-full flex items-center justify-center"
              >
                {hasPip && (
                  <div
                    className={`${pipSize} rounded-full relative flex items-center justify-center`}
                    style={{
                      background: `radial-gradient(circle at 35% 35%, #ffffff 0%, ${skin.pipColor} 55%, ${skin.ringAccent} 100%)`,
                      boxShadow: `0 0 7px ${skin.pipGlow}, inset 0 0 2px #ffffff`,
                      border: '1px solid rgba(255, 255, 255, 0.85)',
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>
      </button>

      {showLabel && canRoll && !isRolling && (
        <span className="mt-1 text-[8px] sm:text-[9px] font-display tracking-[0.14em] uppercase text-amber-300 font-bold animate-pulse whitespace-nowrap">
          TAP DICE
        </span>
      )}
    </div>
  )
}
