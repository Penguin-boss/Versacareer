import { useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float, Icosahedron, MeshDistortMaterial } from '@react-three/drei'
import * as THREE from 'three'

function HeroObject({ visible }: { visible: boolean }) {
  const group = useRef<THREE.Group>(null)
  const mesh = useRef<THREE.Mesh>(null)
  const { viewport } = useThree()
  const mouse = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  useFrame((_, delta) => {
    if (!group.current || !visible) return
    const targetY = mouse.current.x * 0.35
    const targetX = -mouse.current.y * 0.25
    group.current.rotation.y += (targetY - group.current.rotation.y) * 0.04 + delta * 0.08
    group.current.rotation.x += (targetX - group.current.rotation.x) * 0.04
  })

  return (
    <group ref={group}>
      <Float speed={1.2} rotationIntensity={0.25} floatIntensity={0.6}>
        <Icosahedron ref={mesh} args={[1.6, 4]}>
          <MeshDistortMaterial
            color="#2E5EFF"
            emissive="#22D3EE"
            emissiveIntensity={0.25}
            roughness={0.15}
            metalness={0.85}
            distort={0.32}
            speed={1.4}
            transparent
            opacity={0.92}
          />
        </Icosahedron>
        {/* Wireframe halo */}
        <Icosahedron args={[2.15, 1]}>
          <meshBasicMaterial
            color="#22D3EE"
            wireframe
            transparent
            opacity={0.12}
          />
        </Icosahedron>
      </Float>
    </group>
  )
}

function ParticleField({ visible }: { visible: boolean }) {
  const points = useRef<THREE.Points>(null)
  const count = 180

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const r = 4 + Math.random() * 6
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      arr[i * 3 + 2] = r * Math.cos(phi)
    }
    return arr
  }, [])

  useFrame((_, delta) => {
    if (!points.current || !visible) return
    points.current.rotation.y += delta * 0.03
  })

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color="#22D3EE"
        transparent
        opacity={0.55}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

export default function HeroScene3D() {
  const [inView, setInView] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.05 }
    )
    obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={containerRef} className="absolute inset-0" aria-hidden="true">
      <Canvas
        dpr={[1, 1.5]}
        frameloop={inView ? 'always' : 'demand'}
        camera={{ position: [0, 0, 6], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.35} />
        <pointLight position={[5, 5, 5]} intensity={1.2} color="#2E5EFF" />
        <pointLight position={[-5, -3, 2]} intensity={0.7} color="#22D3EE" />
        <directionalLight position={[0, 2, 4]} intensity={0.4} color="#ffffff" />
        <HeroObject visible={inView} />
        <ParticleField visible={inView} />
      </Canvas>
    </div>
  )
}
