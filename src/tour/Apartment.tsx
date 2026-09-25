import { useState } from 'react'

/*
  Planta del apartamento (metros). x hacia el oriente, z hacia el norte-fondo.

    z=0  ┌──────── fachada con ventanales ────────┬──── cocina ────┐
         │           Sala - comedor               │ (abierta)      │
    z=3.5│                                        ├────────────────┤
    z=4.5├──────────┬──────────┬─────────────────┤  Habitación 2  │
         │ Hab. 1   │  Baño    │                 │                │
    z=8  └──────────┴──────────┘                 └────────────────┘
        x=0       x=3.8      x=6                                x=10
*/

export const WALL_H = 2.5
const T = 0.12

type Opening = { from: number; to: number; bottom: number; top: number; kind: 'door' | 'window' | 'arch' }

interface WallProps {
  axis: 'x' | 'z'
  /** Coordenada fija: z para muros en eje x, x para muros en eje z. */
  at: number
  from: number
  to: number
  openings?: Opening[]
  height: number
  exterior?: boolean
}

function Wall({ axis, at, from, to, openings = [], height, exterior }: WallProps) {
  const pieces: { a: number; b: number; y0: number; y1: number }[] = []
  const sorted = [...openings].sort((p, q) => p.from - q.from)
  let cursor = from
  for (const o of sorted) {
    if (o.from > cursor) pieces.push({ a: cursor, b: o.from, y0: 0, y1: height })
    if (o.bottom > 0) pieces.push({ a: o.from, b: o.to, y0: 0, y1: Math.min(o.bottom, height) })
    if (o.top < height) pieces.push({ a: o.from, b: o.to, y0: o.top, y1: height })
    cursor = o.to
  }
  if (cursor < to) pieces.push({ a: cursor, b: to, y0: 0, y1: height })

  const color = exterior ? '#f5f1ea' : '#fbfaf7'
  return (
    <group>
      {pieces
        .filter((p) => p.y1 - p.y0 > 0.001)
        .map((p, i) => {
          const len = p.b - p.a
          const mid = (p.a + p.b) / 2
          const h = p.y1 - p.y0
          const pos: [number, number, number] = axis === 'x' ? [mid, p.y0 + h / 2, at] : [at, p.y0 + h / 2, mid]
          const size: [number, number, number] = axis === 'x' ? [len + T, h, T] : [T, h, len + T]
          return (
            <mesh key={i} position={pos} castShadow receiveShadow>
              <boxGeometry args={size} />
              <meshStandardMaterial color={color} roughness={0.9} />
            </mesh>
          )
        })}
      {sorted
        .filter((o) => o.kind === 'window' && o.bottom < height)
        .map((o, i) => {
          const len = o.to - o.from
          const mid = (o.from + o.to) / 2
          const top = Math.min(o.top, height)
          const h = top - o.bottom
          const pos: [number, number, number] = axis === 'x' ? [mid, o.bottom + h / 2, at] : [at, o.bottom + h / 2, mid]
          const size: [number, number, number] = axis === 'x' ? [len, h, 0.03] : [0.03, h, len]
          const frame: [number, number, number] = axis === 'x' ? [len + 0.06, 0.06, 0.2] : [0.2, 0.06, len + 0.06]
          const sill: [number, number, number] = axis === 'x' ? [mid, o.bottom, at] : [at, o.bottom, mid]
          return (
            <group key={`w${i}`}>
              <mesh position={pos}>
                <boxGeometry args={size} />
                <meshPhysicalMaterial color="#bfe3f2" transparent opacity={0.35} roughness={0.05} />
              </mesh>
              <mesh position={sill}>
                <boxGeometry args={frame} />
                <meshStandardMaterial color="#e2ded6" />
              </mesh>
            </group>
          )
        })}
      {sorted
        .filter((o) => o.kind === 'door' && !exterior)
        .map((o, i) => {
          // Puerta entreabierta, girada 70° desde el marco
          const len = o.to - o.from
          const hinge: [number, number, number] = axis === 'x' ? [o.from, 0, at] : [at, 0, o.from]
          const rot = axis === 'x' ? -1.2 : -Math.PI / 2 + 1.2
          return (
            <group key={`d${i}`} position={hinge} rotation={[0, rot, 0]}>
              <mesh position={[len / 2, o.top / 2, 0]} castShadow>
                <boxGeometry args={[len, o.top - 0.02, 0.04]} />
                <meshStandardMaterial color="#a47148" roughness={0.6} />
              </mesh>
              <mesh position={[len - 0.1, 1.0, 0.04]}>
                <sphereGeometry args={[0.03, 12, 12]} />
                <meshStandardMaterial color="#d4d4d4" metalness={0.8} roughness={0.3} />
              </mesh>
            </group>
          )
        })}
      {sorted
        .filter((o) => o.kind === 'door' && exterior)
        .map((o, i) => {
          const len = o.to - o.from
          const mid = (o.from + o.to) / 2
          const pos: [number, number, number] = axis === 'x' ? [mid, o.top / 2, at] : [at, o.top / 2, mid]
          const size: [number, number, number] = axis === 'x' ? [len, o.top, 0.06] : [0.06, o.top, len]
          return (
            <mesh key={`e${i}`} position={pos} castShadow>
              <boxGeometry args={size} />
              <meshStandardMaterial color="#6b4a2f" roughness={0.5} />
            </mesh>
          )
        })}
    </group>
  )
}

function Box({
  p,
  s,
  c,
  r = 0,
  rough = 0.8,
  metal = 0,
}: {
  p: [number, number, number]
  s: [number, number, number]
  c: string
  r?: number
  rough?: number
  metal?: number
}) {
  return (
    <mesh position={p} rotation={[0, r, 0]} castShadow receiveShadow>
      <boxGeometry args={s} />
      <meshStandardMaterial color={c} roughness={rough} metalness={metal} />
    </mesh>
  )
}

function Cyl({ p, r, h, c, rough = 0.6 }: { p: [number, number, number]; r: number; h: number; c: string; rough?: number }) {
  return (
    <mesh position={p} castShadow receiveShadow>
      <cylinderGeometry args={[r, r, h, 24]} />
      <meshStandardMaterial color={c} roughness={rough} />
    </mesh>
  )
}

function Floor({ x0, x1, z0, z1, color, onClick }: { x0: number; x1: number; z0: number; z1: number; color: string; onClick: () => void }) {
  const [hover, setHover] = useState(false)
  return (
    <mesh
      position={[(x0 + x1) / 2, 0.005, (z0 + z1) / 2]}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHover(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        setHover(false)
        document.body.style.cursor = ''
      }}
    >
      <planeGeometry args={[x1 - x0, z1 - z0]} />
      <meshStandardMaterial color={color} roughness={0.85} emissive="#14b8a6" emissiveIntensity={hover ? 0.18 : 0} />
    </mesh>
  )
}

function Plant({ p }: { p: [number, number, number] }) {
  return (
    <group position={p}>
      <Cyl p={[0, 0.2, 0]} r={0.16} h={0.4} c="#d6cfc4" />
      <mesh position={[0, 0.65, 0]} castShadow>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#4d7c4a" roughness={0.9} />
      </mesh>
      <mesh position={[0.1, 0.95, 0.05]} castShadow>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#5c8f57" roughness={0.9} />
      </mesh>
    </group>
  )
}

function Chair({ p, r = 0 }: { p: [number, number, number]; r?: number }) {
  return (
    <group position={p} rotation={[0, r, 0]}>
      <Box p={[0, 0.45, 0]} s={[0.44, 0.05, 0.44]} c="#8b5e3c" />
      <Box p={[0, 0.72, -0.2]} s={[0.44, 0.5, 0.05]} c="#8b5e3c" />
      {[
        [-0.19, -0.19],
        [0.19, -0.19],
        [-0.19, 0.19],
        [0.19, 0.19],
      ].map(([x, z], i) => (
        <Box key={i} p={[x, 0.22, z]} s={[0.04, 0.44, 0.04]} c="#5b3b25" />
      ))}
    </group>
  )
}

function Bed({ p, w, l, r = 0, sheet, blanket }: { p: [number, number, number]; w: number; l: number; r?: number; sheet: string; blanket: string }) {
  return (
    <group position={p} rotation={[0, r, 0]}>
      <Box p={[0, 0.18, 0]} s={[w, 0.3, l]} c="#7a5236" />
      <Box p={[0, 0.42, 0]} s={[w - 0.06, 0.2, l - 0.06]} c={sheet} rough={1} />
      <Box p={[0, 0.54, l * 0.12]} s={[w - 0.02, 0.06, l * 0.7]} c={blanket} rough={1} />
      <Box p={[0, 0.7, -l / 2 + 0.03]} s={[w + 0.1, 0.9, 0.08]} c="#6b4a2f" />
      {w > 1.2 ? (
        <>
          <Box p={[-w / 4, 0.6, -l / 2 + 0.3]} s={[w / 2 - 0.15, 0.14, 0.35]} c="#ffffff" rough={1} />
          <Box p={[w / 4, 0.6, -l / 2 + 0.3]} s={[w / 2 - 0.15, 0.14, 0.35]} c="#ffffff" rough={1} />
        </>
      ) : (
        <Box p={[0, 0.6, -l / 2 + 0.3]} s={[w - 0.2, 0.14, 0.35]} c="#ffffff" rough={1} />
      )}
    </group>
  )
}

export function Apartment({ lowWalls, onRoom }: { lowWalls: boolean; onRoom: (id: string) => void }) {
  const H = lowWalls ? 1.1 : WALL_H
  return (
    <group>
      {/* Losa */}
      <mesh position={[5, -0.06, 4]} receiveShadow>
        <boxGeometry args={[10.4, 0.1, 8.4]} />
        <meshStandardMaterial color="#d6d3cd" />
      </mesh>

      {/* Pisos */}
      <Floor x0={0} x1={6} z0={0} z1={4.5} color="#caa27a" onClick={() => onRoom('sala')} />
      <Floor x0={6} x1={10} z0={0} z1={3.5} color="#e7e3dc" onClick={() => onRoom('cocina')} />
      <Floor x0={0} x1={3.8} z0={4.5} z1={8} color="#b88a5f" onClick={() => onRoom('hab1')} />
      <Floor x0={3.8} x1={6} z0={4.5} z1={8} color="#d9e1e4" onClick={() => onRoom('bano')} />
      <Floor x0={6} x1={10} z0={3.5} z1={8} color="#b88a5f" onClick={() => onRoom('hab2')} />

      {/* Muros exteriores */}
      <Wall
        axis="x"
        at={0}
        from={0}
        to={10}
        height={H}
        exterior
        openings={[
          { from: 0.8, to: 3.0, bottom: 0.1, top: 2.3, kind: 'window' },
          { from: 3.4, to: 5.4, bottom: 0.1, top: 2.3, kind: 'window' },
          { from: 7.4, to: 9.0, bottom: 1.05, top: 2.1, kind: 'window' },
        ]}
      />
      <Wall
        axis="x"
        at={8}
        from={0}
        to={10}
        height={H}
        exterior
        openings={[
          { from: 1.0, to: 2.8, bottom: 0.9, top: 2.1, kind: 'window' },
          { from: 4.6, to: 5.3, bottom: 1.6, top: 2.1, kind: 'window' },
          { from: 7.2, to: 9.0, bottom: 0.9, top: 2.1, kind: 'window' },
        ]}
      />
      <Wall axis="z" at={0} from={0} to={8} height={H} exterior openings={[{ from: 3.0, to: 3.95, bottom: 0, top: 2.1, kind: 'door' }]} />
      <Wall axis="z" at={10} from={0} to={8} height={H} exterior />

      {/* Muros interiores */}
      <Wall
        axis="x"
        at={4.5}
        from={0}
        to={6}
        height={H}
        openings={[
          { from: 2.7, to: 3.55, bottom: 0, top: 2.05, kind: 'door' },
          { from: 4.5, to: 5.25, bottom: 0, top: 2.05, kind: 'door' },
        ]}
      />
      <Wall axis="z" at={3.8} from={4.5} to={8} height={H} />
      <Wall
        axis="z"
        at={6}
        from={0}
        to={8}
        height={H}
        openings={[
          { from: 0.5, to: 3.0, bottom: 0, top: 2.2, kind: 'arch' },
          { from: 3.55, to: 4.4, bottom: 0, top: 2.05, kind: 'door' },
        ]}
      />
      <Wall axis="x" at={3.5} from={6} to={10} height={H} />

      {/* ---------- Sala ---------- */}
      <Box p={[1.5, 0.01, 2.9]} s={[2.6, 0.02, 1.9]} c="#e9e2d6" rough={1} />
      {/* Sofá */}
      <group position={[1.5, 0, 4.0]}>
        <Box p={[0, 0.22, 0]} s={[2.2, 0.36, 0.85]} c="#3f5b6e" />
        <Box p={[0, 0.62, 0.32]} s={[2.2, 0.5, 0.2]} c="#3f5b6e" />
        <Box p={[-1.02, 0.5, 0]} s={[0.18, 0.3, 0.85]} c="#35505f" />
        <Box p={[1.02, 0.5, 0]} s={[0.18, 0.3, 0.85]} c="#35505f" />
        <Box p={[-0.45, 0.46, -0.05]} s={[0.84, 0.12, 0.66]} c="#48677c" />
        <Box p={[0.45, 0.46, -0.05]} s={[0.84, 0.12, 0.66]} c="#48677c" />
        <Box p={[-0.7, 0.64, 0.12]} s={[0.4, 0.34, 0.12]} c="#e8b04b" />
      </group>
      {/* Mesa de centro */}
      <Box p={[1.5, 0.38, 2.8]} s={[1.1, 0.06, 0.6]} c="#8b5e3c" />
      <Box p={[1.5, 0.18, 2.8]} s={[0.9, 0.34, 0.4]} c="#6b4a2f" />
      {/* Sillón */}
      <group position={[0.55, 0, 1.9]} rotation={[0, Math.PI / 2.4, 0]}>
        <Box p={[0, 0.22, 0]} s={[0.8, 0.36, 0.8]} c="#c9784b" />
        <Box p={[0, 0.6, 0.32]} s={[0.8, 0.45, 0.16]} c="#c9784b" />
      </group>
      <Plant p={[0.4, 0, 0.45]} />
      <Plant p={[5.55, 0, 0.45]} />
      {/* Lámpara de pie */}
      <Cyl p={[0.2, 0.8, 4.25]} r={0.02} h={1.6} c="#222" />
      <Cyl p={[0.2, 1.6, 4.25]} r={0.18} h={0.25} c="#f7ecd4" rough={1} />
      {/* Comedor */}
      <Box p={[4.4, 0.74, 2.2]} s={[1.6, 0.05, 0.9]} c="#a47148" rough={0.5} />
      {[
        [3.8, 1.9],
        [5.0, 1.9],
        [3.8, 2.5],
        [5.0, 2.5],
      ].map(([x, z], i) => (
        <Box key={i} p={[x, 0.36, z]} s={[0.06, 0.72, 0.06]} c="#5b3b25" />
      ))}
      <Chair p={[4.0, 0, 1.5]} />
      <Chair p={[4.8, 0, 1.5]} />
      <Chair p={[4.0, 0, 2.9]} r={Math.PI} />
      <Chair p={[4.8, 0, 2.9]} r={Math.PI} />
      <Cyl p={[4.4, 2.1, 2.2]} r={0.2} h={0.18} c="#1f2937" />

      {/* ---------- Cocina ---------- */}
      {/* Mesón norte con estufa y lavaplatos */}
      <Box p={[8.4, 0.45, 3.13]} s={[3.1, 0.9, 0.62]} c="#f4f4f5" />
      <Box p={[8.4, 0.92, 3.13]} s={[3.1, 0.04, 0.64]} c="#3f3f46" rough={0.3} />
      <Box p={[7.5, 0.95, 3.13]} s={[0.6, 0.02, 0.5]} c="#111827" rough={0.2} />
      <Box p={[9.0, 0.93, 3.13]} s={[0.55, 0.02, 0.4]} c="#9ca3af" metal={0.7} rough={0.3} />
      {H > 1.5 && <Box p={[8.4, 1.85, 3.25]} s={[3.1, 0.7, 0.36]} c="#f4f4f5" />}
      {/* Mesón oriente */}
      <Box p={[9.62, 0.45, 1.55]} s={[0.62, 0.9, 2.5]} c="#f4f4f5" />
      <Box p={[9.62, 0.92, 1.55]} s={[0.64, 0.04, 2.5]} c="#3f3f46" rough={0.3} />
      {/* Nevera */}
      <Box p={[6.45, 0.9, 3.1]} s={[0.7, 1.8, 0.65]} c="#d4d4d8" metal={0.5} rough={0.35} />
      {/* Barra con bancos */}
      <Box p={[7.8, 0.5, 1.6]} s={[1.6, 1.0, 0.6]} c="#a47148" />
      <Box p={[7.8, 1.02, 1.6]} s={[1.75, 0.05, 0.75]} c="#e7e5e4" rough={0.4} />
      <Cyl p={[7.35, 0.35, 0.95]} r={0.18} h={0.7} c="#1f2937" />
      <Cyl p={[8.25, 0.35, 0.95]} r={0.18} h={0.7} c="#1f2937" />

      {/* ---------- Habitación principal ---------- */}
      <Bed p={[1.1, 0, 6.35]} w={1.6} l={2.0} r={Math.PI / 2} sheet="#f1f5f9" blanket="#94a3b8" />
      <Box p={[0.3, 0.25, 5.1]} s={[0.45, 0.5, 0.4]} c="#8b5e3c" />
      <Box p={[0.3, 0.25, 7.6]} s={[0.45, 0.5, 0.4]} c="#8b5e3c" />
      <Cyl p={[0.3, 0.62, 5.1]} r={0.1} h={0.25} c="#fde68a" rough={1} />
      <Box p={[3.45, 1.05, 6.8]} s={[0.6, 2.1, 1.9]} c="#e7dccb" />
      <Box p={[1.9, 0.01, 6.35]} s={[1.2, 0.02, 1.8]} c="#d6c7b0" rough={1} />

      {/* ---------- Baño ---------- */}
      {/* Ducha */}
      <Box p={[4.35, 0.03, 7.5]} s={[0.95, 0.06, 0.95]} c="#f8fafc" />
      <mesh position={[4.35, 1.0, 7.02]}>
        <boxGeometry args={[0.95, 2.0, 0.02]} />
        <meshPhysicalMaterial color="#e0f2fe" transparent opacity={0.3} roughness={0.05} />
      </mesh>
      {/* Sanitario */}
      <Box p={[5.6, 0.2, 7.6]} s={[0.4, 0.4, 0.55]} c="#ffffff" rough={0.2} />
      <Box p={[5.6, 0.55, 7.85]} s={[0.45, 0.35, 0.18]} c="#ffffff" rough={0.2} />
      {/* Lavamanos */}
      <Box p={[5.7, 0.42, 6.0]} s={[0.5, 0.84, 0.9]} c="#8b5e3c" />
      <Box p={[5.7, 0.87, 6.0]} s={[0.52, 0.06, 0.92]} c="#ffffff" rough={0.2} />
      {H > 1.5 && <Box p={[5.93, 1.45, 6.0]} s={[0.03, 0.7, 0.6]} c="#cbd5e1" metal={0.8} rough={0.1} />}

      {/* ---------- Habitación 2 ---------- */}
      <Bed p={[9.0, 0, 6.2]} w={1.4} l={1.9} r={-Math.PI / 2} sheet="#f8fafc" blanket="#0f766e" />
      <Box p={[9.75, 0.25, 7.45]} s={[0.4, 0.5, 0.4]} c="#8b5e3c" />
      {/* Escritorio */}
      <Box p={[8.9, 0.74, 3.9]} s={[1.3, 0.05, 0.6]} c="#a47148" />
      <Box p={[8.3, 0.36, 3.9]} s={[0.05, 0.72, 0.55]} c="#5b3b25" />
      <Box p={[9.5, 0.36, 3.9]} s={[0.05, 0.72, 0.55]} c="#5b3b25" />
      <Box p={[8.9, 0.95, 3.75]} s={[0.6, 0.36, 0.03]} c="#111827" rough={0.3} />
      <Chair p={[8.9, 0, 4.55]} r={Math.PI} />
      {/* Clóset */}
      <Box p={[6.35, 1.05, 6.2]} s={[0.6, 2.1, 1.8]} c="#e7dccb" />
      <Plant p={[6.4, 0, 7.6]} />

    </group>
  )
}
