import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

// GRE sections that carry a numeric/scaled score (Analytical Writing is handled separately as an essay)
const GRE_SECTIONS = ['Verbal Reasoning', 'Quantitative Reasoning']

const SECTION_COLOR = {
  'Verbal Reasoning':       '#6f42c1',
  'Quantitative Reasoning': '#0d6efd',
  'Analytical Writing':     '#d63384',
}
const SECTION_GRADIENT = {
  'Verbal Reasoning':       'linear-gradient(135deg,#6f42c1,#a370f7)',
  'Quantitative Reasoning': 'linear-gradient(135deg,#0d6efd,#4dabf7)',
  'Analytical Writing':     'linear-gradient(135deg,#d63384,#f783ac)',
}
const SECTION_ICON = {
  'Verbal Reasoning':       'bi-chat-square-text-fill',
  'Quantitative Reasoning': 'bi-calculator-fill',
  'Analytical Writing':     'bi-pencil-square',
}

// ─── KaTeX ────────────────────────────────────────────────────────────────────
function loadKaTeX() {
  if (window.renderMathInElement) return
  if (window._greKatexLoading) return
  window._greKatexLoading = true
  if (!document.querySelector('link[href*="katex"]')) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css'
    document.head.appendChild(link)
  }
  const core = document.createElement('script')
  core.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js'
  core.onload = () => {
    const ar = document.createElement('script')
    ar.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js'
    ar.onload = () => { window._greKatexLoading = false }
    document.head.appendChild(ar)
  }
  document.head.appendChild(core)
}

// After KaTeX has decided which $...$ spans are real math (and left backslash-escaped
// \$ currency amounts alone as plain text, per its own delimiter rules), strip the now
// no-longer-needed backslash so the user just sees a clean "$" in the leftover text.
function stripEscapedDollarSigns(element) {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
  const nodes = []
  let node
  while ((node = walker.nextNode())) nodes.push(node)
  nodes.forEach(n => {
    if (n.nodeValue.indexOf('\\$') !== -1) n.nodeValue = n.nodeValue.replace(/\\\$/g, '$')
  })
}

function renderMath(el) {
  if (!el) return
  const run = () => {
    if (typeof window.renderMathInElement === 'undefined') { setTimeout(run, 300); return }
    window.renderMathInElement(el, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$',  right: '$',  display: false },
        { left: '\\(', right: '\\)', display: false },
        { left: '\\[', right: '\\]', display: true },
      ],
      throwOnError: false,
      trust: true,
      strict: false,
    })
    stripEscapedDollarSigns(el)
  }
  setTimeout(run, 50)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function resolveType(q) {
  if (q.type === 'essay') return 'essay'
  if (q.type === 'integer') return 'numeric'
  const hasOpts    = Array.isArray(q.options) && q.options.length > 0
  const hasImgOpts = q.option_images && Object.keys(q.option_images).length > 0
  if (!hasOpts && !hasImgOpts) return 'numeric'
  return q.type || 'multiple_choice'
}

const imgSrc = f => f ? `/img/Graph_questions/${f}` : null

function processCell(c) {
  return c.trim()
    .replace(/\\textbf\{([^}]*)\}/g, '<strong>$1</strong>')
    .replace(/\\textit\{([^}]*)\}/g, '<em>$1</em>')
    .replace(/\\text\{([^}]*)\}/g, '$1')
    .replace(/\\%/g, '%')
}

function latexTabularToHtml(text) {
  return text.replace(
    /\\begin\{(tabular|array)\}\*?(?:\{[^}]*\})?([\s\S]*?)\\end\{\1\}/g,
    (_match, _env, body) => {
      const rows = body.split(/\\\\/).map(r => r.replace(/\\hline/g, '').trim()).filter(r => r)
      if (rows.length === 0) return ''
      const [header, ...dataRows] = rows
      const headerCells = header.split('&').map(c => `<th>${processCell(c)}</th>`).join('')
      const bodyRows = dataRows
        .map(r => '<tr>' + r.split('&').map(c => `<td>${processCell(c)}</td>`).join('') + '</tr>')
        .join('')
      return `<table class="sat-table"><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>`
    }
  )
}

function latexListToHtml(text) {
  text = text.replace(
    /\\begin\{enumerate\}(?:\[[^\]]*\])?([\s\S]*?)\\end\{enumerate\}/g,
    (_match, body) => {
      const items = body.split(/\\item\s*/).slice(1).map(i => `<li>${i.trim()}</li>`).join('')
      return `<ol style="padding-left:1.5rem;margin:8px 0">${items}</ol>`
    }
  )
  text = text.replace(
    /\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/g,
    (_match, body) => {
      const items = body.split(/\\item\s*/).slice(1).map(i => `<li>${i.trim()}</li>`).join('')
      return `<ul style="padding-left:1.5rem;margin:8px 0">${items}</ul>`
    }
  )
  return text
}

// ─── MathText ─────────────────────────────────────────────────────────────────
function MathText({ text }) {
  const ref = useRef(null)
  useEffect(() => { if (ref.current) renderMath(ref.current) }, [text])
  let html = (text || '')
    .replace(/\\%/g, '%')
    .replace(/\\textit\{([^}]*)\}/g, '<em>$1</em>')
    .replace(/\\textbf\{([^}]*)\}/g, '<strong>$1</strong>')
    .replace(
      /\(structure\)/g,
      '<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 10px;' +
      'background:#fff3cd;border:1px dashed #ffc107;border-radius:4px;font-size:0.8rem;' +
      'color:#856404;vertical-align:middle;margin:0 4px;">⬡ Structure</span>'
    )
  html = latexTabularToHtml(html)
  html = latexListToHtml(html)
  html = html.replace(/\\\\/g, '<br>')
  return (
    <span ref={ref} dangerouslySetInnerHTML={{ __html: html }} />
  )
}

// ─── Passage block ────────────────────────────────────────────────────────────
function PassageBlock({ text }) {
  const ref = useRef(null)
  useEffect(() => { if (ref.current) renderMath(ref.current) }, [text])
  if (!text) return null
  let html = (text || '')
    .replace(/\\%/g, '%')
    .replace(/\\textit\{([^}]*)\}/g, '<em>$1</em>')
    .replace(/\\textbf\{([^}]*)\}/g, '<strong>$1</strong>')
  html = latexTabularToHtml(html)
  html = latexListToHtml(html)
  html = html.replace(/\\\\/g, '<br>')
  return (
    <div style={{
      background: '#f8f6ff', border: '1px solid #d9cdf5',
      borderLeft: '4px solid #6f42c1', borderRadius: 10,
      padding: '16px 20px', marginBottom: 20,
    }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '1px', color: '#6f42c1', marginBottom: 10, textTransform: 'uppercase' }}>
        Passage
      </div>
      <div ref={ref} style={{ fontSize: '1rem', lineHeight: 1.85, whiteSpace: 'pre-wrap', margin: 0, color: '#1a1a2e' }}
        dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}

// ─── Question Content ─────────────────────────────────────────────────────────
function QuestionContent({ q }) {
  const ref = useRef(null)
  useEffect(() => { if (ref.current) renderMath(ref.current) }, [q])
  return (
    <div ref={ref}>
      {q.passage && <PassageBlock text={q.passage} />}
      <p className="mb-3" style={{ fontSize: '1.05rem', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
        <MathText text={q.question_text} />
      </p>
      {q.image_url && (
        <div className="mb-4 text-center">
          <a href={imgSrc(q.image_url)} target="_blank" rel="noopener noreferrer">
            <img src={imgSrc(q.image_url)} alt="Question diagram"
              style={{ maxWidth: '100%', maxHeight: 700, borderRadius: 10, border: '1px solid #dee2e6' }}
              onError={e => e.target.style.display = 'none'} />
          </a>
        </div>
      )}
    </div>
  )
}

// ─── Essay card — shows the submitted Analytical Writing response, no numeric score ──
const EssayCard = ({ essayResponse, essayStatus }) => {
  if (essayResponse == null) return null
  return (
    <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ height: 5, background: SECTION_GRADIENT['Analytical Writing'] }} />
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <h5 className="mb-0 fw-bold">
            <i className={`bi ${SECTION_ICON['Analytical Writing']} me-2`} style={{ color: SECTION_COLOR['Analytical Writing'] }} />
            Analytical Writing
          </h5>
          <span className="badge text-white px-3 py-2" style={{ background: SECTION_GRADIENT['Analytical Writing'], borderRadius: 20 }}>
            <i className="bi bi-hourglass-split me-1" />
            {essayStatus === 'pending_review' || !essayStatus ? 'Pending Review' : essayStatus}
          </span>
        </div>
        <p className="text-muted small mb-2">
          This "Analyze an Issue" task is not auto-scored. Your submitted response is shown below for review.
        </p>
        <div style={{
          background: '#fdf2f8', border: '1px solid #f3c6dd', borderRadius: 10,
          padding: '16px 20px', whiteSpace: 'pre-wrap', fontSize: '0.95rem', lineHeight: 1.75,
          maxHeight: 420, overflowY: 'auto',
        }}>
          {essayResponse.trim()
            ? essayResponse
            : <span className="text-muted">(no response submitted)</span>}
        </div>
      </div>
    </div>
  )
}

// ─── Results Page ─────────────────────────────────────────────────────────────
const ResultsPage = ({ results, onReview, allAttempts, activeAttemptId, onSwitchAttempt }) => {
  const [selectedView, setSelectedView] = useState('overview')

  const sectionStats = {}
  for (const sec of GRE_SECTIONS) {
    const ss = results.sectionScores?.[sec] || {}
    sectionStats[sec] = {
      score:       ss.score ?? 0,
      max:         ss.maxScore ?? 0,
      correct:     ss.correctAnswers ?? 0,
      wrong:       ss.wrongAnswers ?? 0,
      unattempted: ss.unattempted ?? 0,
      total:       ss.totalQuestions ?? 0,
      scaledScore: ss.scaledScore ?? null,
    }
  }

  const isFullTest = results.testType === 'full'
  const isEssaySubject = results.subject === 'Analytical Writing'

  // For practice tests, populate section stats from overall results
  if (!isFullTest && !isEssaySubject) {
    const sub = results.subject || ''
    if (sub) {
      sectionStats[sub] = {
        score:       results.score ?? 0,
        max:         results.maxScore ?? 0,
        correct:     results.correctAnswers ?? 0,
        wrong:       results.wrongAnswers ?? 0,
        unattempted: results.unattempted ?? 0,
        total:       results.totalQuestions ?? (results.responses || []).length,
        scaledScore: results.scaledScore ?? null,
      }
    }
  }

  const sidebarSections = isFullTest
    ? GRE_SECTIONS
    : (!isEssaySubject && results.subject ? [results.subject] : [])

  // Module-level stats derived from per-question responses
  const moduleStats = {}
  if (isFullTest) {
    for (const sec of GRE_SECTIONS) {
      const secResps = (results.responses || []).filter(r => r.subject === sec)
      const half = Math.ceil(secResps.length / 2)
      const calcMod = resps => {
        const correct     = resps.filter(r => r?.isCorrect).length
        const unattempted = resps.filter(r => r?.unattempted).length
        const wrong       = resps.length - correct - unattempted
        return { score: correct, max: resps.length, correct, wrong, unattempted }
      }
      moduleStats[sec] = {
        'Module 1': calcMod(secResps.slice(0, half)),
        'Module 2': calcMod(secResps.slice(half)),
      }
    }
  }

  const isModuleView   = selectedView.includes('|')
  const [moduleSection, moduleName] = isModuleView ? selectedView.split('|') : [null, null]
  const isSectionView  = !isModuleView && selectedView !== 'overview'
  const isAnySubView   = isSectionView || isModuleView

  const currentStats = isModuleView
    ? (moduleStats[moduleSection]?.[moduleName] || {})
    : (isSectionView ? sectionStats[selectedView] : null)

  const displayScore       = isAnySubView ? (currentStats?.score ?? 0) : (results.score ?? 0)
  const displayMax         = isAnySubView ? (currentStats?.max ?? 0) : (results.maxScore ?? 0)
  const displayCorrect     = isAnySubView ? (currentStats?.correct ?? 0) : (results.correctAnswers ?? 0)
  const displayWrong       = isAnySubView ? (currentStats?.wrong ?? 0) : (results.wrongAnswers ?? 0)
  const displayUnattempted = isAnySubView ? (currentStats?.unattempted ?? 0) : (results.unattempted ?? 0)
  const total              = displayCorrect + displayWrong + displayUnattempted || 1

  const cardGradient = isAnySubView
    ? (SECTION_GRADIENT[isModuleView ? moduleSection : selectedView] || 'linear-gradient(135deg,#6c757d,#495057)')
    : 'linear-gradient(135deg,#6f42c1,#0d6efd)'
  const displaySubject = results.subject || ''
  const testLabel = isFullTest ? 'Full GRE Test' : `GRE — ${displaySubject || 'Practice'}`

  // Essay data — present for full tests (sectionScores['Analytical Writing']) and standalone AWA attempts
  const essayResponse = isFullTest
    ? (results.sectionScores?.['Analytical Writing']?.essayResponse ?? results.essayResponse ?? null)
    : (isEssaySubject ? (results.essayResponse ?? null) : null)
  const essayStatus = results.essayStatus ?? null

  // Combined scaled score (Verbal + Quant) for full tests
  const totalScaled = isFullTest && sectionStats['Verbal Reasoning'].scaledScore != null && sectionStats['Quantitative Reasoning'].scaledScore != null
    ? sectionStats['Verbal Reasoning'].scaledScore + sectionStats['Quantitative Reasoning'].scaledScore
    : null

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e9ecef', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link to="/courses/gre" style={{ color: '#495057', fontSize: '1.3rem', textDecoration: 'none' }}>←</Link>
        <div className="flex-grow-1">
          <span className="fw-bold">Result: {testLabel}</span>
          {results.dateAttempted && (
            <span className="ms-2 text-muted fw-normal">
              — {new Date(results.dateAttempted).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          )}
          <span className="ms-2 badge bg-light text-dark border" style={{ fontSize: '0.75rem' }}>GRE</span>
        </div>
        {!isEssaySubject && (
          <button className="btn btn-primary btn-sm" onClick={onReview}>
            <i className="bi bi-list-task me-1" />View test solution
          </button>
        )}
      </div>

      {/* Attempt switcher */}
      {allAttempts.length > 0 && (() => {
        const sorted    = [...allAttempts].reverse()
        const activeIdx = sorted.findIndex(a => activeAttemptId ? a._id === activeAttemptId : false)
        const dispIdx   = activeIdx >= 0 ? activeIdx : sorted.length - 1
        const active    = sorted[dispIdx]
        const activePct = active.maxScore > 0 ? Math.round(Math.max(0, active.score) / active.maxScore * 100) : 0
        return (
          <div style={{ background: '#fff', borderBottom: '1px solid #e9ecef', padding: '10px 24px' }}>
            <div className="d-flex align-items-center gap-3 flex-wrap">
              <span className="text-muted" style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                <i className="bi bi-clock-history me-1" />{allAttempts.length} attempt{allAttempts.length !== 1 ? 's' : ''}
              </span>
              <div style={{ position: 'relative', minWidth: 240 }}>
                <select value={dispIdx} onChange={e => onSwitchAttempt(sorted[Number(e.target.value)])}
                  style={{
                    appearance: 'none', width: '100%', padding: '6px 36px 6px 12px',
                    borderRadius: 10, border: '1.5px solid #ced4da', background: '#f8f9fa',
                    fontSize: '0.83rem', fontWeight: 600, color: '#212529', cursor: 'pointer', outline: 'none',
                  }}>
                  {sorted.map((a, i) => {
                    const d   = new Date(a.dateAttempted).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                    const pct = a.maxScore > 0 ? Math.round(Math.max(0, a.score) / a.maxScore * 100) : 0
                    return (
                      <option key={a._id || i} value={i}>
                        Attempt {i + 1} — {d} — {a.score}/{a.maxScore} ({pct}%)
                      </option>
                    )
                  })}
                </select>
                <i className="bi bi-chevron-down" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '0.75rem', color: '#666' }} />
              </div>
              <span className="badge px-3 py-2" style={{
                background: activePct >= 60 ? '#28a745' : activePct >= 35 ? '#ffc107' : '#dc3545',
                color: '#fff', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700,
              }}>
                {active.score}/{active.maxScore} · {activePct}%
              </span>
            </div>
          </div>
        )
      })()}

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div className="row g-4">
          {/* Sidebar */}
          <div className="col-md-3">
            <div className="card border-0 shadow-sm" style={{ borderRadius: 12, overflow: 'hidden' }}>
              {sidebarSections.length > 0 && (
                <>
                  <div className="w-100 p-3 d-flex align-items-center justify-content-between"
                    style={{ background: '#fff', borderBottom: '1px solid #e9ecef' }}>
                    <span style={{ paddingLeft: 10, fontWeight: 500, color: '#495057', fontSize: '0.9rem' }}>Sections</span>
                  </div>
                  {sidebarSections.map(sec => {
                    const secActive = selectedView === sec || moduleSection === sec
                    return (
                      <React.Fragment key={sec}>
                        <button
                          onClick={() => setSelectedView(sec)}
                          className="w-100 text-start border-0 px-4 py-2 d-flex align-items-center justify-content-between"
                          style={{ background: secActive ? '#f8f9fa' : '#fff', borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }}>
                          <span style={{ borderLeft: secActive ? `3px solid ${SECTION_COLOR[sec]}` : '3px solid transparent', paddingLeft: 10, color: secActive ? SECTION_COLOR[sec] : '#495057', fontWeight: secActive ? 600 : 400, fontSize: '0.95rem' }}>
                            {sec}
                          </span>
                          {selectedView === sec && <span style={{ width: 8, height: 8, borderRadius: '50%', background: SECTION_COLOR[sec], display: 'inline-block' }} />}
                        </button>
                        {isFullTest && ['Module 1', 'Module 2'].map(mod => {
                          const viewKey = `${sec}|${mod}`
                          const modActive = selectedView === viewKey
                          return (
                            <button key={mod} onClick={() => setSelectedView(viewKey)}
                              className="w-100 text-start border-0 py-2 d-flex align-items-center justify-content-between"
                              style={{ paddingLeft: '2.5rem', paddingRight: 16, background: modActive ? '#f8f9fa' : '#fff', borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }}>
                              <span style={{ borderLeft: modActive ? `3px solid ${SECTION_COLOR[sec]}` : '3px solid transparent', paddingLeft: 10, color: modActive ? SECTION_COLOR[sec] : '#6c757d', fontWeight: modActive ? 600 : 400, fontSize: '0.85rem' }}>
                                {mod}
                              </span>
                              {modActive && <span style={{ width: 7, height: 7, borderRadius: '50%', background: SECTION_COLOR[sec], display: 'inline-block' }} />}
                            </button>
                          )
                        })}
                      </React.Fragment>
                    )
                  })}
                  {isFullTest && essayResponse != null && (
                    <button
                      onClick={() => setSelectedView('Analytical Writing')}
                      className="w-100 text-start border-0 px-4 py-2 d-flex align-items-center justify-content-between"
                      style={{ background: selectedView === 'Analytical Writing' ? '#f8f9fa' : '#fff', cursor: 'pointer' }}>
                      <span style={{ borderLeft: selectedView === 'Analytical Writing' ? `3px solid ${SECTION_COLOR['Analytical Writing']}` : '3px solid transparent', paddingLeft: 10, color: selectedView === 'Analytical Writing' ? SECTION_COLOR['Analytical Writing'] : '#495057', fontWeight: selectedView === 'Analytical Writing' ? 600 : 400, fontSize: '0.95rem' }}>
                        Analytical Writing
                      </span>
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="d-flex flex-column gap-2 mt-3">
              <Link to="/courses/gre" className="btn btn-outline-dark btn-sm">
                <i className="bi bi-house me-1" />GRE
              </Link>
            </div>
          </div>

          {/* Main */}
          <div className="col-md-9">
            {/* Essay-only view (Analytical Writing selected, or standalone essay attempt) */}
            {(selectedView === 'Analytical Writing' || (isEssaySubject && !isFullTest)) ? (
              <EssayCard essayResponse={essayResponse} essayStatus={essayStatus} />
            ) : (
              <>
                {/* Score card */}
                <div className="text-white mb-4" style={{ background: cardGradient, borderRadius: 16, padding: '32px 24px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', right: -30, top: -30, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
                  <div style={{ position: 'absolute', right: 60, bottom: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
                  <h5 className="fw-bold mb-4" style={{ opacity: 0.95 }}>
                    {isModuleView ? `${moduleSection} — ${moduleName}` : isSectionView ? `${selectedView} Report` : 'Overall'}
                  </h5>
                  <div className="text-center">
                    <div style={{ width: 150, height: 150, borderRadius: '50%', border: '5px solid rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.12)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                      {isSectionView && !isModuleView && currentStats?.scaledScore != null ? (
                        <>
                          <span style={{ fontSize: 36, fontWeight: 700, lineHeight: 1 }}>{currentStats.scaledScore}</span>
                          <div style={{ width: '55%', height: 2, background: 'rgba(255,255,255,0.55)', margin: '6px 0' }} />
                          <span style={{ fontSize: 18, opacity: 0.9 }}>/ 170</span>
                        </>
                      ) : !isAnySubView && totalScaled != null ? (
                        <>
                          <span style={{ fontSize: 36, fontWeight: 700, lineHeight: 1 }}>{totalScaled}</span>
                          <div style={{ width: '55%', height: 2, background: 'rgba(255,255,255,0.55)', margin: '6px 0' }} />
                          <span style={{ fontSize: 18, opacity: 0.9 }}>/ 340</span>
                        </>
                      ) : !isAnySubView && results.scaledScore != null ? (
                        <>
                          <span style={{ fontSize: 36, fontWeight: 700, lineHeight: 1 }}>{results.scaledScore}</span>
                          <div style={{ width: '55%', height: 2, background: 'rgba(255,255,255,0.55)', margin: '6px 0' }} />
                          <span style={{ fontSize: 18, opacity: 0.9 }}>/ 170</span>
                        </>
                      ) : (
                        <>
                          <span style={{ fontSize: 36, fontWeight: 700, lineHeight: 1 }}>{displayScore}</span>
                          <div style={{ width: '55%', height: 2, background: 'rgba(255,255,255,0.55)', margin: '6px 0' }} />
                          <span style={{ fontSize: 22, opacity: 0.9 }}>{displayMax}</span>
                        </>
                      )}
                    </div>
                    <div style={{ opacity: 0.85, fontSize: '0.9rem' }}>
                      Time taken: {Math.floor((results.totalTimeTaken || 0) / 60)}m {(results.totalTimeTaken || 0) % 60}s
                    </div>
                  </div>
                </div>

                {/* Section cards — full test overview only */}
                {selectedView === 'overview' && isFullTest && (
                  <div className="row g-3 mb-4">
                    {GRE_SECTIONS.map(sec => {
                      const st = sectionStats[sec]
                      return (
                        <div key={sec} className="col-md-6">
                          <div className="card border-0 shadow-sm h-100 text-center" style={{ borderRadius: 12, cursor: 'pointer' }}
                            onClick={() => setSelectedView(sec)}>
                            <div style={{ height: 4, background: SECTION_GRADIENT[sec], borderRadius: '12px 12px 0 0' }} />
                            <div className="card-body py-3">
                              <i className={`bi ${SECTION_ICON[sec]} mb-2`} style={{ fontSize: '1.3rem', color: SECTION_COLOR[sec] }} />
                              <div className="fw-bold mb-1" style={{ color: SECTION_COLOR[sec] }}>{sec}</div>
                              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#212529' }}>
                                {st.scaledScore ?? st.score}
                              </div>
                              <div className="text-muted" style={{ fontSize: '0.82rem' }}>
                                {st.scaledScore != null ? '/ 170 scaled' : `/ ${st.max}`}
                              </div>
                              <div className="d-flex justify-content-center gap-3 mt-2" style={{ fontSize: '0.75rem' }}>
                                <span className="text-success">{st.correct}✓</span>
                                <span className="text-danger">{st.wrong}✗</span>
                                <span className="text-muted">{st.unattempted}—</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Analytical Writing preview card — full test overview only */}
                {selectedView === 'overview' && isFullTest && essayResponse != null && (
                  <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 12, cursor: 'pointer' }}
                    onClick={() => setSelectedView('Analytical Writing')}>
                    <div style={{ height: 4, background: SECTION_GRADIENT['Analytical Writing'], borderRadius: '12px 12px 0 0' }} />
                    <div className="card-body py-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
                      <div>
                        <i className={`bi ${SECTION_ICON['Analytical Writing']} me-2`} style={{ color: SECTION_COLOR['Analytical Writing'] }} />
                        <span className="fw-bold" style={{ color: SECTION_COLOR['Analytical Writing'] }}>Analytical Writing</span>
                      </div>
                      <span className="badge text-white" style={{ background: SECTION_GRADIENT['Analytical Writing'] }}>Pending Review</span>
                    </div>
                  </div>
                )}

                {/* Marks Summary */}
                <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
                  <div className="card-body p-4">
                    <h5 className="fw-bold mb-1">Marks Summary</h5>
                    <p className="text-muted small mb-4">
                      You've answered {Math.round(displayCorrect / total * 100)}% questions correctly
                    </p>
                    <div className="row g-3 text-center">
                      {[
                        { label: 'Correct',     count: displayCorrect,     color: '#28a745', bg: '#d4edda', icon: 'bi-check-circle-fill' },
                        { label: 'Incorrect',   count: displayWrong,       color: '#dc3545', bg: '#f8d7da', icon: 'bi-x-circle-fill' },
                        { label: 'Unattempted', count: displayUnattempted, color: '#6c757d', bg: '#e9ecef', icon: 'bi-dash-circle-fill' },
                      ].map(({ label, count, color, bg, icon }) => (
                        <div key={label} className="col-4">
                          <div style={{ background: bg, borderRadius: 12, padding: '20px 8px' }}>
                            <i className={`bi ${icon} mb-2`} style={{ fontSize: '1.5rem', color }} />
                            <div style={{ fontSize: '2rem', fontWeight: 700, color }}>{count}</div>
                            <div className="text-muted" style={{ fontSize: '0.78rem' }}>{label}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Review Answers Page ──────────────────────────────────────────────────────
const ReviewAnswersPage = ({ enriched, onBack }) => {
  const [sectionFilter, setSectionFilter] = useState(null)
  const [statusFilter,  setStatusFilter]  = useState('all')
  const [expandedIdx,   setExpandedIdx]   = useState(null)
  const ref = useRef(null)

  useEffect(() => { if (ref.current) renderMath(ref.current) }, [expandedIdx])

  const counts = {
    all:         enriched.length,
    correct:     enriched.filter(r => r?.isCorrect).length,
    incorrect:   enriched.filter(r => r && !r.isCorrect && !r.unattempted).length,
    unattempted: enriched.filter(r => r?.unattempted).length,
  }

  const availableSections = [...new Set(enriched.map(r => r.subject).filter(Boolean))]

  const filtered = enriched.filter(r => {
    if (sectionFilter && r.subject !== sectionFilter) return false
    if (statusFilter === 'correct'     && !r?.isCorrect) return false
    if (statusFilter === 'incorrect'   && (r?.unattempted || r?.isCorrect)) return false
    if (statusFilter === 'unattempted' && !r?.unattempted) return false
    return true
  })

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }} ref={ref}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e9ecef', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: '1.3rem', color: '#495057', cursor: 'pointer' }}>←</button>
        <strong>Review Answers</strong>
      </div>

      {/* Section chips */}
      {availableSections.length > 1 && (
        <div style={{ background: '#fff', borderBottom: '1px solid #e9ecef', padding: '10px 24px' }}>
          <div className="d-flex gap-2 flex-wrap">
            {availableSections.map(sec => (
              <button key={sec} onClick={() => setSectionFilter(sectionFilter === sec ? null : sec)}
                style={{
                  padding: '4px 14px', borderRadius: 20, border: '1px solid', cursor: 'pointer',
                  fontWeight: 500, fontSize: '0.88rem',
                  borderColor: sectionFilter === sec ? (SECTION_COLOR[sec] || '#0d6efd') : '#ced4da',
                  background:  sectionFilter === sec ? (SECTION_COLOR[sec] || '#0d6efd') : '#fff',
                  color:       sectionFilter === sec ? '#fff' : '#495057',
                }}>
                {sec} {sectionFilter === sec && '×'}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div className="row g-4">
          {/* Status sidebar */}
          <div className="col-md-3">
            <div className="card border-0 shadow-sm" style={{ borderRadius: 12, overflow: 'hidden' }}>
              {[
                { key: 'all',         label: `All (${counts.all})` },
                { key: 'incorrect',   label: `Incorrect (${counts.incorrect})` },
                { key: 'unattempted', label: `Unattempted (${counts.unattempted})` },
                { key: 'correct',     label: `Correct (${counts.correct})` },
              ].map(({ key, label }) => (
                <button key={key} onClick={() => setStatusFilter(key)}
                  className="w-100 text-start border-0 p-3 d-flex align-items-center justify-content-between"
                  style={{ borderBottom: '1px solid #e9ecef', background: statusFilter === key ? '#f0f4ff' : '#fff', cursor: 'pointer' }}>
                  <span style={{ borderLeft: statusFilter === key ? '3px solid #0d6efd' : '3px solid transparent', paddingLeft: 10, color: statusFilter === key ? '#0d6efd' : '#212529', fontWeight: statusFilter === key ? 600 : 400 }}>
                    {label}
                  </span>
                  {statusFilter === key && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0d6efd', display: 'inline-block' }} />}
                </button>
              ))}
            </div>
          </div>

          {/* Question list */}
          <div className="col-md-9">
            {filtered.length === 0
              ? <div className="text-center py-5 text-muted">No questions match the selected filter.</div>
              : filtered.map((r, fi) => {
                  const q           = r.questionData
                  const i           = r.globalIndex
                  const isOpen      = expandedIdx === i
                  const statusColor = r.unattempted ? '#6c757d' : r.isCorrect ? '#28a745' : '#dc3545'
                  const marksLabel  = r.unattempted ? 'N/A' : r.isCorrect ? '+1' : '0'
                  const secColor    = SECTION_COLOR[r.subject] || '#6c757d'

                  return (
                    <div key={fi} className="card border-0 shadow-sm mb-3" style={{ borderRadius: 12 }}>
                      {/* Top strip */}
                      <div style={{ padding: '10px 16px', borderBottom: '1px solid #e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                        onClick={() => setExpandedIdx(isOpen ? null : i)}>
                        <span style={{ color: statusColor, fontWeight: 600, fontSize: '0.82rem' }}>
                          ⊙ CORRECT: {r.unattempted ? 'N/A' : (r.isCorrect ? 'Yes' : 'No')} &nbsp;·&nbsp; Marks: {marksLabel}
                        </span>
                        <div className="d-flex align-items-center gap-2">
                          {r.subject && <span className="badge" style={{ background: secColor, fontSize: '0.68rem' }}>{r.subject}</span>}
                          <i className={`bi bi-chevron-${isOpen ? 'up' : 'right'} text-muted`} style={{ fontSize: '0.8rem' }} />
                        </div>
                      </div>

                      <div className="card-body">
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <span className="fw-bold">Question {i + 1}</span>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor, display: 'inline-block' }} />
                          {q?.difficulty && (
                            <span className={`badge ${q.difficulty === 'hard' ? 'bg-danger' : q.difficulty === 'medium' ? 'bg-warning text-dark' : 'bg-success'}`} style={{ fontSize: '0.7rem' }}>
                              {q.difficulty}
                            </span>
                          )}
                          <span className="ms-auto fw-bold" style={{ color: statusColor }}>{marksLabel}</span>
                        </div>

                        <div style={{ cursor: 'pointer' }} onClick={() => setExpandedIdx(isOpen ? null : i)}>
                          {isOpen && q
                            ? <QuestionContent q={q} />
                            : <p className="text-muted mb-0" style={{ fontSize: '0.93rem', lineHeight: 1.6 }}>
                                {(() => { const t = q?.question_text || '(Question not available)'; return t.length > 220 ? t.slice(0, 220) + '…' : t })()}
                              </p>
                          }
                        </div>

                        {isOpen && q && (
                          <div className="mt-3">
                            {resolveType(q) === 'multiple_choice' && Array.isArray(q.options) && (
                              <div className="mb-3">
                                {q.options.map((opt, oi) => {
                                  const isCrr     = String(q.correct_answer ?? '').trim() === opt.option_id
                                  const userPicked = String(r.userResponse ?? '').trim() === opt.option_id
                                  return (
                                    <div key={oi} className="d-flex align-items-start gap-2 mb-2 px-3 py-2 rounded"
                                      style={{ background: isCrr ? '#d4edda' : userPicked ? '#f8d7da' : '#f8f9fa' }}>
                                      <span className="fw-bold text-muted" style={{ minWidth: 24 }}>{opt.option_id}.</span>
                                      {isCrr     && <i className="bi bi-check-circle-fill text-success mt-1" />}
                                      {userPicked && !isCrr && <i className="bi bi-x-circle-fill text-danger mt-1" />}
                                      <div>
                                        <span style={{ fontSize: '0.9rem' }}><MathText text={opt.text} /></span>
                                        {q.option_images?.[opt.option_id] && (
                                          <div className="mt-1">
                                            <img src={imgSrc(q.option_images[opt.option_id])} alt={`Option ${opt.option_id}`}
                                              style={{ maxWidth: 280, borderRadius: 6, border: '1px solid #dee2e6' }}
                                              onError={e => e.target.style.display = 'none'} />
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                            {resolveType(q) === 'multiple_select' && Array.isArray(q.options) && (
                              <div className="mb-3">
                                {q.options.map((opt, oi) => {
                                  const corrArr   = (Array.isArray(q.correct_answer) ? q.correct_answer : [q.correct_answer]).map(String)
                                  const isCrr     = corrArr.includes(opt.option_id)
                                  const userPicked = Array.isArray(r.userResponse) && r.userResponse.includes(opt.option_id)
                                  return (
                                    <div key={oi} className="d-flex align-items-start gap-2 mb-2 px-3 py-2 rounded"
                                      style={{ background: isCrr ? '#d4edda' : userPicked ? '#f8d7da' : '#f8f9fa' }}>
                                      <span className="fw-bold text-muted" style={{ minWidth: 24 }}>{opt.option_id}.</span>
                                      {isCrr     && <i className="bi bi-check-circle-fill text-success mt-1" />}
                                      {userPicked && !isCrr && <i className="bi bi-x-circle-fill text-danger mt-1" />}
                                      <span style={{ fontSize: '0.9rem' }}><MathText text={opt.text} /></span>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                            {resolveType(q) === 'text_completion_multi_blank' && (
                              <div className="mb-3">
                                {(q.options || []).map((blank, bi) => {
                                  const corrId = q.correct_answer?.[blank.blank_label]
                                  const userId = r.userResponse?.[blank.blank_label]
                                  return (
                                    <div key={bi} className="mb-3">
                                      <p className="fw-semibold small mb-1">{blank.blank_label}</p>
                                      {(blank.choices || []).map((opt, oi) => {
                                        const isCrr = corrId === opt.option_id
                                        const userPicked = userId === opt.option_id
                                        return (
                                          <div key={oi} className="d-flex align-items-start gap-2 mb-2 px-3 py-2 rounded"
                                            style={{ background: isCrr ? '#d4edda' : userPicked ? '#f8d7da' : '#f8f9fa' }}>
                                            <span className="fw-bold text-muted" style={{ minWidth: 24 }}>{opt.option_id}.</span>
                                            {isCrr && <i className="bi bi-check-circle-fill text-success mt-1" />}
                                            {userPicked && !isCrr && <i className="bi bi-x-circle-fill text-danger mt-1" />}
                                            <span style={{ fontSize: '0.9rem' }}><MathText text={opt.text} /></span>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                            {resolveType(q) === 'numeric' && (
                              <div className="d-flex gap-2 flex-wrap mb-3">
                                <span className="badge bg-light text-dark border fs-6">
                                  Your answer: <strong>{r.userResponse ?? '(not answered)'}</strong>
                                </span>
                                <span className="badge bg-success fs-6">
                                  Correct: <strong>
                                    {q.correct_answer !== null && typeof q.correct_answer === 'object' && 'min' in q.correct_answer
                                      ? `${q.correct_answer.min} – ${q.correct_answer.max}`
                                      : String(q.correct_answer)}
                                  </strong>
                                </span>
                              </div>
                            )}
                            <div className="text-center pt-2" style={{ borderTop: '1px solid #e9ecef' }}>
                              <span className="text-primary" style={{ fontSize: '0.88rem', cursor: 'default' }}>⊞ View solution (coming soon)</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
            }
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Pair Verbal + Quant DB records into one full-test attempt object ────────
function buildFullAttempt(verbal, quant, awa) {
  const score       = (verbal.score       || 0) + (quant.score       || 0)
  const maxScore    = (verbal.maxScore    || 0) + (quant.maxScore    || 0)
  const correct     = (verbal.correctAnswers || 0) + (quant.correctAnswers || 0)
  const wrong       = (verbal.wrongAnswers   || 0) + (quant.wrongAnswers   || 0)
  const unattempted = (verbal.unattempted    || 0) + (quant.unattempted    || 0)
  return {
    _id:            new Date(verbal.dateAttempted).toISOString(), // unique per attempt
    testType:       'full',
    score, maxScore,
    correctAnswers: correct,
    wrongAnswers:   wrong,
    unattempted,
    totalTimeTaken: 0,
    dateAttempted:  verbal.dateAttempted,
    responses: [
      ...(verbal.responses || []).map(r => ({ ...r, subject: 'Verbal Reasoning' })),
      ...(quant.responses  || []).map(r => ({ ...r, subject: 'Quantitative Reasoning' })),
    ],
    sectionScores: {
      'Verbal Reasoning': {
        score: verbal.score,   maxScore: verbal.maxScore,
        correctAnswers: verbal.correctAnswers,   wrongAnswers: verbal.wrongAnswers,
        unattempted: verbal.unattempted,         totalQuestions: verbal.totalQuestions,
        scaledScore: verbal.scaledScore ?? null,
      },
      'Quantitative Reasoning': {
        score: quant.score, maxScore: quant.maxScore,
        correctAnswers: quant.correctAnswers, wrongAnswers: quant.wrongAnswers,
        unattempted: quant.unattempted,       totalQuestions: quant.totalQuestions,
        scaledScore: quant.scaledScore ?? null,
      },
    },
    essayResponse: awa?.essayResponse ?? null,
    essayStatus:   awa?.essayStatus ?? null,
  }
}

// Pair Verbal and Quant score arrays (and optionally AWA) into full-test attempts.
// Strategy: sort lists oldest-first, then pair by index.
function pairFullTestAttempts(verbalScores, quantScores, awaScores) {
  if (!verbalScores.length || !quantScores.length) return []
  const count  = Math.min(verbalScores.length, quantScores.length)
  const paired = []
  for (let i = 0; i < count; i++) {
    paired.push(buildFullAttempt(verbalScores[i], quantScores[i], awaScores[i] || null))
  }
  return paired
}

// ─── Main Component ───────────────────────────────────────────────────────────
const GREAnalysis = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const [results,         setResults]         = useState(null)
  const [enriched,        setEnriched]        = useState([])
  const [loading,         setLoading]         = useState(true)
  const [phase,           setPhase]           = useState('results')
  const [allAttempts,     setAllAttempts]     = useState([])
  const [activeAttemptId, setActiveAttemptId] = useState(null)

  const questionsRef = useRef([])

  const buildEnriched = (responseList, questionList) => {
    const qMap = {}
    questionList.forEach(q => { qMap[String(q._id)] = q })
    return responseList.map((r, i) => ({
      ...r,
      questionData: qMap[String(r.questionId)] || questionList[i] || null,
      globalIndex:  i,
    }))
  }

  const switchAttempt = (attempt) => {
    setActiveAttemptId(attempt._id)
    setResults(attempt)
    // Use already-loaded question pool if available; otherwise questions show as previews only
    setEnriched(buildEnriched(attempt.responses || [], questionsRef.current))
    setPhase('results')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => { loadKaTeX() }, [])

  useEffect(() => {
    let res = null
    let qs  = []

    if (location.state?.results) {
      res = location.state.results
      qs  = location.state.questions || []
    } else {
      try {
        const stored = JSON.parse(sessionStorage.getItem('greAnalysis') || '{}')
        res = stored.results || null
        qs  = stored.questions || []
      } catch { /* ignore */ }
    }

    if (!res) { navigate('/courses/gre', { replace: true }); return }
    setResults(res)
    setActiveAttemptId(res._id || null)

    const responses = res.responses || []
    const isEssaySubject = res.subject === 'Analytical Writing'

    if (qs.length > 0) {
      questionsRef.current = qs
      setEnriched(buildEnriched(responses, qs))
    } else {
      setEnriched(responses.map((r, i) => ({ ...r, questionData: null, globalIndex: i })))
    }
    setLoading(false)

    // Fetch questions by subject so the review page can show full question content
    // (needed when navigating from the GRE listing page where questions aren't passed)
    if (res.subject && !isEssaySubject && !qs.length) {
      axios.get(`${API_URL}/api/gre_questions?subject=${encodeURIComponent(res.subject)}`, { withCredentials: true })
        .then(({ data }) => {
          const fetched = Array.isArray(data) ? data : []
          if (fetched.length > 0) {
            questionsRef.current = fetched
            setEnriched(buildEnriched(responses, fetched))
          }
        })
        .catch(() => {})
    } else if (res.testType === 'full' && !qs.length) {
      // Full test: fetch both scorable subjects and tag each question with its section
      Promise.all([
        axios.get(`${API_URL}/api/gre_questions?subject=${encodeURIComponent('Verbal Reasoning')}`, { withCredentials: true }),
        axios.get(`${API_URL}/api/gre_questions?subject=${encodeURIComponent('Quantitative Reasoning')}`, { withCredentials: true }),
      ]).then(([verbalRes, quantRes]) => {
        const verbal = (Array.isArray(verbalRes.data) ? verbalRes.data : []).map(q => ({ ...q, subject: 'Verbal Reasoning' }))
        const quant  = (Array.isArray(quantRes.data)  ? quantRes.data  : []).map(q => ({ ...q, subject: 'Quantitative Reasoning' }))
        const all  = [...verbal, ...quant]
        if (all.length > 0) {
          questionsRef.current = all
          setEnriched(buildEnriched(responses, all))
        }
      }).catch(() => {})
    }

    // Fetch all attempts so user can switch between them
    axios.get(`${API_URL}/api/session-info`, { withCredentials: true })
      .then(({ data }) => {
        if (!data?.email) return null
        return axios.get(`${API_URL}/api/gre_scores`, {
          params: { email: data.email },
          withCredentials: true,
        })
      })
      .then(resp => {
        if (!resp?.data) return
        const all = Array.isArray(resp.data) ? resp.data : []

        let attempts = []
        if (res.testType === 'full') {
          // Pair each Verbal record with its nearest Quant/AWA record
          const verbalScores = all.filter(s => s.subject === 'Verbal Reasoning')
                               .sort((a, b) => new Date(a.dateAttempted) - new Date(b.dateAttempted))
          const quantScores  = all.filter(s => s.subject === 'Quantitative Reasoning')
                               .sort((a, b) => new Date(a.dateAttempted) - new Date(b.dateAttempted))
          const awaScores    = all.filter(s => s.subject === 'Analytical Writing')
                               .sort((a, b) => new Date(a.dateAttempted) - new Date(b.dateAttempted))
          attempts = pairFullTestAttempts(verbalScores, quantScores, awaScores)
          attempts.sort((a, b) => new Date(b.dateAttempted) - new Date(a.dateAttempted))
        } else {
          // Module-level / essay-level: match by subject
          attempts = res.subject
            ? all.filter(a => a.subject === res.subject)
            : []
          attempts.sort((a, b) => new Date(b.dateAttempted) - new Date(a.dateAttempted))
        }

        setAllAttempts(attempts)
        // activeAttemptId defaults to res._id; fall back to most-recent if not set
        if (!res._id && attempts.length > 0) setActiveAttemptId(attempts[0]._id)
      })
      .catch(() => {})
  }, [])

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
      <div className="spinner-border" style={{ color: '#6f42c1' }} role="status" />
    </div>
  )

  if (!results) return null

  if (phase === 'results') return (
    <ResultsPage
      results={results}
      enriched={enriched}
      onReview={() => setPhase('review')}
      allAttempts={allAttempts}
      activeAttemptId={activeAttemptId}
      onSwitchAttempt={switchAttempt}
    />
  )

  return (
    <ReviewAnswersPage
      enriched={enriched}
      onBack={() => setPhase('results')}
    />
  )
}

export default GREAnalysis
