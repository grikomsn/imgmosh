"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

interface EffectControlsProps {
  effects: EffectSettings
  setEffects: (effects: EffectSettings) => void
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

export function EffectControls({ effects, setEffects }: EffectControlsProps) {
  const handleReset = () => {
    setEffects(DEFAULT_EFFECTS)
  }

  const updateEffect = <K extends keyof EffectSettings>(key: K, value: EffectSettings[K]) => {
    setEffects({ ...effects, [key]: value })
  }

  const sliderControl = (
    label: string,
    key: keyof EffectSettings,
    min: number,
    max: number,
    step: number,
    unit = "",
    description?: string,
  ) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">{label}</label>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded font-mono">
          {typeof effects[key] === "number" ? (effects[key] as number).toFixed(1) : effects[key]}
          {unit}
        </span>
      </div>
      <Slider
        value={[effects[key] as number]}
        onValueChange={(value) => updateEffect(key, value[0])}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  )

  return (
    <div className="h-full overflow-y-auto">
      <Card className="bg-card border-border sticky top-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Effect Settings</CardTitle>
          <CardDescription className="text-xs">Customize your datamosh effects in real-time</CardDescription>
          <Button onClick={handleReset} variant="outline" size="sm" className="w-full mt-4 bg-transparent">
            Reset All Settings
          </Button>
        </CardHeader>

        <CardContent>
          <div className="mb-4 p-3 bg-muted rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Debounce Processing</label>
              <button
                onClick={() => updateEffect("debounceEnabled", !effects.debounceEnabled)}
                className={`w-10 h-6 rounded-full transition-colors duration-200 flex items-center px-0.5 ${
                  effects.debounceEnabled ? "bg-primary" : "bg-muted-foreground/30"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-background transition-transform duration-200 ${
                    effects.debounceEnabled ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {effects.debounceEnabled
                ? "Slider adjustments are delayed 200ms for better performance"
                : "Real-time processing (may impact performance on large images)"}
            </p>
          </div>

          <Tabs defaultValue="datamosh" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="datamosh">Datamosh</TabsTrigger>
              <TabsTrigger value="colors">Colors</TabsTrigger>
            </TabsList>

            <TabsContent value="datamosh" className="space-y-6">
              {sliderControl(
                "Glitch Intensity",
                "glitchIntensity",
                0,
                100,
                1,
                "",
                "RGB channel corruption and color distortion",
              )}

              {sliderControl("Displacement", "displacement", 0, 50, 0.5, "", "Horizontal scanline displacement effect")}

              {sliderControl("Block Size", "blockSize", 1, 32, 1, "px", "Size of pixel block distortions")}

              {sliderControl("Chroma Shift", "chromaShift", 0, 20, 0.5, "", "RGB channel separation effect")}

              {sliderControl(
                "Compression Artifacts",
                "compressionArtifacts",
                0,
                50,
                1,
                "",
                "JPEG-style compression block artifacts",
              )}

              {sliderControl("Scanlines", "scanlines", 0, 1, 0.05, "", "CRT-style horizontal line intensity")}

              {sliderControl(
                "Bit Depth",
                "bitCrush",
                1,
                8,
                1,
                "bit",
                "Color depth reduction (lower = more posterization)",
              )}
            </TabsContent>

            <TabsContent value="colors" className="space-y-6">
              {sliderControl("Hue Shift", "hueShift", 0, 360, 1, "°", "Rotate all colors around the color wheel")}

              {sliderControl("Saturation", "saturation", 0, 200, 1, "%", "Increase or decrease color intensity")}

              {sliderControl("Contrast", "contrast", 0, 200, 1, "%", "Adjust the difference between light and dark")}

              {sliderControl("Brightness", "brightness", 0, 200, 1, "%", "Lighten or darken the entire image")}

              {sliderControl("Temperature", "temperature", -50, 50, 1, "", "Warm (red) or cool (blue) color cast")}

              <div className="space-y-2 pt-2">
                <label className="text-sm font-medium text-foreground">Color Palette</label>
                <Select
                  value={effects.colorPaletteMode}
                  onValueChange={(value) => updateEffect("colorPaletteMode", value as any)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="retro">Retro (80s)</SelectItem>
                    <SelectItem value="neon">Neon</SelectItem>
                    <SelectItem value="vintage">Vintage</SelectItem>
                    <SelectItem value="grayscale">Grayscale</SelectItem>
                    <SelectItem value="solarize">Solarize</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Apply predefined color schemes</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
