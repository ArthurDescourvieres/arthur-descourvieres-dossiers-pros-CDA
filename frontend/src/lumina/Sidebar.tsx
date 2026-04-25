import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type MouseEvent as RMouseEvent,
} from 'react';
import {
  ensureUids,
  findNodeByUid,
  isDescendant,
  removeNodeByUid,
  useLumina,
  useLuminaPages,
  type CtxMenuEntry,
} from './LuminaContext';
import type { NavNode } from '../data/types';
import { LuminaIcon } from './LuminaIcon';
import { escapeHTML } from '../lib/escapeHtml';

function NavItem({
  node,
  depth,
}: {
  node: NavNode;
  depth: number;
  isLast: boolean;
}) {
  const lumina = useLumina();
  const mutatePages = useLuminaPages();
  const itemRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const isFolder = Array.isArray(node.children);
  const hasChildren = isFolder && (node.children?.length ?? 0) > 0;
  const isActive = !!node.mapId && node.mapId === lumina.currentPageId;

  // 3D tilt + shine effect on hover
  useEffect(() => {
    const el = itemRef.current;
    if (!el) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf: number | null = null;
    let rx = 0,
      ry = 0;
    let targetRx = 0,
      targetRy = 0;
    let targetSx = 50,
      targetSy = 50;

    const onMove = (e: globalThis.MouseEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      targetRx = (y - 0.5) * -4;
      targetRy = (x - 0.5) * 6;
      targetSx = x * 100;
      targetSy = y * 100;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onLeave = () => {
      targetRx = 0;
      targetRy = 0;
    };
    function tick() {
      rx += (targetRx - rx) * 0.18;
      ry += (targetRy - ry) * 0.18;
      el!.style.transform = `perspective(600px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateZ(0)`;
      el!.style.setProperty('--shine-x', targetSx.toFixed(1) + '%');
      el!.style.setProperty('--shine-y', targetSy.toFixed(1) + '%');
      if (Math.abs(rx - targetRx) > 0.05 || Math.abs(ry - targetRy) > 0.05) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = null;
      }
    }
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Inline rename effect
  useEffect(() => {
    if (lumina.pendingRename !== node.uid) return;
    const el = labelRef.current;
    if (!el) return;
    el.setAttribute('contenteditable', 'true');
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }
    let cancelled = false;
    const commit = () => {
      const v = el.textContent?.trim() ?? '';
      el.removeAttribute('contenteditable');
      if (v && !cancelled) {
        node.label = v;
        if (node.mapId) {
          mutatePages((p) => {
            const cur = p[node.mapId!];
            if (!cur) return p;
            return {
              ...p,
              [node.mapId!]: { ...cur, title: v, titleHTML: escapeHTML(v) },
            };
          });
        }
        lumina.showToast('Renamed', 'pencil');
      }
      lumina.setPendingRename(null);
      lumina.bumpNav();
    };
    const onBlur = () => commit();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        el.blur();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelled = true;
        el.textContent = node.label;
        el.blur();
      }
    };
    el.addEventListener('blur', onBlur, { once: true });
    el.addEventListener('keydown', onKey);
    return () => {
      el.removeEventListener('keydown', onKey);
    };
  }, [lumina.pendingRename, node, lumina, mutatePages]);

  const openCtxMenuForNode = useCallback(
    (clientX: number, clientY: number) => {
      const items: CtxMenuEntry[] = [];
      const isVirtual = !node.mapId && !isFolder;
      items.push({ kind: 'label', label: node.label, icon: node.icon });
      items.push('-');
      if (!isVirtual) {
        items.push({
          label: isFolder ? 'Open folder' : 'Open',
          icon: isFolder ? 'folder-open' : 'arrow-right',
          action: () => {
            if (isFolder) {
              node.expanded = true;
              lumina.bumpNav();
            } else if (node.mapId) lumina.navigate(node.mapId);
          },
        });
      }
      if (isFolder) {
        items.push({
          label: 'New note inside',
          icon: 'file-plus',
          kbd: '⌘N',
          action: () => {
            node.expanded = true;
            node._pendingNew = { type: 'note' };
            lumina.bumpNav();
          },
        });
        items.push({
          label: 'New folder inside',
          icon: 'folder-plus',
          action: () => {
            node.expanded = true;
            node._pendingNew = { type: 'folder' };
            lumina.bumpNav();
          },
        });
        items.push('-');
      }
      items.push({
        label: 'Rename',
        icon: 'pencil',
        kbd: 'F2',
        action: () => lumina.setPendingRename(node.uid ?? null),
      });
      if (!isVirtual) {
        items.push({
          label: 'Duplicate',
          icon: 'copy',
          action: () => {
            const r = findNodeByUid(lumina.navTree, node.uid!);
            if (!r) return;
            const clone = JSON.parse(JSON.stringify(node)) as NavNode;
            clone.label = node.label + ' (copy)';
            const stripUids = (n: NavNode) => {
              delete n.uid;
              if (Array.isArray(n.children)) n.children.forEach(stripUids);
            };
            stripUids(clone);
            if (clone.mapId) {
              const newId = 'u' + Date.now().toString(36);
              mutatePages((p) => {
                const orig = p[clone.mapId!];
                if (!orig) return p;
                const dup = JSON.parse(JSON.stringify(orig));
                dup.id = newId;
                dup.title = clone.label;
                dup.titleHTML = escapeHTML(clone.label);
                return { ...p, [newId]: dup };
              });
              clone.mapId = newId;
            }
            ensureUids([clone]);
            r.parent.splice(r.index + 1, 0, clone);
            lumina.bumpNav();
            lumina.showToast('Duplicated', 'copy');
          },
        });
      }
      items.push({
        label: node.starred ? 'Remove from favourites' : 'Add to favourites',
        icon: 'star',
        action: () => {
          node.starred = !node.starred;
          lumina.bumpNav();
          lumina.showToast(
            node.starred ? 'Added to favourites' : 'Removed from favourites',
            'star',
          );
        },
      });
      if (!isVirtual)
        items.push({
          label: 'Copy link',
          icon: 'link',
          action: () => lumina.showToast('Link copied', 'link'),
        });
      items.push('-');
      items.push({
        label: 'Change icon…',
        icon: 'sparkles',
        action: () => lumina.showToast('Icon picker — open in modal', 'sparkles'),
      });
      items.push({
        label: 'Move to…',
        icon: 'move',
        action: () =>
          lumina.showToast('Pick a destination from the sidebar', 'move'),
      });
      items.push('-');
      if (!isVirtual)
        items.push({
          label: isFolder ? 'Delete folder' : 'Delete note',
          icon: 'trash-2',
          danger: true,
          action: () => {
            removeNodeByUid(lumina.navTree, node.uid!);
            if (node.mapId && lumina.currentPageId === node.mapId)
              lumina.openVirtual('trash');
            lumina.bumpNav();
            lumina.showToast('Moved to Trash', 'trash-2');
          },
        });
      lumina.openCtxMenu(items, clientX, clientY);
    },
    [node, isFolder, lumina, mutatePages],
  );

  const onClick = (e: RMouseEvent<HTMLDivElement>) => {
    const target = e.target as Element;
    if (target.closest('[data-role="more"]')) {
      openCtxMenuForNode(e.clientX, e.clientY);
      return;
    }
    if (target.closest('[data-role="add"]')) {
      node.expanded = true;
      node._pendingNew = { type: 'note' };
      lumina.bumpNav();
      return;
    }
    if (
      target.closest('[data-role="label"]')?.getAttribute('contenteditable') ===
      'true'
    )
      return;
    if (isFolder) {
      node.expanded = !node.expanded;
      lumina.bumpNav();
      return;
    }
    if (node.mapId) lumina.navigate(node.mapId);
    else {
      const lbl = (node.label || '').toLowerCase();
      if (lbl === 'today') lumina.openVirtual('today');
      else if (lbl === 'archive') lumina.openVirtual('archive');
      else if (lbl === 'trash') lumina.openVirtual('trash');
    }
  };

  const onContextMenu = (e: RMouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    openCtxMenuForNode(e.clientX, e.clientY);
  };

  const onDragStart = (e: DragEvent<HTMLDivElement>) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', node.uid ?? '');
    lumina.setDragUid(node.uid ?? null);
    setTimeout(() => itemRef.current?.classList.add('dragging'), 0);
  };
  const onDragEnd = () => {
    itemRef.current?.classList.remove('dragging');
    lumina.setDropIndicator(null);
    lumina.setDragUid(null);
  };
  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!itemRef.current) return;
    const r = itemRef.current.getBoundingClientRect();
    const y = e.clientY - r.top;
    const h = r.height;
    if (isFolder && y > h * 0.28 && y < h * 0.72) {
      lumina.setDropIndicator({ kind: 'into', uid: node.uid! });
    } else {
      lumina.setDropIndicator({
        kind: 'line',
        uid: node.uid!,
        before: y < h / 2,
      });
    }
  };
  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    if (!itemRef.current?.contains(e.relatedTarget as Node)) {
      // keep last indicator until next dragover or drop
    }
  };
  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const sourceUid = e.dataTransfer.getData('text/plain');
    if (!sourceUid || sourceUid === node.uid) {
      lumina.setDropIndicator(null);
      return;
    }
    const src = findNodeByUid(lumina.navTree, sourceUid);
    if (!src) {
      lumina.setDropIndicator(null);
      return;
    }
    if (isDescendant(src.node, node.uid!)) {
      lumina.setDropIndicator(null);
      lumina.showToast('Cannot move a folder into itself', 'alert-triangle');
      return;
    }
    const r = itemRef.current!.getBoundingClientRect();
    const y = e.clientY - r.top;
    const h = r.height;
    removeNodeByUid(lumina.navTree, sourceUid);
    if (isFolder && y > h * 0.28 && y < h * 0.72) {
      node.children = node.children || [];
      node.children.push(src.node);
      node.expanded = true;
    } else {
      const target = findNodeByUid(lumina.navTree, node.uid!);
      if (!target) {
        lumina.navTree.push(src.node);
      } else {
        const idx = target.index + (y < h / 2 ? 0 : 1);
        target.parent.splice(idx, 0, src.node);
      }
    }
    lumina.setDropIndicator(null);
    lumina.bumpNav();
    lumina.showToast(`Moved "${src.node.label}"`, 'move');
  };

  const indicator = lumina.dropIndicator;
  const showLineBefore =
    indicator?.kind === 'line' && indicator.uid === node.uid && indicator.before;
  const showLineAfter =
    indicator?.kind === 'line' && indicator.uid === node.uid && !indicator.before;

  const cls =
    'nav-item' +
    (hasChildren && node.expanded ? ' expanded' : '') +
    (isActive ? ' active' : '') +
    (indicator?.kind === 'into' && indicator.uid === node.uid ? ' drop-into' : '');

  return (
    <>
      {showLineBefore && <div className="drop-line" style={{ position: 'relative' }} />}
      <div
        ref={itemRef}
        className={cls}
        style={{ paddingLeft: 10 + depth * 14 + 'px' }}
        data-uid={node.uid}
        draggable
        onClick={onClick}
        onContextMenu={onContextMenu}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <span className={'chevron' + (isFolder ? '' : ' placeholder')}>
          {isFolder ? <LuminaIcon name="chevron-right" /> : null}
        </span>
        <span className="leaf-icon">
          <LuminaIcon name={node.icon} />
        </span>
        <span className="label" data-role="label" ref={labelRef}>
          {node.label}
        </span>
        {node.badge ? <span className="todo-meta tag">{node.badge}</span> : null}
        {node.starred ? (
          <span className="star">
            <LuminaIcon name="star" />
          </span>
        ) : null}
        <span className="nav-actions">
          {isFolder ? (
            <button data-role="add" title="Add inside">
              <LuminaIcon name="plus" />
            </button>
          ) : null}
          <button data-role="more" title="More">
            <LuminaIcon name="more-horizontal" />
          </button>
        </span>
      </div>
      {hasChildren ? (
        <div className="nav-children" data-expanded={node.expanded ? '1' : '0'}>
          <div>
            {node.expanded
              ? (node.children ?? []).map((c, i) => (
                  <NavItem
                    key={c.uid}
                    node={c}
                    depth={depth + 1}
                    isLast={i === (node.children?.length ?? 0) - 1}
                  />
                ))
              : null}
            {node._pendingNew ? (
              <NavNewInput parent={node} depth={depth + 1} />
            ) : null}
          </div>
        </div>
      ) : null}
      {!hasChildren && node._pendingNew ? (
        <NavNewInput parent={node} depth={depth + 1} />
      ) : null}
      {showLineAfter && <div className="drop-line" style={{ position: 'relative' }} />}
    </>
  );
}

function NavNewInput({ parent, depth }: { parent: NavNode; depth: number }) {
  const lumina = useLumina();
  const mutatePages = useLuminaPages();
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const cancel = useCallback(() => {
    delete parent._pendingNew;
    lumina.bumpNav();
  }, [parent, lumina]);

  const commit = useCallback(() => {
    const label = value.trim();
    const info = parent._pendingNew;
    delete parent._pendingNew;
    if (!label || !info) {
      lumina.bumpNav();
      return;
    }
    let newNode: NavNode;
    if (info.type === 'folder') {
      newNode = { label, icon: 'folder', children: [], expanded: true };
    } else {
      const id = 'u' + Date.now().toString(36);
      const page = lumina.makeBlankPage(id, label);
      mutatePages((p) => ({ ...p, [id]: page }));
      newNode = { label, icon: 'file-text', mapId: id };
    }
    ensureUids([newNode]);
    parent.children = parent.children || [];
    parent.children.push(newNode);
    parent.expanded = true;
    lumina.bumpNav();
    lumina.showToast(
      info.type === 'folder' ? 'Folder created' : 'Note created',
      info.type === 'folder' ? 'folder-plus' : 'file-plus',
    );
    if (newNode.mapId) lumina.navigate(newNode.mapId);
  }, [parent, value, lumina, mutatePages]);

  return (
    <div className="nav-new-input" style={{ marginLeft: depth * 14 + 'px' }}>
      <span className="leaf-icon">
        <LuminaIcon
          name={parent._pendingNew?.type === 'folder' ? 'folder' : 'file-text'}
        />
      </span>
      <input
        ref={inputRef}
        type="text"
        placeholder={
          parent._pendingNew?.type === 'folder' ? 'Folder name' : 'Untitled note'
        }
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            cancel();
          }
        }}
        onBlur={() => {
          if (value.trim()) commit();
          else cancel();
        }}
      />
    </div>
  );
}

export function Sidebar() {
  const lumina = useLumina();

  const beginInlineCreateRoot = (type: 'note' | 'folder') => {
    const host = lumina.navTree.find((n) => Array.isArray(n.children)) ?? null;
    if (host) {
      host.expanded = true;
      host._pendingNew = { type };
      lumina.bumpNav();
    } else {
      const label = type === 'folder' ? 'New folder' : 'Untitled';
      const node: NavNode =
        type === 'folder'
          ? { label, icon: 'folder', children: [], expanded: true }
          : (() => {
              const id = 'u' + Date.now().toString(36);
              const page = lumina.makeBlankPage(id, label);
              const mutatePages = (
                lumina as unknown as {
                  mutatePages: (
                    fn: (p: Record<string, unknown>) => Record<string, unknown>,
                  ) => void;
                }
              ).mutatePages;
              mutatePages((p) => ({ ...p, [id]: page }));
              return { label, icon: 'file-text', mapId: id };
            })();
      ensureUids([node]);
      lumina.navTree.push(node);
      lumina.bumpNav();
      if (node.mapId) lumina.navigate(node.mapId);
    }
  };

  const onSidebarContextMenu = (e: RMouseEvent<HTMLElement>) => {
    if (!(e.target as Element).closest('.nav-item')) {
      e.preventDefault();
      lumina.openCtxMenu(
        [
          { kind: 'label', label: 'Workspace', icon: 'layout-list' },
          '-',
          {
            label: 'New note',
            icon: 'file-plus',
            kbd: '⌘N',
            action: () => beginInlineCreateRoot('note'),
          },
          {
            label: 'New folder',
            icon: 'folder-plus',
            action: () => beginInlineCreateRoot('folder'),
          },
          '-',
          {
            label: 'Collapse all',
            icon: 'chevrons-down-up',
            action: () => {
              const walk = (list: NavNode[]) =>
                list.forEach((n) => {
                  if (Array.isArray(n.children)) {
                    n.expanded = false;
                    walk(n.children);
                  }
                });
              walk(lumina.navTree);
              lumina.bumpNav();
            },
          },
        ],
        e.clientX,
        e.clientY,
      );
    }
  };

  // Wire global shortcut events from LuminaApp.
  useEffect(() => {
    const onSearch = () => openSearchModal(lumina);
    const onNew = () => beginInlineCreateRoot('note');
    document.addEventListener('lumina:open-search', onSearch);
    document.addEventListener('lumina:new-note-root', onNew);
    return () => {
      document.removeEventListener('lumina:open-search', onSearch);
      document.removeEventListener('lumina:new-note-root', onNew);
    };
    // beginInlineCreateRoot is recreated on every render but reads from closure;
    // re-binding each render is fine and keeps it in sync.
  });

  const onAddRoot = (e: RMouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    lumina.openCtxMenu(
      [
        {
          label: 'New note',
          icon: 'file-plus',
          kbd: '⌘N',
          action: () => beginInlineCreateRoot('note'),
        },
        {
          label: 'New folder',
          icon: 'folder-plus',
          action: () => beginInlineCreateRoot('folder'),
        },
        '-',
        {
          label: 'Collapse all',
          icon: 'chevrons-down-up',
          action: () => {
            const walk = (list: NavNode[]) =>
              list.forEach((n) => {
                if (Array.isArray(n.children)) {
                  n.expanded = false;
                  walk(n.children);
                }
              });
            walk(lumina.navTree);
            lumina.bumpNav();
          },
        },
      ],
      r.left,
      r.bottom + 4,
    );
  };

  return (
    <aside className="sidebar" onContextMenu={onSidebarContextMenu}>
      <div className="sidebar-inner">
        <button className="brand" onClick={() => lumina.navigate('inbox')}>
          <div className="brand-mark" aria-hidden="true" />
          <div className="brand-name">
            Lumin<em>a</em>
          </div>
        </button>

        <button
          className="sidebar-search"
          data-magnetic=""
          onClick={() => openSearchModal(lumina)}
        >
          <LuminaIcon name="search" />
          <span>Search notes…</span>
          <span className="kbd">⌘ K</span>
        </button>

        <div className="sidebar-actions">
          <button
            className="sidebar-action primary"
            title="New note (⌘N)"
            onClick={() => beginInlineCreateRoot('note')}
          >
            <LuminaIcon name="file-plus" />
            <span>New note</span>
          </button>
          <button
            className="sidebar-action"
            title="New folder"
            onClick={() => beginInlineCreateRoot('folder')}
          >
            <LuminaIcon name="folder-plus" />
            <span>Folder</span>
          </button>
        </div>

        <div className="nav-section-head">
          <span className="label">Workspace</span>
          <button className="add" title="Add to workspace" onClick={onAddRoot}>
            <LuminaIcon name="plus" />
          </button>
        </div>

        <nav className="nav">
          {lumina.navTree.map((n, i) => (
            <NavItem
              key={n.uid}
              node={n}
              depth={0}
              isLast={i === lumina.navTree.length - 1}
            />
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="user-chip">
            <div className="avatar">E</div>
            <div>
              <div className="user-chip-name">Elise Marchetti</div>
              <div className="user-chip-mail">elise@lumina.work</div>
            </div>
            <span className="settings">
              <LuminaIcon name="settings-2" />
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
}

function openSearchModal(lumina: ReturnType<typeof useLumina>) {
  const pages = Object.values(lumina.pages);
  lumina.openModal(
    <>
      <h3>Search</h3>
      <input type="text" placeholder="Search notes, tags, to-dos…" autoFocus />
      <div
        style={{
          margin: '14px 0 6px',
          fontSize: 11,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--color-text-faint)',
        }}
      >
        Quick jump
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          maxHeight: 280,
          overflow: 'auto',
        }}
      >
        {pages.map((p) => (
          <button
            key={p.id}
            className="share-row"
            style={{
              borderRadius: 8,
              padding: 10,
              cursor: 'none',
              border: '1px solid transparent',
            }}
            onClick={() => {
              lumina.closeModal();
              lumina.navigate(p.id);
            }}
          >
            <span style={{ fontSize: 18 }}>{p.emoji}</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 13.5, color: 'var(--color-text)' }}>
                {p.title}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--color-text-faint)' }}>
                {p.path.slice(0, -1).join(' / ')}
              </div>
            </div>
          </button>
        ))}
      </div>
      <div className="modal-row">
        <button className="modal-btn" onClick={() => lumina.closeModal()}>
          Close
          <span style={{ color: 'var(--color-text-faint)', marginLeft: 4 }}>Esc</span>
        </button>
      </div>
    </>,
  );
}
