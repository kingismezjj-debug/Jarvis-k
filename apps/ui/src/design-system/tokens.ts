export type JarvisTokenLeaf = string | number;
export type JarvisTokenTree = {
  readonly [key: string]: JarvisTokenLeaf | JarvisTokenTree;
};

export const jarvisDesignTokens = {
  color: {
    background: {
      canvas: "#081018",
      surface: "#0f1b26",
      elevated: "#142434",
      subtle: "#10202d",
    },
    text: {
      primary: "#edf7ff",
      secondary: "#b7c8d8",
      muted: "#7f92a5",
      inverse: "#061016",
    },
    border: {
      default: "#26394a",
      subtle: "#1b2a38",
      strong: "#3d5568",
    },
    accent: {
      default: "#21d8ef",
      hover: "#6eeaff",
      pressed: "#0eb7cd",
      subtle: "#0b3440",
    },
    focus: {
      ring: "#8ff4ff",
    },
    status: {
      success: "#53d88f",
      warning: "#f2b84b",
      danger: "#ff6b7a",
      info: "#6da7ff",
    },
    overlay: {
      scrim: "rgba(3, 10, 16, 0.72)",
    },
  },
  typography: {
    font: {
      family: {
        ui: '"Segoe UI Variable", "Segoe UI", "Microsoft YaHei UI", "Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", system-ui, sans-serif',
        mono: '"Cascadia Mono", "SFMono-Regular", Consolas, "Liberation Mono", monospace',
      },
      size: {
        xs: "0.75rem",
        sm: "0.8125rem",
        md: "0.875rem",
        lg: "1rem",
        xl: "1.125rem",
        "2xl": "1.375rem",
      },
      weight: {
        regular: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
      },
    },
    lineHeight: {
      compact: 1.25,
      normal: 1.45,
      relaxed: 1.65,
    },
    letterSpacing: "0",
  },
  spacing: {
    0: "0",
    1: "0.25rem",
    2: "0.5rem",
    3: "0.75rem",
    4: "1rem",
    6: "1.5rem",
    8: "2rem",
    10: "2.5rem",
    12: "3rem",
    16: "4rem",
  },
  radius: {
    none: "0",
    sm: "0.25rem",
    md: "0.375rem",
    lg: "0.5rem",
    full: "999px",
  },
  shadow: {
    none: "none",
    surface: "0 1px 0 rgba(255, 255, 255, 0.04)",
    elevated: "0 14px 34px rgba(0, 0, 0, 0.24)",
    dialog: "0 22px 70px rgba(0, 0, 0, 0.36)",
  },
  motion: {
    duration: {
      fast: "120ms",
      normal: "180ms",
      slow: "260ms",
    },
    easing: {
      standard: "cubic-bezier(0.2, 0, 0, 1)",
      enter: "cubic-bezier(0, 0, 0.2, 1)",
      exit: "cubic-bezier(0.4, 0, 1, 1)",
    },
  },
  layout: {
    contentMaxWidth: "920px",
    navigationWidth: "240px",
    settingRowMinHeight: "58px",
    narrowBreakpoint: "760px",
    headerHeight: "56px",
    touchTargetMin: "32px",
    zIndex: {
      base: 0,
      dropdown: 20,
      overlay: 40,
      dialog: 50,
      tooltip: 60,
    },
  },
  density: {
    comfortable: {
      rowPaddingBlock: "0.875rem",
      rowPaddingInline: "1rem",
      controlGap: "0.75rem",
    },
    compact: {
      rowPaddingBlock: "0.625rem",
      rowPaddingInline: "0.75rem",
      controlGap: "0.5rem",
    },
  },
  identity: {
    hudAccent: "#21d8ef",
    listening: "#27e2ff",
    thinking: "#9b8cff",
    acting: "#f2b84b",
    success: "#53d88f",
    petState: {
      idle: "#21d8ef",
      listening: "#27e2ff",
      thinking: "#9b8cff",
      success: "#53d88f",
      error: "#ff7a59",
      offline: "#8fa1af",
    },
  },
} as const satisfies JarvisTokenTree;

export const jarvisTokenCategories = [
  "color",
  "typography",
  "spacing",
  "radius",
  "shadow",
  "motion",
  "layout",
  "density",
  "identity",
] as const;

export type JarvisTokenCategory = (typeof jarvisTokenCategories)[number];

function flattenTokens(
  value: JarvisTokenTree,
  prefix: string[] = [],
): Record<string, JarvisTokenLeaf> {
  return Object.entries(value).reduce<Record<string, JarvisTokenLeaf>>(
    (accumulator, [key, child]) => {
      const nextPrefix = [...prefix, key];
      if (typeof child === "string" || typeof child === "number") {
        accumulator[nextPrefix.join(".")] = child;
        return accumulator;
      }
      return { ...accumulator, ...flattenTokens(child, nextPrefix) };
    },
    {},
  );
}

export const flatJarvisDesignTokens = flattenTokens(jarvisDesignTokens);

export const jarvisCssVariablePrefix = "--jk";

export function tokenPathToCssVariable(tokenPath: string): string {
  return `${jarvisCssVariablePrefix}-${tokenPath
    .replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)
    .replace(/\./g, "-")}`;
}

export function createJarvisTokenCssVariables(): Record<string, string> {
  return Object.fromEntries(
    Object.entries(flatJarvisDesignTokens).map(([path, value]) => [
      tokenPathToCssVariable(path),
      String(value),
    ]),
  );
}
