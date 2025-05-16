"use client"

import type React from "react"

import { useCallback, useState, useRef } from "react"
import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Upload, ImageIcon } from "lucide-react"

interface ImageDropzoneProps {
  compact?: boolean
}

export function ImageDropzone({ compact = false }: ImageDropzoneProps) {
  const { setImageUrl } = useStore()
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFile(files[0])
    }
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }, [])

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file")
      return
    }

    setIsLoading(true)

    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        setImageUrl(e.target.result.toString())
      }
      setIsLoading(false)
    }
    reader.onerror = () => {
      alert("Error reading file")
      setIsLoading(false)
    }
    reader.readAsDataURL(file)
  }

  const handleUseDefault = () => {
    setImageUrl("/default-image.png")
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  if (compact) {
    return (
      <div className="space-y-4">
        <div
          className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
            isDragging ? "border-primary bg-secondary" : "border-border hover:border-primary/50"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          style={{ cursor: "pointer" }}
        >
          <div className="flex flex-col items-center justify-center space-y-2">
            <Upload className="h-6 w-6 mb-2 text-muted-foreground" />
            <p className="text-sm">
              Drag & drop an image or{" "}
              <label className="text-primary cursor-pointer hover:underline">
                browse
                <input type="file" className="hidden" accept="image/*" onChange={handleFileInput} ref={fileInputRef} />
              </label>
            </p>
          </div>
        </div>

        <Button variant="outline" onClick={handleUseDefault} className="w-full">
          Use Default Image
        </Button>
      </div>
    )
  }

  return (
    <div
      className={`flex flex-col items-center justify-center max-w-xl mx-auto p-12 border-2 border-dashed rounded-lg transition-colors ${
        isDragging ? "border-primary bg-secondary" : "border-border"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      style={{ cursor: "pointer" }}
    >
      {isLoading ? (
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      ) : (
        <>
          <ImageIcon className="h-16 w-16 mb-4 text-muted-foreground" />
          <h2 className="text-xl font-medium mb-2">Drop your image here</h2>
          <p className="text-muted-foreground mb-6 text-center">Supports PNG and JPEG up to 8K resolution</p>
          <div className="flex space-x-4">
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              Choose File
            </Button>
            <Button variant="outline" onClick={handleUseDefault}>
              Use Default Image
            </Button>
          </div>
          <input
            id="file-input"
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileInput}
            ref={fileInputRef}
          />
        </>
      )}
    </div>
  )
}
