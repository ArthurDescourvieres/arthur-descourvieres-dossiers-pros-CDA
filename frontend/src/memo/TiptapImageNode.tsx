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
    <NodeViewWrapper as="div" className="my-3" data-attachment={isInternal ? 'true' : undefined}>
      {resolvedSrc ? (
        <div
          ref={wrapperRef}
          className={`relative inline-block max-w-full rounded-md leading-[0] ${
            selected ? 'outline outline-2 outline-offset-2 outline-[var(--color-accent)]' : ''
          }`}
        >
          <img
            src={resolvedSrc}
            alt={alt}
            draggable={false}
            loading="lazy"
            decoding="async"
            className="block h-auto max-w-full rounded-md border border-[var(--color-surface-strong)]"
            style={{ width: displayWidth ? `${displayWidth}px` : 'auto' }}
          />
          {editable && (
            <span
              onPointerDown={startResize}
              title="Redimensionner"
              className="absolute bottom-[-6px] right-[-6px] h-3.5 w-3.5 cursor-[nwse-resize] touch-none rounded-full border-2 border-[var(--color-bg)] bg-[var(--color-accent)]"
            />
          )}
        </div>
      ) : error ? (
        <span className="text-xs text-[var(--color-danger)]">Image indisponible</span>
      ) : (
        <span className="text-xs opacity-40">Chargement…</span>
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
