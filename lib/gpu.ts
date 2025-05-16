export async function initWebGPU(canvas: HTMLCanvasElement) {
  // Check for WebGPU support
  if (!navigator.gpu) {
    throw new Error("WebGPU not supported on this browser.")
  }

  // Request adapter
  const adapter = await navigator.gpu.requestAdapter({
    powerPreference: "high-performance",
  })

  if (!adapter) {
    throw new Error("No appropriate GPUAdapter found.")
  }

  // Request device
  const device = await adapter.requestDevice()

  // Handle device errors
  device.lost.then((info) => {
    console.error(`WebGPU device was lost: ${info.message}`)

    if (info.reason !== "destroyed") {
      // Try to recreate the device
      window.location.reload()
    }
  })

  // Configure canvas context
  const context = canvas.getContext("webgpu")
  if (!context) {
    throw new Error("Failed to get WebGPU context from canvas.")
  }

  context.configure({
    device,
    format: navigator.gpu.getPreferredCanvasFormat(),
    alphaMode: "premultiplied",
  })

  return { device, context }
}

export async function createRenderPipeline(device: GPUDevice, shaderCode: string) {
  // Vertex shader module (always the same for a full-screen quad)
  const vertexShaderModule = device.createShaderModule({
    code: `
      struct VertexOutput {
        @builtin(position) position: vec4f,
        @location(0) texCoord: vec2f,
      }
      
      @vertex
      fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
        var pos = array<vec2f, 6>(
          vec2f(-1.0, -1.0),
          vec2f(1.0, -1.0),
          vec2f(1.0, 1.0),
          vec2f(-1.0, -1.0),
          vec2f(1.0, 1.0),
          vec2f(-1.0, 1.0)
        );
        
        var texCoords = array<vec2f, 6>(
          vec2f(0.0, 1.0),
          vec2f(1.0, 1.0),
          vec2f(1.0, 0.0),
          vec2f(0.0, 1.0),
          vec2f(1.0, 0.0),
          vec2f(0.0, 0.0)
        );
        
        var output: VertexOutput;
        output.position = vec4f(pos[vertexIndex], 0.0, 1.0);
        output.texCoord = texCoords[vertexIndex];
        return output;
      }
    `,
  })

  // Fragment shader module (from the effect)
  const fragmentShaderModule = device.createShaderModule({
    code: shaderCode,
  })

  // Create pipeline
  const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module: vertexShaderModule,
      entryPoint: "vertexMain",
    },
    fragment: {
      module: fragmentShaderModule,
      entryPoint: "fragmentMain",
      targets: [
        {
          format: navigator.gpu.getPreferredCanvasFormat(),
        },
      ],
    },
    primitive: {
      topology: "triangle-list",
    },
  })

  return pipeline
}
