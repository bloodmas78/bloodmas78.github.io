import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { memberData } from '../data'

function Random() {
  const [selectedMembers, setSelectedMembers] = useState<string[]>(() => memberData.slice(0, 3).map((member) => member.nickname))
  const [rolling, setRolling] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const [statusText, setStatusText] = useState('참여 멤버를 선택한 뒤 한 번 눌러보세요.')
  const [isCelebrating, setIsCelebrating] = useState(false)
  const [confettiPieces, setConfettiPieces] = useState<Array<{ id: number; left: string; delay: string; duration: string; color: string }>>([])
  const containerRef = useRef<HTMLDivElement | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const groupRef = useRef<THREE.Group | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const rollingRef = useRef(false)
  const winnerIndexRef = useRef<number | null>(null)
  const faceDataRef = useRef<Array<{ normal: THREE.Vector3; centroid: THREE.Vector3; angle: number }>>([])
  const spinStartRotationRef = useRef(0)
  const spinTargetRotationRef = useRef(0)
  const spinStartTimeRef = useRef(0)
  const spinDurationRef = useRef(0)
  const focusStartCameraPosRef = useRef<THREE.Vector3>(new THREE.Vector3())
  const focusEndCameraPosRef = useRef<THREE.Vector3>(new THREE.Vector3())
  const focusStartTargetRef = useRef<THREE.Vector3>(new THREE.Vector3())
  const focusEndTargetRef = useRef<THREE.Vector3>(new THREE.Vector3())
  const focusStartTimeRef = useRef(0)
  const focusAnimatingRef = useRef(false)
  const initialCameraPositionRef = useRef<THREE.Vector3>(new THREE.Vector3())
  const initialCameraTargetRef = useRef<THREE.Vector3>(new THREE.Vector3())

  const displayFaces = useMemo(() => selectedMembers, [selectedMembers])
  const canStart = selectedMembers.length >= 2

  useEffect(() => {
    if (!isCelebrating) return

    const timeoutId = window.setTimeout(() => {
      setIsCelebrating(false)
    }, 1800)

    return () => window.clearTimeout(timeoutId)
  }, [isCelebrating])

  useEffect(() => {
    const mount = containerRef.current
    if (!mount) return

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    rendererRef.current = renderer
    mount.innerHTML = ''
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 0.1, 100)
    camera.position.set(0, 4.4, 5.4)
    camera.lookAt(0, 0, 0)

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.4)
    directionalLight.position.set(4, 6, 4)
    scene.add(ambientLight, directionalLight)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.enablePan = false
    controls.minDistance = 3.5
    controls.maxDistance = 8
    controls.target.set(0, 0.2, 0)
    controls.update()
    controlsRef.current = controls
    initialCameraPositionRef.current.copy(camera.position)
    initialCameraTargetRef.current.copy(controls.target)

    const group = new THREE.Group()
    scene.add(group)
    groupRef.current = group
    cameraRef.current = camera

    const segmentCount = Math.max(2, displayFaces.length)
    const segmentAngle = (Math.PI * 2) / segmentCount
    const segmentRadius = 2.2
    const startAngle = -Math.PI / 2 - segmentAngle / 2

    const wheelBase = new THREE.Mesh(
      new THREE.CylinderGeometry(segmentRadius + 0.18, segmentRadius + 0.18, 0.28, 64),
      new THREE.MeshPhysicalMaterial({
        color: 0x0f172a,
        roughness: 0.72,
        metalness: 0.18,
        clearcoat: 0.18,
      }),
    )
    wheelBase.position.y = -0.18
    group.add(wheelBase)

    const wheelEdge = new THREE.Mesh(
      new THREE.TorusGeometry(segmentRadius + 0.28, 0.1, 16, 64),
      new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.68,
        metalness: 0.18,
      }),
    )
    wheelEdge.rotation.x = Math.PI / 2
    wheelEdge.position.y = -0.02
    group.add(wheelEdge)

    const outerRim = new THREE.Mesh(
      new THREE.TorusGeometry(segmentRadius + 0.16, 0.16, 16, 100),
      new THREE.MeshStandardMaterial({
        color: 0x475569,
        roughness: 0.55,
        metalness: 0.08,
      }),
    )
    outerRim.rotation.x = Math.PI / 2
    outerRim.position.y = 0.06
    group.add(outerRim)

    const innerDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(segmentRadius * 0.32, segmentRadius * 0.32, 0.15, 64),
      new THREE.MeshStandardMaterial({
        color: 0x111827,
        roughness: 0.6,
        metalness: 0.25,
      }),
    )
    innerDisc.position.y = 0.14
    group.add(innerDisc)

    const centerHub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.32, 0.26, 32),
      new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        roughness: 0.3,
        metalness: 0.7,
      }),
    )
    centerHub.position.y = 0.28
    group.add(centerHub)

    const segmentColors = displayFaces.map((name) => {
      const member = memberData.find((item) => item.nickname === name)
      return member ? parseInt(member.avatarColor.slice(1), 16) : 0x94a3b8
    })

    const separatorMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.65,
      metalness: 0.2,
    })

    const createSegmentMesh = (index: number, color: number) => {
      const start = startAngle + index * segmentAngle
      const end = start + segmentAngle
      const shape = new THREE.Shape()
      shape.moveTo(0, 0)
      shape.lineTo(Math.cos(start) * segmentRadius, Math.sin(start) * segmentRadius)
      shape.absarc(0, 0, segmentRadius, start, end, false)
      shape.lineTo(0, 0)

      const geom = new THREE.ExtrudeGeometry(shape, {
        depth: 0.32,
        bevelEnabled: true,
        bevelThickness: 0.025,
        bevelSize: 0.03,
        bevelOffset: 0,
        bevelSegments: 2,
      })
      geom.rotateX(-Math.PI / 2)
      geom.translate(0, 0.14, 0)

      const material = new THREE.MeshPhysicalMaterial({
        color,
        roughness: 0.18,
        metalness: 0.35,
        clearcoat: 0.45,
        clearcoatRoughness: 0.12,
      })
      return new THREE.Mesh(geom, material)
    }

    const labelRadius = segmentRadius * 0.52
    const faceData = displayFaces.map((_, index) => {
      const mid = -Math.PI / 2 + index * segmentAngle
      return {
        normal: new THREE.Vector3(0, 1, 0),
        centroid: new THREE.Vector3(Math.cos(mid) * labelRadius, 0.22, Math.sin(mid) * labelRadius),
        angle: mid,
      }
    })

    faceDataRef.current = faceData

    displayFaces.forEach((_, index) => {
      const mesh = createSegmentMesh(index, segmentColors[index % segmentColors.length])
      group.add(mesh)
    })

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(segmentRadius + 1.4, 64),
      new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.9,
        metalness: 0.05,
      }),
    )
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -0.19
    scene.add(floor)

    const glowRim = new THREE.Mesh(
      new THREE.TorusGeometry(segmentRadius + 0.5, 0.08, 16, 120),
      new THREE.MeshStandardMaterial({
        color: 0x8b5cf6,
        emissive: 0x8b5cf6,
        emissiveIntensity: 0.18,
        roughness: 0.35,
        metalness: 0.55,
      }),
    )
    glowRim.rotation.x = Math.PI / 2
    glowRim.position.y = 0.02
    group.add(glowRim)

    displayFaces.forEach((_, index) => {
      const line = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.14, segmentRadius * 1.06),
        separatorMaterial,
      )
      line.position.set(0, 0.18, 0)
      line.rotation.y = startAngle + index * segmentAngle
      group.add(line)
    })

    faceData.forEach((face, index) => {
      const iconGroup = new THREE.Group()
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.15, 16),
        new THREE.MeshStandardMaterial({
          color: segmentColors[index % segmentColors.length],
          roughness: 0.3,
          metalness: 0.2,
        }),
      )
      body.position.y = 0.22
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.095, 16, 16),
        new THREE.MeshStandardMaterial({
          color: 0xffffff,
          roughness: 0.25,
          metalness: 0.15,
        }),
      )
      head.position.y = 0.34
      iconGroup.add(body, head)
      iconGroup.position.copy(face.centroid)
      iconGroup.position.y = 0.14
      iconGroup.rotation.y = -face.angle
      group.add(iconGroup)
    })

    const indicator = new THREE.Mesh(
      new THREE.ConeGeometry(0.18, 0.45, 16),
      new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3, metalness: 0.2 }),
    )
    indicator.rotation.x = Math.PI
    indicator.position.set(0, 0.45, -segmentRadius - 0.22)
    scene.add(indicator)

    const ring = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.4, 16),
      new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3, metalness: 0.2 }),
    )
    ring.position.set(0, 0.2, -segmentRadius - 0.22)
    scene.add(ring)

    const labelGroup = new THREE.Group()
    group.add(labelGroup)

    faceData.forEach((face, index) => {
      const member = displayFaces[index]
      const canvas = document.createElement('canvas')
      canvas.width = 512
      canvas.height = 128
      const context = canvas.getContext('2d')
      if (!context) return

      context.clearRect(0, 0, canvas.width, canvas.height)
      context.fillStyle = '#ffffff'
      context.font = '700 42px sans-serif'
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.shadowColor = 'rgba(0, 0, 0, 0.8)'
      context.shadowBlur = 12
      context.shadowOffsetX = 0
      context.shadowOffsetY = 0
      context.fillText(member, canvas.width / 2, canvas.height / 2)

      const texture = new THREE.CanvasTexture(canvas)
      texture.colorSpace = THREE.SRGBColorSpace
      const labelMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(1.8, 0.45),
        new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, depthTest: false, side: THREE.DoubleSide }),
      )
      labelMesh.rotation.x = -Math.PI / 2
      labelMesh.position.copy(face.centroid)
      labelMesh.position.y = 0.35
      labelGroup.add(labelMesh)
    })

    const animate = () => {
      animationFrameRef.current = window.requestAnimationFrame(animate)

      if (rollingRef.current && groupRef.current) {
        const elapsed = performance.now() - spinStartTimeRef.current
        const progress = Math.min(1, elapsed / spinDurationRef.current)
        const eased = 1 - Math.pow(1 - progress, 3)
        let rotation = spinStartRotationRef.current + (spinTargetRotationRef.current - spinStartRotationRef.current) * eased

        if (progress > 0.72) {
          const tension = (progress - 0.72) / 0.28
          const wobble = Math.sin(tension * Math.PI * 4) * (1 - tension) * 0.16
          rotation += wobble
        }

        groupRef.current.rotation.y = rotation

        if (progress >= 1) {
          rollingRef.current = false
          setRolling(false)
          if (winnerIndexRef.current !== null) {
            const selectedWinner = displayFaces[winnerIndexRef.current]
            setWinner(selectedWinner)
            setStatusText(`✨ ${selectedWinner}님이 당첨됐어요!`)
            setIsCelebrating(true)
            setConfettiPieces(
              Array.from({ length: 24 }, (_, index) => ({
                id: Date.now() + index,
                left: `${Math.random() * 100}%`,
                delay: `${Math.random() * 0.2}s`,
                duration: `${1.2 + Math.random() * 0.8}s`,
                color: ['#f59e0b', '#fb7185', '#60a5fa', '#34d399', '#a78bfa'][index % 5],
              })),
            )
            if (cameraRef.current && controlsRef.current) {
              const face = faceDataRef.current[winnerIndexRef.current]
              if (face) {
                const worldCentroid = face.centroid.clone()
                group.localToWorld(worldCentroid)
                focusStartCameraPosRef.current.copy(cameraRef.current.position)
                focusStartTargetRef.current.copy(controlsRef.current.target)
                focusEndTargetRef.current.copy(worldCentroid)
                focusEndCameraPosRef.current.copy(worldCentroid).add(new THREE.Vector3(0, 1.6, 2.3))
                focusStartTimeRef.current = performance.now()
                focusAnimatingRef.current = true
              }
            }
          }
        }
      }

      if (focusAnimatingRef.current && cameraRef.current && controlsRef.current) {
        const focusElapsed = performance.now() - focusStartTimeRef.current
        const focusProgress = Math.min(1, focusElapsed / 800)
        const ease = 1 - Math.pow(1 - focusProgress, 3)
        cameraRef.current.position.copy(focusStartCameraPosRef.current.clone().lerp(focusEndCameraPosRef.current, ease))
        controlsRef.current.target.copy(focusStartTargetRef.current.clone().lerp(focusEndTargetRef.current, ease))
        controlsRef.current.update()

        if (focusProgress >= 1) {
          focusAnimatingRef.current = false
        }
      }

      controls.update()
      renderer.render(scene, camera)
    }

    animationFrameRef.current = window.requestAnimationFrame(animate)

    const handleResize = () => {
      const width = mount.clientWidth
      const height = mount.clientHeight
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current)
      }
      controls.dispose()
      renderer.dispose()
      scene.clear()
      groupRef.current = null
      mount.innerHTML = ''
    }
  }, [displayFaces, selectedMembers.length])

  const toggleMember = (nickname: string) => {
    setSelectedMembers((current) => {
      if (current.includes(nickname)) {
        if (current.length <= 2) return current
        return current.filter((member) => member !== nickname)
      }

      return [...current, nickname]
    })
  }

  const startDraw = () => {
    if (!canStart || rolling) return

    setRolling(true)
    setWinner(null)
    setStatusText('🎲 굴리는 중... 회전이 멈추면 결과가 보여요')
    setIsCelebrating(false)
    setConfettiPieces([])

    const faces = faceDataRef.current
    if (faces.length === 0) return

    const targetIndex = Math.floor(Math.random() * faces.length)
    const segmentAngle = (Math.PI * 2) / faces.length
    const desiredRotation = -targetIndex * segmentAngle

    const currentRotation = groupRef.current?.rotation.y ?? 0
    const normalizedCurrent = ((currentRotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
    const normalizedDesired = ((desiredRotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
    const deltaRotation = ((normalizedDesired - normalizedCurrent) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2)

    const extraTurns = 4 * Math.PI * 2
    spinStartRotationRef.current = currentRotation
    spinTargetRotationRef.current = currentRotation + deltaRotation + extraTurns
    spinStartTimeRef.current = performance.now()
    spinDurationRef.current = 5200
    winnerIndexRef.current = targetIndex
    rollingRef.current = true
    if (focusAnimatingRef.current) {
      focusAnimatingRef.current = false
    }

    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.copy(initialCameraPositionRef.current)
      controlsRef.current.target.copy(initialCameraTargetRef.current)
      controlsRef.current.update()
    }
  }

  return (
    <div className="home-page random-page">
      <section className="home-hero random-hero">
        <div className="home-badge">🎲 랜덤 뽑기</div>
        <h1>주사위처럼 굴려서 한 명을 뽑아요</h1>
        <p>
          9shot 멤버 중 참여 인원을 선택하고, three.js로 만든 3D 회전판으로
          한 명을 골라보세요. 최소 2명 이상이 필요합니다.
        </p>

        <div className="random-controls">
          <div className="random-picker-panel">
            <div className="random-picker-head">
              <strong>참여 멤버</strong>
              <span>{selectedMembers.length}명 선택됨</span>
            </div>
            <div className="random-member-list">
              {memberData.map((member) => {
                const active = selectedMembers.includes(member.nickname)
                return (
                  <button
                    key={member.nickname}
                    type="button"
                    className={`random-member-chip ${active ? 'active' : ''}`}
                    onClick={() => toggleMember(member.nickname)}
                  >
                    <span className="random-member-dot" style={{ backgroundColor: member.avatarColor }} />
                    {member.nickname}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="random-picker-panel">
            <div className="random-stage-shell">
              <div ref={containerRef} className="random-stage" />
              {isCelebrating && (
                <div className="random-confetti-layer" aria-hidden="true">
                  {confettiPieces.map((piece) => (
                    <span
                      key={piece.id}
                      className="random-confetti-piece"
                      style={{
                        left: piece.left,
                        animationDelay: piece.delay,
                        animationDuration: piece.duration,
                        backgroundColor: piece.color,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            <button type="button" className="random-draw-btn" onClick={startDraw} disabled={!canStart || rolling}>
              {rolling ? '굴리는 중...' : winner ? '다시 뽑기' : '한 명 뽑기'}
            </button>

            <div className="random-status-pill">
              <span className={`random-status-dot ${rolling ? 'rolling' : winner ? 'done' : 'idle'}`} />
              {statusText}
            </div>

            <div className="random-result">
              <span className="random-result-label">이번 당첨</span>
              <strong>{winner ?? '아직 뽑지 않았어요'}</strong>
            </div>
          </div>
        </div>

        <div className="home-actions">
          <Link className="home-card-link" to="/">
            첫 화면으로 가기
          </Link>
        </div>
      </section>
    </div>
  )
}

export default Random
