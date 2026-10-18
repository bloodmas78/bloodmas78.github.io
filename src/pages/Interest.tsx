import { useState, useEffect } from 'react'

export type ItemCategory = 'product' | 'game' | 'stock' | 'etc'

interface TrackedItem {
  id: string
  title: string
  category: ItemCategory
  status: string
  note: string
  registeredAt: string
}

const DEFAULT_ITEMS: TrackedItem[] = [
  {
    id: '1',
    title: '닌텐도 스위치 2 (Nintendo Switch 2)',
    category: 'game',
    status: '출시 정보 추적중',
    note: '공식 발표일, 하위 호환성, 사전예약 시작 알림 모니터링',
    registeredAt: '2026.10',
  },
  {
    id: '2',
    title: '엔비디아 (NVDA)',
    category: 'stock',
    status: '시세 & 실적 추적',
    note: '실적 발표 일정, AI 반도체 동향, 목표 주가 변동 모니터링',
    registeredAt: '2026.10',
  },
  {
    id: '3',
    title: 'M3 맥북 에어 15인치',
    category: 'product',
    status: '핫딜 특가 추적',
    note: '카드 청구할인 및 오픈마켓 역대 최저가 모니터링',
    registeredAt: '2026.10',
  },
]

const STORAGE_KEY = '9shot_tracked_interests_v2'

function Interest() {
  const [items, setItems] = useState<TrackedItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (e) {
      console.error('Failed to parse tracked items from storage', e)
    }
    return DEFAULT_ITEMS
  })

  const [inputTitle, setInputTitle] = useState('')
  const [inputCategory, setInputCategory] = useState<ItemCategory>('product')
  const [selectedFilter, setSelectedFilter] = useState<'all' | ItemCategory>('all')

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch (e) {
      console.error('Failed to save tracked items to storage', e)
    }
  }, [items])

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = inputTitle.trim()
    if (!trimmed) return

    const getInitialStatus = (cat: ItemCategory) => {
      switch (cat) {
        case 'stock':
          return '시세 & 소식 추적중'
        case 'game':
          return '출시 & 핫딜 추적중'
        case 'product':
          return '핫딜 특가 탐색중'
        default:
          return '실시간 정보 추적중'
      }
    }

    const newItem: TrackedItem = {
      id: Date.now().toString(),
      title: trimmed,
      category: inputCategory,
      status: getInitialStatus(inputCategory),
      note: '등록 완료! 실시간 시세 및 최신 소식 수집 대기 중',
      registeredAt: new Date().toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
      }),
    }

    setItems((prev) => [newItem, ...prev])
    setInputTitle('')
  }

  const handleDeleteItem = (id: string) => {
    if (window.confirm('이 관심 아이템을 삭제할까요?')) {
      setItems((prev) => prev.filter((item) => item.id !== id))
    }
  }

  const filteredItems = items.filter((item) => {
    if (selectedFilter === 'all') return true
    return item.category === selectedFilter
  })

  const getCategoryLabel = (cat: ItemCategory) => {
    switch (cat) {
      case 'product':
        return '🛍️ 쇼핑/핫딜'
      case 'game':
        return '🎮 게임/콘솔'
      case 'stock':
        return '📈 주식/투자'
      default:
        return '✨ 기타 관심사'
    }
  }

  const renderActionLinks = (item: TrackedItem) => {
    const encoded = encodeURIComponent(item.title)

    switch (item.category) {
      case 'stock':
        return (
          <>
            <a
              href={`https://finance.naver.com/search/search.naver?query=${encoded}`}
              target="_blank"
              rel="noopener noreferrer"
              className="search-link-btn"
              title="네이버 증권에서 종목 검색"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                trending_up
              </span>
              <span>네이버 증권</span>
            </a>
            <a
              href={`https://www.google.com/finance/quote/${encoded}`}
              target="_blank"
              rel="noopener noreferrer"
              className="search-link-btn"
              title="구글 파이낸스에서 시세 확인"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                monitoring
              </span>
              <span>구글 시세</span>
            </a>
          </>
        )

      case 'game':
        return (
          <>
            <a
              href={`https://search.danawa.com/dsearch.php?query=${encoded}`}
              target="_blank"
              rel="noopener noreferrer"
              className="search-link-btn"
              title="다나와에서 가격 비교"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                shopping_cart
              </span>
              <span>다나와 핫딜</span>
            </a>
            <a
              href={`https://m.ruliweb.com/market/board/1020?search_type=subject&search_key=${encoded}`}
              target="_blank"
              rel="noopener noreferrer"
              className="search-link-btn"
              title="루리웹 예판/핫딜 검색"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                local_fire_department
              </span>
              <span>루리웹 핫딜</span>
            </a>
          </>
        )

      case 'product':
        return (
          <>
            <a
              href={`https://search.danawa.com/dsearch.php?query=${encoded}`}
              target="_blank"
              rel="noopener noreferrer"
              className="search-link-btn"
              title="다나와에서 최저가 비교"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                shopping_cart
              </span>
              <span>다나와 최저가</span>
            </a>
            <a
              href={`https://search.shopping.naver.com/search/all?query=${encoded}`}
              target="_blank"
              rel="noopener noreferrer"
              className="search-link-btn"
              title="네이버 쇼핑에서 가격 탐색"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                storefront
              </span>
              <span>네이버 쇼핑</span>
            </a>
          </>
        )

      default:
        return (
          <>
            <a
              href={`https://search.naver.com/search.naver?query=${encoded}`}
              target="_blank"
              rel="noopener noreferrer"
              className="search-link-btn"
              title="네이버 검색"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                search
              </span>
              <span>네이버 검색</span>
            </a>
            <a
              href={`https://www.google.com/search?q=${encoded}`}
              target="_blank"
              rel="noopener noreferrer"
              className="search-link-btn"
              title="구글 검색"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                travel_explore
              </span>
              <span>구글 검색</span>
            </a>
          </>
        )
    }
  }

  return (
    <div className="interest-page">
      {/* Background Ambient Blobs */}
      <div className="interest-bg-blobs" aria-hidden="true">
        <div className="interest-blob blob-1"></div>
        <div className="interest-blob blob-2"></div>
      </div>

      <div className="interest-container">
        {/* Hero Header */}
        <header className="interest-hero">
          <div className="interest-badge">
            <span className="interest-badge-dot"></span>
            9SHOT RADAR • 관심 아이템 & 시세 레이더
          </div>
          <h1>
            🎯 9샷 <span className="highlight-red">관심사 레이더</span>
          </h1>
          <p className="interest-subtitle">
            꽂혀있는 <strong>관심 상품, 주식 종목, 게임</strong>을 등록해두면,<br />
            실시간 <strong>핫딜 특가, 시세 변동, 출시·발표 정보</strong>를 한 곳에서 모아볼 수 있는 페이지입니다.
          </p>

          <div className="interest-notice-banner">
            <span className="material-symbols-outlined">radar</span>
            <div>
              <strong>관심사 레이더 준비 단계:</strong> 주목 중인 상품이나 주식, 게임 등을 등록해보세요.
              향후 핫딜 크롤러 및 시세 수집기와 연동되어 최신 정보를 자동으로 불러옵니다! 🚀
            </div>
          </div>
        </header>

        {/* Item Registration Card */}
        <section className="interest-add-panel">
          <div className="panel-header">
            <div className="panel-title">
              <span className="material-symbols-outlined">add_circle</span>
              <span>새로운 관심 아이템 등록</span>
            </div>
          </div>

          <form onSubmit={handleAddItem} className="interest-form-grid">
            <input
              type="text"
              className="interest-input"
              placeholder="예: 닌텐도 스위치 2, 엔비디아(NVDA), 맥북 에어, 테슬라..."
              value={inputTitle}
              onChange={(e) => setInputTitle(e.target.value)}
              required
            />
            <select
              className="interest-select"
              value={inputCategory}
              onChange={(e) => setInputCategory(e.target.value as ItemCategory)}
            >
              <option value="product">🛍️ 쇼핑/핫딜</option>
              <option value="game">🎮 게임/콘솔</option>
              <option value="stock">📈 주식/투자</option>
              <option value="etc">✨ 기타 관심사</option>
            </select>
            <button type="submit" className="interest-submit-btn">
              <span className="material-symbols-outlined">radar</span>
              <span>추적 등록</span>
            </button>
          </form>
        </section>

        {/* Filter Bar */}
        <section className="interest-filter-row">
          <div className="filter-chips">
            <button
              type="button"
              className={`filter-chip ${selectedFilter === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('all')}
            >
              전체 보기
            </button>
            <button
              type="button"
              className={`filter-chip ${selectedFilter === 'product' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('product')}
            >
              🛍️ 쇼핑/핫딜
            </button>
            <button
              type="button"
              className={`filter-chip ${selectedFilter === 'game' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('game')}
            >
              🎮 게임/콘솔
            </button>
            <button
              type="button"
              className={`filter-chip ${selectedFilter === 'stock' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('stock')}
            >
              📈 주식/투자
            </button>
            <button
              type="button"
              className={`filter-chip ${selectedFilter === 'etc' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('etc')}
            >
              기타 관심사
            </button>
          </div>

          <div className="items-count-label">
            추적 중인 아이템 <strong>{filteredItems.length}</strong>개
          </div>
        </section>

        {/* Tracked Items List Grid */}
        {filteredItems.length === 0 ? (
          <div className="interest-empty-state">
            <span className="material-symbols-outlined">search_off</span>
            <h3>등록된 관심 아이템이 없습니다.</h3>
            <p>위의 입력창에서 관심 있는 상품, 주식, 게임 등을 등록해보세요!</p>
          </div>
        ) : (
          <section className="interest-cards-grid">
            {filteredItems.map((item) => (
              <article key={item.id} className="interest-item-card">
                <div className="card-top-row">
                  <span className={`category-badge ${item.category}`}>
                    {getCategoryLabel(item.category)}
                  </span>
                  <span className="status-tag">
                    <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>
                      radar
                    </span>
                    {item.status}
                  </span>
                </div>

                <h3 className="card-main-title">{item.title}</h3>

                <div className="card-info-box">
                  <span className="info-label">모니터링 정보</span>
                  <span className="info-value">{item.note}</span>
                </div>

                <div className="card-actions-row">
                  {renderActionLinks(item)}

                  <button
                    type="button"
                    className="delete-item-btn"
                    onClick={() => handleDeleteItem(item.id)}
                    title="아이템 삭제"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      delete
                    </span>
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </div>
  )
}

export default Interest
