'use client'

import { Suspense, useRef, useMemo, useState, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

// --- Constants ---

const NODE_COUNT = 18
const CONNECTION_DISTANCE = 3.2
const MOUSE_INFLUENCE_RADIUS = 4.0
const MOUSE_REPEL_STRENGTH = 0.6
const MESSAGE_SPEED = 0.012
const MESSAGE_SPAWN_CHANCE = 0.004
const MAX_ACTIVE_MESSAGES = 4
const BLUE = new THREE.Color('#60a5fa')
const PURPLE = new THREE.Color('#a78bfa')
const PINK = new THREE.Color('#f472b6')

// --- Types ---

interface NodeData {
  position: THREE.Vector3
  velocity: THREE.Vector3
  basePosition: THREE.Vector3
  color: THREE.Color
  phase: number
  pulseSpeed: number
}

interface MessageParticle {
  fromIndex: number
  toIndex: number
  progress: number
  color: THREE.Color
  active: boolean
}

// --- Utility ---

function generateNodes(): NodeData[] {
  const nodes: NodeData[] = []
  for (let i = 0; i < NODE_COUNT; i++) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    const radius = 2.0 + Math.random() * 2.5

    const x = radius * Math.sin(phi) * Math.cos(theta)
    const y = radius * Math.sin(phi) * Math.sin(theta) * 0.6
    const z = radius * Math.cos(phi)

    const position = new THREE.Vector3(x, y, z)
    const colorChoice = Math.random()
    const color = colorChoice < 0.45
      ? BLUE.clone()
      : colorChoice < 0.85
        ? PURPLE.clone()
        : PINK.clone()

    nodes.push({
      position: position.clone(),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.003,
        (Math.random() - 0.5) * 0.003,
        (Math.random() - 0.5) * 0.003,
      ),
      basePosition: position.clone(),
      color,
      phase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.5 + Math.random() * 0.8,
    })
  }
  return nodes
}

function getEdges(nodes: NodeData[]): [number, number][] {
  const edges: [number, number][] = []
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dist = nodes[i].position.distanceTo(nodes[j].position)
      if (dist < CONNECTION_DISTANCE) {
        edges.push([i, j])
      }
    }
  }
  return edges
}

// --- NetworkMesh scene ---

function NetworkMesh({ mousePosition }: { mousePosition: React.RefObject<THREE.Vector3> }) {
  const nodesRef = useRef<NodeData[]>(generateNodes())
  const edgesGeoRef = useRef<THREE.BufferGeometry<THREE.NormalOrGLBufferAttributes>>(null)
  const messagesRef = useRef<MessageParticle[]>([])
  const timeRef = useRef(0)
  const nodeMeshRefs = useRef<(THREE.Mesh | null)[]>(new Array(NODE_COUNT).fill(null))
  const glowMeshRefs = useRef<(THREE.Mesh | null)[]>(new Array(NODE_COUNT).fill(null))
  const messageRefs = useRef<(THREE.Mesh | null)[]>(new Array(MAX_ACTIVE_MESSAGES).fill(null))

  const { viewport } = useThree()

  // Static geometry for node spheres
  const sphereGeo = useMemo(() => new THREE.SphereGeometry(0.06, 12, 8), [])
  const glowGeo = useMemo(() => new THREE.SphereGeometry(0.15, 8, 6), [])
  const messageGeo = useMemo(() => new THREE.SphereGeometry(0.04, 8, 6), [])

  // Edge line material
  const edgeMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: '#60a5fa',
        transparent: true,
        opacity: 0.12,
        depthWrite: false,
      }),
    [],
  )

  // Initialize messages array
  useMemo(() => {
    messagesRef.current = Array.from({ length: MAX_ACTIVE_MESSAGES }, () => ({
      fromIndex: 0,
      toIndex: 1,
      progress: 0,
      color: BLUE.clone(),
      active: false,
    }))
  }, [])

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime
    timeRef.current = time
    const nodes = nodesRef.current
    const mouse3D = mousePosition.current

    // --- Update node positions ---
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i]

      // Subtle floating motion
      const floatX = Math.sin(time * node.pulseSpeed + node.phase) * 0.15
      const floatY = Math.cos(time * node.pulseSpeed * 0.7 + node.phase * 1.3) * 0.12
      const floatZ = Math.sin(time * node.pulseSpeed * 0.5 + node.phase * 0.8) * 0.1

      node.position.x = node.basePosition.x + floatX
      node.position.y = node.basePosition.y + floatY
      node.position.z = node.basePosition.z + floatZ

      // Mouse repulsion (in world space)
      if (mouse3D) {
        const dx = node.position.x - mouse3D.x
        const dy = node.position.y - mouse3D.y
        const distToMouse = Math.sqrt(dx * dx + dy * dy)
        if (distToMouse < MOUSE_INFLUENCE_RADIUS && distToMouse > 0.01) {
          const force = (1 - distToMouse / MOUSE_INFLUENCE_RADIUS) * MOUSE_REPEL_STRENGTH
          node.position.x += (dx / distToMouse) * force * delta * 8
          node.position.y += (dy / distToMouse) * force * delta * 8
        }
      }

      // Update node mesh
      const mesh = nodeMeshRefs.current[i]
      if (mesh) {
        mesh.position.copy(node.position)
        const pulse = 0.8 + Math.sin(time * node.pulseSpeed * 2 + node.phase) * 0.2
        const scale = 0.8 + pulse * 0.4
        mesh.scale.setScalar(scale)
      }

      // Update glow mesh
      const glow = glowMeshRefs.current[i]
      if (glow) {
        glow.position.copy(node.position)
        const glowPulse = 0.7 + Math.sin(time * node.pulseSpeed * 1.5 + node.phase) * 0.3
        glow.scale.setScalar(glowPulse * 1.2)
        const mat = glow.material as THREE.MeshBasicMaterial
        mat.opacity = 0.08 + Math.sin(time * node.pulseSpeed + node.phase) * 0.06
      }
    }

    // --- Update edges ---
    const edgesGeo = edgesGeoRef.current
    if (edgesGeo) {
      const edges = getEdges(nodes)
      const positions = new Float32Array(edges.length * 6)
      const colors = new Float32Array(edges.length * 6)

      for (let e = 0; e < edges.length; e++) {
        const [a, b] = edges[e]
        const nodeA = nodes[a]
        const nodeB = nodes[b]
        const dist = nodeA.position.distanceTo(nodeB.position)
        const opacity = Math.max(0, 1 - dist / CONNECTION_DISTANCE)

        positions[e * 6 + 0] = nodeA.position.x
        positions[e * 6 + 1] = nodeA.position.y
        positions[e * 6 + 2] = nodeA.position.z
        positions[e * 6 + 3] = nodeB.position.x
        positions[e * 6 + 4] = nodeB.position.y
        positions[e * 6 + 5] = nodeB.position.z

        // Blend colors based on edge opacity
        const edgeColor = nodeA.color.clone().lerp(nodeB.color, 0.5)
        const alpha = opacity * 0.35 + Math.sin(time * 2 + e) * 0.05

        colors[e * 6 + 0] = edgeColor.r * alpha
        colors[e * 6 + 1] = edgeColor.g * alpha
        colors[e * 6 + 2] = edgeColor.b * alpha
        colors[e * 6 + 3] = edgeColor.r * alpha
        colors[e * 6 + 4] = edgeColor.g * alpha
        colors[e * 6 + 5] = edgeColor.b * alpha
      }

      edgesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      edgesGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
      edgesGeo.computeBoundingSphere()

      const mat = edgesGeo.userData.material as THREE.LineBasicMaterial | undefined
      if (mat) {
        mat.vertexColors = true
        mat.color.set('#ffffff')
        mat.opacity = 1
      }
    }

    // --- Spawn message particles ---
    const edges = getEdges(nodes)
    if (edges.length > 0 && Math.random() < MESSAGE_SPAWN_CHANCE) {
      const inactiveMsg = messagesRef.current.find((m) => !m.active)
      if (inactiveMsg) {
        const edge = edges[Math.floor(Math.random() * edges.length)]
        inactiveMsg.fromIndex = edge[0]
        inactiveMsg.toIndex = edge[1]
        inactiveMsg.progress = 0
        inactiveMsg.color = nodes[edge[0]].color.clone().lerp(PINK, 0.3)
        inactiveMsg.active = true
      }
    }

    // --- Update message particles ---
    for (let m = 0; m < messagesRef.current.length; m++) {
      const msg = messagesRef.current[m]
      const mesh = messageRefs.current[m]

      if (msg.active) {
        msg.progress += MESSAGE_SPEED + Math.sin(time * 3) * 0.002
        if (msg.progress >= 1) {
          msg.active = false
        }
      }

      if (mesh) {
        if (msg.active) {
          const from = nodes[msg.fromIndex].position
          const to = nodes[msg.toIndex].position
          const t = msg.progress
          // Slight arc for visual interest
          const arcHeight = Math.sin(t * Math.PI) * 0.15
          mesh.position.lerpVectors(from, to, t)
          mesh.position.y += arcHeight
          mesh.visible = true
          const pulse = 1.0 + Math.sin(t * Math.PI * 4) * 0.3
          mesh.scale.setScalar(pulse)
          const mat = mesh.material as THREE.MeshBasicMaterial
          mat.color.copy(msg.color)
          mat.opacity = Math.sin(t * Math.PI) * 0.9 + 0.1
        } else {
          mesh.visible = false
        }
      }
    }
  })

  return (
    <group>
      {/* Node spheres */}
      {nodesRef.current.map((node, i) => (
        <group key={`node-${i}`}>
          {/* Core sphere */}
          <mesh
            ref={(el) => { nodeMeshRefs.current[i] = el }}
            geometry={sphereGeo}
            position={node.position}
          >
            <meshBasicMaterial
              color={node.color}
              transparent
              opacity={0.95}
            />
          </mesh>
          {/* Glow sphere */}
          <mesh
            ref={(el) => { glowMeshRefs.current[i] = el }}
            geometry={glowGeo}
            position={node.position}
          >
            <meshBasicMaterial
              color={node.color}
              transparent
              opacity={0.1}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>
      ))}

      {/* Edges */}
      <lineSegments
        material={edgeMaterial}
      >
        <bufferGeometry
          ref={(geo) => {
            edgesGeoRef.current = geo
            if (geo) {
              geo.userData.material = edgeMaterial
              edgeMaterial.vertexColors = true
              edgeMaterial.color.set('#ffffff')
              edgeMaterial.opacity = 1
            }
          }}
        />
      </lineSegments>

      {/* Message particles */}
      {Array.from({ length: MAX_ACTIVE_MESSAGES }).map((_, i) => (
        <mesh
          key={`msg-${i}`}
          ref={(el) => { messageRefs.current[i] = el }}
          geometry={messageGeo}
          visible={false}
        >
          <meshBasicMaterial
            color={BLUE}
            transparent
            opacity={0.8}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}

      {/* Ambient glow ring — large faint ring behind the mesh */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -1]}>
        <ringGeometry args={[3.5, 5.5, 64]} />
        <meshBasicMaterial
          color="#60a5fa"
          transparent
          opacity={0.015}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  )
}

// --- Mouse tracker ---

function MouseTracker({ mousePosition }: { mousePosition: React.RefObject<THREE.Vector3> }) {
  const { viewport, camera } = useThree()

  useFrame(({ pointer }) => {
    if (mousePosition.current) {
      // Convert normalized pointer coords to world space at z=0
      const x = (pointer.x * viewport.width) / 2
      const y = (pointer.y * viewport.height) / 2
      mousePosition.current.set(x, y, 0)
    }
  })

  return null
}

// --- Main exported component ---

export default function Hero3D() {
  const mousePosition = useRef(new THREE.Vector3(100, 100, 0))
  const [isVisible, setIsVisible] = useState(true)

  const handleCreated = useCallback(() => {
    setIsVisible(true)
  }, [])

  return (
    <div
      className="w-full relative"
      style={{
        height: '600px',
        background: 'transparent',
        overflow: 'hidden',
      }}
    >
      {/* Top gradient fade into page bg */}
      <div
        className="absolute inset-x-0 top-0 z-10 pointer-events-none"
        style={{
          height: '120px',
          background: 'linear-gradient(to bottom, #0a0a0a 0%, transparent 100%)',
        }}
      />
      {/* Bottom gradient fade */}
      <div
        className="absolute inset-x-0 bottom-0 z-10 pointer-events-none"
        style={{
          height: '120px',
          background: 'linear-gradient(to top, #0a0a0a 0%, transparent 100%)',
        }}
      />

      <Suspense fallback={null}>
        <Canvas
          frameloop="always"
          dpr={[1, 1.5]}
          camera={{
            position: [0, 0, 7],
            fov: 55,
            near: 0.1,
            far: 50,
          }}
          style={{
            background: 'transparent',
            opacity: isVisible ? 1 : 0,
            transition: 'opacity 0.8s ease-in',
          }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
          }}
          onCreated={handleCreated}
        >
          {/* Subtle ambient light */}
          <ambientLight intensity={0.3} />
          <pointLight position={[5, 5, 5]} intensity={0.5} color="#60a5fa" />
          <pointLight position={[-5, -3, 3]} intensity={0.3} color="#a78bfa" />

          <NetworkMesh mousePosition={mousePosition} />
          <MouseTracker mousePosition={mousePosition} />

          <OrbitControls
            enableZoom={false}
            enablePan={false}
            enableRotate={false}
            autoRotate
            autoRotateSpeed={0.4}
          />

          {/* Background fog for depth */}
          <fog attach="fog" args={['#0a0a0a', 6, 16]} />
        </Canvas>
      </Suspense>
    </div>
  )
}
