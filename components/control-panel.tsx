"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LucideImage, LucideSliders } from "lucide-react"
import { ThemeToggle } from "./theme-toggle"
import { ImageDropzone } from "./image-dropzone"
import { EffectControls } from "./effect-controls"
import { useStore } from "@/lib/store"
import { effects, type EffectType } from "@/lib/effects"
import {
  GridFour,
  DotsNine,
  DiamondsFour,
  DropHalfBottom,
  Sparkle,
  Hourglass,
  WaveSawtooth,
} from "@phosphor-icons/react"

export function ControlPanel() {
  const { currentEffect, setCurrentEffect, imageUrl, setImageUrl } = useStore()

  const [activeTab, setActiveTab] = useState<string>("controls")

  const handleEffectChange = (effect: EffectType) => {
    setCurrentEffect(effect)
  }

  // Effect icons mapping using Phosphor icons with dynamic weight
  const getEffectIcon = (effectKey: EffectType) => {
    const isActive = currentEffect === effectKey
    const weight = isActive ? "fill" : "regular"
    const size = 32

    switch (effectKey) {
      case "halftone":
        return <DiamondsFour weight={weight} size={size} />
      case "mirror":
        return <Hourglass weight={weight} size={size} />
      case "glass":
        return <DropHalfBottom weight={weight} size={size} />
      case "dither":
        return <DotsNine weight={weight} size={size} />
      case "fragments":
        return <Sparkle weight={weight} size={size} />
      case "pixelate":
        return <GridFour weight={weight} size={size} />
      case "noise":
        return <WaveSawtooth weight={weight} size={size} />
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <h1 className="text-2xl font-bold">Lummi FX</h1>
        <p className="text-muted-foreground text-sm">WebGPU Image Shader Playground</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-2 mx-4 mt-2">
          <TabsTrigger value="controls">
            <LucideSliders className="h-4 w-4 mr-2" />
            Effects
          </TabsTrigger>
          <TabsTrigger value="image">
            <LucideImage className="h-4 w-4 mr-2" />
            Image
          </TabsTrigger>
        </TabsList>

        <TabsContent value="controls" className="flex-1 overflow-y-auto p-4">
          <div className="space-y-6">
            <div>
              <div className="flex flex-wrap gap-2">
                {["halftone", "mirror", "glass", "dither", "fragments", "pixelate", "noise"].map((key) => (
                  <Button
                    key={key}
                    variant={currentEffect === (key as EffectType) ? "default" : "outline"}
                    onClick={() => handleEffectChange(key as EffectType)}
                    className="h-12 w-16 p-0 flex items-center justify-center"
                    title={effects[key as EffectType].name}
                  >
                    {getEffectIcon(key as EffectType)}
                  </Button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-border">
              <h2 className="text-lg font-medium mb-4">{effects[currentEffect].name}</h2>
              <EffectControls />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="image" className="flex-1 p-4">
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Change Image</h2>
            <p className="text-muted-foreground text-sm">Upload a new image to apply effects to.</p>
            <ImageDropzone compact />
          </div>
        </TabsContent>
      </Tabs>
      <div className="mt-auto p-4 border-t border-border">
        <div className="flex justify-start">
          <ThemeToggle />
        </div>
      </div>
    </div>
  )
}
