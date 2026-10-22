'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Bot,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coins,
  Compass,
  Crown,
  Flame,
  Globe,
  Maximize2,
  MessageSquare,
  Palette,
  Play,
  RefreshCw,
  Shield,
  Sparkles,
  Swords,
  Users,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react'
import {
  BOARD_SKINS,
  BoardSkinId,
  CommentaryLanguage,
  CommentaryPopupData,
  DICE_SKINS,
  DiceSkinId,
  EliminationEvent,
  ENVIRONMENT_SKINS,
  EnvironmentSkinId,
  FACTIONS,
  FactionId,
  MatchMode,
  PIECE_SKINS,
  PieceInstance,
  PieceSculptType,
  PieceSkinId,
  PlayerCountOption,
  PlayerState,
  SCULPTED_PIECES,
} from '@/lib/game-types'
import {
  canPieceMove,
  createMatchPlayers,
  getGlobalOuterIndex,
  getGoalSteps,
  getPieceBoardCoord,
  SAFE_INDICES_4P,
  SAFE_INDICES_6P,
  selectBestAIMove,
} from '@/lib/ludo-engine'
import {
  generateMoveCommentary,
  generateNoMoveCommentary,
} from '@/lib/commentary-engine'
import { soundEngine } from '@/lib/sound-engine'
import { StudioSplash } from './studio-splash'
import { LiveForestEnvironment } from './live-forest-environment'
import { LudoEmpireBoard } from './ludo-empire-board'
import { RoyalCarvedDice } from './royal-carved-dice'
import { BlackHoleSingularity } from './black-hole-singularity'
import { DailySpinWheel } from './daily-spin-wheel'
import { ArmorySkinsModal } from './armory-skins-modal'
import { VictoryRingModal } from './victory-ring-modal'
import { PlayerSideStation } from './player-side-station'
import { SculptedChessPiece3D } from './sculpted-chess-piece-3d'

type LobbySlideId = 'war-deck' | 'relics' | 'cosmic-skins' | 'universe-ring'

const LOBBY_SLIDES: {
  id: LobbySlideId
  step: string
  label: string
  shortLabel: string
  icon: React.ComponentType<{ className?: string }>
}[] = [
  {
    id: 'war-deck',
    step: '01',
    label: 'WAR COMMAND',
    shortLabel: 'WAR HUB',
    icon: Swords,
  },
  {
    id: 'relics',
    step: '02',
    label: '3D CHAMPIONS',
    shortLabel: 'RELICS',
    icon: Crown,
  },
  {
    id: 'cosmic-skins',
    step: '03',
    label: 'COSMIC SKINS',
    shortLabel: 'SKINS',
    icon: Palette,
  },
  {
    id: 'universe-ring',
    step: '04',
    label: 'UNIVERSE RING',
    shortLabel: 'RING',
    icon: Sparkles,
  },
]

export function LudoEmpireApp() {
  // 1. Opening AAA Studio Splash Screen ("THE UMAIR CODE®" on full black)
  const [showSplash, setShowSplash] = useState(true)

  // 2. Navigation, Real-Time Interactive Lobby Slides & Modals
  const [screen, setScreen] = useState<'lobby' | 'match'>('lobby')
  const [activeSlide, setActiveSlide] = useState<LobbySlideId>('war-deck')
  const [showSpinWheel, setShowSpinWheel] = useState(false)
  const [showArmory, setShowArmory] = useState(false)

  // 3. Economy & Synchronized Space/Planet/Meteor Skins
  const [goldBalance, setGoldBalance] = useState(5000)
  const [unlockedSkins, setUnlockedSkins] = useState<string[]>([
    'obsidian',
    'eldergrove',
    'astral',
    'heirloom-gold',
    'dark-damascus',
    'solar-aurum',
    'ruby-diamond',
    'singularity-void',
    'molten-meteor',
    'eclipse-singularity',
    'bioluminescent-forest',
    'deep-space-nebula',
  ])
  const [boardSkin, setBoardSkin] = useState<BoardSkinId>('obsidian')
  const [pieceSkin, setPieceSkin] = useState<PieceSkinId>('heirloom-gold')
  const [diceSkin, setDiceSkin] = useState<DiceSkinId>('ruby-diamond')
  const [envSkin, setEnvSkin] = useState<EnvironmentSkinId>(
    'eclipse-singularity'
  )
  const [lastSpinTimestamp, setLastSpinTimestamp] = useState<number | null>(
    null
  )
  const [soundEnabled, setSoundEnabled] = useState(true)

  // 4. Real-Time Dramatic Commentary Language ('en' | 'hinglish')
  const [commentaryLang, setCommentaryLang] =
    useState<CommentaryLanguage>('en')
  const [commentaryPopup, setCommentaryPopup] =
    useState<CommentaryPopupData | null>(null)

  // 5. Lobby Configuration
  const [playerCount, setPlayerCount] = useState<PlayerCountOption>(4)
  const [matchMode, setMatchMode] = useState<MatchMode>('ai')
  const [inspectedSculpt, setInspectedSculpt] =
    useState<PieceSculptType>('crown')
  const [inspectedFaction, setInspectedFaction] =
    useState<FactionId>('crimson')
  const [lobbyPreviewMode, setLobbyPreviewMode] = useState<
    '3d-model' | 'render'
  >('3d-model')
  const [skinCategoryTab, setSkinCategoryTab] = useState<
    'piece' | 'dice' | 'board' | 'env'
  >('piece')

  // 6. Active Match State
  const [players, setPlayers] = useState<PlayerState[]>(() =>
    createMatchPlayers(4, 'ai')
  )
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const [diceValue, setDiceValue] = useState<number>(6)
  const [isRolling, setIsRolling] = useState(false)
  const [hasRolled, setHasRolled] = useState(false)
  const [tabletopFlipNorth, setTabletopFlipNorth] = useState(false)
  const [recentAbsorbedPiece, setRecentAbsorbedPiece] =
    useState<PieceInstance | null>(null)
  const [recentElimination, setRecentElimination] =
    useState<EliminationEvent | null>(null)
  const [winner, setWinner] = useState<PlayerState | null>(null)

  const aiTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
    const preventContextMenu = (e: MouseEvent) => e.preventDefault()
    window.addEventListener('contextmenu', preventContextMenu)
    return () => window.removeEventListener('contextmenu', preventContextMenu)
  }, [])

  const toggleSound = () => {
    const next = !soundEnabled
    setSoundEnabled(next)
    soundEngine.enabled = next
    if (next) soundEngine.playUiClick()
  }

  const toggleFullscreen = () => {
    soundEngine.playUiClick()
    if (typeof document !== 'undefined') {
      if (!document.fullscreenElement) {
        document.documentElement
          .requestFullscreen?.({ navigationUI: 'hide' })
          .catch(() => {})
      } else {
        document.exitFullscreen?.().catch(() => {})
      }
    }
  }

  const stepSlide = (dir: -1 | 1) => {
    soundEngine.playUiClick()
    const idx = LOBBY_SLIDES.findIndex((s) => s.id === activeSlide)
    const nextIdx = (idx + dir + LOBBY_SLIDES.length) % LOBBY_SLIDES.length
    setActiveSlide(LOBBY_SLIDES[nextIdx].id)
  }

  // Start a new match
  const startMatch = useCallback(
    (count: PlayerCountOption = playerCount, mode: MatchMode = matchMode) => {
      soundEngine.playPieceSpawn()
      const freshPlayers = createMatchPlayers(count, mode)
      setPlayers(freshPlayers)
      setCurrentPlayerIndex(0)
      setDiceValue(6)
      setIsRolling(false)
      setHasRolled(false)
      setWinner(null)
      setRecentAbsorbedPiece(null)
      setRecentElimination(null)

      const openingText =
        commentaryLang === 'hinglish'
          ? `LUDO WAR shuru ho chuka hai (${count} Players)! Apne side ka Planet Dice roll karo aur Universe Ruling Ring pe kabza karo!`
          : `LUDO WAR commenced (${count} Players)! Roll the Cosmic Dice on your side to conquer the Black Hole and claim the Universe Ruling Ring!`

      setCommentaryPopup({
        id: Date.now(),
        title:
          commentaryLang === 'hinglish'
            ? 'LUDO WAR® SHURU HO GAYA!'
            : 'LUDO WAR® COMMENCED!',
        text: openingText,
        accentHex: '#f59e0b',
        eventType: 'roll',
      })
      setScreen('match')
    },
    [playerCount, matchMode, commentaryLang]
  )

  const advanceToNextPlayer = useCallback((nextIdx: number) => {
    setCurrentPlayerIndex(nextIdx)
    setHasRolled(false)
    setIsRolling(false)
  }, [])

  // Execute a verified, deterministic piece movement
  const handleMovePiece = useCallback(
    (pieceToMove: PieceInstance, rolledVal: number) => {
      if (winner) return
      const goalStep = getGoalSteps(playerCount)
      const safeSet = playerCount === 6 ? SAFE_INDICES_6P : SAFE_INDICES_4P
      const requiredToWin = matchMode === 'quick-blitz' ? 2 : 4

      const isDeploying = pieceToMove.stepsMoved === -1
      const targetSteps = isDeploying ? 0 : pieceToMove.stepsMoved + rolledVal
      const reachedBlackHole = targetSteps === goalStep

      const targetGlobalIdx = getGlobalOuterIndex(
        pieceToMove.playerIndex,
        targetSteps,
        playerCount
      )

      const updatedPlayers: PlayerState[] = players.map((p) => ({
        ...p,
        pieces: p.pieces.map((pc) => ({ ...pc })),
      }))

      const mover = updatedPlayers[pieceToMove.playerIndex]
      const targetPiece = mover.pieces.find((pc) => pc.id === pieceToMove.id)!

      const capturedList: { player: PlayerState; piece: PieceInstance }[] = []

      if (targetGlobalIdx !== null && !safeSet.has(targetGlobalIdx)) {
        for (const otherPlayer of updatedPlayers) {
          if (otherPlayer.index === mover.index) continue
          for (const opPiece of otherPlayer.pieces) {
            if (opPiece.isFinished || opPiece.stepsMoved < 0) continue
            const opGlobalIdx = getGlobalOuterIndex(
              opPiece.playerIndex,
              opPiece.stepsMoved,
              playerCount
            )
            if (opGlobalIdx === targetGlobalIdx) {
              capturedList.push({
                player: otherPlayer,
                piece: { ...opPiece },
              })
              opPiece.stepsMoved = -1
              mover.capturesCount += 1
            }
          }
        }
      }

      targetPiece.stepsMoved = targetSteps
      if (reachedBlackHole) {
        targetPiece.isFinished = true
        targetPiece.justFinishedAt = Date.now()
        mover.finishedCount += 1
      }

      if (capturedList.length > 0) {
        soundEngine.playPieceEliminationHorror(pieceToMove.sculptType)

        const landCoord = getPieceBoardCoord(targetPiece, playerCount)
        setRecentElimination({
          id: Date.now(),
          x: landCoord.x,
          y: landCoord.y,
          killerFaction: pieceToMove.faction,
          killerSculpt: pieceToMove.sculptType,
          victimFaction: capturedList[0].piece.faction,
          victimSculpt: capturedList[0].piece.sculptType,
        })
        setTimeout(() => setRecentElimination(null), 1000)
      } else if (reachedBlackHole) {
        soundEngine.playBlackHoleAbsorb()
        setRecentAbsorbedPiece(pieceToMove)
        setTimeout(() => setRecentAbsorbedPiece(null), 1200)
      } else if (isDeploying) {
        soundEngine.playPieceSpawn()
      } else {
        soundEngine.playPieceStep()
      }

      setPlayers(updatedPlayers)

      const commentary = generateMoveCommentary({
        moverPlayer: mover,
        movedPiece: targetPiece,
        rolledValue: rolledVal,
        isDeploying,
        targetSteps,
        reachedBlackHole,
        capturedPieces: capturedList,
        allPlayersAfterMove: updatedPlayers,
        playerCount,
        requiredToWin,
        language: commentaryLang,
      })

      setCommentaryPopup(commentary)

      if (mover.finishedCount >= requiredToWin) {
        setTimeout(() => {
          soundEngine.playVictoryFanfare()
          setWinner(mover)
          setGoldBalance((g) => g + 500)
        }, 950)
      }

      const bonusTurn =
        rolledVal === 6 || reachedBlackHole || capturedList.length > 0
      const nextIndex = bonusTurn
        ? pieceToMove.playerIndex
        : (pieceToMove.playerIndex + 1) % updatedPlayers.length

      setTimeout(() => {
        advanceToNextPlayer(nextIndex)
      }, 450)
    },
    [
      winner,
      playerCount,
      matchMode,
      players,
      commentaryLang,
      advanceToNextPlayer,
    ]
  )

  // Roll the Cosmic Dice from the active player's side station
  const handleRollDice = useCallback(() => {
    if (isRolling || hasRolled || winner) return
    soundEngine.playDiceRoll()
    setIsRolling(true)

    setTimeout(() => {
      const currentP = players[currentPlayerIndex]
      const allInBase = currentP?.pieces.every(
        (p) => p.stepsMoved === -1 || p.isFinished
      )
      const roll =
        allInBase && Math.random() < 0.42
          ? 6
          : Math.floor(Math.random() * 6) + 1

      if (roll === 6) {
        soundEngine.playDiceSix()
      }
      setDiceValue(roll)
      setIsRolling(false)
      setHasRolled(true)

      const movablePieces = currentP.pieces.filter((p) =>
        canPieceMove(p, roll, playerCount)
      )

      if (movablePieces.length === 0) {
        const noMoveComm = generateNoMoveCommentary({
          player: currentP,
          rolledValue: roll,
          language: commentaryLang,
        })
        setCommentaryPopup(noMoveComm)
        setTimeout(() => {
          advanceToNextPlayer((currentPlayerIndex + 1) % players.length)
        }, 900)
      } else if (currentP.isAI) {
        const bestPiece = selectBestAIMove(
          currentP,
          players,
          roll,
          playerCount
        )
        if (bestPiece) {
          setTimeout(() => {
            handleMovePiece(bestPiece, roll)
          }, 620)
        }
      } else if (movablePieces.length === 1) {
        setTimeout(() => {
          handleMovePiece(movablePieces[0], roll)
        }, 420)
      } else {
        const factionColor = FACTIONS[currentP.faction].colorName
        const promptTitle =
          commentaryLang === 'hinglish'
            ? `${factionColor.toUpperCase()} ROLLED ${roll} — CHUNO APNA PIECE!`
            : `${factionColor.toUpperCase()} ROLLED ${roll} — SELECT PIECE!`
        const promptText =
          commentaryLang === 'hinglish'
            ? `${factionColor} ne ${roll} roll kiya! Apne chamakte hue 3D piece (Crown, Horse, Alien ya Human) pe tap karke chaal chalo!`
            : `${factionColor} rolled a ${roll}! Tap any glowing 3D piece on the board or in your side station to advance toward the Universe Ring.`
        setCommentaryPopup({
          id: Date.now(),
          title: promptTitle,
          text: promptText,
          accentHex: FACTIONS[currentP.faction].primaryHex,
          eventType: 'roll',
        })
      }
    }, 520)
  }, [
    isRolling,
    hasRolled,
    winner,
    players,
    currentPlayerIndex,
    playerCount,
    commentaryLang,
    advanceToNextPlayer,
    handleMovePiece,
  ])

  // Trigger AI turn automatically
  useEffect(() => {
    if (screen !== 'match' || winner || showSplash) return
    const currentP = players[currentPlayerIndex]
    if (currentP && currentP.isAI && !hasRolled && !isRolling) {
      aiTimeoutRef.current = setTimeout(() => {
        handleRollDice()
      }, 720)
    }
    return () => {
      if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current)
    }
  }, [
    screen,
    winner,
    showSplash,
    players,
    currentPlayerIndex,
    hasRolled,
    isRolling,
    handleRollDice,
  ])

  const handleSelectOrUnlockSkin = (
    category: 'board' | 'piece' | 'dice' | 'env',
    skinId: string,
    cost: number
  ) => {
    soundEngine.playUiClick()
    const alreadyUnlocked = cost === 0 || unlockedSkins.includes(skinId)
    if (!alreadyUnlocked) {
      if (goldBalance < cost) return
      setGoldBalance((prev) => prev - cost)
      setUnlockedSkins((prev) => [...prev, skinId])
    }

    if (category === 'board') setBoardSkin(skinId as BoardSkinId)
    if (category === 'piece') setPieceSkin(skinId as PieceSkinId)
    if (category === 'dice') setDiceSkin(skinId as DiceSkinId)
    if (category === 'env') setEnvSkin(skinId as EnvironmentSkinId)
  }

  const inspectedSculptMeta =
    SCULPTED_PIECES.find((s) => s.id === inspectedSculpt) || SCULPTED_PIECES[0]

  const isSpinReady =
    !lastSpinTimestamp || Date.now() - lastSpinTimestamp >= 24 * 60 * 60 * 1000

  const requiredToWin = matchMode === 'quick-blitz' ? 2 : 4
  const currentSlideMeta =
    LOBBY_SLIDES.find((s) => s.id === activeSlide) || LOBBY_SLIDES[0]

  const renderPlayerStation = (
    pIdx: number,
    compassSide: 'NW' | 'N' | 'NE' | 'SW' | 'S' | 'SE',
    isNorthSide: boolean
  ) => {
    const p = players[pIdx]
    if (!p) return null
    const isTurn = currentPlayerIndex === p.index
    return (
      <PlayerSideStation
        key={`station-${p.index}-${compassSide}`}
        player={p}
        compassSide={compassSide}
        isCurrentTurn={isTurn}
        diceValue={diceValue}
        isRolling={isTurn && isRolling}
        hasRolled={isTurn && hasRolled}
        canRoll={isTurn && !p.isAI && !hasRolled && !winner}
        onRollDice={handleRollDice}
        onMovePiece={(pc) => handleMovePiece(pc, diceValue)}
        diceSkinId={diceSkin}
        pieceSkinId={pieceSkin}
        playerCount={playerCount}
        requiredToWin={requiredToWin}
        rotateForTabletop={isNorthSide && tabletopFlipNorth}
        compact={playerCount === 6}
      />
    )
  }

  return (
    <main className="relative min-h-[100dvh] w-full overflow-x-hidden flex flex-col justify-between select-none">
      {/* 1. OPENING FULL-BLACK STUDIO SPLASH: "THE UMAIR CODE®" */}
      {showSplash && <StudioSplash onComplete={() => setShowSplash(false)} />}

      {/* 2. LIVE MOVING COSMIC SPACE, PLANET, METEOR & FOREST ENVIRONMENT */}
      <LiveForestEnvironment
        skinId={envSkin}
        intensity={screen === 'match' ? 'match' : 'menu'}
      />

      {/* 3. TOP TACTICAL COMMAND HUD BAR — Fits 100% Within Every Mobile & Tablet Width */}
      <header className="relative z-20 w-full px-2 sm:px-6 py-1.5 sm:py-2 bg-gradient-to-b from-black/95 via-black/85 to-transparent border-b border-amber-500/25 shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-1.5">
          {/* Left: Official Game App Icon & Complete LUDO WAR® Brand Title */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl overflow-hidden border-2 border-amber-400 bg-black shadow-[0_0_14px_rgba(245,158,11,0.5)] shrink-0">
              <img
                src="/images/game-icon.jpg"
                alt="LUDO WAR® Icon"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-black text-sm sm:text-xl md:text-2xl tracking-[0.08em] sm:tracking-[0.12em] text-amber-100 whitespace-nowrap drop-shadow-[0_2px_10px_rgba(245,158,11,0.45)] leading-tight">
                  LUDO WAR®
                </h1>
                <span className="hidden md:inline-block px-2 py-0.5 text-[9px] font-display font-bold tracking-widest uppercase rounded bg-amber-500/20 border border-amber-400/40 text-amber-300 whitespace-nowrap">
                  UNIVERSE RING EDITION
                </span>
              </div>
              <div className="text-[8px] sm:text-[10px] font-display font-bold tracking-widest uppercase text-amber-400/90 whitespace-nowrap leading-none">
                THE UMAIR CODE
              </div>
            </div>
          </div>

          {/* Right Controls: Sized so every button fits cleanly inside 360px-390px mobile */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Live Commentary Language Toggle (ENG / HIN) */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playUiClick()
                setCommentaryLang((prev) =>
                  prev === 'en' ? 'hinglish' : 'en'
                )
              }}
              title="Switch Real-Time Commentary Language: English or Hinglish"
              className="px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-purple-950/85 border border-purple-400/50 text-purple-200 font-display font-bold text-[9px] sm:text-xs uppercase tracking-wider flex items-center gap-1 cursor-pointer hover:border-amber-300 transition-all"
            >
              <MessageSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300 shrink-0" />
              <span className="whitespace-nowrap">
                {commentaryLang === 'en' ? 'ENG' : 'HIN'}
              </span>
            </button>

            {/* Gold Balance */}
            <div
              className={`${
                screen === 'match' ? 'hidden sm:flex' : 'flex'
              } items-center gap-1 px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-black/85 border border-amber-500/35`}
            >
              <Coins className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 shrink-0" />
              <span className="font-mono font-bold text-[10px] sm:text-xs text-amber-200 whitespace-nowrap">
                {goldBalance.toLocaleString()}
              </span>
            </div>

            {/* Tabletop 180° Flip North Stations Button (When in Match) */}
            {screen === 'match' ? (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playUiClick()
                  setTabletopFlipNorth((prev) => !prev)
                }}
                title="Rotate North-side player dice stations 180°"
                className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl border text-[10px] font-display font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all ${
                  tabletopFlipNorth
                    ? 'bg-amber-500 text-black border-amber-200'
                    : 'bg-black/75 border-amber-500/35 text-amber-200 hover:border-amber-400'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">180° FLIP</span>
              </button>
            ) : (
              /* Strict 24-Hour Spin Wheel Button in Lobby */
              <button
                type="button"
                onClick={() => {
                  soundEngine.playUiClick()
                  setShowSpinWheel(true)
                }}
                aria-label="Open 24-Hour Spin Wheel"
                className="imperial-button relative p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl flex items-center gap-1 text-xs font-display font-bold tracking-wider uppercase text-amber-200 cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                <span className="hidden lg:inline">WHEEL</span>
                {isSpinReady && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                )}
              </button>
            )}

            {/* Armory / Skins Modal Button */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playUiClick()
                setShowArmory(true)
              }}
              aria-label="Open Cosmic Skins Vault"
              className="imperial-button p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl flex items-center gap-1 text-xs font-display font-bold tracking-wider uppercase text-amber-200 cursor-pointer"
            >
              <Palette className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />
              <span className="hidden lg:inline">SKINS</span>
            </button>

            {/* Audio Toggle */}
            <button
              type="button"
              onClick={toggleSound}
              aria-label="Toggle Sound Effects"
              className="p-1.5 rounded-lg sm:rounded-xl bg-black/75 border border-amber-500/30 text-amber-200 hover:border-amber-400 cursor-pointer"
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
              )}
            </button>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label="Toggle Fullscreen"
              className="hidden sm:flex p-2 rounded-xl bg-black/75 border border-amber-500/30 text-amber-200 hover:border-amber-400 cursor-pointer"
            >
              <Maximize2 className="w-4 h-4 text-amber-300" />
            </button>

            {screen === 'match' && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playUiClick()
                  setScreen('lobby')
                }}
                className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl bg-red-950/90 border border-red-500/60 text-red-200 font-display font-bold text-[9px] sm:text-xs uppercase tracking-wider hover:bg-red-900/80 cursor-pointer whitespace-nowrap"
              >
                HUB
              </button>
            )}
          </div>
        </div>
      </header>

      {/* =================================================================== */}
      {/* SCREEN A: AAA INTERACTIVE MULTI-SLIDE COMMAND HUB                   */}
      {/* Fits 100% inside mobile & tablet viewport with ZERO scrolling       */}
      {/* =================================================================== */}
      {screen === 'lobby' && (
        <section className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-2 sm:px-6 py-1.5 sm:py-3 flex flex-col justify-between gap-1.5 sm:gap-3">
          {/* TOP SLIDE NAVIGATION BAR — Fits 100% cleanly within 390px */}
          <div className="flex items-center justify-between gap-2 bg-black/80 border border-amber-500/30 rounded-xl px-2.5 py-1.5">
            <button
              type="button"
              onClick={() => stepSlide(-1)}
              className="px-2 sm:px-3 py-1 rounded-lg bg-amber-500/15 border border-amber-400/40 text-amber-200 font-display font-bold text-[10px] sm:text-xs uppercase tracking-wider flex items-center gap-1 hover:bg-amber-500/30 cursor-pointer whitespace-nowrap"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              PREV
            </button>

            <div className="flex flex-col items-center">
              <span className="font-display font-bold text-[10px] sm:text-xs uppercase tracking-[0.16em] text-amber-200 whitespace-nowrap">
                SPACE {currentSlideMeta.step}/04 • {currentSlideMeta.label}
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                {LOBBY_SLIDES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    aria-label={`Go to ${s.label}`}
                    onClick={() => {
                      soundEngine.playUiClick()
                      setActiveSlide(s.id)
                    }}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      activeSlide === s.id
                        ? 'w-6 bg-amber-400 shadow-[0_0_8px_#f59e0b]'
                        : 'w-2 bg-white/25'
                    }`}
                  />
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => stepSlide(1)}
              className="px-2 sm:px-3 py-1 rounded-lg bg-amber-500/15 border border-amber-400/40 text-amber-200 font-display font-bold text-[10px] sm:text-xs uppercase tracking-wider flex items-center gap-1 hover:bg-amber-500/30 cursor-pointer whitespace-nowrap"
            >
              NEXT
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* =============================================================== */}
          {/* SLIDE 01: WAR COMMAND (MAIN BATTLE DECK & INSTANT MATCH START)   */}
          {/* =============================================================== */}
          {activeSlide === 'war-deck' && (
            <div className="imperial-panel rounded-2xl p-2.5 sm:p-5 border border-amber-500/40 grid grid-cols-1 lg:grid-cols-12 gap-2.5 sm:gap-5 items-center flex-1">
              {/* Left 6 Cols: Centerpiece Ancient Greek Universe Ring & Active 3D Champion */}
              <div className="lg:col-span-6 flex flex-col items-center justify-between p-2.5 sm:p-4 rounded-xl bg-gradient-to-b from-slate-950/90 via-[#090d1a] to-black border border-amber-400/35">
                <div className="w-full flex items-center justify-between mb-1">
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-[9px] sm:text-[10px] font-display font-bold uppercase tracking-widest text-amber-300">
                    BLACK HOLE & UNIVERSE RING
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playUiClick()
                      setActiveSlide('relics')
                    }}
                    className="text-[9px] sm:text-[10px] font-display font-bold uppercase tracking-wider text-purple-300 hover:text-amber-200 flex items-center gap-0.5 cursor-pointer"
                  >
                    3D RELICS <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Live Interactive Showcase: Ancient Greek Universe Ring + Active 3D Piece + Planet Dice */}
                <div className="flex items-center justify-center gap-4 sm:gap-6 my-1">
                  <div className="w-24 h-24 sm:w-36 sm:h-36 relative shrink-0">
                    <BlackHoleSingularity
                      absorbedPieces={[]}
                      size="showcase"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-16 h-20 sm:w-24 sm:h-30 flex items-center justify-center animate-float-slow">
                      <SculptedChessPiece3D
                        sculptType={inspectedSculpt}
                        faction={inspectedFaction}
                        skinId={pieceSkin}
                        isGlowing
                      />
                    </div>
                    <RoyalCarvedDice
                      value={6}
                      isRolling={false}
                      canRoll={false}
                      onRoll={() => {}}
                      skinId={diceSkin}
                      activeFactionColor={
                        FACTIONS[inspectedFaction].primaryHex
                      }
                      size="xs"
                      showLabel={false}
                    />
                  </div>
                </div>

                {/* Quick 4-Piece Switcher Pills */}
                <div className="grid grid-cols-4 gap-1.5 w-full mt-1.5 pt-1.5 border-t border-white/10">
                  {SCULPTED_PIECES.map((sculpt) => {
                    const isSel = inspectedSculpt === sculpt.id
                    return (
                      <button
                        key={sculpt.id}
                        type="button"
                        onClick={() => {
                          soundEngine.playUiClick()
                          setInspectedSculpt(sculpt.id)
                        }}
                        className={`py-1 px-1 rounded-lg border text-[9px] sm:text-[10px] font-display font-bold uppercase tracking-wider cursor-pointer transition-all ${
                          isSel
                            ? 'bg-amber-500/25 border-amber-400 text-amber-200'
                            : 'bg-black/60 border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        {sculpt.shortLabel}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Right 6 Cols: Battle Mode Configuration & Instant Match Launch */}
              <div className="lg:col-span-6 flex flex-col justify-between gap-2 sm:gap-3">
                {/* 1. Player Count Selector */}
                <div>
                  <label className="block text-[10px] sm:text-[11px] font-display font-bold uppercase tracking-[0.16em] text-amber-300 mb-1">
                    1. SELECT PLAYERS (2, 4, OR 6 COMMANDERS)
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    {([2, 4, 6] as PlayerCountOption[]).map((count) => {
                      const active = playerCount === count
                      return (
                        <button
                          key={count}
                          type="button"
                          onClick={() => {
                            soundEngine.playUiClick()
                            setPlayerCount(count)
                          }}
                          className={`py-1.5 sm:py-2.5 px-2 rounded-xl border-2 font-display transition-all flex flex-col items-center cursor-pointer ${
                            active
                              ? 'bg-amber-500/20 border-amber-400 text-white shadow-[0_0_14px_rgba(245,158,11,0.3)]'
                              : 'bg-black/60 border-white/15 text-slate-400 hover:text-amber-100'
                          }`}
                        >
                          <span className="text-xs sm:text-base font-black tracking-wider whitespace-nowrap">
                            {count} PLAYERS
                          </span>
                          <span className="text-[8.5px] sm:text-[9px] uppercase tracking-wider text-amber-300/90 whitespace-nowrap">
                            {count === 2
                              ? '1v1 Duel'
                              : count === 4
                                ? '4-Corner War'
                                : '6-Hex Altar'}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 2. Gameplay Mode Selector */}
                <div>
                  <label className="block text-[10px] sm:text-[11px] font-display font-bold uppercase tracking-[0.16em] text-amber-300 mb-1">
                    2. SELECT BATTLE MODE
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                    {[
                      {
                        id: 'ai',
                        title: 'VS COMPUTER AI',
                        sub: 'Tactical AI Bots',
                        icon: Bot,
                      },
                      {
                        id: 'pass-and-play',
                        title: 'PASS & PLAY',
                        sub: 'Friends Side-Dice',
                        icon: Users,
                      },
                      {
                        id: 'quick-blitz',
                        title: 'BLITZ WAR',
                        sub: 'Crown Out • 2 to Win',
                        icon: Zap,
                      },
                      {
                        id: 'online-arena',
                        title: 'COSMIC ARENA',
                        sub: 'Championship Mode',
                        icon: Compass,
                      },
                    ].map((m) => {
                      const Icon = m.icon
                      const active = matchMode === m.id
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            soundEngine.playUiClick()
                            setMatchMode(m.id as MatchMode)
                          }}
                          className={`p-1.5 sm:p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 cursor-pointer ${
                            active
                              ? 'bg-purple-950/50 border-amber-400 text-white shadow-[0_0_14px_rgba(168,85,247,0.3)]'
                              : 'bg-black/60 border-white/15 text-slate-300 hover:border-amber-500/40'
                          }`}
                        >
                          <Icon className="w-4 h-4 text-amber-400 shrink-0" />
                          <div className="min-w-0">
                            <div className="font-display font-bold text-[10px] sm:text-xs tracking-wider whitespace-nowrap">
                              {m.title}
                            </div>
                            <div className="text-[9px] sm:text-[10px] text-slate-400 whitespace-nowrap">
                              {m.sub}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 3. Live Commentary Language Selector (English vs Hinglish) */}
                <div>
                  <label className="block text-[10px] sm:text-[11px] font-display font-bold uppercase tracking-[0.16em] text-amber-300 mb-1">
                    3. LIVE POP-UP COMMENTARY LANGUAGE
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playUiClick()
                        setCommentaryLang('en')
                      }}
                      className={`py-1.5 sm:py-2 px-2 rounded-xl border font-display font-bold text-[10px] sm:text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        commentaryLang === 'en'
                          ? 'bg-amber-500/25 border-amber-400 text-white'
                          : 'bg-black/60 border-white/15 text-slate-400'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      ENGLISH (DRAMATIC)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playUiClick()
                        setCommentaryLang('hinglish')
                      }}
                      className={`py-1.5 sm:py-2 px-2 rounded-xl border font-display font-bold text-[10px] sm:text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        commentaryLang === 'hinglish'
                          ? 'bg-amber-500/25 border-amber-400 text-white'
                          : 'bg-black/60 border-white/15 text-slate-400'
                      }`}
                    >
                      <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      HINGLISH (DOSTANA)
                    </button>
                  </div>
                </div>

                {/* Primary Launch Button — Always visible above the fold! */}
                <button
                  type="button"
                  onClick={() => startMatch(playerCount, matchMode)}
                  className="w-full py-3 sm:py-4 rounded-xl font-display font-black text-sm sm:text-lg tracking-[0.16em] uppercase text-black flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99]"
                  style={{
                    background:
                      'linear-gradient(135deg, #fef08a 0%, #f59e0b 50%, #d97706 100%)',
                    boxShadow:
                      '0 8px 30px rgba(245, 158, 11, 0.5), inset 0 2px 2px rgba(255, 255, 255, 0.85)',
                  }}
                >
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-black" />
                  START LUDO WAR ({playerCount}P)
                </button>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* SLIDE 02: 3D CHAMPIONS & CREEPY ELIMINATION SOUND CHAMBER        */}
          {/* =============================================================== */}
          {activeSlide === 'relics' && (
            <div className="imperial-panel rounded-2xl p-3 sm:p-6 border border-amber-500/40 grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-5 items-center flex-1">
              <div className="lg:col-span-6 flex flex-col justify-between rounded-xl border-2 border-amber-400/50 bg-gradient-to-b from-slate-950 via-[#080c18] to-black p-3 sm:p-4 relative overflow-hidden">
                <div className="flex items-center justify-between gap-2 z-10">
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/50 text-[9px] sm:text-[10px] font-display font-bold tracking-widest text-amber-300 uppercase">
                    RELIC #{inspectedSculptMeta.index + 1} •{' '}
                    {inspectedSculptMeta.shortLabel}
                  </span>
                  <div className="flex rounded-lg bg-black/80 border border-white/15 p-0.5">
                    <button
                      type="button"
                      onClick={() => setLobbyPreviewMode('3d-model')}
                      className={`px-2 py-0.5 rounded text-[9px] font-display font-bold uppercase cursor-pointer ${
                        lobbyPreviewMode === '3d-model'
                          ? 'bg-amber-400 text-black'
                          : 'text-slate-400'
                      }`}
                    >
                      3D MODEL
                    </button>
                    <button
                      type="button"
                      onClick={() => setLobbyPreviewMode('render')}
                      className={`px-2 py-0.5 rounded text-[9px] font-display font-bold uppercase cursor-pointer ${
                        lobbyPreviewMode === 'render'
                          ? 'bg-amber-400 text-black'
                          : 'text-slate-400'
                      }`}
                    >
                      ART RENDER
                    </button>
                  </div>
                </div>

                <div className="relative h-36 sm:h-52 flex items-center justify-center my-1.5">
                  {lobbyPreviewMode === '3d-model' ? (
                    <div className="w-28 h-36 sm:w-40 sm:h-48 flex items-center justify-center animate-float-slow">
                      <SculptedChessPiece3D
                        sculptType={inspectedSculptMeta.id}
                        faction={inspectedFaction}
                        skinId={pieceSkin}
                        isGlowing
                      />
                    </div>
                  ) : (
                    <div className="relative h-full aspect-[16/10] rounded-xl overflow-hidden border border-amber-400/45 shadow-[0_0_25px_rgba(0,0,0,0.75)] bg-black">
                      <img
                        key={inspectedSculptMeta.id}
                        src={inspectedSculptMeta.image}
                        alt={inspectedSculptMeta.name}
                        className="w-full h-full object-cover scale-[1.22] origin-[38%_46%] select-none pointer-events-none"
                        style={{ filter: PIECE_SKINS[pieceSkin].imageFilter }}
                      />
                    </div>
                  )}
                </div>

                <div className="z-10 bg-black/80 border border-amber-500/25 rounded-xl p-2.5 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm sm:text-lg font-display font-bold text-white">
                        {FACTIONS[inspectedFaction].colorName}{' '}
                        {inspectedSculptMeta.name}
                      </h3>
                      <span className="text-[10px] text-amber-300 font-display uppercase tracking-wider">
                        {inspectedSculptMeta.horrorSoundTitle}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        soundEngine.playPieceEliminationHorror(
                          inspectedSculptMeta.id
                        )
                      }
                      className="px-2.5 py-1.5 rounded-lg bg-red-950/90 border border-red-500/60 text-red-200 font-display font-bold text-[10px] uppercase tracking-wider hover:bg-red-900 cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-red-400" />
                      KILL SOUND
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    {inspectedSculptMeta.description}
                  </p>
                </div>
              </div>

              <div className="lg:col-span-6 flex flex-col justify-between gap-3">
                <div className="grid grid-cols-4 gap-2">
                  {SCULPTED_PIECES.map((sculpt) => {
                    const isSelected = inspectedSculpt === sculpt.id
                    return (
                      <button
                        key={sculpt.id}
                        type="button"
                        onClick={() => {
                          soundEngine.playPieceEliminationHorror(sculpt.id)
                          setInspectedSculpt(sculpt.id)
                        }}
                        className={`rounded-xl border-2 p-2 transition-all cursor-pointer flex flex-col items-center ${
                          isSelected
                            ? 'border-amber-400 bg-amber-950/40 scale-[1.02] shadow-[0_0_16px_rgba(245,158,11,0.35)]'
                            : 'border-white/15 bg-black/60 hover:border-amber-400/50'
                        }`}
                      >
                        <div className="w-11 h-14 sm:w-14 sm:h-18 flex items-center justify-center mb-1">
                          <SculptedChessPiece3D
                            sculptType={sculpt.id}
                            faction={inspectedFaction}
                            skinId={pieceSkin}
                            isGlowing={isSelected}
                          />
                        </div>
                        <span className="text-[10px] sm:text-xs font-display font-bold tracking-wider text-amber-100 uppercase">
                          {sculpt.shortLabel}
                        </span>
                      </button>
                    )
                  })}
                </div>

                <div>
                  <span className="block text-[10px] font-display font-bold uppercase tracking-widest text-amber-300 mb-1.5">
                    PREVIEW FACTION COLOR
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(
                      ['crimson', 'emerald', 'sapphire', 'gold'] as FactionId[]
                    ).map((fId) => {
                      const f = FACTIONS[fId]
                      const active = inspectedFaction === fId
                      return (
                        <button
                          key={fId}
                          type="button"
                          onClick={() => {
                            soundEngine.playUiClick()
                            setInspectedFaction(fId)
                          }}
                          className={`py-1.5 px-2 rounded-lg border font-display font-bold text-[10px] sm:text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer ${
                            active
                              ? 'border-white bg-white/15 text-white'
                              : 'border-white/15 bg-black/60 text-slate-300'
                          }`}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: f.primaryHex }}
                          />
                          {f.colorName}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveSlide('cosmic-skins')}
                    className="imperial-button flex-1 py-2.5 sm:py-3 rounded-xl font-display font-bold text-xs tracking-widest uppercase text-amber-200 cursor-pointer"
                  >
                    NEXT: SKINS
                  </button>
                  <button
                    type="button"
                    onClick={() => startMatch(playerCount, matchMode)}
                    className="flex-1 py-2.5 sm:py-3 rounded-xl font-display font-black text-xs tracking-widest uppercase text-black bg-amber-400 hover:bg-amber-300 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Play className="w-4 h-4 fill-black" />
                    START WAR
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* SLIDE 03: COSMIC SKINS VAULT (PIECES, PLANET DICE, BOARDS, ENV)  */}
          {/* =============================================================== */}
          {activeSlide === 'cosmic-skins' && (
            <div className="imperial-panel rounded-2xl p-3 sm:p-5 border border-amber-500/40 flex flex-col justify-between gap-3 flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-500/20 pb-2">
                <h2 className="text-sm sm:text-xl font-display font-black text-white">
                  SPACE, PLANET & METEOR SKINS
                </h2>

                <div className="grid grid-cols-4 gap-1">
                  {[
                    { id: 'piece', label: 'PIECES' },
                    { id: 'dice', label: 'DICE' },
                    { id: 'board', label: 'BOARDS' },
                    { id: 'env', label: 'SPACE' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        soundEngine.playUiClick()
                        setSkinCategoryTab(t.id as typeof skinCategoryTab)
                      }}
                      className={`px-2 py-1 rounded-lg font-display font-bold text-[10px] sm:text-xs uppercase tracking-wider cursor-pointer border ${
                        skinCategoryTab === t.id
                          ? 'bg-amber-400 text-black border-amber-200'
                          : 'bg-black/60 text-slate-300 border-white/15'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[52dvh] overflow-y-auto pr-1">
                {skinCategoryTab === 'piece' &&
                  Object.values(PIECE_SKINS).map((skin) => {
                    const isUnlocked =
                      skin.costGold === 0 || unlockedSkins.includes(skin.id)
                    const isEquipped = pieceSkin === skin.id
                    return (
                      <div
                        key={skin.id}
                        className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                          isEquipped
                            ? 'bg-amber-950/35 border-amber-400'
                            : 'bg-black/65 border-white/15'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <h4 className="font-display font-bold text-xs sm:text-sm text-amber-100">
                              {skin.name}
                            </h4>
                            {isEquipped && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-400 text-black text-[8px] font-bold uppercase">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-300 mt-0.5 mb-2">
                            {skin.subtitle}
                          </p>
                          <div className="grid grid-cols-4 gap-1 mb-2 bg-black/60 p-1.5 rounded-lg border border-white/10">
                            {SCULPTED_PIECES.map((sc) => (
                              <div
                                key={sc.id}
                                className="h-10 flex items-center justify-center"
                              >
                                <SculptedChessPiece3D
                                  sculptType={sc.id}
                                  faction="crimson"
                                  skinId={skin.id}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleSelectOrUnlockSkin(
                              'piece',
                              skin.id,
                              skin.costGold
                            )
                          }
                          className={`w-full py-1.5 rounded-lg font-display font-bold text-[10px] uppercase tracking-wider cursor-pointer ${
                            isEquipped
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                              : 'imperial-button text-amber-200'
                          }`}
                        >
                          {isEquipped
                            ? 'EQUIPPED IN GAME'
                            : isUnlocked
                              ? 'EQUIP SKIN'
                              : `UNLOCK (${skin.costGold} GOLD)`}
                        </button>
                      </div>
                    )
                  })}

                {skinCategoryTab === 'dice' &&
                  Object.values(DICE_SKINS).map((skin) => {
                    const isUnlocked =
                      skin.costGold === 0 || unlockedSkins.includes(skin.id)
                    const isEquipped = diceSkin === skin.id
                    return (
                      <div
                        key={skin.id}
                        className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                          isEquipped
                            ? 'bg-amber-950/35 border-amber-400'
                            : 'bg-black/65 border-white/15'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <RoyalCarvedDice
                            value={6}
                            isRolling={false}
                            canRoll={false}
                            onRoll={() => {}}
                            skinId={skin.id}
                            activeFactionColor={skin.ringAccent}
                            size="sm"
                            showLabel={false}
                          />
                          <div>
                            <h4 className="font-display font-bold text-xs sm:text-sm text-amber-100">
                              {skin.name}
                            </h4>
                            <p className="text-[10px] text-slate-300 mt-0.5">
                              {skin.subtitle}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleSelectOrUnlockSkin(
                              'dice',
                              skin.id,
                              skin.costGold
                            )
                          }
                          className={`w-full py-1.5 rounded-lg font-display font-bold text-[10px] uppercase tracking-wider cursor-pointer ${
                            isEquipped
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                              : 'imperial-button text-amber-200'
                          }`}
                        >
                          {isEquipped
                            ? 'EQUIPPED IN GAME'
                            : isUnlocked
                              ? 'EQUIP PLANET DICE'
                              : `UNLOCK (${skin.costGold} GOLD)`}
                        </button>
                      </div>
                    )
                  })}

                {skinCategoryTab === 'board' &&
                  Object.values(BOARD_SKINS).map((skin) => {
                    const isUnlocked =
                      skin.costGold === 0 || unlockedSkins.includes(skin.id)
                    const isEquipped = boardSkin === skin.id
                    return (
                      <div
                        key={skin.id}
                        className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                          isEquipped
                            ? 'bg-amber-950/35 border-amber-400'
                            : 'bg-black/65 border-white/15'
                        }`}
                      >
                        <div>
                          <h4 className="font-display font-bold text-xs sm:text-sm text-amber-100">
                            {skin.name}
                          </h4>
                          <p className="text-[10px] text-slate-300 mt-0.5 mb-2">
                            {skin.subtitle}
                          </p>
                          <div
                            className="h-12 rounded-lg border-2 p-1.5 flex items-center justify-around mb-2"
                            style={{
                              background: skin.woodGradient,
                              borderColor: skin.goldTrim,
                            }}
                          >
                            {['Α', 'Ω', 'Δ', 'Σ'].map((r, i) => (
                              <span
                                key={i}
                                className="w-6 h-6 rounded border flex items-center justify-center font-serif font-bold text-xs"
                                style={{
                                  backgroundColor: skin.tileBase,
                                  borderColor: skin.tileBorder,
                                  color: skin.runeColor,
                                }}
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleSelectOrUnlockSkin(
                              'board',
                              skin.id,
                              skin.costGold
                            )
                          }
                          className={`w-full py-1.5 rounded-lg font-display font-bold text-[10px] uppercase tracking-wider cursor-pointer ${
                            isEquipped
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                              : 'imperial-button text-amber-200'
                          }`}
                        >
                          {isEquipped
                            ? 'EQUIPPED IN GAME'
                            : isUnlocked
                              ? 'EQUIP BOARD SKIN'
                              : `UNLOCK (${skin.costGold} GOLD)`}
                        </button>
                      </div>
                    )
                  })}

                {skinCategoryTab === 'env' &&
                  Object.values(ENVIRONMENT_SKINS).map((skin) => {
                    const isUnlocked =
                      skin.costGold === 0 || unlockedSkins.includes(skin.id)
                    const isEquipped = envSkin === skin.id
                    return (
                      <div
                        key={skin.id}
                        className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                          isEquipped
                            ? 'bg-amber-950/35 border-amber-400'
                            : 'bg-black/65 border-white/15'
                        }`}
                      >
                        <div>
                          <h4 className="font-display font-bold text-xs sm:text-sm text-amber-100">
                            {skin.name}
                          </h4>
                          <p className="text-[10px] text-slate-300 mt-0.5 mb-2">
                            {skin.subtitle}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleSelectOrUnlockSkin(
                              'env',
                              skin.id,
                              skin.costGold
                            )
                          }
                          className={`w-full py-1.5 rounded-lg font-display font-bold text-[10px] uppercase tracking-wider cursor-pointer ${
                            isEquipped
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                              : 'imperial-button text-amber-200'
                          }`}
                        >
                          {isEquipped
                            ? 'ACTIVE SCENERY'
                            : isUnlocked
                              ? 'EQUIP SPACE SCENERY'
                              : `UNLOCK (${skin.costGold} GOLD)`}
                        </button>
                      </div>
                    )
                  })}
              </div>

              <button
                type="button"
                onClick={() => startMatch(playerCount, matchMode)}
                className="w-full py-2.5 rounded-xl font-display font-black text-xs tracking-widest uppercase text-black bg-amber-400 hover:bg-amber-300 cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
              >
                <Play className="w-4 h-4 fill-black" />
                START WAR WITH EQUIPPED SKINS
              </button>
            </div>
          )}

          {/* =============================================================== */}
          {/* SLIDE 04: ANCIENT GREEK UNIVERSE RULING RING & COMMENTARY LORE   */}
          {/* =============================================================== */}
          {activeSlide === 'universe-ring' && (
            <div className="imperial-panel rounded-2xl p-3.5 sm:p-6 border border-amber-500/40 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center flex-1">
              <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 rounded-2xl bg-black/75 border border-purple-500/40">
                <div className="w-36 h-36 sm:w-48 sm:h-48 relative my-1">
                  <BlackHoleSingularity absorbedPieces={[]} size="showcase" />
                </div>
                <span className="text-[9px] font-display tracking-[0.2em] uppercase text-purple-300 font-bold mt-1">
                  OLYMPUS ANTIKYTHERA RELIC
                </span>
                <h3 className="text-sm sm:text-lg font-display font-black text-amber-200 mt-0.5 text-center">
                  THE UNIVERSE RULING RING
                </h3>
              </div>

              <div className="lg:col-span-7 space-y-3">
                <div>
                  <span className="text-[10px] font-display tracking-[0.2em] uppercase text-amber-400 font-bold block">
                    SLIDE 04 • COSMIC CODEX & COMMENTARY SYSTEM
                  </span>
                  <h2 className="text-base sm:text-2xl font-display font-black text-white">
                    CONQUER THE SINGULARITY TO RULE THE COSMOS
                  </h2>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Suspended inside the central Black Hole rests the Ancient
                    Greek Universe Ruling Ring — forged with 12 Olympian sun
                    pillars, eternal Greek Key fretwork, and four cardinal star
                    jewels.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-black/75 border border-amber-400/35 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-display font-bold uppercase tracking-widest text-amber-300">
                      COMMENTARY ({commentaryLang.toUpperCase()})
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setCommentaryLang((p) =>
                          p === 'en' ? 'hinglish' : 'en'
                        )
                      }
                      className="px-2 py-0.5 rounded bg-purple-950 border border-purple-400/50 text-[9px] font-display font-bold text-purple-200 uppercase cursor-pointer"
                    >
                      SWITCH TO{' '}
                      {commentaryLang === 'en' ? 'HINGLISH' : 'ENGLISH'}
                    </button>
                  </div>
                  <p className="text-[11px] text-amber-100 leading-snug">
                    {commentaryLang === 'hinglish'
                      ? '"Bach ke rehna bhai! Red Alien 6 kadam aage badha aur ab Green Human ko udata hua Universe Ruling Ring ki taraf badh raha hai!"'
                      : '"The Red Alien moves 6 steps forward toward capturing the Green Human and closing in on the Universe Ruling Ring!"'}
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowSpinWheel(true)}
                    className="imperial-button flex-1 py-2.5 sm:py-3 rounded-xl font-display font-bold text-xs tracking-widest uppercase text-amber-200 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Clock className="w-4 h-4 text-amber-400" />
                    24H WHEEL
                  </button>
                  <button
                    type="button"
                    onClick={() => startMatch(playerCount, matchMode)}
                    className="flex-1 py-2.5 sm:py-3 rounded-xl font-display font-black text-xs tracking-widest uppercase text-black bg-amber-400 hover:bg-amber-300 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Play className="w-4 h-4 fill-black" />
                    START WAR
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* BOTTOM INTERACTIVE SLIDE NAVIGATION DOCK */}
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2 bg-black/85 border border-amber-500/30 rounded-xl p-1 sm:p-1.5">
            {LOBBY_SLIDES.map((s) => {
              const Icon = s.icon
              const active = activeSlide === s.id
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    soundEngine.playUiClick()
                    setActiveSlide(s.id)
                  }}
                  className={`py-1.5 sm:py-2 px-1.5 rounded-lg font-display font-bold text-[9.5px] sm:text-xs uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    active
                      ? 'bg-gradient-to-r from-amber-500/30 to-purple-900/40 border border-amber-400 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 shrink-0" />
                  <span className="whitespace-nowrap">{s.shortLabel}</span>
                </button>
              )
            })}
          </div>
        </section>
      )}

      {/* =================================================================== */}
      {/* SCREEN B: ACTIVE LUDO WAR® MATCH ARENA                              */}
      {/* =================================================================== */}
      {screen === 'match' && (
        <section className="relative z-10 flex-1 w-full max-w-5xl mx-auto px-2 sm:px-4 py-1 sm:py-2 flex flex-col items-center justify-between gap-1.5">
          {/* 1. REAL-TIME DRAMATIC COMMENTARY POP-UP BANNER (ENGLISH / HINGLISH) */}
          {commentaryPopup && (
            <div
              key={commentaryPopup.id}
              style={{
                borderColor: commentaryPopup.accentHex,
                boxShadow: `0 6px 24px rgba(0,0,0,0.9), 0 0 18px ${commentaryPopup.accentHex}44`,
              }}
              className={`w-full ${
                playerCount === 6 ? 'max-w-[780px]' : 'max-w-[620px]'
              } rounded-xl bg-black/92 border-2 px-3 py-1.5 sm:py-2 animate-commentary-pop`}
            >
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full animate-ping shrink-0"
                    style={{ backgroundColor: commentaryPopup.accentHex }}
                  />
                  <span className="font-display font-black text-[10px] sm:text-xs tracking-wider uppercase text-amber-300">
                    {commentaryPopup.title}
                  </span>
                </div>
                <span className="text-[8.5px] sm:text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-white/10 text-amber-200 shrink-0">
                  {commentaryLang === 'hinglish' ? 'HINGLISH LIVE' : 'ENG LIVE'}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-white font-medium leading-snug">
                {commentaryPopup.text}
              </p>
            </div>
          )}

          {/* 2. NORTH SIDE PLAYER STATIONS & SIDE DICE */}
          <div
            className={`w-full ${
              playerCount === 6 ? 'max-w-[780px]' : 'max-w-[620px]'
            }`}
          >
            {playerCount === 2 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
                <div className="hidden sm:flex items-center gap-2.5 p-2 rounded-xl bg-black/70 border border-amber-500/25 text-xs text-slate-300">
                  <img
                    src="/images/game-icon.jpg"
                    alt="LUDO WAR®"
                    className="w-8 h-8 rounded-lg border border-amber-400/50 object-cover shrink-0"
                  />
                  <div>
                    <span className="text-[9px] font-display font-bold uppercase tracking-widest text-amber-400 block">
                      1V1 COSMIC DUEL
                    </span>
                    <p className="text-[11px] text-slate-300">
                      First to guide {requiredToWin} relics into the Universe
                      Ring wins.
                    </p>
                  </div>
                </div>
                <div>{renderPlayerStation(1, 'NE', true)}</div>
              </div>
            )}

            {playerCount === 4 && (
              <div className="grid grid-cols-2 gap-1.5 sm:gap-3">
                {renderPlayerStation(1, 'NW', true)}
                {renderPlayerStation(2, 'NE', true)}
              </div>
            )}

            {playerCount === 6 && (
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5">
                {renderPlayerStation(1, 'NW', true)}
                {renderPlayerStation(2, 'N', true)}
                {renderPlayerStation(3, 'NE', true)}
              </div>
            )}
          </div>

          {/* 3. CENTER COSMIC ALTAR BOARD WITH ANCIENT GREEK UNIVERSE RING */}
          <div className="w-full max-w-[min(92vw,45dvh)] sm:max-w-[min(80vw,50dvh)] md:max-w-[min(520px,52dvh)] aspect-square flex items-center justify-center my-0.5">
            <LudoEmpireBoard
              players={players}
              playerCount={playerCount}
              currentPlayerIndex={currentPlayerIndex}
              diceValue={diceValue}
              hasRolled={hasRolled}
              onSelectPiece={(piece) => handleMovePiece(piece, diceValue)}
              boardSkinId={boardSkin}
              pieceSkinId={pieceSkin}
              recentAbsorbedPiece={recentAbsorbedPiece}
              recentElimination={recentElimination}
            />
          </div>

          {/* 4. SOUTH SIDE PLAYER STATIONS & SIDE DICE */}
          <div
            className={`w-full ${
              playerCount === 6 ? 'max-w-[780px]' : 'max-w-[620px]'
            }`}
          >
            {playerCount === 2 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
                <div>{renderPlayerStation(0, 'SW', false)}</div>
                <div className="hidden sm:flex items-center justify-between p-2.5 rounded-xl bg-black/75 border border-amber-500/25">
                  <div>
                    <span className="text-[9px] font-display font-bold uppercase tracking-widest text-purple-300 block">
                      UNIVERSE RULING RING GOAL
                    </span>
                    <span className="text-xs font-display font-bold text-amber-200">
                      {requiredToWin} RELICS IN BLACK HOLE
                    </span>
                  </div>
                  <Shield className="w-5 h-5 text-amber-400" />
                </div>
              </div>
            )}

            {playerCount === 4 && (
              <div className="grid grid-cols-2 gap-1.5 sm:gap-3">
                {renderPlayerStation(0, 'SW', false)}
                {renderPlayerStation(3, 'SE', false)}
              </div>
            )}

            {playerCount === 6 && (
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5">
                {renderPlayerStation(0, 'SW', false)}
                {renderPlayerStation(5, 'S', false)}
                {renderPlayerStation(4, 'SE', false)}
              </div>
            )}
          </div>
        </section>
      )}

      {/* =================================================================== */}
      {/* MODALS: STRICT 24-HOUR SPIN WHEEL, SKINS VAULT, VICTORY RING        */}
      {/* =================================================================== */}
      <DailySpinWheel
        isOpen={showSpinWheel}
        onClose={() => setShowSpinWheel(false)}
        lastSpinTimestamp={lastSpinTimestamp}
        onClaimReward={(amount, ts) => {
          setGoldBalance((prev) => prev + amount)
          setLastSpinTimestamp(ts)
        }}
      />

      <ArmorySkinsModal
        isOpen={showArmory}
        onClose={() => setShowArmory(false)}
        goldBalance={goldBalance}
        unlockedSkins={unlockedSkins}
        boardSkin={boardSkin}
        pieceSkin={pieceSkin}
        diceSkin={diceSkin}
        envSkin={envSkin}
        onSelectOrUnlock={handleSelectOrUnlockSkin}
      />

      <VictoryRingModal
        winner={winner}
        onPlayAgain={() => startMatch(playerCount, matchMode)}
        onReturnLobby={() => {
          setWinner(null)
          setScreen('lobby')
        }}
        rewardGold={500}
      />
    </main>
  )
}
