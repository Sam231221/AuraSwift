export type KeyType = {
  key: string
  display?: string
  variant?: "default" | "action" | "special" | "danger" | "success" | "wide" | "extra-wide"
  width?: number
  action?: "backspace" | "clear" | "enter" | "space" | "tab" | "shift" | "caps" | "mode"
}

export const QWERTY_LAYOUT: KeyType[][] = [
  [
    { key: "1" },
    { key: "2" },
    { key: "3" },
    { key: "4" },
    { key: "5" },
    { key: "6" },
    { key: "7" },
    { key: "8" },
    { key: "9" },
    { key: "0" },
    { key: "backspace", display: "⌫", variant: "danger", action: "backspace" },
  ],
  [
    { key: "q" },
    { key: "w" },
    { key: "e" },
    { key: "r" },
    { key: "t" },
    { key: "y" },
    { key: "u" },
    { key: "i" },
    { key: "o" },
    { key: "p" },
    { key: "tab", display: "Tab ⇥", variant: "action", action: "tab" },
  ],
  [
    { key: "a" },
    { key: "s" },
    { key: "d" },
    { key: "f" },
    { key: "g" },
    { key: "h" },
    { key: "j" },
    { key: "k" },
    { key: "l" },
    { key: "enter", display: "Enter ↵", variant: "success", action: "enter", width: 2 },
  ],
  [
    { key: "shift", display: "⇧ Shift", variant: "action", action: "shift" },
    { key: "z" },
    { key: "x" },
    { key: "c" },
    { key: "v" },
    { key: "b" },
    { key: "n" },
    { key: "m" },
    { key: "caps", display: "Caps", variant: "action", action: "caps" },
    { key: "clear", display: "Clear", variant: "danger", action: "clear" },
  ],
  [
    { key: "123", display: "123", variant: "special", action: "mode" },
    { key: "@" },
    { key: "space", display: "Space", variant: "wide", action: "space", width: 5 },
    { key: "." },
    { key: "#+=", display: "#+=", variant: "special", action: "mode" },
  ],
]

export const NUMERIC_LAYOUT: KeyType[][] = [
  [
    { key: "7" },
    { key: "8" },
    { key: "9" },
    { key: "backspace", display: "⌫", variant: "danger", action: "backspace" },
  ],
  [{ key: "4" }, { key: "5" }, { key: "6" }, { key: "clear", display: "Clear", variant: "danger", action: "clear" }],
  [{ key: "1" }, { key: "2" }, { key: "3" }, { key: "tab", display: "Tab", variant: "action", action: "tab" }],
  [{ key: "0", width: 2 }, { key: "." }, { key: "enter", display: "Enter ↵", variant: "success", action: "enter" }],
  [
    { key: "ABC", display: "ABC", variant: "special", action: "mode" },
    { key: "-" },
    { key: "+" },
    { key: "#+=", display: "#+=", variant: "special", action: "mode" },
  ],
]

export const SYMBOLS_LAYOUT: KeyType[][] = [
  [
    { key: "!" },
    { key: "@" },
    { key: "#" },
    { key: "$" },
    { key: "%" },
    { key: "^" },
    { key: "&" },
    { key: "*" },
    { key: "(" },
    { key: ")" },
    { key: "backspace", display: "⌫", variant: "danger", action: "backspace" },
  ],
  [
    { key: "-" },
    { key: "_" },
    { key: "=" },
    { key: "+" },
    { key: "[" },
    { key: "]" },
    { key: "{" },
    { key: "}" },
    { key: "|" },
    { key: "\\" },
    { key: "tab", display: "Tab", variant: "action", action: "tab" },
  ],
  [
    { key: ":" },
    { key: ";" },
    { key: "'" },
    { key: '"' },
    { key: "<" },
    { key: ">" },
    { key: "," },
    { key: "." },
    { key: "?" },
    { key: "enter", display: "Enter ↵", variant: "success", action: "enter", width: 2 },
  ],
  [
    { key: "`" },
    { key: "~" },
    { key: "/" },
    { key: "space", display: "Space", variant: "wide", action: "space", width: 4 },
    { key: "clear", display: "Clear", variant: "danger", action: "clear", width: 2 },
  ],
  [
    { key: "ABC", display: "ABC", variant: "special", action: "mode" },
    { key: "€" },
    { key: "£" },
    { key: "¥" },
    { key: "123", display: "123", variant: "special", action: "mode" },
  ],
]

export type KeyboardMode = "qwerty" | "numeric" | "symbols"

export const LAYOUTS: Record<KeyboardMode, KeyType[][]> = {
  qwerty: QWERTY_LAYOUT,
  numeric: NUMERIC_LAYOUT,
  symbols: SYMBOLS_LAYOUT,
}

