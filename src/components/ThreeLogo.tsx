import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'
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
    cuePos: new THREE.Vector3(0, 0, -5),
    cueRot: new THREE.Vector3(-Math.PI / 2, 0, 0),
    cueOpacity: 0,
    ballScale: new THREE.Vector3(1, 1, 1)
  })
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 2048
    canvas.height = 1024
    const ctx = canvas.getContext('2d')
    if (ctx) {
      // 공 전체를 중간 톤의 노란색으로
      ctx.fillStyle = '#fbbf24'
      ctx.fillRect(0, 0, 2048, 1024)

      ctx.fillStyle = '#111111'
      ctx.font = '900 340px "Arial Black", Impact, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('9', 512, 530)
      ctx.fillText('9', 1536, 530)
    }
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 16
    return tex
  }, [])

  useFrame((state, delta) => {
    const s = stateRef.current
    s.timer += delta

    if (s.phase === 0) {
      // Idle - 공 멈춰있고 아이들링 없음 (y=0이면 x=512 텍스처가 +Z 정면)
      s.ballRot.set(0, 0, 0)
      s.ballPos.set(0, 0, 0)
      s.cueOpacity = Math.max(0, s.cueOpacity - delta * 2)

      if (s.timer > 2.0) {
        s.phase = 1
        s.timer = 0
      }
    } else if (s.phase === 1) {
      // Aiming (0 ~ 1.2s)
      s.cueOpacity = Math.min(1, s.cueOpacity + delta * 3)
      s.ballPos.set(0, 0, 0)
      s.ballRot.set(0, 0, 0)

      const aimProgress = Math.min(s.timer / 1.2, 1)
      const pullBack = Math.sin(aimProgress * Math.PI * 3) * 0.5 + 0.2

      // 사용자 시점(우측 하단 앞쪽)에서 공을 향하도록 배치
      const handDir = new THREE.Vector3(-0.3, 3.5, -3.0).normalize()
      // 공 반경(0.75) + 큐대 팁 오프셋(0.45) = 1.2가 최소 거리
      const dist = Math.max(1.2, 1.2 + pullBack * 1.5)
      s.cuePos.copy(handDir).multiplyScalar(dist)

      dummy.position.copy(s.cuePos)
      dummy.lookAt(0, 0, 0)
      dummy.rotateX(-Math.PI / 2)
      s.cueRot.set(dummy.rotation.x, dummy.rotation.y, dummy.rotation.z)

      if (s.timer > 1.2) {
        s.phase = 2
        s.timer = 0
      }
    } else if (s.phase === 2) {
      // Striking (0 ~ 0.05s) - 빠르게 타격
      const strikeProgress = Math.min(s.timer / 0.05, 1)

      const handDir = new THREE.Vector3(-0.3, 3.5, -3.0).normalize()
      // 1.5 → 1.2 까지만 접근 (팁이 공 표면에 닿는 지점에서 멈춤)
      const dist = 1.5 - strikeProgress * 0.3
      s.cuePos.copy(handDir).multiplyScalar(dist)

      dummy.position.copy(s.cuePos)
      dummy.lookAt(0, 0, 0)
      dummy.rotateX(-Math.PI / 2)
      s.cueRot.set(dummy.rotation.x, dummy.rotation.y, dummy.rotation.z)
      if (s.timer > 0.05) {
        s.phase = 3
        s.timer = 0
        // 임팩트 순간 공 찌그러짐
        s.ballScale.set(1.2, 0.8, 1.2)
      }
    } else if (s.phase === 3) {
      // Spinning & stopping (0 ~ 2s) - 단일 이징으로 자연스럽게 감속
      s.cueOpacity = Math.max(0, s.cueOpacity - delta * 3)

      const duration = 2.0;
      const progress = Math.min(s.timer / duration, 1);

      // 임팩트 시작 시 목표 회전 계산 (한 번만)
      if (!s.spinTarget) {
        // 현재 각도에서 6바퀴(12π) 더 돌리고, 가장 가까운 2π 배수에 착지
        const totalSpin = s.ballRot.x - Math.PI * 12;
        s.spinTarget = Math.round(totalSpin / (Math.PI * 2)) * Math.PI * 2;
        s.spinStart = s.ballRot.x;
      }

      // quintic ease-out: 처음에 아주 빠르게, 끝에서 아주 서서히 멈춤
      const eased = 1 - Math.pow(1 - progress, 5);

      s.ballRot.x = s.spinStart + (s.spinTarget - s.spinStart) * eased;
      s.ballRot.y = THREE.MathUtils.lerp(s.ballRot.y, 0, progress);
      s.ballRot.z = THREE.MathUtils.lerp(s.ballRot.z, 0, progress);

      // 임팩트 직후 미세한 진동
      if (progress < 0.05) {
        const shake = Math.sin(s.timer * 150) * 0.05 * (1 - progress / 0.05);
        s.ballPos.set(shake, Math.abs(shake), 0);
      } else {
        s.ballPos.set(0, 0, 0);
      }

      // 찌그러진 공 원상복구
      s.ballScale.lerp(new THREE.Vector3(1, 1, 1), delta * 15);

      if (s.timer > duration) {
        s.phase = 0
        s.timer = 0
        s.spinTarget = null
        s.spinStart = null
      }
    }

    if (ballRef.current) {
      ballRef.current.position.copy(s.ballPos)
      ballRef.current.rotation.set(s.ballRot.x, s.ballRot.y, s.ballRot.z)
      ballRef.current.scale.copy(s.ballScale)
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
        <sphereGeometry args={[0.75, 64, 64]} />
        <meshPhysicalMaterial
          map={texture}
          metalness={0}
          roughness={0.2}
          clearcoat={0.4}
          clearcoatRoughness={0.15}
        />
      </mesh>

      {/* 인라인 큐대 컴포넌트 - 50% 축소 (scale 4.5) */}
      <group ref={cueGroupRef} scale={4.5}>
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
      {/* 카메라를 더 아래로 내려서 공이 화면 위쪽에 보이게 함 */}
      <Canvas shadows camera={{ position: [0, 0, 2.8], fov: 45 }}>
        <ambientLight intensity={0.8} />
        <directionalLight 
          position={[5, 40, 10]} 
          intensity={1.5} 
          castShadow 
          shadow-radius={12} 
          shadow-mapSize={[1024, 1024]} 
        />
        <pointLight position={[0, 30, 5]} intensity={0.5} />
        {/* 공 테두리의 어두운 그림자를 없애기 위한 후면/하단 림 라이트(Rim Light) */}
        <pointLight position={[0, -10, -10]} intensity={0.8} />
        <pointLight position={[-10, 0, -10]} intensity={0.5} />
        <pointLight position={[10, 0, -10]} intensity={0.5} />

        <AnimatedScene />

        {/* studio 환경의 검은 배경이 테두리에 반사되는 것을 막기 위해 전체적으로 밝은 apartment 환경 사용 */}
        <Environment preset="apartment" environmentRotation={[-Math.PI / 2, 0, 0]} />

        {/* ContactShadows 대신 plane + shadowMaterial을 사용하여 큐대 그림자를 없앰 (큐대는 castShadow가 없으므로) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.75, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <shadowMaterial opacity={0.06} />
        </mesh>
      </Canvas>
    </div>
  )
}
