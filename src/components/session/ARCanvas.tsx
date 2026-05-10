// ============================================================
// GamiPhysio AR — ARCanvas
// Three.js 2D bounding boxes and target zones over webcam feed.
// ============================================================
'use client'

import { useEffect, useRef } from 'react'
import type { PoseLandmarks, AROverlayConfig, BodyPart } from '@/types'
import { DEFAULT_AR_CONFIG } from '@/lib/constants'
import { getPrimaryAngle, isInTargetZone } from '@/lib/angleMath'

interface ARCanvasProps {
  landmarks: PoseLandmarks | null
  bodyPart: BodyPart
  minAngle: number
  maxAngle: number
  isInZone: boolean
  config?: Partial<AROverlayConfig>
  width: number
  height: number
}

export function ARCanvas({
  landmarks,
  bodyPart,
  minAngle,
  maxAngle,
  isInZone,
  config: configOverride = {},
  width,
  height,
}: ARCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const config = { ...DEFAULT_AR_CONFIG, ...configOverride }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !landmarks) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, width, height)

    // ── Draw bounding box ──────────────────────────────────
    if (config.showBoundingBox) {
      drawBoundingBox(ctx, landmarks, width, height, isInZone, config)
    }

    // ── Draw target zone arc ───────────────────────────────
    if (config.showTargetZone) {
      drawTargetZone(ctx, landmarks, bodyPart, minAngle, maxAngle, isInZone, width, height, config)
    }

    // ── Draw angle label ───────────────────────────────────
    if (config.showAngleLabel) {
      const angle = getPrimaryAngle(landmarks, bodyPart)
      if (angle !== null) {
        drawAngleLabel(ctx, landmarks, angle, isInZone, width, height, config)
      }
    }
  }, [landmarks, isInZone, bodyPart, minAngle, maxAngle, width, height, config])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="ar-canvas"
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    />
  )
}

// ── Drawing helpers ────────────────────────────────────────────

function drawBoundingBox(
  ctx: CanvasRenderingContext2D,
  landmarks: PoseLandmarks,
  w: number,
  h: number,
  inZone: boolean,
  config: AROverlayConfig
) {
  const visible = landmarks.filter(lm => lm.visibility > 0.5)
  if (visible.length < 4) return

  const xs = visible.map(lm => lm.x * w)
  const ys = visible.map(lm => lm.y * h)

  const minX = Math.min(...xs) - 20
  const minY = Math.min(...ys) - 20
  const maxX = Math.max(...xs) + 20
  const maxY = Math.max(...ys) + 20
  const bw   = maxX - minX
  const bh   = maxY - minY

  const color  = inZone ? '#39FF14' : '#FFE500'
  const glow   = inZone ? 'rgba(57,255,20,0.15)' : 'rgba(255,229,0,0.08)'
  const corner = 16

  ctx.save()

  // Fill glow
  ctx.fillStyle = glow
  roundRect(ctx, minX, minY, bw, bh, corner)
  ctx.fill()

  // Corner brackets
  const bracketLen = 24
  ctx.strokeStyle = color
  ctx.lineWidth   = 3
  ctx.lineCap     = 'round'
  ctx.shadowColor = color
  ctx.shadowBlur  = inZone ? 12 : 6

  // 🟢 FIXED: Changed from 8 numbers to 6 numbers to match coordinates provided
  const corners: [number, number, number, number, number, number][] = [
    [minX, minY, minX + bracketLen, minY, minX, minY + bracketLen],  // TL
    [maxX, minY, maxX - bracketLen, minY, maxX, minY + bracketLen],  // TR
    [minX, maxY, minX + bracketLen, maxY, minX, maxY - bracketLen],  // BL
    [maxX, maxY, maxX - bracketLen, maxY, maxX, maxY - bracketLen],  // BR
  ]

  for (const [x1, y1, x2, y2, x3, y3] of corners) {
    ctx.beginPath()
    ctx.moveTo(x2, y2)
    ctx.lineTo(x1, y1)
    ctx.lineTo(x3, y3)
    ctx.stroke()
  }

  ctx.restore()
}

function drawTargetZone(
  ctx: CanvasRenderingContext2D,
  landmarks: PoseLandmarks,
  bodyPart: BodyPart,
  minAngle: number,
  maxAngle: number,
  inZone: boolean,
  w: number,
  h: number,
  config: AROverlayConfig
) {
  const jointPos = getPrimaryJointPosition(landmarks, bodyPart, w, h)
  if (!jointPos) return

  const { x, y } = jointPos
  const radius = 50
  const color  = inZone ? '#39FF14' : '#374250'
  const arcStart = ((minAngle - 90) * Math.PI) / 180
  const arcEnd   = ((maxAngle - 90) * Math.PI) / 180

  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth   = 6
  ctx.lineCap     = 'round'
  ctx.shadowColor = color
  ctx.shadowBlur  = inZone ? 16 : 0
  ctx.globalAlpha = 0.85

  ctx.beginPath()
  ctx.arc(x, y, radius, arcStart, arcEnd)
  ctx.strokeStyle = 'rgba(255,255,255,0.1)'
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(x, y, radius, arcStart, arcEnd)
  ctx.strokeStyle = color
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(x, y, inZone ? 8 : 5, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()

  ctx.restore()
}

function drawAngleLabel(
  ctx: CanvasRenderingContext2D,
  landmarks: PoseLandmarks,
  angle: number,
  inZone: boolean,
  w: number,
  h: number,
  config: AROverlayConfig
) {
  const nose = landmarks[0]
  if (!nose) return

  const x = nose.x * w + 40
  const y = nose.y * h - 20

  const color = inZone ? '#39FF14' : '#FFE500'
  const label = `${angle}°`

  ctx.save()
  ctx.font = 'bold 22px "Barlow Condensed", sans-serif'
  ctx.textAlign = 'left'

  const metrics = ctx.measureText(label)
  const pw = metrics.width + 20
  const ph = 32

  ctx.fillStyle = 'rgba(14,17,20,0.85)'
  roundRect(ctx, x - 10, y - ph + 8, pw, ph, 8)
  ctx.fill()

  ctx.fillStyle = color
  ctx.shadowColor = color
  ctx.shadowBlur = inZone ? 10 : 0
  ctx.fillText(label, x, y)

  ctx.restore()
}

function getPrimaryJointPosition(
  landmarks: PoseLandmarks,
  bodyPart: BodyPart,
  w: number,
  h: number
): { x: number; y: number } | null {
  const JOINT_INDEX: Record<BodyPart, number> = {
    neck:      0,   
    back:      23,  
    shoulders: 11,  
    knees:     25,  
    ankles:    27,  
  }

  const idx = JOINT_INDEX[bodyPart]
  const lm  = landmarks[idx]
  if (!lm || lm.visibility < 0.4) return null

  return { x: lm.x * w, y: lm.y * h }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  r: number
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}