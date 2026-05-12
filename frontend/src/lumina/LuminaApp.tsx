import { useEffect } from 'react';
import { LuminaProvider, useLumina, findNodeByUid } from './LuminaContext';
import { Sidebar } from './Sidebar';
import { Editor } from './Editor';
import { Panel } from './Panel';
import {
  ContextMenu,
  Modal,
  ToastLayer,
} from './Overlays';

function GlobalShortcuts() {
  const lumina = useLumina();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        // dispatch open-search; Sidebar exposes it via the brand-search button.
        document.dispatchEvent(new CustomEvent('lumina:open-search'));
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n' && !e.shiftKey) {
        e.preventDefault();
        document.dispatchEvent(new CustomEvent('lumina:new-note-root'));
      }
      if (e.key === 'F2') {
        const active = document.querySelector<HTMLElement>('.nav-item.active');
        if (active) {
          const uid = active.dataset.uid;
          if (uid) {
            const r = findNodeByUid(lumina.navTree, uid);
            if (r) {
              e.preventDefault();
              lumina.setPendingRename(uid);
            }
          }
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [lumina]);

  return null;
}

function AppShell() {
  const lumina = useLumina();
  const cls = [
    'app',
    lumina.panelCollapsed ? 'panel-collapsed' : '',
    lumina.sidebarOpen ? 'sidebar-open' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <ToastLayer />
      <Modal />
      <ContextMenu />
      <GlobalShortcuts />
      <div className={cls} id="app">
        <Sidebar />
        <Editor />
        <Panel />
      </div>
    </>
  );
}

export function LuminaApp() {
  return (
    <LuminaProvider>
      <AppShell />
    </LuminaProvider>
  );
}
