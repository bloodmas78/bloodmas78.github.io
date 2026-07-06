import { useMemo, useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import * as THREE from 'three'



function AnimatedScene() {
  const ballRef = useRef<THREE.Mesh>(null)
  const cueGroupRef = useRef<THREE.Group>(null)
  
  // 애니메이션 상태 관리
  // phase: 0=idle, 1=aiming, 2=striking, 3=rolling, 4=resetting
  const stateRef = useRef({
    phase: 0,
    timer: 0,
    ballPos: new THREE.Vector3(0, 0, 0),
    ballRot: new THREE.Vector3(0, 0, 0),
    cuePos: new THREE.Vector3(10, 10, 10),
    cueRot: new THREE.Vector3(0, 0, -Math.PI / 2 + 0.3),
    cueOpacity: 0
  })

  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 2048
    canvas.height = 1024
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#fdfdfd'
      ctx.fillRect(0, 0, 2048, 1024)
      ctx.fillStyle = '#ffcc00'
      ctx.fillRect(0, 256, 2048, 512)
      ctx.beginPath()
      ctx.arc(512, 512, 180, 0, Math.PI * 2)
      ctx.fillStyle = '#ffffff'
      ctx.fill()
      ctx.beginPath()
      ctx.arc(1536, 512, 180, 0, Math.PI * 2)
      ctx.fillStyle = '#ffffff'
      ctx.fill()
      ctx.fillStyle = '#111111'
      ctx.font = 'bold 220px Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('9', 512, 530)
      ctx.fillText('9', 1536, 530)
      ctx.fillRect(452, 660, 120, 12)
      ctx.fillRect(1476, 660, 120, 12)
    }
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 16
    return tex
  }, [])

  useFrame((state, delta) => {
    const s = stateRef.current
    s.timer += delta

    // y축 부유 효과 (idle 상태일 때만)
    const floatY = Math.sin(state.clock.elapsedTime * 2) * 0.1

    if (s.phase === 0) {
      // Idle (0 ~ 2s)
      s.ballRot.y -= delta * 0.4
      s.ballRot.x += delta * 0.1
      s.ballPos.set(0, floatY, 0)
      s.cueOpacity = Math.max(0, s.cueOpacity - delta * 2)
      
      if (s.timer > 2.0) {
        s.phase = 1
        s.timer = 0
      }
    } else if (s.phase === 1) {
      // Aiming (0 ~ 1.2s)
      s.cueOpacity = Math.min(1, s.cueOpacity + delta * 3)
      s.ballPos.set(0, floatY, 0)
      
      const aimProgress = Math.min(s.timer / 1.2, 1)
      const pullBack = Math.sin(aimProgress * Math.PI * 3) * 0.5 + 0.2
      
      s.cuePos.set(1.5 + pullBack, floatY + 0.2 + pullBack * 0.3, 0)

      if (s.timer > 1.2) {
        s.phase = 2
        s.timer = 0
      }
    } else if (s.phase === 2) {
      // Striking (0 ~ 0.05s) - 빠르게 타격
      const strikeProgress = Math.min(s.timer / 0.05, 1)
      const pullBack = 0.2 - strikeProgress * 0.4 
      
      s.cuePos.set(1.5 + pullBack, floatY + 0.2 + pullBack * 0.3, 0)
      
      if (s.timer > 0.05) {
        s.phase = 3
        s.timer = 0
      }
    } else if (s.phase === 3) {
      // Spinning in place (0 ~ 1.5s)
      s.cueOpacity = Math.max(0, s.cueOpacity - delta * 3)
      
      // 제자리에서 회전만 함 (구르는 이동 없음)
      const spinSpeed = Math.max(0, 20 - s.timer * 13) 
      s.ballRot.z -= spinSpeed * delta 
      
      if (s.timer > 1.5) {
        s.phase = 0
        s.timer = 0
      }
    }

    if (ballRef.current) {
      ballRef.current.position.copy(s.ballPos)
      ballRef.current.rotation.set(s.ballRot.x, s.ballRot.y, s.ballRot.z)
    }

    if (cueGroupRef.current) {
      cueGroupRef.current.position.copy(s.cuePos)
      cueGroupRef.current.rotation.set(s.cueRot.x, s.cueRot.y, s.cueRot.z)
      cueGroupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material.opacity = s.cueOpacity
          child.material.transparent = true
        }
      })
    }
  })

  return (
    <>
      <mesh 
        ref={ballRef} 
        castShadow 
        receiveShadow 
      >
        <sphereGeometry args={[1.5, 64, 64]} />
        <meshPhysicalMaterial 
          map={texture} 
          metalness={0.15}
          roughness={0.1}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
        />
      </mesh>
      
      {/* 인라인 큐대 컴포넌트 */}
      <group ref={cueGroupRef} scale={6}>
        <mesh position={[0, 4, 0]} frustumCulled={false}>
          <cylinderGeometry args={[0.08, 0.02, 8, 16]} />
          <meshStandardMaterial color="#d4a373" />
        </mesh>
        <mesh position={[0, 8.05, 0]} frustumCulled={false}>
          <cylinderGeometry args={[0.08, 0.08, 0.1, 16]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
        <mesh position={[0, -0.05, 0]} frustumCulled={false}>
          <cylinderGeometry args={[0.02, 0.02, 0.1, 16]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, -0.1, 0]} frustumCulled={false}>
          <cylinderGeometry args={[0.02, 0.02, 0.02, 16]} />
          <meshStandardMaterial color="#0077b6" />
        </mesh>
      </group>
    </>
  )
}

export default function ThreeLogo() {
  return (
    <div className="three-logo-container">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 10]} intensity={1.5} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        <AnimatedScene />
        
        <Environment preset="studio" />
        
        <OrbitControls 
          enableZoom={false} 
          enablePan={false} 
          minPolarAngle={Math.PI / 3} 
          maxPolarAngle={Math.PI / 1.5} 
        />
      </Canvas>
    </div>
  )
}
