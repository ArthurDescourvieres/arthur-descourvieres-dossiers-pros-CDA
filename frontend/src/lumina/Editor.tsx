import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
} from 'react'
import { useLumina, virtualPages } from './LuminaContext'
import { LuminaIcon } from './LuminaIcon'
import { spawnParticles } from '../lib/particles'
import { sanitizeHtml } from '../lib/sanitizeHtml'
import type {
  Block,
  BlockTodo as BlockTodoT,
  BlockH1,
  BlockH2,
  BlockP,
  BlockQuote,
  BlockCallout,
  Page,
} from '../data/types'

const REDUCED = () =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

// =====================================================================
// THEME TOGGLE
// =====================================================================
function ThemeToggle() {
  const lumina = useLumina()
  const isLight = lumina.theme === 'light'
  return (
    <button
      className={`theme-toggle ${lumina.theme}`}
      onClick={lumina.toggleTheme}
      aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      aria-pressed={isLight ? 'true' : 'false'}
    />
  )
}

// =====================================================================
// BREADCRUMB
// =====================================================================
function Breadcrumb({ page, virtualKey }: { page: Page | null; virtualKey: string | null }) {
  const lumina = useLumina()
  if (virtualKey) {
    const v = virtualPages[virtualKey as keyof typeof virtualPages]
    return (
      <div className="breadcrumb" id="breadcrumb">
        <a href="#" className="leaf" onClick={(e) => e.preventDefault()}>
          <span className="leaf-emoji">{v.emoji}</span>
          {v.title}
        </a>
      </div>
    )
  }
  if (!page) return <div className="breadcrumb" id="breadcrumb" />
  return (
    <div className="breadcrumb" id="breadcrumb">
      {page.path.map((seg, i) => {
        const isLeaf = i === page.path.length - 1
        return (
          <span key={i} style={{ display: 'contents' }}>
            <a
              href="#"
              className={isLeaf ? 'leaf' : undefined}
              onClick={(e) => {
                e.preventDefault()
                if (!isLeaf) lumina.showToast(`Navigating to “${seg}”`, 'folder')
              }}
            >
              {isLeaf && <span className="leaf-emoji">{page.emoji}</span>}
              {seg}
            </a>
            {!isLeaf && <span className="sep">/</span>}
          </span>
        )
      })}
    </div>
  )
}

// =====================================================================
// TOPBAR
// =====================================================================
function Topbar({ page, virtualKey }: { page: Page | null; virtualKey: string | null }) {
  const lumina = useLumina()

  const openShare = () => {
    const p = page
    lumina.openModal(
      <>
        <h3>Share {p ? `“${p.title}”` : 'this view'}</h3>
        <p>Invite someone by email, or copy a private link.</p>
        <input type="text" placeholder="name@studio.co" />
        <div
          style={{
            margin: '16px 0 6px',
            fontSize: 11,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--color-text-faint)',
          }}
        >
          People with access
        </div>
        <div className="share-list">
          <div className="share-row">
            <div className="avatar">E</div>
            <div>
              <div>Elise Marchetti</div>
              <div style={{ fontSize: 11.5, color: 'var(--color-text-faint)' }}>
                elise@lumina.work
              </div>
            </div>
            <div className="role">Owner</div>
          </div>
          <div className="share-row">
            <div
              className="avatar"
              style={{
                background:
                  'radial-gradient(60% 60% at 35% 30%, oklch(0.85 0.15 42), oklch(0.45 0.18 42))',
              }}
            >
              M
            </div>
            <div>
              <div>Marianne Lowell</div>
              <div style={{ fontSize: 11.5, color: 'var(--color-text-faint)' }}>Can edit</div>
            </div>
            <div className="role">Editor</div>
          </div>
          <div className="share-row">
            <div
              className="avatar"
              style={{
                background:
                  'radial-gradient(60% 60% at 35% 30%, oklch(0.85 0.12 85), oklch(0.45 0.15 85))',
              }}
            >
              H
            </div>
            <div>
              <div>Hiro Kanda</div>
              <div style={{ fontSize: 11.5, color: 'var(--color-text-faint)' }}>Can comment</div>
            </div>
            <div className="role">Viewer</div>
          </div>
        </div>
        <div className="modal-row">
          <button className="modal-btn" onClick={lumina.closeModal}>
            Cancel
          </button>
          <button
            className="modal-btn"
            onClick={() => {
              lumina.closeModal()
              lumina.showToast('Link copied to clipboard', 'link')
            }}
          >
            Copy link
          </button>
          <button className="modal-btn primary" onClick={lumina.closeModal}>
            Invite
          </button>
        </div>
      </>,
    )
  }

  const openHistory = () => {
    const p = page
    lumina.openModal(
      <>
        <h3>Version history</h3>
        <p>Snapshots are saved automatically every few minutes. Click to restore.</p>
        <div className="history-list">
          <div className="history-item">
            <div className="when">2 hours ago</div>
            <div>
              <div className="what">Reworked opening paragraph</div>
              <div className="who">Elise Marchetti · +184 / −56</div>
            </div>
          </div>
          <div className="history-item">
            <div className="when">Yesterday</div>
            <div>
              <div className="what">Added three new to-dos</div>
              <div className="who">Elise Marchetti · +42 / −0</div>
            </div>
          </div>
          <div className="history-item">
            <div className="when">Apr 19</div>
            <div>
              <div className="what">Imported Orsola interview fragments</div>
              <div className="who">Elise Marchetti · +912 / −11</div>
            </div>
          </div>
          <div className="history-item">
            <div className="when">Apr 14</div>
            <div>
              <div className="what">Renamed “Night atlas” → “{p ? p.title : 'This page'}”</div>
              <div className="who">Elise Marchetti</div>
            </div>
          </div>
          <div className="history-item">
            <div className="when">Apr 2</div>
            <div>
              <div className="what">Created page</div>
              <div className="who">Elise Marchetti</div>
            </div>
          </div>
        </div>
        <div className="modal-row">
          <button className="modal-btn" onClick={lumina.closeModal}>
            Close
          </button>
        </div>
      </>,
    )
  }

  const openComments = () => {
    lumina.openModal(
      <>
        <h3>Comments</h3>
        <p>A quiet place for small annotations. Marianne left one on this page.</p>
        <div
          style={{
            padding: 12,
            borderRadius: 10,
            background: 'oklch(1 0 0 / 0.03)',
            border: '1px solid var(--color-line)',
            marginBottom: 10,
          }}
        >
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div
              className="avatar"
              style={{
                width: 24,
                height: 24,
                fontSize: 11,
                background:
                  'radial-gradient(60% 60% at 35% 30%, oklch(0.85 0.15 42), oklch(0.45 0.18 42))',
              }}
            >
              M
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-text)' }}>Marianne</div>
            <div
              style={{
                marginLeft: 'auto',
                fontSize: 11,
                color: 'var(--color-text-faint)',
              }}
            >
              yesterday
            </div>
          </div>
          <div
            style={{
              marginTop: 8,
              fontSize: 13.5,
              lineHeight: 1.55,
              color: 'var(--color-text-muted)',
            }}
          >
            “Kinder object” is lovely — keep it. Consider tightening the next sentence.
          </div>
        </div>
        <input type="text" placeholder="Write a reply…" />
        <div className="modal-row">
          <button className="modal-btn" onClick={lumina.closeModal}>
            Close
          </button>
          <button className="modal-btn primary" onClick={lumina.closeModal}>
            Reply
          </button>
        </div>
      </>,
    )
  }

  return (
    <header className="topbar">
      <Breadcrumb page={page} virtualKey={virtualKey} />
      <div className="topbar-actions">
        <ThemeToggle />
        <button className="icon-btn" onClick={openHistory} aria-label="History">
          <LuminaIcon name="clock" />
        </button>
        <button
          className={`icon-btn ${lumina.favorite ? 'active' : ''}`}
          onClick={lumina.toggleFavorite}
          aria-label="Favorite"
        >
          <LuminaIcon name="star" />
        </button>
        <button className="icon-btn" onClick={openComments} aria-label="Comments">
          <LuminaIcon name="message-square" />
        </button>
        <button className="icon-btn" onClick={lumina.togglePanel} aria-label="Toggle panel">
          <LuminaIcon name="panel-right" />
        </button>
        <button className="share-btn" onClick={openShare} data-magnetic="">
          <LuminaIcon name="send" />
          Share
        </button>
      </div>
    </header>
  )
}

// =====================================================================
// BLOCK HANDLE
// =====================================================================
function BlockHandle() {
  return (
    <span className="block-handle">
      <button className="icon-btn" aria-label="Add block">
        <LuminaIcon name="plus" />
      </button>
      <button className="icon-btn" aria-label="Drag">
        <LuminaIcon name="grip-vertical" />
      </button>
    </span>
  )
}

// =====================================================================
// BLOCK VARIANTS
// =====================================================================
function BlockTodo({ block }: { block: BlockTodoT }) {
  const [done, setDone] = useState(block.done)
  const checkRef = useRef<HTMLButtonElement | null>(null)

  const onToggle = (e: ReactMouseEvent) => {
    e.stopPropagation()
    setDone((prev) => {
      const next = !prev
      if (next && checkRef.current) spawnParticles(checkRef.current)
      return next
    })
  }

  return (
    <div className={`block-todo ${done ? 'done' : ''}`}>
      <button
        ref={checkRef}
        className="todo-check"
        aria-label="Toggle todo"
        tabIndex={0}
        onClick={onToggle}
      >
        <svg viewBox="0 0 24 24">
          <path d="M5 12.5 L10 17.5 L19 7" />
        </svg>
      </button>
      <div className="todo-label">{block.label}</div>
      <span className="todo-meta tag">{block.meta}</span>
    </div>
  )
}

function SlashTrigger() {
  const lumina = useLumina()
  const ref = useRef<HTMLDivElement | null>(null)
  return (
    <div
      ref={ref}
      className="slash-trigger"
      data-slash-trigger=""
      onClick={(e) => {
        e.stopPropagation()
        if (ref.current) lumina.openSlashMenu(ref.current)
      }}
    >
      <span className="bar"></span>
      <span>
        Type <strong style={{ color: 'var(--color-text)' }}>/</strong> to insert a new block…
      </span>
    </div>
  )
}

function BlockBody({ block }: { block: Block }) {
  switch (block.type) {
    case 'callout': {
      const b = block as BlockCallout
      return (
        <div className="block-callout">
          <span className="callout-icon">{b.icon}</span>
          <div
            className="callout-body"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(b.body) }}
          />
        </div>
      )
    }
    case 'h1': {
      const b = block as BlockH1
      return <div className="block-h1">{b.text}</div>
    }
    case 'h2': {
      const b = block as BlockH2
      return <div className="block-h2">{b.text}</div>
    }
    case 'p': {
      const b = block as BlockP
      return (
        <div
          className="block-p"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(b.html ?? b.text ?? '') }}
        />
      )
    }
    case 'quote': {
      const b = block as BlockQuote
      return (
        <blockquote className="block-quote">
          {b.text}
          <span className="block-quote-cite">— {b.cite}</span>
        </blockquote>
      )
    }
    case 'divider':
      return (
        <div className="block-divider">
          <span className="block-divider-mark">✦ ✦ ✦</span>
        </div>
      )
    case 'todo':
      return <BlockTodo block={block as BlockTodoT} />
    case 'slash':
      return <SlashTrigger />
    default:
      return null
  }
}

function BlockRow({
  block,
  idx,
  focused,
  onFocus,
  initialDelay,
}: {
  block: Block
  idx: number
  focused: boolean
  onFocus: () => void
  initialDelay: number
}) {
  const ref = useRef<HTMLDivElement | null>(null)
  const isDivider = block.type === 'divider'

  // Stagger entry animation: start with .will-enter, swap to .enter after delay.
  const [entered, setEntered] = useState(false)
  useEffect(() => {
    if (REDUCED()) {
      setEntered(true)
      return
    }
    const t = window.setTimeout(() => setEntered(true), 60 * idx + initialDelay)
    return () => window.clearTimeout(t)
  }, [idx, initialDelay])

  return (
    <div
      ref={ref}
      className={`block ${entered ? 'enter' : 'will-enter'} ${focused ? 'focus' : ''}`}
      data-block-idx={idx}
      onClick={onFocus}
      style={REDUCED() ? { opacity: 1, clipPath: 'none' } : undefined}
    >
      {!isDivider ? <BlockHandle /> : null}
      <BlockBody block={block} />
    </div>
  )
}

// =====================================================================
// PAGE (renders current page content w/ exit/enter)
// =====================================================================
function PageView({ page, initialDelay }: { page: Page; initialDelay: number }) {
  const [focusedIdx, setFocusedIdx] = useState<number | null>(null)
  const tasks = useMemo(() => page.blocks.filter((b) => b.type === 'todo').length, [page])
  return (
    <article className="page" id="lumina-page">
      <div className="cover" />
      <div className="page-emoji">{page.emoji}</div>
      <h1
        className="page-title"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.titleHTML || page.title) }}
      />
      <div className="page-subtitle">
        <span>Edited {page.meta.edited}</span>
        <span className="dot" />
        <span>by {page.meta.by}</span>
        <span className="dot" />
        <span>
          {tasks} tasks · {page.blocks.length} blocks
        </span>
      </div>
      {page.blocks.map((b, i) => (
        <BlockRow
          key={`${page.id}-${i}`}
          block={b}
          idx={i}
          focused={focusedIdx === i}
          onFocus={() => setFocusedIdx(i)}
          initialDelay={initialDelay}
        />
      ))}
    </article>
  )
}

function VirtualPageView({ vkey }: { vkey: keyof typeof virtualPages }) {
  const v = virtualPages[vkey]
  return (
    <article className="page" id="lumina-page">
      <div className="empty-state">
        <div className="icon">
          <LuminaIcon name={v.icon} />
        </div>
        <h2>{v.title}</h2>
        <p>{v.subtitle}</p>
      </div>
    </article>
  )
}

// =====================================================================
// SLASH MENU
// =====================================================================
const SLASH_ITEMS = [
  {
    key: 'h1',
    icon: 'heading-1',
    title: 'Heading 1',
    desc: 'Section title, displayed in Boska.',
    kbd: '#',
  },
  {
    key: 'h2',
    icon: 'heading-2',
    title: 'Heading 2',
    desc: 'Subsection with medium prominence.',
    kbd: '##',
  },
  {
    key: 'todo',
    icon: 'check-square',
    title: 'To-do',
    desc: 'Track a task with a checkbox.',
    kbd: '[]',
  },
  {
    key: 'callout',
    icon: 'lightbulb',
    title: 'Callout',
    desc: 'Highlight a passage with an icon.',
    kbd: '!',
  },
  {
    key: 'quote',
    icon: 'quote',
    title: 'Quote',
    desc: 'Attribute a line in italic serif.',
    kbd: '"',
  },
  {
    key: 'divider',
    icon: 'minus',
    title: 'Divider',
    desc: 'Break up content with a line.',
    kbd: '---',
  },
]

function SlashMenu({ scrollRef }: { scrollRef: React.RefObject<HTMLDivElement | null> }) {
  const lumina = useLumina()
  const open = !!lumina.slashTriggerEl
  const [activeIdx, setActiveIdx] = useState(0)
  const [pos, setPos] = useState<{ left: number; top: number }>({ left: 0, top: 0 })

  // Position menu relative to the editor-col / scroll container.
  useLayoutEffect(() => {
    if (!open) return
    const anchor = lumina.slashTriggerEl
    const scroll = scrollRef.current
    if (!anchor || !scroll) return
    const a = anchor.getBoundingClientRect()
    const s = scroll.getBoundingClientRect()
    setPos({
      left: a.left - s.left + 12,
      top: a.top - s.top + 28,
    })
    setActiveIdx(0)
  }, [open, lumina.slashTriggerEl, scrollRef])

  // Keyboard nav.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        lumina.closeSlashMenu()
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIdx((i) => (i + 1) % SLASH_ITEMS.length)
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIdx((i) => (i - 1 + SLASH_ITEMS.length) % SLASH_ITEMS.length)
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        const item = SLASH_ITEMS[activeIdx]
        lumina.closeSlashMenu()
        lumina.showToast(`Inserted ${item.title}`, item.icon)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, activeIdx, lumina])

  // Click outside.
  useEffect(() => {
    if (!open) return
    const onClick = (e: globalThis.MouseEvent) => {
      const t = e.target as Element | null
      if (!t) return
      if (t.closest('.slash-menu')) return
      if (t.closest('[data-slash-trigger]')) return
      lumina.closeSlashMenu()
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [open, lumina])

  if (!open) return null

  const style: CSSProperties = {
    left: `${pos.left}px`,
    top: `${pos.top}px`,
  }

  return (
    <div className="slash-menu open" role="listbox" aria-label="Insert block" style={style}>
      <div className="slash-menu-label">Basic blocks</div>
      {SLASH_ITEMS.map((item, i) => (
        <button
          key={item.key}
          className={`slash-item ${activeIdx === i ? 'active' : ''}`}
          data-slash={item.key}
          onMouseEnter={() => setActiveIdx(i)}
          onClick={() => {
            lumina.closeSlashMenu()
            lumina.showToast(`Inserted ${item.title}`, item.icon)
          }}
        >
          <span className="slash-item-icon">
            <LuminaIcon name={item.icon} />
          </span>
          <span className="slash-item-body">
            <div className="slash-item-title">{item.title}</div>
            <div className="slash-item-desc">{item.desc}</div>
          </span>
          <span className="slash-item-kbd">{item.kbd}</span>
        </button>
      ))}
    </div>
  )
}

// =====================================================================
// EDITOR COLUMN
// =====================================================================
export function Editor() {
  const lumina = useLumina()
  const scrollRef = useRef<HTMLDivElement | null>(null)

  const page = lumina.currentPageId ? lumina.pages[lumina.currentPageId] : null
  const virtualKey = lumina.currentVirtual

  // Page exit/enter animation: when currentPageId changes, briefly add page-enter.
  const [enterKey, setEnterKey] = useState(0)
  const lastIdRef = useRef<string | null>(lumina.currentPageId)
  useEffect(() => {
    if (lumina.currentPageId !== lastIdRef.current) {
      lastIdRef.current = lumina.currentPageId
      setEnterKey((k) => k + 1)
    }
  }, [lumina.currentPageId])

  const handleEditorClick = useCallback((_e: ReactMouseEvent<HTMLElement>) => {
    // any click in editor area dismisses page-exit class; React handles the state
  }, [])

  return (
    <main className="editor-col" onClick={handleEditorClick}>
      <Topbar page={page} virtualKey={virtualKey} />
      <div className="editor-scroll" id="editorScroll" ref={scrollRef}>
        {page ? (
          <PageView key={`${page.id}-${enterKey}`} page={page} initialDelay={150} />
        ) : virtualKey ? (
          <VirtualPageView key={`v-${virtualKey}`} vkey={virtualKey} />
        ) : null}
      </div>
      <SlashMenu scrollRef={scrollRef} />
    </main>
  )
}
