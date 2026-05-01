import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import { Image } from '@tiptap/extension-image'
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight'
import { createLowlight, common } from 'lowlight'
import { useEffect } from 'react'
import type { TiptapDoc } from '../lib/types'

const lowlight = createLowlight(common)

export type TiptapEditorProps = {
  initialContent: TiptapDoc | null
  onChange: (doc: TiptapDoc) => void
  editable?: boolean
}

export function TiptapEditor({ initialContent, onChange, editable = true }: TiptapEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Image.configure({ inline: false, allowBase64: false }),
      CodeBlockLowlight.configure({ lowlight }),
    ],
    editable,
    content: initialContent ?? defaultDoc(),
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON() as TiptapDoc)
    },
  })

  useEffect(() => {
    if (!editor) return
    editor.setEditable(editable)
  }, [editor, editable])

  if (!editor) return <div style={{ padding: 24, opacity: 0.5 }}>Chargement de l'éditeur…</div>

  return (
    <div className="tiptap-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} className="tiptap-content" />
    </div>
  )
}

function defaultDoc(): TiptapDoc {
  return { type: 'doc', content: [{ type: 'paragraph' }] }
}

function Toolbar({ editor }: { editor: Editor }) {
  const btn = (label: string, isActive: boolean, onClick: () => void): React.ReactNode => (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: isActive ? 'rgba(91, 140, 255, 0.18)' : 'rgba(255,255,255,0.04)',
        color: 'inherit',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 4,
        padding: '4px 8px',
        fontSize: 12,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {btn('B', editor.isActive('bold'), () => editor.chain().focus().toggleBold().run())}
      {btn('I', editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run())}
      {btn('U', editor.isActive('underline'), () => editor.chain().focus().toggleUnderline().run())}
      {btn('S', editor.isActive('strike'), () => editor.chain().focus().toggleStrike().run())}
      <span style={separatorStyle} />
      {btn('H1', editor.isActive('heading', { level: 1 }), () =>
        editor.chain().focus().toggleHeading({ level: 1 }).run(),
      )}
      {btn('H2', editor.isActive('heading', { level: 2 }), () =>
        editor.chain().focus().toggleHeading({ level: 2 }).run(),
      )}
      {btn('H3', editor.isActive('heading', { level: 3 }), () =>
        editor.chain().focus().toggleHeading({ level: 3 }).run(),
      )}
      <span style={separatorStyle} />
      {btn('• List', editor.isActive('bulletList'), () =>
        editor.chain().focus().toggleBulletList().run(),
      )}
      {btn('1. List', editor.isActive('orderedList'), () =>
        editor.chain().focus().toggleOrderedList().run(),
      )}
      {btn('Code', editor.isActive('codeBlock'), () =>
        editor.chain().focus().toggleCodeBlock().run(),
      )}
    </div>
  )
}

const separatorStyle: React.CSSProperties = {
  width: 1,
  background: 'rgba(255,255,255,0.1)',
  margin: '0 4px',
}
