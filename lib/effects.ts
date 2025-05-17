export type EffectType = "pixelate" | "dither" | "halftone" | "glass" | "fragments" | "mirror" | "noise" | "water"

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
  water: {
    name: "Water Waves",
    description: "Simulates water ripples with reflections, refractions and caustics",
    params: {
      patternType: {
        name: "Wave Pattern",
        type: "number",
        min: 0,
        max: 3,
        step: 1,
        default: 0,
      },
      waveHeight: {
        name: "Wave Height",
        type: "number",
        min: 0,
        max: 1,
        step: 0.01,
        default: 0.3,
        decimals: 2,
      },
      waveFrequency: {
        name: "Wave Frequency",
        type: "number",
        min: 1,
        max: 50,
        step: 1,
        default: 10,
      },
      waveSpeed: {
        name: "Wave Speed",
        type: "number",
        min: 0,
        max: 5,
        step: 0.1,
        default: 1.0,
        decimals: 1,
      },
      refraction: {
        name: "Refraction",
        type: "number",
        min: 0,
        max: 1,
        step: 0.01,
        default: 0.5,
        decimals: 2,
      },
      reflection: {
        name: "Reflection",
        type: "number",
        min: 0,
        max: 1,
        step: 0.01,
        default: 0.3,
        decimals: 2,
      },
      caustics: {
        name: "Caustics",
        type: "number",
        min: 0,
        max: 1,
        step: 0.01,
        default: 0.5,
        decimals: 2,
      },
      lightDirection: {
        name: "Light Direction",
        type: "number",
        min: 0,
        max: 360,
        step: 1,
        default: 45,
      },
      depth: {
        name: "Water Depth",
        type: "number",
        min: 0.1,
        max: 5,
        step: 0.1,
        default: 1.0,
        decimals: 1,
      },
    },
    shaderCode: `
      struct Uniforms {
        textureSize: vec2f,
        patternType: f32,
        waveHeight: f32,
        waveFrequency: f32,
        waveSpeed: f32,
        refraction: f32,
        reflection: f32,
        caustics: f32,
        lightDirection: f32,
        depth: f32,
        time: f32, // Automatically added for animation
      }
      
      @group(0) @binding(0) var texSampler: sampler;
      @group(0) @binding(1) var inputTexture: texture_2d<f32>;
      @group(0) @binding(2) var<uniform> uniforms: Uniforms;
      
      // Constants
      const PI = 3.14159265359;
      
      // Hash function for noise
      fn hash(p: f32) -> f32 {
        return fract(sin(p * 591.32) * 43758.5453);
      }
      
      // 2D hash
      fn hash2(p: vec2f) -> f32 {
        return fract(sin(dot(p, vec2f(127.1, 311.7))) * 43758.5453);
      }
      
      // Noise function
      fn noise(p: vec2f) -> f32 {
        let i = floor(p);
        let f = fract(p);
        
        // Cubic interpolation
        let u = f * f * (3.0 - 2.0 * f);
        
        // Four corners
        let a = hash2(i);
        let b = hash2(i + vec2f(1.0, 0.0));
        let c = hash2(i + vec2f(0.0, 1.0));
        let d = hash2(i + vec2f(1.0, 1.0));
        
        // Mix
        return mix(
          mix(a, b, u.x),
          mix(c, d, u.x),
          u.y
        );
      }
      
      // FBM (Fractal Brownian Motion) for more natural looking waves
      fn fbm(p: vec2f, octaves: i32) -> f32 {
        var value = 0.0;
        var amplitude = 0.5;
        var frequency = 1.0;
        var total_amplitude = 0.0;
        
        for (var i = 0; i < octaves; i++) {
          value += amplitude * noise(p * frequency);
          total_amplitude += amplitude;
          amplitude *= 0.5;
          frequency *= 2.0;
        }
        
        return value / total_amplitude;
      }
      
      // Pattern 0: Ripples - concentric circular waves
      fn ripplePattern(uv: vec2f, time: f32, frequency: f32, speed: f32) -> f32 {
        // Center coordinates
        let center = vec2f(0.5, 0.5);
        let dist = length(uv - center) * frequency;
        
        // Animate ripples moving outward
        return sin(dist - time * speed) * 0.5 + 0.5;
      }
      
      // Pattern 1: Ocean waves - directional waves with some randomness
      fn oceanPattern(uv: vec2f, time: f32, frequency: f32, speed: f32) -> f32 {
        // Base wave pattern
        var height = sin(uv.x * frequency + time * speed) * 0.3;
        height += sin(uv.x * frequency * 0.5 + uv.y * frequency * 0.7 + time * speed * 0.8) * 0.2;
        
        // Add some noise for realism
        height += fbm(uv * vec2f(1.0, 2.0) + vec2f(time * 0.1, 0.0), 2) * 0.1;
        
        return height * 0.5 + 0.5;
      }
      
      // Pattern 2: Choppy water - more complex wave interaction
      fn choppyPattern(uv: vec2f, time: f32, frequency: f32, speed: f32) -> f32 {
        // Multiple wave directions
        var height = 0.0;
        
        // Wave 1
        height += sin(uv.x * frequency * 1.1 + uv.y * frequency * 0.5 + time * speed) * 0.25;
        
        // Wave 2 (perpendicular direction)
        height += sin(uv.y * frequency * 1.3 + uv.x * frequency * 0.7 + time * speed * 1.1) * 0.25;
        
        // Wave 3 (diagonal)
        height += sin((uv.x + uv.y) * frequency * 0.9 + time * speed * 0.8) * 0.15;
        
        // Add noise for choppiness
        height += (fbm(uv * 2.5 + vec2f(time * 0.2, time * 0.1), 3) - 0.5) * 0.2;
        
        return height * 0.5 + 0.5;
      }
      
      // Pattern 3: Calm pool - subtle ripples with reflection
      fn calmPoolPattern(uv: vec2f, time: f32, frequency: f32, speed: f32) -> f32 {
        // Very subtle ripples
        var height = 0.0;
        
        // Multiple small ripple sources
        for (var i = 0; i < 5; i++) {
          let rippleCenter = vec2f(
            hash(f32(i) * 42.1) * 0.8 + 0.1,
            hash(f32(i) * 17.9) * 0.8 + 0.1
          );
          
          let dist = length(uv - rippleCenter) * frequency * 0.5;
          let ripplePhase = time * speed * (0.5 + hash(f32(i)) * 0.5);
          let rippleStrength = 0.02 + hash(f32(i) * 13.7) * 0.03;
          
          height += sin(dist * 10.0 - ripplePhase) * rippleStrength * smoothstep(1.0, 0.0, dist);
        }
        
        // Add very subtle noise
        height += (fbm(uv * 3.0 + vec2f(time * 0.05, 0.0), 2) - 0.5) * 0.02;
        
        return height * 0.5 + 0.5;
      }
      
      // Calculate water height based on selected pattern
      fn getWaterHeight(uv: vec2f, patternType: f32, time: f32, frequency: f32, speed: f32) -> f32 {
        if (patternType < 0.5) {
          return ripplePattern(uv, time, frequency, speed);
        } else if (patternType < 1.5) {
          return oceanPattern(uv, time, frequency, speed);
        } else if (patternType < 2.5) {
          return choppyPattern(uv, time, frequency, speed);
        } else {
          return calmPoolPattern(uv, time, frequency, speed);
        }
      }
      
      // Calculate water normal from height field
      fn calculateWaterNormal(uv: vec2f, patternType: f32, time: f32, frequency: f32, speed: f32, height: f32) -> vec3f {
        let eps = 0.01;
        
        // Sample height at neighboring points
        let hL = getWaterHeight(uv + vec2f(-eps, 0.0), patternType, time, frequency, speed);
        let hR = getWaterHeight(uv + vec2f(eps, 0.0), patternType, time, frequency, speed);
        let hD = getWaterHeight(uv + vec2f(0.0, -eps), patternType, time, frequency, speed);
        let hU = getWaterHeight(uv + vec2f(0.0, eps), patternType, time, frequency, speed);
        
        // Calculate normal using central differences
        let normal = normalize(vec3f(
          (hL - hR) * 2.0,
          (hD - hU) * 2.0,
          0.15 // Controls the "flatness" of the water
        ));
        
        return normal;
      }
      
      // Calculate caustics pattern
      fn caustics(uv: vec2f, time: f32, waterHeight: f32) -> f32 {
        // Caustics are focused light patterns created by water lensing
        // We'll simulate this with a combination of noise and the water height
        
        let causticScale = 5.0;
        let causticSpeed = 0.2;
        
        // Distort the UV based on water height
        let distortedUV = uv + waterHeight * 0.1;
        
        // Create caustic pattern with multiple layers of noise
        var causticPattern = 0.0;
        
        // Layer 1
        causticPattern += fbm(distortedUV * causticScale + vec2f(time * causticSpeed, 0.0), 2);
        
        // Layer 2 (different scale and direction)
        causticPattern += fbm(distortedUV * causticScale * 1.5 + vec2f(0.0, time * causticSpeed * 0.7), 2) * 0.5;
        
        // Create bright spots where caustic patterns converge
        causticPattern = pow(causticPattern, 2.0);
        
        return causticPattern;
      }
      
      // Rotate a 2D point around the origin
      fn rotate2D(p: vec2f, angle: f32) -> vec2f {
        let s = sin(angle);
        let c = cos(angle);
        return vec2f(
          p.x * c - p.y * s,
          p.x * s + p.y * c
        );
      }
      
      @fragment
      fn fragmentMain(@location(0) texCoord: vec2f) -> @location(0) vec4f {
        // Sample the original texture
        let originalColor = textureSample(inputTexture, texSampler, texCoord);
        
        // Get parameters
        let patternType = uniforms.patternType;
        let waveHeight = uniforms.waveHeight;
        let waveFrequency = uniforms.waveFrequency;
        let waveSpeed = uniforms.waveSpeed;
        let refraction = uniforms.refraction;
        let reflection = uniforms.reflection;
        let causticsIntensity = uniforms.caustics;
        let lightAngle = uniforms.lightDirection * PI / 180.0;
        let depth = uniforms.depth;
        let time = uniforms.time;
        
        // Calculate water height at this point
        let waterHeight = getWaterHeight(texCoord, patternType, time, waveFrequency, waveSpeed);
        
        // Scale the height by the wave height parameter
        let scaledHeight = (waterHeight - 0.5) * waveHeight;
        
        // Calculate water surface normal
        let waterNormal = calculateWaterNormal(texCoord, patternType, time, waveFrequency, waveSpeed, waterHeight);
        
        // Calculate light direction
        let lightDir = normalize(vec3f(
          cos(lightAngle),
          sin(lightAngle),
          1.0 // Light coming from above
        ));
        
        // Calculate refraction (distortion of the image below water)
        let refractionStrength = refraction * 0.1 * waveHeight;
        let refractionOffset = waterNormal.xy * refractionStrength * depth;
        let refractedUV = texCoord + refractionOffset;
        
        // Sample the refracted image
        let refractedColor = textureSample(inputTexture, texSampler, refractedUV);
        
        // Calculate reflection (mirror-like reflection of the image)
        let reflectionStrength = reflection * smoothstep(0.0, 0.5, 1.0 - abs(dot(vec3f(0.0, 0.0, 1.0), waterNormal)));
        
        // For reflection, we'll flip the image vertically and distort it
        let reflectionUV = vec2f(texCoord.x, 1.0 - texCoord.y) + waterNormal.xy * 0.05;
        let reflectedColor = textureSample(inputTexture, texSampler, reflectionUV);
        
        // Calculate caustics (light patterns created by water lensing)
        let causticPattern = caustics(texCoord, time, waterHeight);
        let causticColor = vec3f(1.0, 1.0, 0.9) * causticPattern * causticsIntensity;
        
        // Calculate Fresnel effect (more reflection at glancing angles)
        let viewDir = vec3f(0.0, 0.0, 1.0); // Looking straight down at the water
        let fresnel = pow(1.0 - abs(dot(viewDir, waterNormal)), 3.0);
        
        // Calculate specular highlight
        let halfDir = normalize(lightDir + viewDir);
        let specular = pow(max(0.0, dot(waterNormal, halfDir)), 64.0) * 0.5;
        
        // Combine everything
        // Start with the refracted color (what's below the water)
        var finalColor = refractedColor.rgb;
        
        // Add caustics
        finalColor += causticColor * depth;
        
        // Add reflection based on Fresnel effect
        finalColor = mix(finalColor, reflectedColor.rgb, reflectionStrength * fresnel);
        
        // Add specular highlight
        finalColor += vec3f(specular);
        
        // Apply a slight blue tint to simulate water color absorption
        // Deeper water absorbs more red light
        let waterColor = vec3f(0.2, 0.5, 0.7);
        finalColor = mix(finalColor, waterColor, depth * 0.2);
        
        return vec4f(finalColor, originalColor.a);
      }
    `,
  },
  noise: {
    name: "Noise",
    description: "Apply various noise patterns with creative post-processing",
    params: {
      noiseType: {
        name: "Noise Type",
        type: "number",
        min: 0,
        max: 5,
        step: 1,
        default: 0,
      },
      scale: {
        name: "Scale",
        type: "number",
        min: 1,
        max: 100,
        step: 1,
        default: 20,
      },
      amount: {
        name: "Amount",
        type: "number",
        min: 0,
        max: 1,
        step: 0.01,
        default: 0.5,
        decimals: 2,
      },
      rotation: {
        name: "Rotation",
        type: "number",
        min: 0,
        max: 360,
        step: 1,
        default: 0,
      },
      octaves: {
        name: "Octaves",
        type: "number",
        min: 1,
        max: 8,
        step: 1,
        default: 3,
      },
      colorMode: {
        name: "Color Mode",
        type: "number",
        min: 0,
        max: 5,
        step: 1,
        default: 0,
      },
      contrast: {
        name: "Contrast",
        type: "number",
        min: 0,
        max: 2,
        step: 0.01,
        default: 1.0,
        decimals: 2,
      },
      blendMode: {
        name: "Blend Mode",
        type: "number",
        min: 0,
        max: 4,
        step: 1,
        default: 0,
      },
      invert: {
        name: "Invert",
        type: "boolean",
        default: false,
      },
    },
    shaderCode: `
      struct Uniforms {
        textureSize: vec2f,
        noiseType: f32,
        scale: f32,
        amount: f32,
        rotation: f32,
        octaves: f32,
        colorMode: f32,
        contrast: f32,
        blendMode: f32,
        invert: f32,
      }
      
      @group(0) @binding(0) var texSampler: sampler;
      @group(0) @binding(1) var inputTexture: texture_2d<f32>;
      @group(0) @binding(2) var<uniform> uniforms: Uniforms;
      
      // Constants
      const PI = 3.14159265359;
      
      // Hash function for noise
      fn hash(p: f32) -> f32 {
        return fract(sin(p * 591.32) * 43758.5453);
      }
      
      // 2D hash
      fn hash2(p: vec2f) -> f32 {
        return fract(sin(dot(p, vec2f(127.1, 311.7))) * 43758.5453);
      }
      
      // Random noise (white noise)
      fn randomNoise(p: vec2f) -> f32 {
        return hash2(p);
      }
      
      // Perlin noise
      fn perlinNoise(p: vec2f) -> f32 {
        let i = floor(p);
        let f = fract(p);
        
        // Cubic interpolation
        let u = f * f * (3.0 - 2.0 * f);
        
        // Four corners
        let a = hash2(i);
        let b = hash2(i + vec2f(1.0, 0.0));
        let c = hash2(i + vec2f(0.0, 1.0));
        let d = hash2(i + vec2f(1.0, 1.0));
        
        // Mix
        return mix(
          mix(a, b, u.x),
          mix(c, d, u.x),
          u.y
        );
      }
      
      // Warped noise using domain distortion
      fn warpNoise(p: vec2f) -> f32 {
        // Use perlin noise to distort the domain
        let distortion = vec2f(
          perlinNoise(p * 1.7),
          perlinNoise(p * 1.7 + vec2f(43.13, 17.21))
        );
        
        // Apply the distortion to the coordinates
        let warpedCoords = p + distortion * 0.2;
        
        // Sample perlin noise with the warped coordinates
        return perlinNoise(warpedCoords);
      }
      
      // Voronoi (cellular) noise
      fn voronoiNoise(p: vec2f) -> f32 {
        let n = floor(p);
        let f = fract(p);
        
        var minDist = 1.0;
        
        // Check 3x3 neighborhood
        for (var j = -1; j <= 1; j++) {
          for (var i = -1; i <= 1; i++) {
            let neighbor = vec2f(f32(i), f32(j));
            let point = neighbor + vec2f(hash2(n + neighbor), hash2(n + neighbor + vec2f(31.17, 57.3)));
            let dist = length(point - f);
            
            minDist = min(minDist, dist);
          }
        }
        
        return minDist;
      }
      
      // Cellular noise - different from Voronoi
      fn cellularNoise(p: vec2f) -> f32 {
        let n = floor(p);
        let f = fract(p);
        
        var minDist = 1.0;
        var secondMinDist = 1.0;
        
        // Check 3x3 neighborhood
        for (var j = -1; j <= 1; j++) {
          for (var i = -1; i <= 1; i++) {
            let neighbor = vec2f(f32(i), f32(j));
            let point = neighbor + vec2f(hash2(n + neighbor), hash2(n + neighbor + vec2f(31.17, 57.3)));
            let dist = length(point - f);
            
            if (dist < minDist) {
              secondMinDist = minDist;
              minDist = dist;
            } else if (dist < secondMinDist) {
              secondMinDist = dist;
            }
          }
        }
        
        // Return the difference between the two closest distances
        // This creates cell borders
        return secondMinDist - minDist;
      }

      // Simplex-like noise (improved Perlin)
      fn simplexNoise(p: vec2f) -> f32 {
        // Skew the input space to determine which simplex cell we're in
        let F2 = 0.366025404; // 0.5*(sqrt(3.0)-1.0)
        let G2 = 0.211324865; // (3.0-sqrt(3.0))/6.0
        
        // Skew
        let s = (p.x + p.y) * F2;
        let i = floor(p.x + s);
        let j = floor(p.y + s);
        
        // Unskew
        let t = (i + j) * G2;
        let X0 = i - t;
        let Y0 = j - t;
        let x0 = p.x - X0;
        let y0 = p.y - Y0;
        
        // Determine which simplex we're in
        // Use var instead of let for variables that will be modified
        var i1 = 0.0;  // Changed to f32
        var j1 = 0.0;  // Changed to f32
        
        if (x0 > y0) {
          i1 = 1.0;  // Changed to f32
          j1 = 0.0;  // Changed to f32
        } else {
          i1 = 0.0;  // Changed to f32
          j1 = 1.0;  // Changed to f32
        }
        
        // Offsets for corners
        let x1 = x0 - i1 + G2;
        let y1 = y0 - j1 + G2;
        let x2 = x0 - 1.0 + 2.0 * G2;
        let y2 = y0 - 1.0 + 2.0 * G2;
        
        // Calculate contribution from the three corners
        let t0 = 0.5 - x0*x0 - y0*y0;
        var n0 = 0.0;
        if (t0 > 0.0) {
          let g0 = vec2f(
            hash2(vec2f(i, j)) * 2.0 - 1.0,
            hash2(vec2f(i, j) + vec2f(31.17, 57.3)) * 2.0 - 1.0
          );
          n0 = t0 * t0 * t0 * t0 * dot(g0, vec2f(x0, y0));
        }
        
        let t1 = 0.5 - x1*x1 - y1*y1;
        var n1 = 0.0;
        if (t1 > 0.0) {
          let g1 = vec2f(
            hash2(vec2f(i + i1, j + j1)) * 2.0 - 1.0,
            hash2(vec2f(i + i1, j + j1) + vec2f(31.17, 57.3)) * 2.0 - 1.0
          );
          n1 = t1 * t1 * t1 * t1 * dot(g1, vec2f(x1, y1));
        }
        
        let t2 = 0.5 - x2*x2 - y2*y2;
        var n2 = 0.0;
        if (t2 > 0.0) {
          let g2 = vec2f(
            hash2(vec2f(i + 1.0, j + 1.0)) * 2.0 - 1.0,
            hash2(vec2f(i + 1.0, j + 1.0) + vec2f(31.17, 57.3)) * 2.0 - 1.0
          );
          n2 = t2 * t2 * t2 * t2 * dot(g2, vec2f(x2, y2));
        }
        
        // Scale to [0,1]
        return 0.5 + 35.0 * (n0 + n1 + n2);
      }
      
      // Fractal Brownian Motion (FBM)
      fn fbm(p: vec2f, octaves: i32, noiseType: f32) -> f32 {
        var value = 0.0;
        var amplitude = 0.5;
        var frequency = 1.0;
        var total_amplitude = 0.0;
        
        for (var i = 0; i < 8; i++) {
          if (i >= octaves) {
            break;
          }
          
          var noiseValue = 0.0;
          
          // Select noise type
          if (noiseType < 0.5) {
            // Random noise
            noiseValue = randomNoise(p * frequency);
          } else if (noiseType < 1.5) {
            // Perlin noise
            noiseValue = perlinNoise(p * frequency);
          } else if (noiseType < 2.5) {
            // Warp noise
            noiseValue = warpNoise(p * frequency);
          } else if (noiseType < 3.5) {
            // Voronoi noise
            noiseValue = voronoiNoise(p * frequency);
          } else if (noiseType < 4.5) {
            // Cellular noise
            noiseValue = cellularNoise(p * frequency);
          } else {
            // Simplex noise
            noiseValue = simplexNoise(p * frequency);
          }
          
          value += amplitude * noiseValue;
          total_amplitude += amplitude;
          amplitude *= 0.5;
          frequency *= 2.0;
        }
        
        return value / total_amplitude;
      }
      
      // Rotate a 2D point around the origin
      fn rotate2D(p: vec2f, angle: f32) -> vec2f {
        let s = sin(angle);
        let c = cos(angle);
        return vec2f(
          p.x * c - p.y * s,
          p.x * s + p.y * c
        );
      }
      
      // Apply color mapping to noise value
      fn applyColorMapping(noiseValue: f32, colorMode: f32) -> vec3f {
        if (colorMode < 0.5) {
          // Grayscale
          return vec3f(noiseValue);
        } else if (colorMode < 1.5) {
          // Heat map (black -> red -> yellow -> white)
          return vec3f(
            smoothstep(0.0, 0.7, noiseValue),
            smoothstep(0.2, 0.8, noiseValue),
            smoothstep(0.7, 1.0, noiseValue)
          );
        } else if (colorMode < 2.5) {
          // Rainbow
          return vec3f(
            0.5 + 0.5 * sin(noiseValue * 6.28318 + 0.0),
            0.5 + 0.5 * sin(noiseValue * 6.28318 + 2.0944),
            0.5 + 0.5 * sin(noiseValue * 6.28318 + 4.18879)
          );
        } else if (colorMode < 3.5) {
          // Cyberpunk (purple to cyan)
          return mix(
            vec3f(0.8, 0.1, 0.8),  // Purple
            vec3f(0.0, 0.8, 0.8),  // Cyan
            noiseValue
          );
        } else if (colorMode < 4.5) {
          // Neon (vibrant blues and pinks)
          return mix(
            vec3f(0.0, 0.8, 1.0),  // Bright blue
            vec3f(1.0, 0.2, 0.8),  // Hot pink
            sin(noiseValue * 3.14159) * 0.5 + 0.5
          );
        } else {
          // Earth tones (browns, greens, blues)
          // Changed from 'let' to 'var' to make it mutable
          var earth = mix(
            vec3f(0.6, 0.4, 0.2),  // Brown
            vec3f(0.2, 0.5, 0.2),  // Green
            noiseValue
          );
          
          // Add blue for water in low areas
          if (noiseValue < 0.3) {
            earth = mix(
              vec3f(0.1, 0.3, 0.6),  // Deep blue
              earth,
              noiseValue / 0.3
            );
          }
          
          return earth;
        }
      }
      
      // Apply blend mode between original and noise
      fn applyBlendMode(original: vec3f, noise: vec3f, blendMode: f32) -> vec3f {
        if (blendMode < 0.5) {
          // Normal blend
          return noise;
        } else if (blendMode < 1.5) {
          // Multiply
          return original * noise;
        } else if (blendMode < 2.5) {
          // Screen
          return 1.0 - (1.0 - original) * (1.0 - noise);
        } else if (blendMode < 3.5) {
          // Overlay - implemented without ternary operators
          var result: vec3f;
          
          // Red channel
          if (original.r < 0.5) {
            result.r = 2.0 * original.r * noise.r;
          } else {
            result.r = 1.0 - 2.0 * (1.0 - original.r) * (1.0 - noise.r);
          }
          
          // Green channel
          if (original.g < 0.5) {
            result.g = 2.0 * original.g * noise.g;
          } else {
            result.g = 1.0 - 2.0 * (1.0 - original.g) * (1.0 - noise.g);
          }
          
          // Blue channel
          if (original.b < 0.5) {
            result.b = 2.0 * original.b * noise.b;
          } else {
            result.b = 1.0 - 2.0 * (1.0 - original.b) * (1.0 - noise.b);
          }
          
          return result;
        } else {
          // Add
          return min(original + noise, vec3f(1.0));
        }
      }
      
      // Apply contrast adjustment
      fn applyContrast(color: vec3f, contrast: f32) -> vec3f {
        return 0.5 + (color - 0.5) * contrast;
      }
      
      @fragment
      fn fragmentMain(@location(0) texCoord: vec2f) -> @location(0) vec4f {
        // Sample the original texture
        let originalColor = textureSample(inputTexture, texSampler, texCoord);
        
        // Get parameters
        let noiseType = uniforms.noiseType;
        let scale = uniforms.scale / 100.0; // Convert to 0-1 range
        let amount = uniforms.amount;
        let rotationAngle = uniforms.rotation * PI / 180.0; // Convert to radians
        let octaves = i32(uniforms.octaves);
        let colorMode = uniforms.colorMode;
        let contrast = uniforms.contrast;
        let blendMode = uniforms.blendMode;
        let invert = uniforms.invert > 0.5;
        
        // Center and normalize coordinates
        let center = vec2f(0.5, 0.5);
        let normalizedCoord = (texCoord - center) * 2.0;
        
        // Apply rotation
        let rotatedCoord = rotate2D(normalizedCoord, rotationAngle);
        
        // Scale back to UV space
        let scaledCoord = (rotatedCoord / 2.0 + center) * uniforms.textureSize * scale;
        
        // Generate noise
        var noiseValue = fbm(scaledCoord, octaves, noiseType);
        
        // Apply inversion if needed
        if (invert) {
          noiseValue = 1.0 - noiseValue;
        }
        
        // Apply color mapping
        let noiseColor = applyColorMapping(noiseValue, colorMode);
        
        // Apply contrast
        let contrastedNoise = applyContrast(noiseColor, contrast);
        
        // Apply blend mode
        let blendedColor = applyBlendMode(originalColor.rgb, contrastedNoise, blendMode);
        
        // Mix with original based on amount
        let finalColor = mix(originalColor.rgb, blendedColor, amount);
        
        return vec4f(finalColor, originalColor.a);
      }
    `,
  },
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
      const PI = 3.14159265359;
      
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
