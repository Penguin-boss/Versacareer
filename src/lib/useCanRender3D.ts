import { useEffect, useState } from 'react'

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function hasWebGLSupport(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    return !!(window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')))
  } catch {
    return false
  }
}

export function useCanRender3D(): { canRender: boolean; checked: boolean } {
  const [state, setState] = useState(() => ({
    canRender: false,
    checked: false,
  }))

  useEffect(() => {
    const reduced = prefersReducedMotion()
    const webgl = hasWebGLSupport()
    setState({ canRender: webgl && !reduced, checked: true })
  }, [])

  return state
}
