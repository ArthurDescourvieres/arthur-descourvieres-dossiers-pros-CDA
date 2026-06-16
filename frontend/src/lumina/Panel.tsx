import { useMemo } from 'react'
import { useLumina, virtualPages } from './LuminaContext'
import { LuminaIcon } from './LuminaIcon'
import type { Page } from '../data/types'

function Properties({ page }: { page: Page }) {
  const m = page.meta
  return (
    <div>
      <div className="panel-title">
        <span>Properties</span>
        <button className="dots icon-btn" aria-label="More">
          <LuminaIcon name="more-horizontal" />
        </button>
      </div>
      <div className="prop-row">
        <div className="prop-label">
          <LuminaIcon name="file-text" /> Type
        </div>
        <div className="prop-value">
          <span className="chip chip-slate">Long-form note</span>
        </div>
      </div>
      <div className="prop-row">
        <div className="prop-label">
          <LuminaIcon name="activity" /> Status
        </div>
        <div className="prop-value">
          <span className="status-dot" />
          <span className={`chip chip-${m.status[1]}`}>{m.status[0]}</span>
        </div>
      </div>
      <div className="prop-row">
        <div className="prop-label">
          <LuminaIcon name="tag" /> Tags
        </div>
        <div className="prop-value">
          {m.tags.map(([label, color], i) => (
            <span key={i} className={`chip chip-${color}`}>
              {label}
            </span>
          ))}
        </div>
      </div>
      <div className="prop-row">
        <div className="prop-label">
          <LuminaIcon name="calendar" /> Created
        </div>
        <div className="prop-value">{m.created}</div>
      </div>
      <div className="prop-row">
        <div className="prop-label">
          <LuminaIcon name="clock" /> Edited
        </div>
        <div className="prop-value">{m.edited}</div>
      </div>
      <div className="prop-row">
        <div className="prop-label">
          <LuminaIcon name="user" /> By
        </div>
        <div className="prop-value">
          <span className="activity-avatar a" style={{ width: 16, height: 16, fontSize: 8 }}>
            E
          </span>{' '}
          {m.by}
        </div>
      </div>
      <div className="prop-row">
        <div className="prop-label">
          <LuminaIcon name="users" /> Shared
        </div>
        <div className="prop-value">
          <span className="chip chip-slate">Only me</span>
        </div>
      </div>
    </div>
  )
}

function Backlinks({ page }: { page: Page }) {
  const lumina = useLumina()
  const items = useMemo(
    () =>
      Object.values(lumina.pages)
        .filter((p) => p.id !== page.id)
        .slice(0, 2),
    [lumina.pages, page.id],
  )
  return (
    <div>
      <div className="panel-section-title">
        <LuminaIcon name="link" /> Backlinks
      </div>
      {items.map((b) => (
        <button
          key={b.id}
          className="backlink"
          data-nav={b.id}
          onClick={() => lumina.navigate(b.id)}
        >
          <span className="backlink-emoji">{b.emoji}</span>
          <div>
            <div className="backlink-title">{b.title}</div>
            <div className="backlink-context">
              Referenced in <em>{page.title}</em>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}

function Activity({ edited }: { edited: string }) {
  return (
    <div>
      <div className="panel-section-title">
        <LuminaIcon name="history" /> Activity
      </div>
      <div className="activity">
        <div className="activity-avatar a">E</div>
        <div className="activity-body">
          <strong>Elise</strong> edited two blocks.
          <div className="activity-time">{edited}</div>
        </div>
      </div>
      <div className="activity" style={{ marginTop: 12 }}>
        <div className="activity-avatar b">M</div>
        <div className="activity-body">
          <strong>Marianne</strong> left a comment on <em>Opening</em>.
          <div className="activity-time">Yesterday</div>
        </div>
      </div>
      <div className="activity" style={{ marginTop: 12 }}>
        <div className="activity-avatar c">H</div>
        <div className="activity-body">
          <strong>Hiro</strong> attached <em>05:10_east_window.tiff</em>.
          <div className="activity-time">4 days ago</div>
        </div>
      </div>
    </div>
  )
}

function VirtualAbout({ vkey }: { vkey: keyof typeof virtualPages }) {
  const v = virtualPages[vkey]
  return (
    <div>
      <div className="panel-title">
        <span>About</span>
      </div>
      <div className="prop-row">
        <div className="prop-label">
          <LuminaIcon name="file-text" /> View
        </div>
        <div className="prop-value">
          <span className="chip chip-slate">{v.title}</span>
        </div>
      </div>
      <div className="prop-row">
        <div className="prop-label">
          <LuminaIcon name="activity" /> Items
        </div>
        <div className="prop-value">0</div>
      </div>
    </div>
  )
}

export function Panel() {
  const lumina = useLumina()
  const page = lumina.currentPageId ? lumina.pages[lumina.currentPageId] : null
  const vkey = lumina.currentVirtual

  return (
    <aside className="panel" id="panel">
      <div className="panel-inner" id="panelInner">
        {page ? (
          <>
            <Properties page={page} />
            <Backlinks page={page} />
            <Activity edited={page.meta.edited} />
          </>
        ) : vkey ? (
          <VirtualAbout vkey={vkey} />
        ) : null}
      </div>
    </aside>
  )
}
