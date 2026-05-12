type ProseMirrorNode = {
  type?: string
  text?: string
  content?: ProseMirrorNode[]
}

export function extractText(content: unknown): string {
  if (!content || typeof content !== 'object') return ''
  const root = content as ProseMirrorNode
  const parts: string[] = []
  walk(root, parts)
  return parts.join(' ').replace(/\s+/g, ' ').trim()
}

function walk(node: ProseMirrorNode, out: string[]): void {
  if (typeof node.text === 'string' && node.text.length > 0) {
    out.push(node.text)
  }
  if (Array.isArray(node.content)) {
    for (const child of node.content) walk(child, out)
  }
}
