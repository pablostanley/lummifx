import type React from "react"
import { create } from "zustand"
import { persist } from "zustand/middleware"
import { effects, type EffectType } from "./effects"

interface StoreState {
  // Image state
  imageUrl: string | null
  setImageUrl: (url: string) => void

  // Canvas reference for download
  canvasRef: React.RefObject<HTMLCanvasElement> | null
  setCanvasRef: (ref: React.RefObject<HTMLCanvasElement>) => void

  // Effect state
  currentEffect: EffectType
  setCurrentEffect: (effect: EffectType) => void

  // Effect parameters
  effectParams: Record<string, number | boolean>
  setEffectParams: (params: Record<string, number | boolean>) => void
  updateEffectParam: (key: string, value: number | boolean) => void

  // Custom shader code
  customShaderCode: string | null
  setCustomShaderCode: (code: string) => void
  resetCustomShaderCode: () => void
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => {
      // Get default effect and its parameters
      const defaultEffect: EffectType = "halftone"
      const defaultParams = Object.entries(effects[defaultEffect].params).reduce(
        (acc, [key, param]) => ({
          ...acc,
          [key]: param.default,
        }),
        {},
      )

      return {
        // Image state
        imageUrl: null,
        setImageUrl: (url) => set({ imageUrl: url }),

        // Canvas reference
        canvasRef: null,
        setCanvasRef: (ref) => set({ canvasRef: ref }),

        // Effect state
        currentEffect: defaultEffect,
        setCurrentEffect: (effect) =>
          set((state) => {
            // Get parameters for the new effect
            const newParams = Object.entries(effects[effect].params).reduce(
              (acc, [key, param]) => ({
                ...acc,
                [key]: param.default,
              }),
              {},
            )

            return {
              currentEffect: effect,
              effectParams: newParams,
            }
          }),

        // Effect parameters
        effectParams: defaultParams,
        setEffectParams: (params) => set({ effectParams: params }),
        updateEffectParam: (key, value) =>
          set((state) => ({
            effectParams: {
              ...state.effectParams,
              [key]: value,
            },
          })),

        // Custom shader code
        customShaderCode: null,
        setCustomShaderCode: (code) => set({ customShaderCode: code }),
        resetCustomShaderCode: () => set({ customShaderCode: null }),
      }
    },
    {
      name: "lummi-fx-storage",
      partialize: (state) => ({
        currentEffect: state.currentEffect,
        // Don't persist image URL or canvas ref
      }),
    },
  ),
)
