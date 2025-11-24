self.onmessage = async (event) => {
  const { imageData, effects, operation } = event.data

  try {
    let result = imageData

    if (operation === "process") {
      result = processImage(imageData, effects)
    }

    self.postMessage({ success: true, result })
  } catch (error) {
    self.postMessage({ success: false, error: error.message })
  }
}

function processImage(imageData, effects) {
  const { data, width, height } = imageData

  // Apply color corrections
  applyColorAdjustments(data, effects)
  applyColorPalette(data, effects)

  // Apply datamosh effects
  applyGlitchEffect(data, width, height, effects)
  applyCompressionArtifacts(data, width, height, effects)

  return { data, width, height }
}

function applyColorAdjustments(data, effects) {
  const hueShift = effects.hueShift
  const saturation = effects.saturation / 100
  const contrast = effects.contrast / 100
  const brightness = effects.brightness / 100
  const temperature = effects.temperature

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i]
    let g = data[i + 1]
    let b = data[i + 2]

    r = Math.min(255, r * brightness)
    g = Math.min(255, g * brightness)
    b = Math.min(255, b * brightness)

    r = Math.max(0, (r - 128) * contrast + 128)
    g = Math.max(0, (g - 128) * contrast + 128)
    b = Math.max(0, (b - 128) * contrast + 128)

    r = Math.min(255, r + temperature)
    b = Math.max(0, b - temperature * 0.5)

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0
    let s = 0
    const l = (max + min) / 510

    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (510 - max - min) : d / (max + min)
      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6
          break
        case g:
          h = ((b - r) / d + 2) / 6
          break
        case b:
          h = ((r - g) / d + 4) / 6
          break
      }
    }

    h = (h + hueShift / 360) % 1
    s = Math.min(1, s * saturation)

    const c = (1 - Math.abs(2 * l - 1)) * s
    const x = c * (1 - Math.abs(((h * 6) % 2) - 1))
    const m = l - c / 2

    let rr = 0,
      gg = 0,
      bb = 0

    if (h < 1 / 6) {
      rr = c
      gg = x
      bb = 0
    } else if (h < 2 / 6) {
      rr = x
      gg = c
      bb = 0
    } else if (h < 3 / 6) {
      rr = 0
      gg = c
      bb = x
    } else if (h < 4 / 6) {
      rr = 0
      gg = x
      bb = c
    } else if (h < 5 / 6) {
      rr = x
      gg = 0
      bb = c
    } else {
      rr = c
      gg = 0
      bb = x
    }

    data[i] = Math.max(0, Math.min(255, (rr + m) * 255))
    data[i + 1] = Math.max(0, Math.min(255, (gg + m) * 255))
    data[i + 2] = Math.max(0, Math.min(255, (bb + m) * 255))
  }
}

function applyColorPalette(data, effects) {
  const mode = effects.colorPaletteMode

  const palettes = {
    retro: [
      [255, 0, 0],
      [255, 127, 0],
      [255, 255, 0],
      [0, 255, 0],
      [0, 0, 255],
      [75, 0, 130],
      [148, 0, 211],
    ],
    neon: [
      [255, 0, 127],
      [0, 255, 255],
      [0, 255, 0],
      [255, 255, 0],
      [255, 0, 0],
    ],
    vintage: [
      [139, 69, 19],
      [210, 180, 140],
      [184, 134, 11],
      [160, 82, 45],
      [128, 128, 0],
    ],
  }

  if (mode === "none") return

  if (mode === "grayscale") {
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
      data[i] = gray
      data[i + 1] = gray
      data[i + 2] = gray
    }
    return
  }

  if (mode === "solarize") {
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255 - data[i]
      data[i + 1] = 255 - data[i + 1]
      data[i + 2] = 255 - data[i + 2]
    }
    return
  }

  const palette = palettes[mode] || []
  if (palette.length === 0) return

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const brightness = r * 0.299 + g * 0.587 + b * 0.114
    const index = Math.floor((brightness / 255) * (palette.length - 1))
    const [pr, pg, pb] = palette[index]

    data[i] = pr
    data[i + 1] = pg
    data[i + 2] = pb
  }
}

function applyGlitchEffect(data, width, height, effects) {
  const colorShift = effects.glitchIntensity
  for (let i = 0; i < data.length; i += 4) {
    const rand = Math.random() * colorShift
    if (rand > colorShift * 0.7) {
      data[i] = Math.max(0, Math.min(255, data[i] + (Math.random() * colorShift - colorShift / 2)))
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + (Math.random() * colorShift - colorShift / 2)))
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + (Math.random() * colorShift - colorShift / 2)))
    }
  }

  const levels = Math.pow(2, effects.bitCrush)
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.round((data[i] / 255) * levels) * (255 / levels)
    data[i + 1] = Math.round((data[i + 1] / 255) * levels) * (255 / levels)
    data[i + 2] = Math.round((data[i + 2] / 255) * levels) * (255 / levels)
  }

  const blockSize = Math.max(1, effects.blockSize)
  for (let y = 0; y < height; y += blockSize) {
    for (let x = 0; x < width; x += blockSize) {
      if (Math.random() > 0.85) {
        const offset = Math.floor(Math.random() * blockSize * 2)
        for (let by = 0; by < blockSize; by++) {
          for (let bx = 0; bx < blockSize; bx++) {
            const srcY = Math.min(height - 1, y + by + offset)
            const dstIdx = ((y + by) * width + x + bx) * 4
            const srcIdx = (srcY * width + x + bx) * 4

            if (srcIdx < data.length && dstIdx < data.length) {
              data[dstIdx] = data[srcIdx]
              data[dstIdx + 1] = data[srcIdx + 1]
              data[dstIdx + 2] = data[srcIdx + 2]
            }
          }
        }
      }
    }
  }
}

function applyCompressionArtifacts(data, width, height, effects) {
  const blockSize = Math.floor(effects.compressionArtifacts / 2) + 1

  for (let y = 0; y < height; y += blockSize) {
    for (let x = 0; x < width; x += blockSize) {
      if (Math.random() > 0.7) {
        const baseIdx = (y * width + x) * 4
        const r = data[baseIdx]
        const g = data[baseIdx + 1]
        const b = data[baseIdx + 2]

        for (let by = 0; by < blockSize && y + by < height; by++) {
          for (let bx = 0; bx < blockSize && x + bx < width; bx++) {
            const idx = ((y + by) * width + x + bx) * 4
            data[idx] = r
            data[idx + 1] = g
            data[idx + 2] = b
          }
        }
      }
    }
  }
}
