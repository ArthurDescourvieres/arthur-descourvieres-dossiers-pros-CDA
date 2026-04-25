import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { initialPages, virtualPages } from '../data/pages';
import {
  clearUids,
  ensureUids,
  findNodeByUid,
  initialNavTree,
  isDescendant,
  removeNodeByUid,
} from '../data/navTree';
import type { NavNode, Page, VirtualKey } from '../data/types';
import { escapeHTML } from '../lib/escapeHtml';

export type Theme = 'light' | 'dark';

export type ToastItem = { id: number; text: string; icon?: string; leaving?: boolean };

export type CtxMenuEntry =
  | '-'
  | { kind: 'label'; label: string; icon?: string }
  | {
      label: string;
      icon?: string;
      kbd?: string;
      danger?: boolean;
      action?: () => void;
    };

export type CtxMenuState = {
  open: boolean;
  x: number;
  y: number;
  items: CtxMenuEntry[];
};

export type ModalState = { open: boolean; body: ReactNode | null };

export type DropIndicator =
  | null
  | { kind: 'into'; uid: string }
  | { kind: 'line'; uid: string; before: boolean };

export type LuminaState = {
  theme: Theme;
  toggleTheme: () => void;

  pages: Record<string, Page>;
  currentPageId: string | null;
  currentVirtual: VirtualKey | null;
  navigate: (id: string) => void;
  openVirtual: (key: VirtualKey) => void;

  navTree: NavNode[];
  bumpNav: () => void;
  pendingRename: string | null;
  setPendingRename: (uid: string | null) => void;

  panelCollapsed: boolean;
  togglePanel: () => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  toasts: ToastItem[];
  showToast: (text: string, icon?: string) => void;

  ctxMenu: CtxMenuState;
  openCtxMenu: (items: CtxMenuEntry[], x: number, y: number) => void;
  closeCtxMenu: () => void;

  modal: ModalState;
  openModal: (body: ReactNode) => void;
  closeModal: () => void;

  slashTriggerEl: HTMLElement | null;
  openSlashMenu: (anchor: HTMLElement) => void;
  closeSlashMenu: () => void;

  dropIndicator: DropIndicator;
  setDropIndicator: (d: DropIndicator) => void;
  dragUid: string | null;
  setDragUid: (uid: string | null) => void;

  favorite: boolean;
  toggleFavorite: () => void;

  makeBlankPage: (id: string, title: string) => Page;
};

const LuminaCtx = createContext<LuminaState | null>(null);

function getPreferredTheme(): Theme {
  const stored = localStorage.getItem('lumina.theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

let toastSeq = 1;

export function LuminaProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getPreferredTheme);
  const [pages, setPages] = useState<Record<string, Page>>(() => ({ ...initialPages }));
  const [currentPageId, setCurrentPageId] = useState<string | null>('atlas');
  const [currentVirtual, setCurrentVirtual] = useState<VirtualKey | null>(null);

  const navRef = useRef<NavNode[]>(initialNavTree);
  ensureUids(navRef.current);
  const [, setNavVersion] = useState(0);
  const bumpNav = useCallback(() => setNavVersion((v) => v + 1), []);
  const [pendingRename, setPendingRenameState] = useState<string | null>(null);

  const [panelCollapsed, setPanelCollapsed] = useState<boolean>(true);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const showToast = useCallback((text: string, icon?: string) => {
    const id = toastSeq++;
    setToasts((t) => [...t, { id, text, icon }]);
    setTimeout(() => {
      setToasts((t) => t.map((x) => (x.id === id ? { ...x, leaving: true } : x)));
    }, 2200);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 2460);
  }, []);

  const [ctxMenu, setCtxMenu] = useState<CtxMenuState>({
    open: false,
    x: 0,
    y: 0,
    items: [],
  });
  const openCtxMenu = useCallback(
    (items: CtxMenuEntry[], x: number, y: number) => {
      setCtxMenu({ open: true, x, y, items });
    },
    [],
  );
  const closeCtxMenu = useCallback(
    () => setCtxMenu((c) => ({ ...c, open: false })),
    [],
  );

  const [modal, setModal] = useState<ModalState>({ open: false, body: null });
  const openModal = useCallback(
    (body: ReactNode) => setModal({ open: true, body }),
    [],
  );
  const closeModal = useCallback(() => {
    setModal((m) => ({ ...m, open: false }));
    setTimeout(() => setModal({ open: false, body: null }), 260);
  }, []);

  const [slashTriggerEl, setSlashTriggerEl] = useState<HTMLElement | null>(null);
  const openSlashMenu = useCallback((anchor: HTMLElement) => {
    setSlashTriggerEl(anchor);
  }, []);
  const closeSlashMenu = useCallback(() => setSlashTriggerEl(null), []);

  const [dropIndicator, setDropIndicator] = useState<DropIndicator>(null);
  const [dragUid, setDragUid] = useState<string | null>(null);

  const [favorite, setFavorite] = useState(false);

  const makeBlankPage = useCallback(
    (id: string, title: string): Page => ({
      id,
      title,
      titleHTML: escapeHTML(title),
      emoji: '📝',
      path: ['Private', title],
      meta: {
        created: new Date().toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        edited: 'just now',
        by: 'Elise Marchetti',
        tags: [['Draft', 'slate']],
        status: ['New', 'teal'],
        icon: '📝',
      },
      blocks: [
        {
          type: 'callout',
          icon: '✨',
          body: 'A fresh page. Start writing, or press <strong>/</strong> to insert a block.',
        },
        { type: 'p', html: 'Your first thought goes here.' },
        { type: 'slash' },
      ],
    }),
    [],
  );

  const navigate = useCallback(
    (id: string) => {
      if (!pages[id] || id === currentPageId) return;
      setCurrentVirtual(null);
      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduced) {
        setCurrentPageId(id);
        return;
      }
      const el = document.getElementById('lumina-page');
      if (el) el.classList.add('page-exit');
      setTimeout(() => {
        setCurrentPageId(id);
      }, 180);
    },
    [pages, currentPageId],
  );

  const openVirtual = useCallback((key: VirtualKey) => {
    setCurrentVirtual(key);
    setCurrentPageId(null);
  }, []);

  const setPendingRename = useCallback((uid: string | null) => {
    setPendingRenameState(uid);
  }, []);

  const togglePanel = useCallback(() => {
    if (matchMedia('(max-width: 1100px)').matches) {
      // On tablet: panel opens as overlay by flipping panel-open
      setPanelCollapsed((v) => !v); // we reuse the same flag but apply it as .panel-open at tablet
    } else {
      setPanelCollapsed((v) => !v);
    }
  }, []);

  const toggleFavorite = useCallback(() => {
    setFavorite((f) => {
      const next = !f;
      showToast(next ? 'Added to favourites' : 'Removed from favourites', 'star');
      return next;
    });
  }, [showToast]);

  const toggleTheme = useCallback(() => {
    const root = document.documentElement;
    root.classList.add('theme-transition');
    setTimeout(() => root.classList.remove('theme-transition'), 520);
    setTheme((cur) => {
      const next: Theme = cur === 'light' ? 'dark' : 'light';
      localStorage.setItem('lumina.theme', next);
      showToast(next === 'light' ? 'Light mode' : 'Dark mode', next === 'light' ? 'sun' : 'moon');
      return next;
    });
  }, [showToast]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: light)');
    const listener = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('lumina.theme')) {
        setTheme(e.matches ? 'light' : 'dark');
      }
    };
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  // Close ctx menu on scroll/resize/click outside
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.ctx-menu')) closeCtxMenu();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeCtxMenu();
        closeModal();
        closeSlashMenu();
      }
    };
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', closeCtxMenu, true);
    window.addEventListener('resize', closeCtxMenu);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', closeCtxMenu, true);
      window.removeEventListener('resize', closeCtxMenu);
    };
  }, [closeCtxMenu, closeModal, closeSlashMenu]);

  const value = useMemo<LuminaState>(
    () => ({
      theme,
      toggleTheme,
      pages,
      currentPageId,
      currentVirtual,
      navigate,
      openVirtual,
      navTree: navRef.current,
      bumpNav,
      pendingRename,
      setPendingRename,
      panelCollapsed,
      togglePanel,
      sidebarOpen,
      setSidebarOpen,
      toasts,
      showToast,
      ctxMenu,
      openCtxMenu,
      closeCtxMenu,
      modal,
      openModal,
      closeModal,
      slashTriggerEl,
      openSlashMenu,
      closeSlashMenu,
      dropIndicator,
      setDropIndicator,
      dragUid,
      setDragUid,
      favorite,
      toggleFavorite,
      makeBlankPage,
    }),
    [
      theme,
      toggleTheme,
      pages,
      currentPageId,
      currentVirtual,
      navigate,
      openVirtual,
      bumpNav,
      pendingRename,
      setPendingRename,
      panelCollapsed,
      togglePanel,
      sidebarOpen,
      toasts,
      showToast,
      ctxMenu,
      openCtxMenu,
      closeCtxMenu,
      modal,
      openModal,
      closeModal,
      slashTriggerEl,
      openSlashMenu,
      closeSlashMenu,
      dropIndicator,
      dragUid,
      favorite,
      toggleFavorite,
      makeBlankPage,
    ],
  );

  // expose helpers for children that mutate pages
  (value as LuminaState & {
    mutatePages: (fn: (p: Record<string, Page>) => Record<string, Page>) => void;
  }).mutatePages = (fn) => setPages((p) => fn(p));

  return <LuminaCtx.Provider value={value}>{children}</LuminaCtx.Provider>;
}

export function useLumina(): LuminaState {
  const v = useContext(LuminaCtx);
  if (!v) throw new Error('LuminaProvider missing');
  return v;
}

export function useLuminaPages() {
  const ctx = useLumina() as LuminaState & {
    mutatePages: (fn: (p: Record<string, Page>) => Record<string, Page>) => void;
  };
  return ctx.mutatePages;
}

export { virtualPages };
export { findNodeByUid, removeNodeByUid, isDescendant, clearUids, ensureUids };
