import { useRef } from 'react'
import {
  attachmentFileUrl,
  useDeleteAttachment,
  useNoteAttachments,
  useUploadAttachment,
  type Attachment,
} from '../hooks/useAttachments'
import { useBlobUrl } from './AttachmentImage'

const KB = 1024
const MB = KB * 1024

function formatSize(bytes: number): string {
  if (bytes < KB) return `${bytes} o`
  if (bytes < MB) return `${(bytes / KB).toFixed(1)} ko`
  return `${(bytes / MB).toFixed(1)} Mo`
}

export function AttachmentsPanel({ noteId }: { noteId: string }) {
  const { data, isPending } = useNoteAttachments(noteId)
  const upload = useUploadAttachment(noteId)
  const remove = useDeleteAttachment(noteId)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const onPickFile = () => fileInputRef.current?.click()
  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      await upload.mutateAsync(file)
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'payload' in err
          ? JSON.stringify((err as { payload: unknown }).payload)
          : 'Échec'
      alert(`Upload refusé: ${msg}`)
    }
  }

  return (
    <section
      style={{
        marginTop: 24,
        borderTop: '1px solid rgba(255,255,255,0.08)',
        paddingTop: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.5 }}>
          Pièces jointes
        </span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
          style={{ display: 'none' }}
          onChange={onChange}
        />
        <button
          type="button"
          onClick={onPickFile}
          disabled={upload.isPending}
          style={{
            background: 'rgba(91, 140, 255, 0.18)',
            border: '1px solid rgba(91, 140, 255, 0.3)',
            color: 'inherit',
            padding: '4px 10px',
            fontSize: 12,
            borderRadius: 4,
            cursor: upload.isPending ? 'wait' : 'pointer',
          }}
        >
          {upload.isPending ? 'Envoi…' : '+ Ajouter un fichier'}
        </button>
      </header>

      {isPending ? (
        <div style={{ opacity: 0.4, fontSize: 12 }}>…</div>
      ) : !data || data.length === 0 ? (
        <div style={{ opacity: 0.4, fontSize: 12 }}>Aucune pièce jointe</div>
      ) : (
        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 12,
          }}
        >
          {data.map((a) => (
            <AttachmentItem key={a.id} attachment={a} onDelete={() => remove.mutate(a.id)} />
          ))}
        </ul>
      )}
    </section>
  )
}

function AttachmentItem({ attachment, onDelete }: { attachment: Attachment; onDelete: () => void }) {
  const isImage = attachment.mimeType.startsWith('image/')
  const url = attachmentFileUrl(attachment.id)
  const { url: blobUrl } = useBlobUrl(isImage ? url : null)

  return (
    <li
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 6,
        padding: 8,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      {isImage ? (
        blobUrl ? (
          <img
            src={blobUrl}
            alt={attachment.filename}
            style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 4 }}
          />
        ) : (
          <div style={{ height: 100, display: 'grid', placeItems: 'center', opacity: 0.4 }}>…</div>
        )
      ) : (
        <div
          style={{
            height: 100,
            display: 'grid',
            placeItems: 'center',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 4,
            fontSize: 11,
            opacity: 0.6,
          }}
        >
          {attachment.mimeType.split('/')[1]?.toUpperCase() ?? 'FILE'}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {attachment.filename}
        </span>
        <span style={{ fontSize: 11, opacity: 0.5 }}>{formatSize(attachment.size)}</span>
      </div>
      <button
        type="button"
        onClick={onDelete}
        style={{
          background: 'transparent',
          border: '1px solid rgba(255,107,107,0.3)',
          color: '#ff6b6b',
          padding: '2px 6px',
          fontSize: 11,
          borderRadius: 4,
          cursor: 'pointer',
        }}
      >
        Supprimer
      </button>
    </li>
  )
}
