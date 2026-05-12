import { Image as TiptapImage } from '@tiptap/extension-image'
import { ReactNodeViewRenderer, NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import { useBlobUrl } from './AttachmentImage'

function ImageNodeView({ node }: NodeViewProps) {
  const src = (node.attrs.src as string | undefined) ?? null
  const alt = (node.attrs.alt as string | undefined) ?? ''
  const isInternal = typeof src === 'string' && src.startsWith('/api/attachments/')

  // Always call the hook — pass null when not used so the hook is a no-op.
  const { url, error } = useBlobUrl(isInternal ? src : null)

  let resolvedSrc: string | null = src
  if (isInternal) {
    if (error) resolvedSrc = null
    else resolvedSrc = url
  }

  return (
    <NodeViewWrapper
      as="div"
      style={{ display: 'block', margin: '12px 0' }}
      data-attachment={isInternal ? 'true' : undefined}
    >
      {resolvedSrc ? (
        <img
          src={resolvedSrc}
          alt={alt}
          style={{ maxWidth: '100%', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }}
        />
      ) : error ? (
        <span style={{ color: '#ff6b6b', fontSize: 12 }}>Image indisponible</span>
      ) : (
        <span style={{ opacity: 0.4, fontSize: 12 }}>Chargement…</span>
      )}
    </NodeViewWrapper>
  )
}

export const AttachmentAwareImage = TiptapImage.extend({
  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView)
  },
})
