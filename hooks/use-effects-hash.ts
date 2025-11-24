"use client"

import { useCallback } from "react"
import LZString from "lz-string"

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
    // Hyperoptimized encoding: JSON -> LZ compression -> URL-safe base64
    const json = JSON.stringify(effects)
    const compressed = LZString.compressToEncodedURIComponent(json)
    return compressed
  }, [])

  const decodeHashToEffects = useCallback((encoded: string): Partial<EffectSettings> | null => {
    try {
      if (!encoded) return null
      
      // Try compressed format first (new hyperoptimized format)
      try {
        const decompressed = LZString.decompressFromEncodedURIComponent(encoded)
        if (decompressed) {
          return JSON.parse(decompressed)
        }
      } catch (e) {
        // Fall through to legacy format
      }
      
      // Fallback to legacy uncompressed format for backward compatibility
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
