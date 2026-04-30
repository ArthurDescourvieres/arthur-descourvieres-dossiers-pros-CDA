import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { createPortal } from 'react-dom';
import { useLumina } from './LuminaContext';
import { LuminaIcon } from './LuminaIcon';

const REDUCED = () =>
  typeof matchMedia !== 'undefined' &&
  matchMedia('(prefers-reduced-motion: reduce)').matches;

// =====================================================================
// CUSTOM CURSOR
// =====================================================================
export function Cursor() {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const trailRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (REDUCED()) return;
    const dot = dotRef.current;
    const trail = trailRef.current;
    if (!dot || !trail) return;

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let dx = mx;
    let dy = my;
    let tx = mx;
    let ty = my;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
    };
    const onLeave = () => {
      dot.style.opacity = '0';
      trail.style.opacity = '0';
    };
    const onEnter = () => {
      dot.style.opacity = '';
      trail.style.opacity = '';
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseleave', onLeave);
    window.addEventListener('mouseenter', onEnter);

    const tick = () => {
      dx += (mx - dx) * 0.55;
      dy += (my - dy) * 0.55;
      tx += (mx - tx) * 0.14;
      ty += (my - ty) * 0.14;
      dot.style.transform = `translate3d(${dx}px, ${dy}px, 0) translate(-50%, -50%)`;
      trail.style.transform = `translate3d(${tx}px, ${ty}px, 0) translate(-50%, -50%)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // Hover detection
    const hoverSel =
      'button, a, .nav-item, .slash-item, .todo-check, .backlink, [data-magnetic]';
    const onOver = (e: MouseEvent) => {
      const t = e.target as Element | null;
      if (t && t.closest(hoverSel)) document.body.classList.add('cursor-hover');
    };
    const onOut = (e: MouseEvent) => {
      const t = e.target as Element | null;
      if (t && t.closest(hoverSel)) document.body.classList.remove('cursor-hover');
    };
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseout', onOut);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('mouseenter', onEnter);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout', onOut);
    };
  }, []);

  return (
    <>
      <div className="cursor-trail" id="cursorTrail" ref={trailRef} />
      <div className="cursor-dot" id="cursorDot" ref={dotRef} />
    </>
  );
}

// =====================================================================
// MAGNETIC BUTTONS
// =====================================================================
export function MagneticManager() {
  useEffect(() => {
    if (REDUCED()) return;
    const radius = 80;
    const strength = 0.25;
    let mx = 0;
    let my = 0;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
    };
    window.addEventListener('mousemove', onMove);

    const tick = () => {
      const els = Array.from(
        document.querySelectorAll<HTMLElement>('[data-magnetic]'),
      );
      els.forEach((el) => {
        if (!el.dataset.magneticReady) {
          el.style.willChange = 'transform';
          el.style.transition = 'transform 220ms cubic-bezier(0.16, 1, 0.3, 1)';
          el.dataset.magneticReady = '1';
        }
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = mx - cx;
        const dy = my - cy;
        const dist = Math.hypot(dx, dy);
        const reach = radius + Math.max(r.width, r.height) / 2;
        if (dist < reach) {
          const k = Math.max(0, 1 - dist / reach) * strength;
          el.style.transform = `translate(${dx * k}px, ${dy * k}px)`;
        } else {
          el.style.transform = '';
        }
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
    };
  }, []);
  return null;
}

// =====================================================================
// TOAST LAYER
// =====================================================================
export function ToastLayer() {
  const lumina = useLumina();
  return createPortal(
    <div
      className="fixed bottom-[24px] left-1/2 -translate-x-1/2 flex flex-col gap-[8px] z-[10000] pointer-events-none"
      id="toastLayer"
    >
      {lumina.toasts.map((t) => (
        <div
          key={t.id}
          className={
            'toast inline-flex items-center gap-[10px] py-[10px] px-[16px] rounded-[10px] max-w-[420px] text-[13px] text-[var(--color-text)] [&>svg]:w-[14px] [&>svg]:h-[14px] [&>svg]:text-[var(--color-teal)] [&>svg]:flex-[0_0_auto]' +
            (t.leaving ? ' leaving' : '')
          }
          style={{ pointerEvents: 'auto' }}
        >
          {t.icon ? <LuminaIcon name={t.icon} /> : null}
          <span>{t.text}</span>
        </div>
      ))}
    </div>,
    document.body,
  );
}

// =====================================================================
// MODAL
// =====================================================================
export function Modal() {
  const lumina = useLumina();
  const [mounted, setMounted] = useState(false);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    if (lumina.modal.open) {
      setMounted(true);
      const id = requestAnimationFrame(() => setOpening(true));
      return () => cancelAnimationFrame(id);
    } else {
      setOpening(false);
      const t = window.setTimeout(() => setMounted(false), 260);
      return () => window.clearTimeout(t);
    }
  }, [lumina.modal.open]);

  if (!mounted && !lumina.modal.body) return null;

  return createPortal(
    <div
      className={
        'modal-backdrop fixed inset-0 grid place-items-center z-[9000]' +
        (opening ? ' open' : '')
      }
      id="modalBackdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) lumina.closeModal();
      }}
    >
      <div
        className="modal w-[min(560px,calc(100vw-48px))] py-[20px] px-[22px] rounded-[16px]"
        id="modalBox"
        role="dialog"
      >
        {lumina.modal.body}
      </div>
    </div>,
    document.body,
  );
}

// =====================================================================
// CONTEXT MENU
// =====================================================================
export function ContextMenu() {
  const lumina = useLumina();
  const ref = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number }>({ left: 0, top: 0 });

  useLayoutEffect(() => {
    if (!lumina.ctxMenu.open) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    let left = lumina.ctxMenu.x;
    let top = lumina.ctxMenu.y;
    const margin = 8;
    if (left + r.width > window.innerWidth - margin) {
      left = window.innerWidth - r.width - margin;
    }
    if (top + r.height > window.innerHeight - margin) {
      top = window.innerHeight - r.height - margin;
    }
    setPos({ left, top });
  }, [lumina.ctxMenu]);

  if (!lumina.ctxMenu.open) return null;

  const style: CSSProperties = {
    left: `${pos.left}px`,
    top: `${pos.top}px`,
    display: 'block',
  };

  return createPortal(
    <div
      className="ctx-menu open min-w-[220px] p-[6px] rounded-[12px]"
      ref={ref}
      style={style}
      role="menu"
    >
      {lumina.ctxMenu.items.map((it, i) => {
        if (it === '-')
          return (
            <hr
              key={`s-${i}`}
              className="border-0 border-t border-[var(--color-line)] my-[4px] mx-[6px]"
            />
          );
        if ('kind' in it && it.kind === 'label') {
          return (
            <div
              key={`l-${i}`}
              className="flex items-center gap-[6px] pt-[6px] pb-[4px] px-[10px] text-[11px] tracking-[0.08em] uppercase text-[var(--color-text-faint)]"
            >
              {it.icon ? <LuminaIcon name={it.icon} /> : null}
              <span>{it.label}</span>
            </div>
          );
        }
        const action = it as Exclude<
          typeof it,
          '-' | { kind: 'label'; label: string; icon?: string }
        >;
        const baseBtn =
          'flex items-center gap-[10px] w-full py-[7px] px-[10px] rounded-[6px] text-[13px] text-left transition-[background,color] duration-[140ms] [&>svg]:w-[14px] [&>svg]:h-[14px] [&>svg]:flex-[0_0_14px]';
        const toneBtn = action.danger
          ? 'text-[oklch(0.78_0.16_20)] hover:bg-[oklch(0.65_0.2_20_/_0.12)] hover:text-[oklch(0.9_0.16_20)]'
          : 'text-[var(--color-text-muted)] hover:bg-[var(--color-overlay)] hover:text-[var(--color-text)]';
        return (
          <button
            key={`b-${i}`}
            className={baseBtn + ' ' + toneBtn}
            onClick={() => {
              lumina.closeCtxMenu();
              if (action.action) action.action();
            }}
          >
            {action.icon ? <LuminaIcon name={action.icon} /> : null}
            <span>{action.label}</span>
            {action.kbd ? (
              <kbd className="ml-auto text-[10.5px] py-[1px] px-[5px] rounded-[4px] border border-[var(--color-line)] text-[var(--color-text-faint)] bg-[var(--color-ink-shadow)] font-sans not-italic">
                {action.kbd}
              </kbd>
            ) : null}
          </button>
        );
      })}
    </div>,
    document.body,
  );
}
