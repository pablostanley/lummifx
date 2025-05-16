"use client"

import { useEffect, useState } from "react"
import { Canvas } from "@/components/canvas"
import { ControlPanel } from "@/components/control-panel"
import { useStore } from "@/lib/store"
import { DownloadButton } from "@/components/download-button"
import { ImageDropzone } from "@/components/image-dropzone"

export default function Home() {
  const [isWebGPUSupported, setIsWebGPUSupported] = useState<boolean | null>(null)
  const { imageUrl, setImageUrl } = useStore()

  useEffect(() => {
    async function checkWebGPUSupport() {
      if (!navigator.gpu) {
        setIsWebGPUSupported(false)
        return
      }

      try {
        const adapter = await navigator.gpu.requestAdapter()
        setIsWebGPUSupported(!!adapter)
      } catch (e) {
        setIsWebGPUSupported(false)
      }
    }

    checkWebGPUSupport()

    // Set default image
    if (!imageUrl) {
      setImageUrl("/default-image.png")
    }
  }, [imageUrl, setImageUrl])

  if (isWebGPUSupported === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <div className="animate-pulse">Checking WebGPU support...</div>
      </div>
    )
  }

  if (isWebGPUSupported === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-6">
        <h1 className="text-2xl font-bold mb-4">WebGPU Not Supported</h1>
        <p className="text-center max-w-md">
          Your browser doesn't support WebGPU, which is required for Lummi FX. Please try Chrome/Edge 113+ or Safari 17+
          with the WebGPU flag enabled.
        </p>
      </div>
    )
  }

  return (
    <main className="flex h-screen bg-background text-foreground overflow-hidden">
      {!imageUrl ? (
        <div className="flex items-center justify-center w-full h-full">
          <ImageDropzone />
        </div>
      ) : (
        <>
          <div className="w-80 border-r border-border h-full overflow-y-auto">
            <ControlPanel />
          </div>
          <div className="flex-1 relative">
            <Canvas />
            <div className="absolute top-4 right-4">
              <DownloadButton />
            </div>
          </div>
        </>
      )}
    </main>
  )
}
