'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { PoseEngineState, PoseLandmarks } from '@/types'
import { MIN_LANDMARK_VISIBILITY } from '@/lib/constants'
import { computeJitterScore } from '@/lib/angleMath'

const JITTER_WINDOW = 20
const FPS_WINDOW = 30
// Lock to a specific stable version to avoid the "Module" error
const MEDIAPIPE_VERSION = '0.5.1675923585' 

export interface UsePoseOptions {
  videoRef: React.RefObject<HTMLVideoElement>
  canvasRef: React.RefObject<HTMLCanvasElement>
  enabled: boolean
  onLandmarks?: (landmarks: PoseLandmarks) => void
}

export function usePose({
  videoRef,
  canvasRef,
  enabled,
  onLandmarks,
}: UsePoseOptions): PoseEngineState {
  const [state, setState] = useState<PoseEngineState>({
    landmarks: null,
    isDetected: false,
    fps: 0,
    jitterScore: 0,
    personCount: 0,
  })

  const poseRef = useRef<any>(null)
  const cameraRef = useRef<any>(null)
  const poseInitRef = useRef<boolean>(false) // Prevent double-initialization
  const angleHistory = useRef<number[]>([])
  const fpsHistory = useRef<number[]>([])
  const lastFrameTime = useRef<number>(0)
  const isMounted = useRef(true)

  // Use a Ref for the callback to prevent the useEffect from re-running on every render
  const onResultsRef = useRef(onLandmarks)
  useEffect(() => {
    onResultsRef.current = onLandmarks
  }, [onLandmarks])

  const onResults = useCallback((results: any) => {
    if (!isMounted.current) return

    const now = performance.now()
    const delta = now - lastFrameTime.current
    lastFrameTime.current = now

    const fps = delta > 0 ? Math.round(1000 / delta) : 0
    fpsHistory.current = [...fpsHistory.current.slice(-(FPS_WINDOW - 1)), fps]
    const avgFps = Math.round(
      fpsHistory.current.reduce((a, b) => a + b, 0) / fpsHistory.current.length
    )

    const landmarks: PoseLandmarks | null = results.poseLandmarks ?? null
    const isDetected = landmarks
      ? landmarks.some(lm => lm.visibility >= MIN_LANDMARK_VISIBILITY)
      : false

    let jitterScore = 0
    if (landmarks && isDetected) {
      const hipY = landmarks[23]?.y ?? 0
      angleHistory.current = [
        ...angleHistory.current.slice(-(JITTER_WINDOW - 1)),
        hipY * 180,
      ]
      jitterScore = computeJitterScore(angleHistory.current)
    }

    if (canvasRef.current && results.poseLandmarks) {
      drawPoseOnCanvas(canvasRef.current, results)
    }

    if (landmarks && isDetected && onResultsRef.current) {
      onResultsRef.current(landmarks)
    }

    setState({
      landmarks,
      isDetected,
      fps: avgFps,
      jitterScore,
      personCount: isDetected ? 1 : 0,
    })
  }, [canvasRef])

  useEffect(() => {
    if (!enabled || poseInitRef.current) return
    
    isMounted.current = true
    poseInitRef.current = true // Lock initialization

    async function initMediaPipe() {
      // Dynamic imports
      const { Pose } = await import('@mediapipe/pose')
      const { Camera } = await import('@mediapipe/camera_utils')

      if (!videoRef.current || !isMounted.current) return

      const pose = new Pose({
        locateFile: (file: string) => {
          // Force the use of the locked version for WASM files
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose@${MEDIAPIPE_VERSION}/${file}`
        },
      })

      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      })

      pose.onResults(onResults)
      poseRef.current = pose

      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current && poseRef.current && isMounted.current) {
            try {
              await poseRef.current.send({ image: videoRef.current })
            } catch (e) {
              console.error("Pose send error:", e)
            }
          }
        },
        width: 1280,
        height: 720,
      })

      camera.start()
      cameraRef.current = camera
    }

    initMediaPipe().catch(err => {
      console.error("MediaPipe Init Error:", err)
      poseInitRef.current = false // Allow retry on failure
    })

    return () => {
      isMounted.current = false
      poseInitRef.current = false
      cameraRef.current?.stop()
      poseRef.current?.close()
    }
  }, [enabled, videoRef, onResults]) // onResults is now stable

  return state
}

// ── Canvas drawing (unchanged but included for completeness) ──
function drawPoseOnCanvas(canvas: HTMLCanvasElement, results: any) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  if (!results.poseLandmarks) return

  const connections = getPoseConnections()
  ctx.strokeStyle = 'rgba(57, 255, 20, 0.7)'
  ctx.lineWidth = 2

  for (const [i, j] of connections) {
    const a = results.poseLandmarks[i]
    const b = results.poseLandmarks[j]
    if (a && b && a.visibility > 0.5 && b.visibility > 0.5) {
      ctx.beginPath()
      ctx.moveTo(a.x * canvas.width, a.y * canvas.height)
      ctx.lineTo(b.x * canvas.width, b.y * canvas.height)
      ctx.stroke()
    }
  }

  for (const lm of results.poseLandmarks) {
    if (lm.visibility < 0.5) continue
    ctx.beginPath()
    ctx.arc(lm.x * canvas.width, lm.y * canvas.height, 5, 0, Math.PI * 2)
    ctx.fillStyle = '#FFE500'
    ctx.fill()
  }
}

function getPoseConnections(): [number, number][] {
  return [
    [11, 12], [11, 23], [12, 24], [23, 24],
    [11, 13], [13, 15], [12, 14], [14, 16],
    [23, 25], [25, 27], [27, 31], [24, 26], [26, 28], [28, 32],
    [0, 11], [0, 12],
  ]
}