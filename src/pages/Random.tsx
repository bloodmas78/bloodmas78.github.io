import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import * as THREE from 'three'
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
  const rotationRef = useRef(0)
  const rollingRef = useRef(false)
  const winnerIndexRef = useRef<number | null>(null)
  const spinStartTimeRef = useRef(0)
  const spinDurationRef = useRef(0)
  const spinFromRef = useRef(0)
  const spinToRef = useRef(0)

  const faceCount = selectedMembers.length
  const canStart = faceCount >= 3

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
    camera.position.set(0, 0, 5.2)

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5)
    directionalLight.position.set(3, 4, 4)
    scene.add(ambientLight, directionalLight)

    const group = new THREE.Group()
    scene.add(group)

    const polyGeometry = new THREE.CylinderGeometry(1.15, 1.15, 0.45, faceCount, 1, false)
    const polyMaterial = new THREE.MeshStandardMaterial({
      color: 0xfef3c7,
      roughness: 0.35,
      metalness: 0.18,
      emissive: 0x8b5cf6,
      emissiveIntensity: 0.04,
    })
    const polyMesh = new THREE.Mesh(polyGeometry, polyMaterial)
    group.add(polyMesh)

    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(polyGeometry),
      new THREE.LineBasicMaterial({ color: 0x111827, linewidth: 1 }),
    )
    group.add(edges)

    const labelGroup = new THREE.Group()
    group.add(labelGroup)

    selectedMembers.forEach((member, index) => {
      const canvas = document.createElement('canvas')
      canvas.width = 256
      canvas.height = 128

      const context = canvas.getContext('2d')
      if (!context) return

      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.fillStyle = '#111827'
      context.font = '700 38px sans-serif'
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.fillText(member, canvas.width / 2, canvas.height / 2)

      const texture = new THREE.CanvasTexture(canvas)
      texture.colorSpace = THREE.SRGBColorSpace
      const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
      })
      const sprite = new THREE.Sprite(spriteMaterial)
      sprite.scale.set(1.1, 0.55, 1)

      const angle = (index / faceCount) * Math.PI * 2
      sprite.position.set(Math.cos(angle) * 1.45, 0, Math.sin(angle) * 1.45)
      sprite.material.rotation = angle + Math.PI / 2
      labelGroup.add(sprite)
    })

    const animate = () => {
      animationFrameRef.current = window.requestAnimationFrame(animate)

      if (rollingRef.current) {
        const elapsed = performance.now() - spinStartTimeRef.current
        const progress = Math.min(1, elapsed / spinDurationRef.current)
        const easedProgress = 1 - Math.pow(1 - progress, 3)
        rotationRef.current = spinFromRef.current + (spinToRef.current - spinFromRef.current) * easedProgress

        if (progress >= 1) {
          rotationRef.current = spinToRef.current
          rollingRef.current = false
          setRolling(false)
          if (winnerIndexRef.current !== null) {
            const selectedWinner = selectedMembers[winnerIndexRef.current]
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
          }
        }
      }

      group.rotation.y = THREE.MathUtils.degToRad(rotationRef.current)
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
      renderer.dispose()
      polyGeometry.dispose()
      polyMaterial.dispose()
      edges.material.dispose()
      scene.clear()
      mount.innerHTML = ''
    }
  }, [faceCount, selectedMembers])

  const toggleMember = (nickname: string) => {
    setSelectedMembers((current) => {
      if (current.includes(nickname)) {
        if (current.length <= 3) return current
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

    const spins = 8 + Math.floor(Math.random() * 5)
    const targetIndex = Math.floor(Math.random() * selectedMembers.length)
    const targetRotation = 360 * spins + (360 / selectedMembers.length) * (selectedMembers.length - targetIndex)

    spinStartTimeRef.current = performance.now()
    spinDurationRef.current = 1800 + Math.random() * 400
    spinFromRef.current = rotationRef.current
    spinToRef.current = rotationRef.current + targetRotation
    winnerIndexRef.current = targetIndex
    rollingRef.current = true
  }

  return (
    <div className="home-page random-page">
      <section className="home-hero random-hero">
        <div className="home-badge">🎲 랜덤 뽑기</div>
        <h1>주사위처럼 굴려서 한 명을 뽑아요</h1>
        <p>
          9shot 멤버 중 참여 인원을 선택하고, three.js로 만든 3D 회전판으로
          한 명을 골라보세요. 최소 3명 이상이 필요합니다.
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
              <div className="random-pointer" aria-hidden="true">
                <span />
              </div>
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
