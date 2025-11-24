"use client"

import { useCallback } from "react"

interface EffectSettings {
  displacement: number
  glitchIntensity: number
  scanlines: number
  blockSize: number
  bitCrush: number
  compressionArtifacts: number
  chromaShift: number
  hueShift: number
  saturation: number
  contrast: number
  brightness: number
  colorPaletteMode: "none" | "retro" | "neon" | "vintage" | "grayscale" | "solarize"
  temperature: number
}

export function useEffectsHash() {
  const encodeEffectsToHash = useCallback((effects: EffectSettings): string => {
    const encoded = encodeURIComponent(JSON.stringify(effects))
    return encoded
  }, [])

  const decodeHashToEffects = useCallback((encoded: string): Partial<EffectSettings> | null => {
    try {
      if (!encoded) return null
      const decoded = decodeURIComponent(encoded)
      return JSON.parse(decoded)
    } catch (error) {
      console.error("[v0] Error decoding effects hash:", error)
      return null
    }
  }, [])

  const updateUrlHash = useCallback(
    (effects: EffectSettings) => {
      if (typeof window !== "undefined") {
        const encoded = encodeEffectsToHash(effects)
        window.history.replaceState(null, "", `?effects=${encoded}`)
      }
    },
    [encodeEffectsToHash],
  )

  const getEffectsFromUrl = useCallback((): Partial<EffectSettings> | null => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const encoded = params.get("effects")
      if (!encoded) return null
      return decodeHashToEffects(encoded)
    }
    return null
  }, [decodeHashToEffects])

  return {
    encodeEffectsToHash,
    decodeHashToEffects,
    updateUrlHash,
    getEffectsFromUrl,
  }
}
