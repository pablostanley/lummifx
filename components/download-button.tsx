"use client"

import { Button } from "@/components/ui/button"
import { useStore } from "@/lib/store"
import { Download } from "lucide-react"

export function DownloadButton() {
  const { canvasRef } = useStore()

  const handleDownload = () => {
    if (!canvasRef?.current) return

    // Create a temporary link element
    const link = document.createElement("a")

    // Get the canvas data URL
    const dataUrl = canvasRef.current.toDataURL("image/png")

    // Set the link attributes
    link.href = dataUrl
    link.download = `lummi-fx-${Date.now()}.png`

    // Append to the document, click, and remove
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Button
      onClick={handleDownload}
      size="lg"
      className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
    >
      <Download className="mr-2 h-5 w-5" />
      Download
    </Button>
  )
}
