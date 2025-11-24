"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { EffectControls } from "./effect-controls"
import { Download, Shuffle, RotateCcw, Copy, Check, Upload } from "lucide-react"
import { useEffectsHash } from "@/hooks/use-effects-hash"
import { useDebounce } from "@/hooks/use-debounce"

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
  debounceEnabled: boolean
}

const DEFAULT_EFFECTS: EffectSettings = {
  displacement: 10,
  glitchIntensity: 15,
  scanlines: 0.3,
  blockSize: 4,
  bitCrush: 6,
  compressionArtifacts: 5,
  chromaShift: 0,
  hueShift: 0,
  saturation: 100,
  contrast: 100,
  brightness: 100,
  colorPaletteMode: "none",
  temperature: 0,
  debounceEnabled: true,
}

export function ImageDropzone() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [effects, setEffects] = useState<EffectSettings>(DEFAULT_EFFECTS)
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [copied, setCopied] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const workerRef = useRef<Worker | null>(null)
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { updateUrlHash, getEffectsFromUrl } = useEffectsHash()
  const effectsToUse = useDebounce(effects, 200, { enabled: effects.debounceEnabled })

  useEffect(() => {
    if (typeof window !== "undefined") {
      workerRef.current = new Worker("/workers/image-processor.js")
    }

    const urlEffects = getEffectsFromUrl()
    if (urlEffects) {
      setEffects({ ...DEFAULT_EFFECTS, ...urlEffects })
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate()
      }
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current)
      }
    }
  }, [getEffectsFromUrl])

  useEffect(() => {
    updateUrlHash(effectsToUse)
  }, [effectsToUse, updateUrlHash])

  useEffect(() => {
    if (!uploadedImage || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const img = new window.Image()
    img.crossOrigin = "anonymous"
    img.src = uploadedImage

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height

      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

      setIsProcessing(true)

      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current)
      }

      if (workerRef.current) {
        workerRef.current.onmessage = (event) => {
          const { success, result } = event.data
          if (success) {
            const processedImageData = new ImageData(new Uint8ClampedArray(result.data), result.width, result.height)
            ctx.putImageData(processedImageData, 0, 0)
            applyCanvasEffects(ctx, canvas, effectsToUse)
          }
          setIsProcessing(false)
        }

        workerRef.current.postMessage({
          imageData: {
            data: Array.from(imageData.data),
            width: imageData.width,
            height: imageData.height,
          },
          effects: effectsToUse,
          operation: "process",
        })
      }
    }
  }, [uploadedImage, effectsToUse])

  const applyCanvasEffects = useCallback(
    (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, effects: EffectSettings) => {
      if (effects.displacement > 0) {
        applyDisplacementEffect(ctx, canvas, effects.displacement)
      }

      if (effects.scanlines > 0) {
        applyScanlineEffect(ctx, canvas, effects.scanlines)
      }

      if (effects.chromaShift > 0) {
        applyChromaShift(ctx, canvas, effects.chromaShift)
      }
    },
    [],
  )

  const applyDisplacementEffect = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, amount: number) => {
    if (amount === 0) return

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    for (let y = 0; y < canvas.height; y++) {
      if (Math.random() > 0.95) {
        const offset = (Math.random() - 0.5) * amount * 2
        for (let x = 0; x < canvas.width; x++) {
          const srcX = Math.max(0, Math.min(canvas.width - 1, x + offset))
          const srcIdx = (y * canvas.width + Math.floor(srcX)) * 4
          const dstIdx = (y * canvas.width + x) * 4

          data[dstIdx] = data[srcIdx]
          data[dstIdx + 1] = data[srcIdx + 1]
          data[dstIdx + 2] = data[srcIdx + 2]
        }
      }
    }

    ctx.putImageData(imageData, 0, 0)
  }

  const applyChromaShift = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, amount: number) => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    const offset = Math.floor(amount * 2)

    for (let i = 0; i < data.length; i += 4) {
      const idx = i + offset * 4
      if (idx < data.length) {
        const temp = data[i]
        data[i] = data[idx]
        data[idx] = temp
      }
    }

    ctx.putImageData(imageData, 0, 0)
  }

  const applyScanlineEffect = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, opacity: number) => {
    if (opacity === 0) return

    ctx.strokeStyle = `rgba(0, 0, 0, ${opacity})`
    ctx.lineWidth = 1

    for (let y = 0; y < canvas.height; y += 2) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget === e.target) {
      setIsDragging(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        setIsProcessing(false)
        setUploadedImage(e.target.result as string)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleRandomize = () => {
    setEffects({
      displacement: Math.random() * 40,
      glitchIntensity: Math.random() * 60,
      scanlines: Math.random() * 0.5,
      blockSize: Math.floor(Math.random() * 16) + 2,
      bitCrush: Math.floor(Math.random() * 6) + 3,
      compressionArtifacts: Math.random() * 20,
      chromaShift: Math.random() * 10,
      hueShift: Math.random() * 360,
      saturation: Math.random() * 100 + 50,
      contrast: Math.random() * 100 + 75,
      brightness: Math.random() * 100 + 75,
      colorPaletteMode: ["none", "retro", "neon", "vintage", "grayscale", "solarize"][
        Math.floor(Math.random() * 6)
      ] as any,
      temperature: Math.random() * 60 - 30,
      debounceEnabled: true,
    })
  }

  const handleReset = () => {
    setEffects(DEFAULT_EFFECTS)
  }

  const handleDownload = () => {
    if (!canvasRef.current) return

    const link = document.createElement("a")
    link.href = canvasRef.current.toDataURL("image/png")
    link.download = `datamosh-${Date.now()}.png`
    link.click()
  }

  const handleCopyShareUrl = () => {
    if (typeof window !== "undefined") {
      const url = window.location.href
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
    }
  }

  const handleSelectImage = () => {
    fileInputRef.current?.click()
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0])
    }
    e.target.value = ""
  }

  return (
    <div className="flex h-screen flex-col gap-4 p-4 md:gap-6 md:p-6 lg:flex-row lg:gap-8">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
        aria-label="Upload image file"
      />

      {/* Main dropzone and preview area */}
      <div className="flex flex-1 flex-col gap-4">
        {!uploadedImage ? (
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`flex-1 flex flex-col items-center justify-center rounded-lg border-2 border-dashed transition-all duration-200 ${
              isDragging
                ? "border-primary bg-primary/10 scale-[1.02]"
                : "border-muted-foreground/30 bg-muted/5 hover:border-primary/50 hover:bg-primary/5"
            }`}
          >
            <div className="text-center px-6">
              <div className="text-6xl mb-4">🎨</div>
              <h2 className="text-3xl font-bold mb-2 text-foreground">Drop your image here</h2>
              <p className="text-muted-foreground mb-8 text-lg">Upload and transform with creative datamosh effects</p>
              <Button size="lg" className="cursor-pointer gap-2" onClick={handleSelectImage}>
                <Upload className="w-4 h-4" />
                Select Image
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center rounded-lg border border-border bg-card p-4 overflow-auto relative">
            <div className="relative max-w-full max-h-full">
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-full rounded-lg shadow-lg"
                style={{
                  maxHeight: "calc(100vh - 300px)",
                  maxWidth: "100%",
                  height: "auto",
                  opacity: isProcessing ? 0.5 : 1,
                }}
              />
              {isProcessing && (
                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/20">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border border-primary border-t-transparent mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Processing...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action buttons */}
        {uploadedImage && (
          <div className="flex gap-2 flex-wrap justify-center md:justify-start">
            <Button
              onClick={handleRandomize}
              variant="outline"
              size="sm"
              className="flex-1 min-w-28 gap-2 bg-transparent"
            >
              <Shuffle className="w-4 h-4" />
              <span className="hidden sm:inline">Randomize</span>
            </Button>
            <Button onClick={handleReset} variant="outline" size="sm" className="flex-1 min-w-28 gap-2 bg-transparent">
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Reset</span>
            </Button>
            <Button onClick={handleDownload} size="sm" className="flex-1 min-w-28 gap-2">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Save</span>
            </Button>
            <Button
              onClick={handleCopyShareUrl}
              variant="outline"
              size="sm"
              className="flex-1 min-w-28 gap-2 bg-transparent"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? "Copied!" : "Share"}</span>
            </Button>
            <Button
              onClick={handleSelectImage}
              variant="outline"
              size="sm"
              className="flex-1 min-w-28 gap-2 bg-transparent"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">New Image</span>
            </Button>
          </div>
        )}
      </div>

      {/* Control panel */}
      {uploadedImage && (
        <div className="w-full lg:w-96">
          <EffectControls effects={effects} setEffects={setEffects} />
        </div>
      )}
    </div>
  )
}
