import { useEffect, useState } from 'react'
import type { PCAPoint } from '../types'
import { api } from '../api'

const PADDING = 40
const DOT_RADIUS = 6
const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

export default function SimilarityMap() {
  const [points, setPoints] = useState<PCAPoint[]>([])
  const [size, setSize] = useState({ w: 360, h: 360 })

  useEffect(() => {
    api.getPCA().then(setPoints).catch(() => {})
    const w = Math.min(window.innerWidth - 32, 440)
    setSize({ w, h: w })
  }, [])

  if (points.length < 2) {
    return (
      <div className="card">
        <h2>Similarity Map</h2>
        <p className="subtitle">Need at least 2 people with logged traits to generate the map.</p>
      </div>
    )
  }

  const xs = points.map(p => p.x)
  const ys = points.map(p => p.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const rangeX = maxX - minX || 1
  const rangeY = maxY - minY || 1

  const scale = (p: PCAPoint) => ({
    cx: PADDING + ((p.x - minX) / rangeX) * (size.w - PADDING * 2),
    cy: PADDING + ((p.y - minY) / rangeY) * (size.h - PADDING * 2),
  })

  return (
    <div className="card">
      <h2>Similarity Map</h2>
      <p className="subtitle">People closer together share more traits</p>
      <svg
        width={size.w}
        height={size.h}
        className="pca-plot"
      >
        {/* Grid lines */}
        <line x1={PADDING} y1={size.h / 2} x2={size.w - PADDING} y2={size.h / 2} stroke="#222" strokeWidth={1} />
        <line x1={size.w / 2} y1={PADDING} x2={size.w / 2} y2={size.h - PADDING} stroke="#222" strokeWidth={1} />

        {/* Connection lines between all pairs (opacity = closeness) */}
        {points.map((a, i) =>
          points.slice(i + 1).map((b, j) => {
            const sa = scale(a)
            const sb = scale(b)
            const dist = Math.sqrt((sa.cx - sb.cx) ** 2 + (sa.cy - sb.cy) ** 2)
            const maxDist = Math.sqrt((size.w - PADDING * 2) ** 2 + (size.h - PADDING * 2) ** 2)
            const opacity = Math.max(0.05, 0.4 * (1 - dist / maxDist))
            return (
              <line
                key={`${i}-${j}`}
                x1={sa.cx} y1={sa.cy}
                x2={sb.cx} y2={sb.cy}
                stroke="#6366f1"
                strokeWidth={1}
                opacity={opacity}
              />
            )
          })
        )}

        {/* Dots and labels */}
        {points.map((p, i) => {
          const { cx, cy } = scale(p)
          const color = COLORS[i % COLORS.length]
          return (
            <g key={p.name}>
              <circle cx={cx} cy={cy} r={DOT_RADIUS} fill={color} />
              <text
                x={cx}
                y={cy - DOT_RADIUS - 6}
                textAnchor="middle"
                fill="#e0e0e0"
                fontSize={13}
                fontWeight={600}
              >
                {p.name}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
