"use client"

import { useEffect, useRef, useState } from "react"
import { useStore } from "@/lib/store"
import { initWebGPU, createRenderPipeline } from "@/lib/gpu"
import { getShaderCode } from "@/lib/effects"

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { imageUrl, currentEffect, effectParams, customShaderCode, setCanvasRef } = useStore()
  const [isRendering, setIsRendering] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [animationTime, setAnimationTime] = useState(0)
  const animationFrameRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(performance.now())

  // Store GPU context and resources
  const gpuContextRef = useRef<{
    device: GPUDevice | null
    context: GPUCanvasContext | null
    pipeline: GPURenderPipeline | null
    bindGroup: GPUBindGroup | null
    texture: GPUTexture | null
    sampler: GPUSampler | null
    uniformBuffer: GPUBuffer | null
  }>({
    device: null,
    context: null,
    pipeline: null,
    bindGroup: null,
    texture: null,
    sampler: null,
    uniformBuffer: null,
  })

  // Initialize WebGPU
  useEffect(() => {
    async function setup() {
      if (!canvasRef.current || !imageUrl) return

      try {
        setError(null)
        setIsRendering(true)

        // Initialize WebGPU
        const { device, context } = await initWebGPU(canvasRef.current)
        gpuContextRef.current.device = device
        gpuContextRef.current.context = context

        // Create sampler
        const sampler = device.createSampler({
          magFilter: "linear",
          minFilter: "linear",
        })
        gpuContextRef.current.sampler = sampler

        // Load image and create texture
        await loadImageTexture(imageUrl)

        // Create uniform buffer
        const uniformBuffer = device.createBuffer({
          size: 256, // Enough space for all our uniforms
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        })
        gpuContextRef.current.uniformBuffer = uniformBuffer

        // Create pipeline with current shader
        await updatePipeline()

        // Store canvas ref for download functionality
        setCanvasRef(canvasRef)
      } catch (err) {
        console.error("WebGPU setup error:", err)
        setError(err instanceof Error ? err.message : "Failed to initialize WebGPU")
      } finally {
        setIsRendering(false)
      }
    }

    setup()

    return () => {
      // Clean up GPU resources
      if (gpuContextRef.current.texture) {
        gpuContextRef.current.texture.destroy()
      }
      if (gpuContextRef.current.uniformBuffer) {
        gpuContextRef.current.uniformBuffer.destroy()
      }
    }
  }, [imageUrl, setCanvasRef])

  // Update pipeline when effect or custom shader changes
  useEffect(() => {
    if (!gpuContextRef.current.device || !imageUrl) return

    updatePipeline()
  }, [currentEffect, customShaderCode, imageUrl])

  // Update uniforms when effect parameters change
  useEffect(() => {
    if (!gpuContextRef.current.device || !gpuContextRef.current.uniformBuffer) return

    updateUniforms()
    render()
  }, [effectParams])

  // Force render when component mounts to ensure initial parameters are applied
  useEffect(() => {
    if (gpuContextRef.current.device && gpuContextRef.current.uniformBuffer) {
      updateUniforms()
      render()
    }
  }, [])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current || !gpuContextRef.current.context) return

      resizeCanvas()
      render()
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Handle animation
  useEffect(() => {
    // Reset animation time when component mounts
    startTimeRef.current = performance.now()

    // Start animation loop
    const updateAnimation = () => {
      // Calculate time in seconds
      const currentTime = performance.now()
      const elapsedTime = (currentTime - startTimeRef.current) / 1000

      // Update animation time state
      setAnimationTime(elapsedTime)

      // Continue the animation loop
      animationFrameRef.current = requestAnimationFrame(updateAnimation)
    }

    // Start the animation loop
    animationFrameRef.current = requestAnimationFrame(updateAnimation)

    // Cleanup animation loop on unmount
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  async function loadImageTexture(url: string) {
    if (!gpuContextRef.current.device) return

    const device = gpuContextRef.current.device

    // Load image
    const img = new Image()
    img.crossOrigin = "anonymous"

    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
      img.src = url
    })

    // Create texture
    if (gpuContextRef.current.texture) {
      gpuContextRef.current.texture.destroy()
    }

    const texture = device.createTexture({
      size: [img.width, img.height, 1],
      format: "rgba8unorm",
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
    })

    // Copy image data to texture
    device.queue.copyExternalImageToTexture({ source: img }, { texture }, [img.width, img.height])

    gpuContextRef.current.texture = texture

    // Resize canvas to match image aspect ratio
    resizeCanvas()
  }

  async function updatePipeline() {
    if (
      !gpuContextRef.current.device ||
      !gpuContextRef.current.texture ||
      !gpuContextRef.current.sampler ||
      !gpuContextRef.current.uniformBuffer
    )
      return

    try {
      setError(null)
      setIsRendering(true)

      const device = gpuContextRef.current.device
      const texture = gpuContextRef.current.texture
      const sampler = gpuContextRef.current.sampler
      const uniformBuffer = gpuContextRef.current.uniformBuffer

      // Get shader code (either custom or from predefined effects)
      const shaderCode = customShaderCode || getShaderCode(currentEffect)

      // Create pipeline
      const pipeline = await createRenderPipeline(device, shaderCode)
      gpuContextRef.current.pipeline = pipeline

      // Create bind group
      const bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
          {
            binding: 0,
            resource: sampler,
          },
          {
            binding: 1,
            resource: texture.createView(),
          },
          {
            binding: 2,
            resource: { buffer: uniformBuffer },
          },
        ],
      })
      gpuContextRef.current.bindGroup = bindGroup

      // Update uniforms and render
      updateUniforms()
      render()
    } catch (err) {
      console.error("Shader compilation error:", err)
      setError(err instanceof Error ? err.message : "Failed to compile shader")
    } finally {
      setIsRendering(false)
    }
  }

  function updateUniforms() {
    if (!gpuContextRef.current.device || !gpuContextRef.current.uniformBuffer || !gpuContextRef.current.texture) return

    const device = gpuContextRef.current.device
    const uniformBuffer = gpuContextRef.current.uniformBuffer
    const texture = gpuContextRef.current.texture

    // Create uniform data based on current effect parameters
    const textureSize = new Float32Array([texture.width, texture.height])

    // Convert effect parameters to Float32Array
    // For boolean values, convert to 0.0 or 1.0
    const paramValues = Object.entries(effectParams).map(([key, value]) => {
      if (typeof value === "boolean") {
        return value ? 1.0 : 0.0
      }
      return value as number
    })

    // Add animation time for animated effects
    const animatedEffects = ["fragments", "noise"]
    if (animatedEffects.includes(currentEffect)) {
      paramValues.push(animationTime)
    }

    const uniformData = new Float32Array([
      ...textureSize,
      ...paramValues,
      // Pad to ensure we have enough data
      ...new Array(64 - textureSize.length - paramValues.length).fill(0),
    ])

    // Write uniform data to buffer
    device.queue.writeBuffer(uniformBuffer, 0, uniformData)
  }

  function resizeCanvas() {
    if (!canvasRef.current || !gpuContextRef.current.texture) return

    const canvas = canvasRef.current
    const container = canvas.parentElement
    if (!container) return

    const texture = gpuContextRef.current.texture
    const containerWidth = container.clientWidth
    const containerHeight = container.clientHeight

    // Calculate aspect ratio
    const imageAspect = texture.width / texture.height
    const containerAspect = containerWidth / containerHeight

    let width, height

    if (containerAspect > imageAspect) {
      // Container is wider than image
      height = containerHeight
      width = height * imageAspect
    } else {
      // Container is taller than image
      width = containerWidth
      height = width / imageAspect
    }

    // Set canvas size
    canvas.width = width * window.devicePixelRatio
    canvas.height = height * window.devicePixelRatio
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    // Update configuration for WebGPU context
    if (gpuContextRef.current.context) {
      gpuContextRef.current.context.configure({
        device: gpuContextRef.current.device!,
        format: navigator.gpu.getPreferredCanvasFormat(),
        alphaMode: "premultiplied",
      })
    }
  }

  function render() {
    if (
      !gpuContextRef.current.device ||
      !gpuContextRef.current.context ||
      !gpuContextRef.current.pipeline ||
      !gpuContextRef.current.bindGroup
    )
      return

    const device = gpuContextRef.current.device
    const context = gpuContextRef.current.context
    const pipeline = gpuContextRef.current.pipeline
    const bindGroup = gpuContextRef.current.bindGroup

    // Create command encoder
    const commandEncoder = device.createCommandEncoder()

    // Begin render pass
    const renderPassDescriptor = {
      colorAttachments: [
        {
          view: context.getCurrentTexture().createView(),
          loadOp: "clear",
          storeOp: "store",
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
        },
      ],
    }

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor)
    passEncoder.setPipeline(pipeline)
    passEncoder.setBindGroup(0, bindGroup)
    passEncoder.draw(6) // Draw 2 triangles (6 vertices) for a full-screen quad
    passEncoder.end()

    // Submit command buffer
    device.queue.submit([commandEncoder.finish()])
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-muted">
      {isRendering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
        </div>
      )}

      {error && (
        <div className="absolute bottom-4 left-4 right-4 bg-destructive text-destructive-foreground p-4 rounded-md z-20">
          <h3 className="font-bold">Shader Error:</h3>
          <pre className="text-xs mt-2 overflow-auto max-h-32">{error}</pre>
        </div>
      )}

      <canvas ref={canvasRef} className="max-w-full max-h-full object-contain" />
    </div>
  )
}
