"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"

interface ShaderEditorProps {
  value: string
  onChange: (value: string) => void
}

export function ShaderEditor({ value, onChange }: ShaderEditorProps) {
  const [isEditorReady, setIsEditorReady] = useState(false)
  const [isMonacoLoaded, setIsMonacoLoaded] = useState(false)
  const editorRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const monacoRef = useRef<any>(null)

  // Dynamically load Monaco Editor
  useEffect(() => {
    if (typeof window === "undefined") return

    let isMounted = true

    async function loadMonaco() {
      try {
        if (!isMounted) return

        // Dynamic import of Monaco editor
        const monaco = await import("monaco-editor")
        monacoRef.current = monaco

        // Register WGSL language
        monaco.languages.register({ id: "wgsl" })

        // Define WGSL syntax highlighting
        monaco.languages.setMonarchTokensProvider("wgsl", {
          tokenizer: {
            root: [
              // Keywords
              [
                /\b(fn|var|let|const|return|if|else|for|while|struct|switch|case|default|break|continue|discard|loop|switch|case|fallthrough|return|break|continue|nextIteration|default|fn|const|var|let|override|static|private|workgroup|uniform|storage|read|write|read_write|type|struct|binding|group|vertex|fragment|compute|stage|workgroup_size)\b/,
                "keyword",
              ],

              // Types
              [
                /\b(void|bool|i32|u32|f32|f16|vec2|vec3|vec4|mat2x2|mat3x3|mat4x4|array|texture|sampler|atomic)\b/,
                "type",
              ],

              // Built-in functions
              [
                /\b(abs|acos|acosh|all|any|asin|asinh|atan|atanh|ceil|clamp|cos|cosh|cross|degrees|determinant|distance|dot|exp|exp2|floor|fract|inverse|length|log|log2|max|min|mix|normalize|pow|radians|reflect|refract|round|saturate|sign|sin|sinh|smoothstep|sqrt|step|tan|tanh|transpose|trunc)\b/,
                "function",
              ],

              // Numbers
              [/\b\d+\.\d+\b/, "number.float"],
              [/\b\d+\b/, "number"],

              // Comments
              [/\/\/.*$/, "comment"],
              [/\/\*/, { token: "comment.block", next: "@comment" }],

              // Strings
              [/"/, { token: "string.quote", bracket: "@open", next: "@string" }],

              // Operators
              [/[+\-*/%&|^~!<>=]+/, "operator"],

              // Punctuation
              [/[{}()[\];,.]/, "delimiter"],
            ],

            comment: [
              [/[^/*]+/, "comment.block"],
              [/\/\*/, "comment.block", "@push"],
              [/\*\//, "comment.block", "@pop"],
              [/[/*]/, "comment.block"],
            ],

            string: [
              [/[^\\"]+/, "string"],
              [/\\./, "string.escape"],
              [/"/, { token: "string.quote", bracket: "@close", next: "@pop" }],
            ],
          },
        })

        if (isMounted) {
          setIsMonacoLoaded(true)
        }
      } catch (error) {
        console.error("Failed to load Monaco editor:", error)
      }
    }

    loadMonaco()

    return () => {
      isMounted = false
    }
  }, [])

  // Initialize editor once Monaco is loaded
  useEffect(() => {
    if (!isMonacoLoaded || !containerRef.current || !monacoRef.current) return

    // Create editor
    try {
      editorRef.current = monacoRef.current.editor.create(containerRef.current, {
        value,
        language: "wgsl",
        theme: "vs-dark",
        automaticLayout: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        fontSize: 14,
        tabSize: 2,
        wordWrap: "on",
        lineNumbers: "on",
        glyphMargin: false,
        folding: true,
        lineDecorationsWidth: 10,
        lineNumbersMinChars: 3,
      })

      // Set up change event handler
      if (editorRef.current) {
        editorRef.current.onDidChangeModelContent(() => {
          if (editorRef.current) {
            onChange(editorRef.current.getValue())
          }
        })
      }

      setIsEditorReady(true)
    } catch (error) {
      console.error("Failed to initialize Monaco editor:", error)
    }

    return () => {
      if (editorRef.current) {
        editorRef.current.dispose()
        editorRef.current = null
      }
    }
  }, [isMonacoLoaded, onChange, value])

  // Update editor value when prop changes
  useEffect(() => {
    if (isEditorReady && editorRef.current) {
      const currentValue = editorRef.current.getValue()
      if (value !== currentValue) {
        editorRef.current.setValue(value)
      }
    }
  }, [value, isEditorReady])

  return (
    <div className="w-full h-full flex flex-col">
      {!isEditorReady && (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}
      <div ref={containerRef} className="w-full flex-1" style={{ visibility: isEditorReady ? "visible" : "hidden" }} />
    </div>
  )
}
