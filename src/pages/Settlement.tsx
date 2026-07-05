import { useRef } from 'react'
import html2canvas from 'html2canvas'
import { memberData } from '../data'
import { useSettlement } from '../hooks/useSettlement'

function Settlement() {
  const {
    rounds,
    highlighted,
    accountInfo,
    roundSummaries,
    totalCost,
    sortedMembers,
    setAccountInfo,
    updateRound,
    updateCost,
    toggleAttendee,
    addRound,
    confirmDeleteRound,
    toggleHighlight,
    handleCopy,
  } = useSettlement()

  const summaryRef = useRef<HTMLDivElement>(null)

  const handleCapture = async () => {
    if (!summaryRef.current) return
    try {
      const canvas = await html2canvas(summaryRef.current, { scale: 2, useCORS: true })
      const image = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = image
      link.download = 'settlement-summary.png'
      link.click()
    } catch (error) {
      console.error('Capture failed', error)
      alert('캡쳐에 실패했습니다.')
    }
  }

  return (
    <div className="settlement-page">
      <section className="settlement-hero settlement-top-card">
        <h1>모임비 정산</h1>
        <p>
          장소와 비용을 입력하고 참석 멤버를 선택하면 전체 합계와
          멤버별 정산 금액을 자동 계산합니다.
        </p>
      </section>

      <main className="settlement-container">
        <div className="settlement-grid">
          <div className="add-round-row">
            <button type="button" className="add-round-btn" onClick={addRound}>
              <span className="add-round-icon">＋</span>
              <span>차수 추가</span>
            </button>
          </div>

          {rounds.map((round, idx) => {
            const summary = roundSummaries[idx]
            return (
              <section key={summary.key} className="round-card">
                <div className="round-card-header">
                  <h2>{round.label}</h2>
                  <div className="round-card-actions">
                    <span className="round-meta">
                      비용 {summary.cost ? `${summary.cost.toLocaleString()}원` : '0원'} · 참석 {summary.participants}명 · 1인 {summary.participants ? `${summary.perPerson.toLocaleString()}원` : '0원'}
                    </span>
                    {idx > 0 && (
                      <button type="button" className="home-btn small" onClick={() => confirmDeleteRound(idx)}>
                        삭제
                      </button>
                    )}
                  </div>
                </div>

                <div className="field-group">
                  <label>
                    장소
                    <input
                      type="text"
                      value={round.place}
                      onChange={(event) => updateRound(idx, 'place', event.target.value)}
                      placeholder="예: 감자탕집"
                    />
                  </label>
                </div>

                <div className="field-group">
                  <label>
                    비용
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={round.cost}
                      onChange={(event) => updateCost(idx, event.target.value)}
                      placeholder="0"
                    />
                  </label>
                </div>

                <div className="field-group">
                  <span className="field-label">참석 멤버</span>
                  <div className="attendance-grid">
                    {memberData.map((member) => (
                      <button
                        key={member.nickname}
                        type="button"
                        className={`attendance-chip ${round.attendees.includes(member.nickname) ? 'selected' : ''}`}
                        onClick={() => toggleAttendee(idx, member.nickname)}
                      >
                        {member.nickname}
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            )
          })}

          <section className="summary-bottom">
            <div className="summary-card summary-horizontal" ref={summaryRef}>
              <div className="summary-left">
                <div className="kakao-badge" aria-hidden="true">
                  = 정산 =
                </div>
                <div className="summary-row total-sum">
                  <strong className="total-amount">{totalCost.toLocaleString()}원</strong>
                </div>
                <div className="places-list">
                  {rounds.map((r, i) => {
                    const cost = Number(r.cost) || 0
                    return (
                      <div key={`place-${i}`} className="place-item">
                        <strong className="place-name">
                          {`${r.label} ${r.place ? r.place : '-'}`} · {cost > 0 ? `${cost.toLocaleString()}원` : '비용 -'}
                        </strong>
                        <span className="place-attendees">
                          {r.attendees.length ? `참석: ${r.attendees.join(', ')}` : '참석 없음'}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Account info input and Copy Button */}
                <div className="settlement-copy-section">
                  <input
                    type="text"
                    value={accountInfo}
                    onChange={(e) => setAccountInfo(e.target.value)}
                    placeholder="정산 계좌번호 입력 (선택)"
                    className="settlement-account-input"
                  />
                  <div className="settlement-btn-group" data-html2canvas-ignore="true">
                    <button type="button" onClick={handleCopy} className="settlement-copy-btn">
                      📋 정산요약 복사
                    </button>
                    <button type="button" onClick={handleCapture} className="settlement-capture-btn">
                      📸 캡쳐하기
                    </button>
                  </div>
                </div>
              </div>

              <div className="summary-right">
                <h3>멤버별 정산</h3>
                <div className="balance-list">
                  {sortedMembers.filter((m) => m.total > 0).length > 0 ? (
                    sortedMembers
                      .filter((m) => m.total > 0)
                      .map((member) => (
                        <div
                          key={member.nickname}
                          className={`balance-item ${highlighted === member.nickname ? 'highlighted' : ''}`}
                          onClick={() => toggleHighlight(member.nickname)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && toggleHighlight(member.nickname)}
                        >
                          <span>{member.nickname}</span>
                          <strong>{member.total.toLocaleString()}원</strong>
                        </div>
                      ))
                  ) : (
                    <div className="balance-empty-state">
                      비용과 참석자를 입력하면 정산 금액이 여기에 표시됩니다.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

export default Settlement
