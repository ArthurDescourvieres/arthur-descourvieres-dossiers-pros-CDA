import { Image as TiptapImage } from '@tiptap/extension-image'
import { ReactNodeViewRenderer, NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { useBlobUrl } from './AttachmentImage'

function ImageNodeView({ node, updateAttributes, selected, editor }: NodeViewProps) {
  const src = (node.attrs.src as string | undefined) ?? null
  const alt = (node.attrs.alt as string | undefined) ?? ''
  const attrWidth = typeof node.attrs.width === 'number' ? node.attrs.width : null
  const isInternal = typeof src === 'string' && src.startsWith('/api/attachments/')

  // Always call the hook — pass null when not used so the hook is a no-op.
  const { url, error } = useBlobUrl(isInternal ? src : null)

  const wrapperRef = useRef<HTMLDivElement>(null)
  const [dragWidth, setDragWidth] = useState<number | null>(null)

  let resolvedSrc: string | null = src
  if (isInternal) {
    if (error) resolvedSrc = null
    else resolvedSrc = url
  }

  const displayWidth = dragWidth ?? attrWidth
  const editable = editor.isEditable

  const startResize = (e: ReactPointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const img = wrapperRef.current?.querySelector('img')
    const startX = e.clientX
    const startW = img?.offsetWidth ?? attrWidth ?? 0
    const maxW = wrapperRef.current?.parentElement?.clientWidth ?? Infinity
    const clamp = (px: number) => Math.round(Math.min(maxW, Math.max(80, px)))

    const onMove = (ev: PointerEvent) => {
      setDragWidth(clamp(startW + (ev.clientX - startX)))
    }
    const onUp = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      updateAttributes({ width: clamp(startW + (ev.clientX - startX)) })
      setDragWidth(null)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  return (
    <NodeViewWrapper
      as="div"
      style={{ margin: '12px 0' }}
      data-attachment={isInternal ? 'true' : undefined}
    >
      {resolvedSrc ? (
        <div
          ref={wrapperRef}
          style={{
            position: 'relative',
            display: 'inline-block',
            maxWidth: '100%',
            lineHeight: 0,
            borderRadius: 6,
            outline: selected ? '2px solid var(--color-accent)' : 'none',
            outlineOffset: 2,
          }}
        >
          <img
            src={resolvedSrc}
            alt={alt}
            draggable={false}
            loading="lazy"
            decoding="async"
            style={{
              width: displayWidth ? `${displayWidth}px` : 'auto',
              maxWidth: '100%',
              height: 'auto',
              display: 'block',
              borderRadius: 6,
              border: '1px solid var(--color-surface-strong)',
            }}
          />
          {editable && (
            <span
              onPointerDown={startResize}
              title="Redimensionner"
              style={{
                position: 'absolute',
                right: -6,
                bottom: -6,
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: 'var(--color-accent)',
                border: '2px solid var(--color-bg)',
                cursor: 'nwse-resize',
                touchAction: 'none',
              }}
            />
          )}
        </div>
      ) : error ? (
        <span style={{ color: 'var(--color-danger)', fontSize: 12 }}>Image indisponible</span>
      ) : (
        <span style={{ opacity: 0.4, fontSize: 12 }}>Chargement…</span>
      )}
    </NodeViewWrapper>
  )
}

export const AttachmentAwareImage = TiptapImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) => {
          const w = element.getAttribute('width') || element.style.width
          if (!w) return null
          const n = parseInt(w, 10)
          return Number.isFinite(n) ? n : null
        },
        renderHTML: (attributes) => {
          if (!attributes.width) return {}
          return { width: attributes.width }
        },
      },
    }
  },
  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView)
  },
})
