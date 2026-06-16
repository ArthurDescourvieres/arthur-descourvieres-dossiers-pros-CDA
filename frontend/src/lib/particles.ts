export function spawnParticles(anchor: Element): void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const rect = anchor.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  for (let i = 0; i < 4; i++) {
    const p = document.createElement('div')
    p.className = 'particle'
    p.style.left = cx + 'px'
    p.style.top = cy + 'px'
    document.body.appendChild(p)
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2
    const dist = 28 + Math.random() * 24
    const dx = Math.cos(angle) * dist
    const dy = Math.sin(angle) * dist
    const anim = p.animate(
      [
        { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
        {
          transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.3)`,
          opacity: 0,
        },
      ],
      { duration: 700 + Math.random() * 200, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
    )
    anim.onfinish = () => p.remove()
  }
}
