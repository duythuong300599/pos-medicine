import { useEffect } from 'react'

/**
 * Khi bàn phím ảo hiện trên mobile, tự động scroll input đang focus vào view.
 * Dùng visualViewport API (Chrome 61+, iOS Safari 13+).
 */
export function useKeyboardScroll() {
  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return

    const handleResize = () => {
      const focused = document.activeElement as HTMLElement | null
      if (!focused) return

      const tag = focused.tagName.toLowerCase()
      if (tag !== 'input' && tag !== 'textarea' && focused.contentEditable !== 'true') return

      // Chờ bàn phím animation xong (~100ms) rồi scroll
      requestAnimationFrame(() => {
        focused.scrollIntoView({ block: 'center', behavior: 'smooth' })
      })
    }

    viewport.addEventListener('resize', handleResize)
    return () => viewport.removeEventListener('resize', handleResize)
  }, [])
}
