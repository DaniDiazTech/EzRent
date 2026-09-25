import { OrbitControls } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { tr } from '../lib/i18n'
import { Apartment } from './Apartment'

export interface RoomView {
  id: string
  label: string
  labelEn: string
  position: [number, number, number]
  target: [number, number, number]
}

export const ROOMS: RoomView[] = [
  { id: 'general', label: 'Vista general', labelEn: 'Overview', position: [5, 12.5, -6.5], target: [5, 0, 4] },
  { id: 'sala', label: 'Sala-comedor', labelEn: 'Living-dining', position: [3, 6.2, -2.6], target: [3, 0.4, 2.4] },
  { id: 'cocina', label: 'Cocina', labelEn: 'Kitchen', position: [4.6, 5.6, 0.4], target: [8.2, 0.5, 1.8] },
  { id: 'hab1', label: 'Habitación principal', labelEn: 'Main bedroom', position: [1.9, 6.2, 2.8], target: [1.9, 0.4, 6.3] },
  { id: 'bano', label: 'Baño', labelEn: 'Bathroom', position: [4.9, 6.4, 3.6], target: [4.9, 0.3, 6.5] },
  { id: 'hab2', label: 'Habitación 2', labelEn: 'Bedroom 2', position: [8.2, 6.2, 2.2], target: [8.2, 0.4, 5.8] },
]

function CameraRig({ view, onArrive }: { view: RoomView; onArrive: () => void }) {
  const { camera } = useThree()
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null
  const animating = useRef(true)
  const goalPos = useRef(new THREE.Vector3())
  const goalTarget = useRef(new THREE.Vector3())

  useEffect(() => {
    goalPos.current.set(...view.position)
    goalTarget.current.set(...view.target)
    animating.current = true
  }, [view])

  useEffect(() => {
    if (!controls) return
    const stop = () => {
      animating.current = false
    }
    controls.addEventListener('start', stop)
    return () => controls.removeEventListener('start', stop)
  }, [controls])

  useFrame((_, dt) => {
    if (!animating.current || !controls) return
    const k = 1 - Math.exp(-dt * 3.5)
    camera.position.lerp(goalPos.current, k)
    controls.target.lerp(goalTarget.current, k)
    controls.update()
    if (camera.position.distanceTo(goalPos.current) < 0.02 && controls.target.distanceTo(goalTarget.current) < 0.02) {
      animating.current = false
      onArrive()
    }
  })
  return null
}

export default function Tour() {
  useEffect(() => () => void (document.body.style.cursor = ''), [])
  const [view, setView] = useState<RoomView>(ROOMS[0])
  const [lowWalls, setLowWalls] = useState(false)
  const [moving, setMoving] = useState(true)

  const go = (id: string) => {
    const r = ROOMS.find((x) => x.id === id)
    if (r) {
      setView({ ...r })
      setMoving(true)
    }
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-b from-sky-100 to-stone-100">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [5, 22, -16], fov: 45, near: 0.1, far: 100 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#eef2f3']} />
        <hemisphereLight args={['#ffffff', '#c8bca8', 0.9]} />
        <ambientLight intensity={0.35} />
        <directionalLight
          position={[-6, 14, -8]}
          intensity={1.6}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
          shadow-bias={-0.0005}
        />
        <pointLight position={[4.4, 2.0, 2.2]} intensity={2} distance={4} color="#ffe2b0" />
        <Apartment lowWalls={lowWalls} onRoom={go} />
        <mesh position={[5, -0.12, 4]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[60, 60]} />
          <meshStandardMaterial color="#e6e9e4" />
        </mesh>
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          minDistance={2}
          maxDistance={28}
          maxPolarAngle={Math.PI / 2.1}
          target={[5, 0, 4]}
        />
        <CameraRig view={view} onArrive={() => setMoving(false)} />
      </Canvas>

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
        <span className="pointer-events-auto inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-stone-900/80 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> <span className="hidden sm:inline">{tr('3D tour ·', 'Recorrido 3D ·')}</span> {tr(view.labelEn, view.label)}
          {moving && <span className="opacity-60">…</span>}
        </span>
        <button
          onClick={() => setLowWalls((v) => !v)}
          className="pointer-events-auto whitespace-nowrap rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-stone-800 shadow ring-1 ring-black/5 hover:bg-white"
        >
          {lowWalls ? tr('Full walls', 'Muros completos') : tr('Cut walls', 'Cortar muros')}
        </button>
      </div>

      <div className="absolute inset-x-0 bottom-0 p-3">
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {ROOMS.map((r) => (
            <button
              key={r.id}
              onClick={() => go(r.id)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold shadow ring-1 transition ${
                view.id === r.id ? 'bg-teal-700 text-white ring-teal-800' : 'bg-white/95 text-stone-800 ring-black/5 hover:bg-white'
              }`}
            >
              {tr(r.labelEn, r.label)}
            </button>
          ))}
        </div>
        <p className="mt-1 text-[11px] text-stone-600">
          {tr(
            'Tap a room’s floor to go there · drag to rotate · pinch or scroll to zoom',
            'Toca el piso de un ambiente para ir a él · arrastra para girar · pellizca o usa la rueda para acercar',
          )}
        </p>
      </div>
    </div>
  )
}
