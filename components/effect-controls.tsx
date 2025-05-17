"use client"

import { useStore } from "@/lib/store"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { effects } from "@/lib/effects"
import { Card } from "@/components/ui/card"
import { useState, useEffect } from "react"

// Add import for the Select components at the top of the file:
// Add this with the other imports at the top
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Add import for the noise preview components
import {
  NoisePatternPreview as ActualNoisePatternPreview,
  NoiseColorModePreview as ActualNoiseColorModePreview,
} from "./noise-previews"

// Add import for the water preview component
import { WaterPatternPreview } from "./water-previews"

export function EffectControls() {
  const { currentEffect, effectParams, setEffectParams, updateEffectParam } = useStore()
  const [localParams, setLocalParams] = useState(effectParams)

  // Update local params when effect changes
  useEffect(() => {
    setLocalParams(effectParams)
  }, [effectParams, currentEffect])

  const handleParamChange = (param: string, value: number | boolean) => {
    // Update local state immediately for responsive UI
    setLocalParams((prev) => ({ ...prev, [param]: value }))

    // Update the global store
    updateEffectParam(param, value)
  }

  // Special handling for pattern type in Fragments effect
  const renderFragmentsPatternSelector = () => {
    if (currentEffect !== "fragments") return null

    const patternTypes = [
      "Diagonal Lines",
      "Diagonal Lines 2",
      "Vertical Lines",
      "Horizontal Segments",
      "Noise Texture",
      "Static Noise",
    ]

    const patternValue = localParams.patternType !== undefined ? Number(localParams.patternType) : 0

    return (
      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <Label>Pattern Type</Label>
        </div>
        <div className="grid grid-cols-6 gap-1">
          {patternTypes.map((name, index) => (
            <Card
              key={index}
              className={`p-1 cursor-pointer transition-all aspect-square ${patternValue === index ? "ring-2 ring-primary" : ""}`}
              onClick={() => handleParamChange("patternType", index)}
              title={name}
            >
              <div className="w-full h-full rounded-sm overflow-hidden">
                <FragmentsPatternPreview type={index} />
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Special handling for pattern type in Mirror effect
  const renderMirrorPatternSelector = () => {
    if (currentEffect !== "mirror") return null

    const patternTypes = [
      "Radial Stripes",
      "S-Curve",
      "Vertical Pinch",
      "Horizontal Pinch",
      "Zigzag",
      "Wavy Horizontal",
    ]

    const patternValue = localParams.patternType !== undefined ? Number(localParams.patternType) : 0

    return (
      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <Label>Pattern Type</Label>
        </div>
        <div className="grid grid-cols-6 gap-1">
          {patternTypes.map((name, index) => (
            <Card
              key={index}
              className={`p-1 cursor-pointer transition-all aspect-square ${patternValue === index ? "ring-2 ring-primary" : ""}`}
              onClick={() => handleParamChange("patternType", index)}
              title={name}
            >
              <div className="w-full h-full rounded-sm overflow-hidden">
                <MirrorPatternPreview type={index} />
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Special handling for shape type in Halftone effect
  const renderHalftoneShapeSelector = () => {
    if (currentEffect !== "halftone") return null

    // Change the shape types array to use the diamond icon and remove the text labels
    const shapeTypes = [
      { name: "Circles", icon: "⚪" },
      { name: "Diamonds", icon: "◆" },
      { name: "Triangles", icon: "▲" },
    ]

    const shapeValue = localParams.shapeType !== undefined ? Number(localParams.shapeType) : 0

    return (
      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <Label>Shape Type</Label>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {shapeTypes.map((shape, index) => (
            // Then modify the shape selector card to remove the text labels
            <Card
              key={index}
              className={`p-2 cursor-pointer transition-all ${shapeValue === index ? "ring-2 ring-primary" : ""}`}
              onClick={() => handleParamChange("shapeType", index)}
              title={shape.name}
            >
              <div className="flex items-center justify-center text-center">
                <span className="text-2xl">{shape.icon}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Add special handling for noise type selector
  const renderNoiseTypeSelector = () => {
    if (currentEffect !== "noise") return null

    const noiseTypes = ["Random", "Perlin", "Warp", "Voronoi", "Cellular", "Simplex"]

    const noiseValue = localParams.noiseType !== undefined ? Number(localParams.noiseType) : 0

    return (
      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <Label>Noise Type</Label>
        </div>
        <div className="grid grid-cols-6 gap-1">
          {noiseTypes.map((name, index) => (
            <Card
              key={index}
              className={`p-1 cursor-pointer transition-all ${noiseValue === index ? "ring-2 ring-primary" : ""}`}
              onClick={() => handleParamChange("noiseType", index)}
              title={name}
            >
              <div className="w-full h-full flex items-center justify-center">
                <ActualNoisePatternPreview type={index} />
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Add special handling for water pattern type selector
  const renderWaterPatternSelector = () => {
    if (currentEffect !== "water") return null

    const waterPatterns = ["Ripples", "Ocean Waves", "Choppy Water", "Calm Pool"]

    const patternValue = localParams.patternType !== undefined ? Number(localParams.patternType) : 0

    return (
      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <Label>Wave Pattern</Label>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {waterPatterns.map((name, index) => (
            <Card
              key={index}
              className={`p-1 cursor-pointer transition-all ${patternValue === index ? "ring-2 ring-primary" : ""}`}
              onClick={() => handleParamChange("patternType", index)}
              title={name}
            >
              <div className="w-full h-full flex items-center justify-center">
                <WaterPatternPreview type={index} />
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Add special handling for color mode selector in noise effect
  const renderNoiseColorModeSelector = () => {
    if (currentEffect !== "noise") return null

    const colorModes = ["Grayscale", "Heat Map", "Rainbow", "Cyberpunk", "Neon", "Earth"]

    const colorModeValue = localParams.colorMode !== undefined ? Number(localParams.colorMode) : 0

    return (
      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <Label>Color Mode</Label>
        </div>
        <div className="grid grid-cols-6 gap-1">
          {colorModes.map((name, index) => (
            <Card
              key={index}
              className={`p-1 cursor-pointer transition-all ${colorModeValue === index ? "ring-2 ring-primary" : ""}`}
              onClick={() => handleParamChange("colorMode", index)}
              title={name}
            >
              <div className="w-full h-full flex items-center justify-center">
                <ActualNoiseColorModePreview type={index} />
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Find the renderNoiseBlendModeSelector function and replace it with this implementation:

  const renderNoiseBlendModeSelector = () => {
    if (currentEffect !== "noise") return null

    const blendModes = ["Normal", "Multiply", "Screen", "Overlay", "Add"]
    const blendModeValue = localParams.blendMode !== undefined ? Number(localParams.blendMode) : 0

    return (
      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <Label>Blend Mode</Label>
        </div>
        <Select
          value={blendModeValue.toString()}
          onValueChange={(value) => handleParamChange("blendMode", Number.parseInt(value))}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select blend mode" />
          </SelectTrigger>
          <SelectContent>
            {blendModes.map((name, index) => (
              <SelectItem key={index} value={index.toString()}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  // Add the new selectors to the return statement
  return (
    <div className="space-y-6">
      {renderFragmentsPatternSelector()}
      {renderMirrorPatternSelector()}
      {renderHalftoneShapeSelector()}
      {renderNoiseTypeSelector()}
      {renderNoiseColorModeSelector()}
      {renderNoiseBlendModeSelector()}
      {renderWaterPatternSelector()}

      {Object.entries(effects[currentEffect].params).map(([key, param]) => {
        // Skip pattern type parameter as we're handling it separately
        if ((currentEffect === "fragments" || currentEffect === "mirror") && key === "patternType") return null
        // Skip shape type parameter as we're handling it separately
        if (currentEffect === "halftone" && key === "shapeType") return null
        // Skip noise type parameter as we're handling it separately
        if (currentEffect === "noise" && key === "noiseType") return null
        // Skip color mode parameter as we're handling it separately
        if (currentEffect === "noise" && key === "colorMode") return null
        // Skip blend mode parameter as we're handling it separately
        if (currentEffect === "noise" && key === "blendMode") return null
        // Skip water pattern type parameter as we're handling it separately
        if (currentEffect === "water" && key === "patternType") return null

        const paramValue =
          localParams[key] !== undefined && localParams[key] !== null && !isNaN(Number(localParams[key]))
            ? localParams[key]
            : param.default

        return (
          <div key={key} className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor={key}>{param.name}</Label>
              <span className="text-muted-foreground">
                {param.type === "boolean"
                  ? Boolean(paramValue)
                    ? "On"
                    : "Off"
                  : Number(paramValue).toFixed(param.decimals || 0)}
              </span>
            </div>

            {param.type === "boolean" ? (
              <Switch
                id={key}
                checked={Boolean(paramValue)}
                onCheckedChange={(checked) => handleParamChange(key, checked)}
              />
            ) : (
              <Slider
                id={key}
                min={param.min}
                max={param.max}
                step={param.step || 1}
                value={[Number(paramValue)]}
                onValueChange={(value) => handleParamChange(key, value[0])}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// Component to preview fragments pattern types
function FragmentsPatternPreview({ type }: { type: number }) {
  const patternStyle = () => {
    switch (type) {
      case 0: // Diagonal Lines
        return {
          background: `repeating-linear-gradient(
            45deg,
            #ffffff,
            #ffffff 4px,
            #000000 4px,
            #000000 8px
          )`,
        }
      case 1: // Diagonal Lines 2
        return {
          background: `repeating-linear-gradient(
            -45deg,
            #ffffff,
            #ffffff 4px,
            #000000 4px,
            #000000 8px
          )`,
        }
      case 2: // Vertical Lines
        return {
          background: `repeating-linear-gradient(
            90deg,
            #ffffff,
            #ffffff 4px,
            #000000 4px,
            #000000 8px
          )`,
        }
      case 3: // Horizontal Segments
        return {
          background: `repeating-linear-gradient(
            0deg,
            #ffffff,
            #ffffff 8px,
            #000000 8px,
            #000000 16px
          )`,
          backgroundPosition: "left center",
          backgroundSize: "100% 100%",
        }
      case 4: // Noise Texture
        return {
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundSize: "cover",
        }
      case 5: // Static Noise
        return {
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundSize: "cover",
        }
      default:
        return {}
    }
  }

  return <div className="w-full h-full" style={patternStyle()}></div>
}

// Component to preview mirror pattern types
function MirrorPatternPreview({ type }: { type: number }) {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg viewBox="0 0 40 40" width="100%" height="100%" className="text-current">
        {type === 0 && (
          // Radial stripes
          <g stroke="currentColor" fill="none" strokeWidth="1.5">
            <circle cx="20" cy="20" r="18" />
            <path d="M20,2 L20,38" />
            <path d="M2,20 L38,20" />
            <path d="M6,6 L34,34" />
            <path d="M6,34 L34,6" />
          </g>
        )}
        {type === 1 && (
          // S-curve
          <g stroke="currentColor" fill="none" strokeWidth="2">
            <path d="M5,10 Q20,0 35,10 Q20,20 5,30 Q20,40 35,30" />
          </g>
        )}
        {type === 2 && (
          // Vertical pinch
          <g stroke="currentColor" fill="none" strokeWidth="2">
            <path d="M5,20 L35,20" />
            <path d="M5,10 Q20,15 35,10" />
            <path d="M5,30 Q20,25 35,30" />
          </g>
        )}
        {type === 3 && (
          // Horizontal pinch
          <g stroke="currentColor" fill="none" strokeWidth="2">
            <path d="M20,5 L20,35" />
            <path d="M10,5 Q15,20 10,35" />
            <path d="M30,5 Q25,20 30,35" />
          </g>
        )}
        {type === 4 && (
          // Zigzag
          <g stroke="currentColor" fill="none" strokeWidth="2">
            <path d="M5,20 L10,10 L20,30 L30,10 L35,20" />
          </g>
        )}
        {type === 5 && (
          // Wavy horizontal
          <g stroke="currentColor" fill="none" strokeWidth="2">
            <path d="M5,20 Q10,10 15,20 Q20,30 25,20 Q30,10 35,20" />
          </g>
        )}
      </svg>
    </div>
  )
}

// Placeholder components for Noise effect previews
function NoisePatternPreview({ type }: { type: number }) {
  return <div className="w-full h-full bg-gray-500" />
}

function NoiseColorModePreview({ type }: { type: number }) {
  return <div className="w-full h-full bg-gray-500" />
}

// Placeholder component for Water effect previews
