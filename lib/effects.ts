export type EffectType = "pixelate" | "dither" | "halftone" | "glass" | "fragments" | "mirror"

interface EffectParam {
  name: string
  type: "number" | "boolean"
  min?: number
  max?: number
  step?: number
  default: number | boolean
  decimals?: number
}

interface Effect {
  name: string
  description: string
  params: Record<string, EffectParam>
  shaderCode: string
}

export const effects: Record<EffectType, Effect> = {
  pixelate: {
    name: "Pixelate",
    description: "Pixelates the image by snapping UVs to a grid",
    params: {
      pixelSize: {
        name: "Pixel Size",
        type: "number",
        min: 1,
        max: 128,
        step: 1,
        default: 8,
      },
    },
    shaderCode: `
      struct Uniforms {
        textureSize: vec2f,
        pixelSize: f32,
      }
      
      @group(0) @binding(0) var texSampler: sampler;
      @group(0) @binding(1) var inputTexture: texture_2d<f32>;
      @group(0) @binding(2) var<uniform> uniforms: Uniforms;
      
      @fragment
      fn fragmentMain(@location(0) texCoord: vec2f) -> @location(0) vec4f {
        // Calculate the pixel grid
        let pixelSize = max(1.0, uniforms.pixelSize);
        let textureSize = uniforms.textureSize;
        
        // Calculate the number of pixels in the texture
        let numPixels = textureSize / pixelSize;
        
        // Snap the texture coordinate to the pixel grid
        let snappedTexCoord = floor(texCoord * numPixels) / numPixels;
        
        // Sample the texture at the snapped coordinate
        return textureSample(inputTexture, texSampler, snappedTexCoord);
      }
    `,
  },

  dither: {
    name: "Ordered Dithering",
    description: "Applies ordered dithering using a Bayer matrix",
    params: {
      matrixSize: {
        name: "Matrix Size",
        type: "number",
        min: 0,
        max: 8,
        step: 1,
        default: 3,
      },
      patternSize: {
        name: "Pattern Size",
        type: "number",
        min: 1,
        max: 16,
        step: 1,
        default: 4,
      },
      levels: {
        name: "Color Levels",
        type: "number",
        min: 2,
        max: 16,
        step: 1,
        default: 4,
      },
      colorDither: {
        name: "Color Dithering",
        type: "boolean",
        default: true,
      },
    },
    shaderCode: `
      struct Uniforms {
        textureSize: vec2f,
        matrixSize: f32,
        patternSize: f32,
        levels: f32,
        colorDither: f32,
      }
      
      @group(0) @binding(0) var texSampler: sampler;
      @group(0) @binding(1) var inputTexture: texture_2d<f32>;
      @group(0) @binding(2) var<uniform> uniforms: Uniforms;
      
      // Get the threshold value from a Bayer matrix
      fn getBayerThreshold(x: u32, y: u32, matrixSize: u32) -> f32 {
        // 2x2 Bayer matrix
        let bayer2 = array<f32, 4>(
          0.0, 0.5,
          0.75, 0.25
        );
        
        // 4x4 Bayer matrix
        let bayer4 = array<f32, 16>(
          0.0, 0.5, 0.125, 0.625,
          0.75, 0.25, 0.875, 0.375,
          0.1875, 0.6875, 0.0625, 0.5625,
          0.9375, 0.4375, 0.8125, 0.3125
        );
        
        // 8x8 Bayer matrix
        let bayer8 = array<f32, 64>(
          0.0, 0.5, 0.125, 0.625, 0.03125, 0.53125, 0.15625, 0.65625,
          0.75, 0.25, 0.875, 0.375, 0.78125, 0.28125, 0.90625, 0.40625,
          0.1875, 0.6875, 0.0625, 0.5625, 0.21875, 0.71875, 0.09375, 0.59375,
          0.9375, 0.4375, 0.8125, 0.3125, 0.96875, 0.46875, 0.84375, 0.34375,
          0.046875, 0.546875, 0.171875, 0.671875, 0.015625, 0.515625, 0.140625, 0.640625,
          0.796875, 0.296875, 0.921875, 0.421875, 0.765625, 0.265625, 0.890625, 0.390625,
          0.234375, 0.734375, 0.109375, 0.609375, 0.203125, 0.703125, 0.078125, 0.578125,
          0.984375, 0.484375, 0.859375, 0.359375, 0.953125, 0.453125, 0.828125, 0.328125
        );
        
        // Get the index in the Bayer matrix
        let xMod = x % matrixSize;
        let yMod = y % matrixSize;
        let index = yMod * matrixSize + xMod;
        
        // Return the threshold value based on the matrix size
        if (matrixSize == 2u) {
          return bayer2[index];
        } else if (matrixSize == 4u) {
          return bayer4[index];
        } else {
          return bayer8[index];
        }
      }
      
      @fragment
      fn fragmentMain(@location(0) texCoord: vec2f) -> @location(0) vec4f {
        // Sample the texture
        let color = textureSample(inputTexture, texSampler, texCoord);
        
        // Get the pixel position, scaled by pattern size
        let patternSize = max(1.0, uniforms.patternSize);
        let scaledPos = vec2u(texCoord * uniforms.textureSize / patternSize);
        
        // Get the matrix size
        let matrixSize = u32(max(2.0, uniforms.matrixSize));
        
        // Get the threshold value
        let threshold = getBayerThreshold(scaledPos.x, scaledPos.y, matrixSize);
        
        // Get the number of color levels
        let levels = uniforms.levels;
        
        // Apply dithering
        var result: vec4f;
        
        if (uniforms.colorDither > 0.5) {
          // Color dithering
          result = vec4f(
            floor(color.r * levels + threshold) / (levels - 1.0),
            floor(color.g * levels + threshold) / (levels - 1.0),
            floor(color.b * levels + threshold) / (levels - 1.0),
            color.a
          );
        } else {
          // Grayscale dithering
          let gray = dot(color.rgb, vec3f(0.299, 0.587, 0.114));
          let dithered = floor(gray * levels + threshold) / (levels - 1.0);
          result = vec4f(dithered, dithered, dithered, color.a);
        }
        
        return result;
      }
    `,
  },

  halftone: {
    name: "Halftone Dots",
    description: "Creates a halftone dot pattern",
    params: {
      dotRadius: {
        name: "Dot Radius",
        type: "number",
        min: 1,
        max: 20,
        step: 0.5,
        default: 10,
        decimals: 1,
      },
      angle: {
        name: "Angle",
        type: "number",
        min: 0,
        max: 90,
        step: 1,
        default: 45,
      },
      colorMode: {
        name: "Color Mode",
        type: "boolean",
        default: true,
      },
      shapeType: {
        name: "Shape Type",
        type: "number",
        min: 0,
        max: 2,
        step: 1,
        default: 0,
      },
    },
    shaderCode: `
      struct Uniforms {
        textureSize: vec2f,
        dotRadius: f32,
        angle: f32,
        colorMode: f32,
        shapeType: f32,
      }
      
      @group(0) @binding(0) var texSampler: sampler;
      @group(0) @binding(1) var inputTexture: texture_2d<f32>;
      @group(0) @binding(2) var<uniform> uniforms: Uniforms;
      
      // Calculate distance based on shape type
      fn getShapeDistance(pos: vec2f, shapeType: f32) -> f32 {
        // Shape type: 0 = Circle, 1 = Square, 2 = Triangle
        if (shapeType < 0.5) {
          // Circle - Euclidean distance
          return length(pos);
        } else if (shapeType < 1.5) {
          // Square - Maximum of absolute x and y (L∞ norm)
          // This creates a square with sides parallel to the x and y axes
          // Apply a scaling factor to make it slightly smaller
          return max(abs(pos.x), abs(pos.y)) * 1.3; // Added scaling factor to make it smaller
        } else {
          // Triangle - Custom distance function
          // This creates a triangular pattern
          let k = 1.5; // Triangle sharpness factor
          return max(
            abs(pos.x) * 0.866025 + pos.y * 0.5, 
            -pos.y
          ) * k;
        }
      }
      
      @fragment
      fn fragmentMain(@location(0) texCoord: vec2f) -> @location(0) vec4f {
        // Sample the original texture at the original coordinates
        let originalColor = textureSample(inputTexture, texSampler, texCoord);
        
        // Convert angle from degrees to radians
        let angleRad = uniforms.angle * 3.14159265359 / 180.0;
        
        // Calculate the rotation matrix
        let cosAngle = cos(angleRad);
        let sinAngle = sin(angleRad);
        let rotMatrix = mat2x2f(
          cosAngle, -sinAngle,
          sinAngle, cosAngle
        );
        
        // Calculate the cell size based on dot radius
        let cellSize = uniforms.dotRadius * 2.0;
        
        // Get pixel position in screen space
        let pixelPos = texCoord * uniforms.textureSize;
        
        // Rotate the grid coordinates for the dot pattern, not the sampling coordinates
        let rotatedGridPos = rotMatrix * pixelPos;
        
        // Calculate the cell coordinates in the rotated space
        let cellCoord = rotatedGridPos / cellSize;
        let cellCenter = (floor(cellCoord) + 0.5) * cellSize;
        
        // Calculate the distance from the center of the cell based on shape type
        let distFromCenter = getShapeDistance(rotatedGridPos - cellCenter, uniforms.shapeType) / uniforms.dotRadius;
        
        // Apply halftone effect
        var result: vec4f;
        
        if (uniforms.colorMode > 0.5) {
          // Color halftone
          // Calculate the dot size based on the brightness of each channel
          let rThreshold = 1.0 - originalColor.r;
          let gThreshold = 1.0 - originalColor.g;
          let bThreshold = 1.0 - originalColor.b;
          
          // Create the halftone pattern for each channel
          let r = step(distFromCenter, 1.0 - rThreshold);
          let g = step(distFromCenter, 1.0 - gThreshold);
          let b = step(distFromCenter, 1.0 - bThreshold);
          
          result = vec4f(r, g, b, originalColor.a);
        } else {
          // Monochrome halftone
          // Calculate the grayscale value
          let gray = dot(originalColor.rgb, vec3f(0.299, 0.587, 0.114));
          
          // Calculate the dot size based on the brightness
          let threshold = 1.0 - gray;
          
          // Create the halftone pattern
          let pattern = step(distFromCenter, 1.0 - threshold);
          
          result = vec4f(pattern, pattern, pattern, originalColor.a);
        }
        
        return result;
      }
    `,
  },
  glass: {
    name: "Glass Refraction",
    description: "Simulates looking through textured glass",
    params: {
      distortionStrength: {
        name: "Distortion Strength",
        type: "number",
        min: 0,
        max: 50,
        step: 1,
        default: 4,
      },
      glassScale: {
        name: "Glass Pattern Scale",
        type: "number",
        min: 1,
        max: 50,
        step: 1,
        default: 24,
      },
      bumpiness: {
        name: "Bumpiness",
        type: "number",
        min: 0.1,
        max: 5,
        step: 0.1,
        default: 1.0,
        decimals: 1,
      },
      chromaticAberration: {
        name: "Chromatic Aberration",
        type: "boolean",
        default: true,
      },
    },
    shaderCode: `
      struct Uniforms {
        textureSize: vec2f,
        distortionStrength: f32,
        glassScale: f32,
        bumpiness: f32,
        chromaticAberration: f32,
      }
      
      @group(0) @binding(0) var texSampler: sampler;
      @group(0) @binding(1) var inputTexture: texture_2d<f32>;
      @group(0) @binding(2) var<uniform> uniforms: Uniforms;
      
      // Hash function for noise
      fn hash22(p: vec2f) -> vec2f {
        var p3 = fract(vec2f(p.x, p.y) * vec2f(443.8975, 397.2973));
        p3 += dot(p3, p3.yx + 19.19);
        return fract(vec2f(p3.x * p3.y, p3.x + p3.y));
      }
      
      // Value noise
      fn valueNoise(p: vec2f) -> f32 {
        let i = floor(p);
        let f = fract(p);
        
        // Four corners
        let a = hash22(i).x;
        let b = hash22(i + vec2f(1.0, 0.0)).x;
        let c = hash22(i + vec2f(0.0, 1.0)).x;
        let d = hash22(i + vec2f(1.0, 1.0)).x;
        
        // Cubic interpolation
        let u = f * f * (3.0 - 2.0 * f);
        
        // Mix
        return mix(
          mix(a, b, u.x),
          mix(c, d, u.x),
          u.y
        );
      }
      
      // FBM (Fractal Brownian Motion) with moderately amplified bumpiness
      fn fbm(p: vec2f, octaves: i32, bumpFactor: f32) -> f32 {
        // Moderately amplify the bumpiness factor
        let amplifiedBumpiness = bumpFactor * 2.0; // Reduced from 3.0 to 2.0
        
        var value = 0.0;
        var amplitude = 0.5 * amplifiedBumpiness;
        var frequency = 1.0;
        var total_amplitude = 0.0;
        
        for (var i = 0; i < octaves; i++) {
          value += amplitude * valueNoise(p * frequency);
          total_amplitude += amplitude;
          amplitude *= 0.5;
          frequency *= 2.0;
        }
        
        return value / total_amplitude;
      }
      
      // Calculate normal from height map with moderately amplified bumpiness
      fn calculateNormal(p: vec2f, scale: f32, bumpFactor: f32) -> vec3f {
        let eps = 0.01;
        
        // Sample height at multiple points with amplified bumpiness
        let h = fbm(p * scale, 4, bumpFactor);
        let hL = fbm((p + vec2f(-eps, 0.0)) * scale, 4, bumpFactor);
        let hR = fbm((p + vec2f(eps, 0.0)) * scale, 4, bumpFactor);
        let hD = fbm((p + vec2f(0.0, -eps)) * scale, 4, bumpFactor);
        let hU = fbm((p + vec2f(0.0, eps)) * scale, 4, bumpFactor);
        
        // Calculate normal using central differences
        // Use 2.0x amplification for X and Y components as requested
        let zFactor = max(0.2, 1.0 / bumpFactor); // Slightly increased z for less extreme distortion
        
        let normal = normalize(vec3f(
          (hL - hR) * 2.0 * bumpFactor, // Reduced from 4.0 to 2.0
          (hD - hU) * 2.0 * bumpFactor, // Reduced from 4.0 to 2.0
          eps * zFactor
        ));
        
        return normal;
      }
      
      @fragment
      fn fragmentMain(@location(0) texCoord: vec2f) -> @location(0) vec4f {
        // Sample the original texture
        let originalColor = textureSample(inputTexture, texSampler, texCoord);
        
        // Calculate normal from noise with moderately amplified bumpiness
        let normal = calculateNormal(texCoord, uniforms.glassScale, uniforms.bumpiness);
        
        // Calculate refraction strength based on distortion parameter
        let refractStrength = uniforms.distortionStrength / 600.0; // Adjusted from 500.0 to 600.0
        
        // Apply refraction
        var finalColor: vec3f;
        
        // Check if chromatic aberration is enabled
        if (uniforms.chromaticAberration > 0.5) {
          // With chromatic aberration - sample each color channel with moderately different offsets
          // Scale the separation based on distortion strength and bumpiness
          let aberrationScale = 1.0 + uniforms.bumpiness * 0.3; // Reduced from 0.5 to 0.3
          
          // Create moderately different offsets for each color channel
          let redOffset = texCoord + vec2f(normal.x, normal.y) * refractStrength * 1.5 * aberrationScale; // Reduced from 2.0 to 1.5
          let greenOffset = texCoord + vec2f(normal.x, normal.y) * refractStrength;
          let blueOffset = texCoord + vec2f(normal.x, normal.y) * refractStrength * 0.7 * aberrationScale; // Increased from 0.5 to 0.7
          
          // Sample each color channel separately
          finalColor.r = textureSample(inputTexture, texSampler, redOffset).r;
          finalColor.g = textureSample(inputTexture, texSampler, greenOffset).g;
          finalColor.b = textureSample(inputTexture, texSampler, blueOffset).b;
          
          // Add subtle color fringing at high contrast edges
          let edgeDetect = length(originalColor.rgb - finalColor);
          finalColor += vec3f(edgeDetect * 0.1, 0.0, edgeDetect * 0.15) * uniforms.bumpiness; // Reduced from 0.2/0.3 to 0.1/0.15
        } else {
          // Without chromatic aberration - sample all channels with the same offset
          let refractedUV = texCoord + vec2f(normal.x, normal.y) * refractStrength;
          finalColor = textureSample(inputTexture, texSampler, refractedUV).rgb;
        }
        
        // Add highlights based on the normal and bumpiness
        let specular = pow(max(0.0, normal.z), 12.0) * uniforms.bumpiness * 0.7; // Reduced intensity and increased sharpness
        finalColor += vec3f(specular);
        
        return vec4f(finalColor, originalColor.a);
      }
    `,
  },
  fragments: {
    name: "Fragments",
    description: "Breaks the image into geometric fragments with various patterns",
    params: {
      patternType: {
        name: "Pattern Type",
        type: "number",
        min: 0,
        max: 5,
        step: 1,
        default: 0,
      },
      radius: {
        name: "Radius",
        type: "number",
        min: 1,
        max: 50,
        step: 1,
        default: 2,
      },
      smoothness: {
        // Renamed from "smooth" to "smoothness"
        name: "Smoothness",
        type: "number",
        min: 0,
        max: 1,
        step: 0.01,
        default: 0.5,
        decimals: 2,
      },
      intensity: {
        name: "Intensity",
        type: "number",
        min: 0,
        max: 1,
        step: 0.01,
        default: 0.48,
        decimals: 2,
      },
      segments: {
        name: "Segments",
        type: "number",
        min: 1,
        max: 50,
        step: 1,
        default: 16,
      },
    },
    shaderCode: `
      struct Uniforms {
        textureSize: vec2f,
        patternType: f32,
        radius: f32,
        smoothness: f32, // Renamed from "smooth" to "smoothness"
        intensity: f32,
        segments: f32,
      }
      
      @group(0) @binding(0) var texSampler: sampler;
      @group(0) @binding(1) var inputTexture: texture_2d<f32>;
      @group(0) @binding(2) var<uniform> uniforms: Uniforms;
      
      // Hash function for noise
      fn hash(p: f32) -> f32 {
        return fract(sin(p * 591.32) * 43758.5453);
      }
      
      // 2D hash
      fn hash2(p: vec2f) -> f32 {
        return hash(p.x + p.y * 57.0);
      }
      
      // Noise function
      fn noise(p: vec2f) -> f32 {
        let i = floor(p);
        let f = fract(p);
        
        // Four corners
        let a = hash2(i);
        let b = hash2(i + vec2f(1.0, 0.0));
        let c = hash2(i + vec2f(0.0, 1.0));
        let d = hash2(i + vec2f(1.0, 1.0));
        
        // Smooth interpolation
        let u = f * f * (3.0 - 2.0 * f);
        
        // Mix
        return mix(
          mix(a, b, u.x),
          mix(c, d, u.x),
          u.y
        );
      }
      
      // Pattern 0: Diagonal lines
      fn diagonalPattern(uv: vec2f, segments: f32) -> f32 {
        let angle = 0.785398; // 45 degrees in radians
        let rotatedU = uv.x * cos(angle) - uv.y * sin(angle);
        return step(0.5, fract(rotatedU * segments));
      }
      
      // Pattern 1: Diagonal lines (opposite direction)
      fn diagonalPattern2(uv: vec2f, segments: f32) -> f32 {
        let angle = -0.785398; // -45 degrees in radians
        let rotatedU = uv.x * cos(angle) - uv.y * sin(angle);
        return step(0.5, fract(rotatedU * segments));
      }
      
      // Pattern 2: Vertical lines
      fn verticalPattern(uv: vec2f, segments: f32) -> f32 {
        return step(0.5, fract(uv.x * segments));
      }
      
      // Pattern 3: Horizontal segments
      fn horizontalSegments(uv: vec2f, segments: f32) -> f32 {
        let y = floor(uv.y * segments) / segments;
        let offset = hash(y) * 0.8;
        return step(0.5, fract(uv.x * segments + offset));
      }
      
      // Pattern 4: Noise texture
      fn noisePattern(uv: vec2f, segments: f32) -> f32 {
        return noise(uv * segments);
      }
      
      // Pattern 5: Static noise
      fn staticPattern(uv: vec2f, segments: f32) -> f32 {
        return hash2(uv * segments);
      }
      
      @fragment
      fn fragmentMain(@location(0) texCoord: vec2f) -> @location(0) vec4f {
        // Sample the original texture
        let originalColor = textureSample(inputTexture, texSampler, texCoord);
        
        // Normalized coordinates for patterns
        let uv = texCoord;
        
        // Calculate radius in UV space
        let radius = uniforms.radius / 100.0;
        
        // Calculate pattern value based on selected type
        var patternValue: f32;
        let segments = max(1.0, uniforms.segments);
        
        if (uniforms.patternType < 0.5) {
          patternValue = diagonalPattern(uv, segments);
        } else if (uniforms.patternType < 1.5) {
          patternValue = diagonalPattern2(uv, segments);
        } else if (uniforms.patternType < 2.5) {
          patternValue = verticalPattern(uv, segments);
        } else if (uniforms.patternType < 3.5) {
          patternValue = horizontalSegments(uv, segments);
        } else if (uniforms.patternType < 4.5) {
          patternValue = noisePattern(uv, segments);
        } else {
          patternValue = staticPattern(uv, segments);
        }
        
        // Apply smoothing if needed
        if (uniforms.smoothness > 0.0) { // Renamed from "smooth" to "smoothness"
          patternValue = mix(step(0.5, patternValue), patternValue, uniforms.smoothness); // Renamed from "smooth" to "smoothness"
        }
        
        // Calculate displacement based on pattern
        let displacement = (patternValue - 0.5) * 2.0 * radius * uniforms.intensity;
        
        // Apply displacement to texture coordinates
        let displacedUV = texCoord + vec2f(displacement);
        
        // Sample with displaced coordinates
        let displacedColor = textureSample(inputTexture, texSampler, displacedUV);
        
        // Mix original and displaced based on intensity
        return mix(originalColor, displacedColor, uniforms.intensity);
      }
    `,
  },
  mirror: {
    name: "Mirror Distort",
    description: "Applies mirror-like distortion patterns to the image",
    params: {
      patternType: {
        name: "Pattern Type",
        type: "number",
        min: 0,
        max: 5,
        step: 1,
        default: 0,
      },
      radius: {
        name: "Radius",
        type: "number",
        min: 1,
        max: 100,
        step: 1,
        default: 100,
      },
      amplitude: {
        name: "Amplitude",
        type: "number",
        min: 0,
        max: 1,
        step: 0.01,
        default: 0.08,
        decimals: 2,
      },
      intensity: {
        name: "Intensity",
        type: "number",
        min: 0,
        max: 1,
        step: 0.01,
        default: 0.8,
        decimals: 2,
      },
      frequency: {
        name: "Frequency",
        type: "number",
        min: 1,
        max: 50,
        step: 1,
        default: 10,
      },
    },
    shaderCode: `
      struct Uniforms {
        textureSize: vec2f,
        patternType: f32,
        radius: f32,
        amplitude: f32,
        intensity: f32,
        frequency: f32,
      }
      
      @group(0) @binding(0) var texSampler: sampler;
      @group(0) @binding(1) var inputTexture: texture_2d<f32>;
      @group(0) @binding(2) var<uniform> uniforms: Uniforms;
      
      // Constants
      const PI: f32 = 3.14159265359;
      
      // Pattern 0: Radial stripes
      fn radialStripes(uv: vec2f, frequency: f32, amplitude: f32) -> vec2f {
        // Center coordinates
        let center = vec2f(0.5, 0.5);
        let dir = uv - center;
        let dist = length(dir);
        let angle = atan2(dir.y, dir.x);
        
        // Calculate distortion based on angle
        let distortion = sin(angle * frequency) * amplitude;
        
        // Apply distortion to the distance
        let newDist = dist * (1.0 + distortion);
        
        // Convert back to UV coordinates
        let newUV = center + normalize(dir) * newDist;
        
        return newUV;
      }
      
      // Pattern 1: S-curve
      fn sCurve(uv: vec2f, frequency: f32, amplitude: f32) -> vec2f {
        // Calculate distortion based on horizontal position
        let distortion = sin(uv.x * PI * frequency) * amplitude;
        
        // Apply vertical distortion
        let newUV = vec2f(
          uv.x,
          uv.y + distortion
        );
        
        return newUV;
      }
      
      // Pattern 2: Vertical pinch/bulge
      fn verticalPinch(uv: vec2f, frequency: f32, amplitude: f32) -> vec2f {
        // Center coordinates
        let center = vec2f(0.5, 0.5);
        let xDist = abs(uv.x - center.x);
        
        // Calculate distortion based on horizontal distance from center
        let distortion = sin(xDist * PI * frequency) * amplitude;
        
        // Apply vertical distortion
        let newUV = vec2f(
          uv.x,
          uv.y + distortion
        );
        
        return newUV;
      }
      
      // Pattern 3: Horizontal pinch/bulge
      fn horizontalPinch(uv: vec2f, frequency: f32, amplitude: f32) -> vec2f {
        // Center coordinates
        let center = vec2f(0.5, 0.5);
        let yDist = abs(uv.y - center.y);
        
        // Calculate distortion based on vertical distance from center
        let distortion = sin(yDist * PI * frequency) * amplitude;
        
        // Apply horizontal distortion
        let newUV = vec2f(
          uv.x + distortion,
          uv.y
        );
        
        return newUV;
      }
      
      // Pattern 4: Zigzag
      fn zigzag(uv: vec2f, frequency: f32, amplitude: f32) -> vec2f {
        // Calculate zigzag pattern
        let zigzag = abs(fract(uv.x * frequency) * 2.0 - 1.0);
        let distortion = (zigzag - 0.5) * amplitude;
        
        // Apply vertical distortion
        let newUV = vec2f(
          uv.x,
          uv.y + distortion
        );
        
        return newUV;
      }
      
      // Pattern 5: Wavy horizontal
      fn wavyHorizontal(uv: vec2f, frequency: f32, amplitude: f32) -> vec2f {
        // Calculate wave pattern
        let wave = sin(uv.y * PI * frequency);
        let distortion = wave * amplitude;
        
        // Apply horizontal distortion
        let newUV = vec2f(
          uv.x + distortion,
          uv.y
        );
        
        return newUV;
      }
      
      @fragment
      fn fragmentMain(@location(0) texCoord: vec2f) -> @location(0) vec4f {
        // Sample the original texture
        let originalColor = textureSample(inputTexture, texSampler, texCoord);
        
        // Get parameters
        let patternType = uniforms.patternType;
        let radius = uniforms.radius / 100.0; // Convert to 0-1 range
        let amplitude = uniforms.amplitude;
        let intensity = uniforms.intensity;
        let frequency = uniforms.frequency;
        
        // Calculate distorted UV based on pattern type
        var distortedUV: vec2f;
        
        if (patternType < 0.5) {
          distortedUV = radialStripes(texCoord, frequency, amplitude);
        } else if (patternType < 1.5) {
          distortedUV = sCurve(texCoord, frequency, amplitude);
        } else if (patternType < 2.5) {
          distortedUV = verticalPinch(texCoord, frequency, amplitude);
        } else if (patternType < 3.5) {
          distortedUV = horizontalPinch(texCoord, frequency, amplitude);
        } else if (patternType < 4.5) {
          distortedUV = zigzag(texCoord, frequency, amplitude);
        } else {
          distortedUV = wavyHorizontal(texCoord, frequency, amplitude);
        }
        
        // Apply radius to limit distortion area
        let center = vec2f(0.5, 0.5);
        let dist = length(texCoord - center);
        let radiusEffect = smoothstep(radius, radius * 1.2, dist);
        let finalUV = mix(distortedUV, texCoord, radiusEffect);
        
        // Sample with distorted coordinates
        let distortedColor = textureSample(inputTexture, texSampler, finalUV);
        
        // Mix original and distorted based on intensity
        return mix(originalColor, distortedColor, intensity);
      }
    `,
  },
}

export function getShaderCode(effect: EffectType = "pixelate"): string {
  return effects[effect].shaderCode
}
