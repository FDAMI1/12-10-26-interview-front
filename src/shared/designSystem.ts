/**
 * Aivarnix design system.
 *
 * Navy type on pale-blue surfaces, electric-blue actions, violet accents,
 * soft rounded cards with a faint blue shadow. Matches the Aivarnix sign-in
 * screens and website.
 *
 *   1. Body text 13–14px, page titles 20px; one typeface (Inter).
 *   2. The brand blue is an ACCENT — primary action, active nav, links, focus.
 *      Most pixels stay neutral.
 *   3. Every text colour keeps at least 4.5:1 on its background.
 *
 * Token keys are unchanged, so every existing call-site re-skins from here.
 */

export const palette = {
  /**
   * Ink — near-black tinted navy so it belongs to the Aivarnix brand
   * family. Pure #000 on pure #FFF is the highest-contrast, cheapest-looking
   * pairing in UI; every considered system tints both ends.
   */
  ink: {
    50: "#F5F7FD",
    100: "#EDF1FA",
    200: "#DFE4F2",
    300: "#C3CAE0",
    400: "#8C96B2",
    500: "#5B6788",
    600: "#3F4A6B",
    700: "#2A3557",
    800: "#13204F",
    900: "#0B1640",
  },

  /**
   * Primary brand — Aivarnix electric blue. 600 is the brand blue; 700 is the
   * shade used where white text sits on it or it is used as text (4.5:1+).
   *
   * NOTE: the key is still `teal` because ~100 call-sites reference
   * `palette.teal[...]`. `palette.brand` is the preferred alias going forward.
   */
  teal: {
    50: "#F1F4FF",
    100: "#E3E9FF",
    200: "#C9D5FF",
    300: "#A3B6FF",
    400: "#7392FF",
    500: "#4F74FF",
    600: "#2F5BFF",
    700: "#2447E6",
    800: "#1631A8",
    900: "#0E1E7A",
  },

  // Accent — Aivarnix violet. Secondary emphasis; 700 carries white text.
  cobalt: {
    50: "#F6F3FF",
    100: "#ECE6FF",
    200: "#D8CDFF",
    300: "#BBA9FF",
    400: "#9B83FF",
    500: "#8263FF",
    600: "#6D4AFF",
    700: "#5634E0",
    800: "#3E24B8",
    900: "#2E1A86",
  },

  // Neutral surfaces, tinted navy to match ink.
  neutral: {
    0: "#FFFFFF",
    900: "#0B1640",
    800: "#13204F",
    700: "#2A3557",
    600: "#3F4A6B",
    500: "#5B6788",
    400: "#8C96B2",
    300: "#C3CAE0",
    200: "#DFE4F2",
    100: "#EDF1FA",
    50: "#F5F7FD",
  },

  surface: {
    primary: "#FFFFFF",
    /** App canvas: pale blue. Cards are white planes ON this. */
    secondary: "#F3F6FE",
    tertiary: "#EDF1FC",
    raised: "#FFFFFF",
    /** Wells, table header rows, input backgrounds. */
    sunken: "#EEF2FC",
    dark: "#0B1640",
    darkRaised: "#13204F",
  },

  text: {
    primary: "#0B1640",
    secondary: "#2A3557",
    // 5.6:1 on white; carries every label, hint and timestamp.
    tertiary: "#5B6788",
    disabled: "#9AA3BE",
    inverse: "#FFFFFF",
    accent: "#2447E6", // brand blue 700, 6.1:1 on white
    link: "#2447E6",
  },

  border: {
    /** Row dividers inside a card. */
    subtle: "#EDF1FA",
    /** The hairline. Every card, table and panel edge in the app. */
    default: "#E1E7F5",
    /** Input borders and anything that must read as interactive. */
    strong: "#C9D2EA",
    focus: "#2F5BFF",
    dark: "#1D2A5C",
  },

  // Semantic — stock / expiry / billing states. Contrast-checked on white.
  success: { bg: "#E4F5EE", text: "#0F7A54", border: "#B7E6D3" }, // 4.73:1
  warning: { bg: "#FBF1DC", text: "#8A5A11", border: "#F3DCA6" }, // 5.27:1
  danger: { bg: "#FCEAE7", text: "#B32D1D", border: "#F6C9C1" }, // 5.46:1
  info: { bg: "#E7F1FC", text: "#1467AE", border: "#BFDDF8" }, // 5.13:1
} as const;

/**
 * Preferred alias for the primary brand ramp. New code should use
 * `palette.brand[600]`; `palette.teal[600]` is the same object, kept because
 * ~100 existing call-sites already reference it.
 */
export const brand = palette.teal;

/**
 * Dark surfaces, ink and borders.
 *
 * NOT AN INVERSION — pure black behind pure white smears on OLED and haloes
 * for astigmatic readers. This is the elevation model: a dark desaturated
 * ground with each layer slightly lighter, text topping out near #E8EDEC.
 * Semantic colours are re-tuned, not reused, keeping the same 4.5:1 floor.
 *
 * Worth recording: the reading research (Piepenbrock 2013/2014, NN/g's review)
 * finds light-on-dark measurably worse for proofreading accuracy. This app
 * shows batch numbers, dosages and expiry dates — dark mode belongs here as an
 * option that follows the OS, never as the default.
 */
export const darkPalette = {
  ink: {
    900: "#F2F6F5",
    800: "#E4EBE9",
    700: "#CBD5D2",
    600: "#A7B4B1",
    500: "#859390",
    400: "#6B7976",
    300: "#4B5956",
    200: "#33403D",
    100: "#26312E",
    50: "#1C2523",
  },
  surface: {
    /** Cards and panels — one step above the canvas. */
    primary: "#1A2321",
    /** App canvas. Not black: #000 shows OLED smear on scroll. */
    secondary: "#111917",
    tertiary: "#212C29",
    raised: "#212C29",
    /** Wells, table headers, pressed rows. */
    sunken: "#141D1B",
    dark: "#0B110F",
    darkRaised: "#1A2321",
  },
  text: {
    primary: "#E8EDEC",
    secondary: "#B4C0BD",
    tertiary: "#8A9793",
    disabled: "#5E6B68",
    inverse: "#0F1F1B",
    /** Lifted from 700 to 400: the deep green is unreadable on a dark ground. */
    accent: "#7392FF",
    link: "#9BB0FF",
  },
  border: {
    subtle: "#26312E",
    default: "#2F3B38",
    strong: "#41504C",
    focus: "#7392FF",
    dark: "#0B110F",
  },
  // Deep fills, light text — same 4.5:1 discipline as the light set.
  success: { bg: "#12301F", text: "#5FD498", border: "#1F5133" },
  warning: { bg: "#33260E", text: "#E5B45C", border: "#57401A" },
  danger: { bg: "#3A1A16", text: "#F08C7C", border: "#5E2A24" },
  info: { bg: "#12283D", text: "#6FB4F0", border: "#1D4468" },
} as const;

/** Status accents, re-tuned for a dark ground. */
export const darkAccents = {
  teal: { color: "#7392FF", tint: "#16204A" },
  blue: { color: "#5FAAEF", tint: "#12283D" },
  amber: { color: "#E5B45C", tint: "#33260E" },
  red: { color: "#F08C7C", tint: "#3A1A16" },
  purple: { color: "#A79BF0", tint: "#241F3D" },
  neutral: { color: "#8A9793", tint: "#212C29" },
} as const;

/**
 * Status accents for metrics.
 *
 * These used to paint a 3px coloured cap and a tinted icon bubble on every KPI
 * card, which is how a dashboard ends up looking like a box of highlighters.
 * They are still here for the few places a metric genuinely carries a status
 * (expiring = red, dues = amber), but the default is now `none` — a metric with
 * no status gets no colour at all.
 */
export const accents = {
  teal: { color: "#2F5BFF", tint: "#EEF2FF" },
  blue: { color: "#2F5BFF", tint: "#EEF2FF" },
  amber: { color: "#C1801C", tint: "#FBF1DC" },
  red: { color: "#DB4B3D", tint: "#FCEAE7" },
  purple: { color: "#6D4AFF", tint: "#F1EDFF" },
  neutral: { color: "#5B6788", tint: "#EEF1F8" },
} as const;

/**
 * 4pt spacing grid. Semantic names, because the old string-keyed scale
 * (`spacing["1.5"]`) was hostile enough to use that it had zero call-sites in
 * the entire app while 556 raw magic numbers grew up around it.
 */
export const space = {
  none: 0,
  hair: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  "6xl": 64,
} as const;

/** Back-compat numeric alias. Prefer `space`. */
export const spacing = {
  "0": 0,
  px: 1,
  "0.5": 2,
  "1": 4,
  "2": 8,
  "3": 12,
  "4": 16,
  "5": 20,
  "6": 24,
  "8": 32,
  "10": 40,
  "12": 48,
  "16": 64,
} as const;

/**
 * Radius ladder — deliberately short. Controls 6, small surfaces 8, cards 10,
 * dialogs 12. Nothing in the product is rounder than 12 except pills.
 */
export const radius = {
  xs: 4,
  sm: 6,
  md: 10, // buttons, inputs, chips, icon wells
  lg: 16, // cards, tables, panels
  xl: 20, // dialogs, sheets, hero panels
  "2xl": 22,
  "3xl": 24,
  full: 9999,
} as const;

// Thin hairline outline.
export const outline = { width: 1, color: palette.border.default } as const;

/**
 * One family, Inter, at three weights.
 *
 * Poppins used to carry "friendly rounded headings". Mixing a geometric display
 * face into a data tool is the single clearest junior tell in the audit — every
 * system this product is measured against (Stripe, Linear, Geist, Mercury)
 * ships one grotesque throughout and gets its hierarchy from size and colour.
 *
 * `display`/`heading` now point at Inter so no call-site has to change. The
 * Poppins files are no longer loaded in App.tsx.
 */
export const fonts = {
  display: "Inter_600SemiBold",
  heading: "Inter_600SemiBold",
  bodyRegular: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_600SemiBold",
} as const;

/**
 * Tabular figures. Every rupee amount, quantity and batch count in the app must
 * use these or columns of numbers wobble — proportional digits in a money
 * column is a tell people feel without being able to name.
 */
export const numeric: { fontVariant: ["tabular-nums"] } = {
  fontVariant: ["tabular-nums"],
};

export const typography = {
  display: {
    large: {
      fontFamily: fonts.display,
      fontSize: 28,
      lineHeight: 34,
      fontWeight: "600" as const,
      letterSpacing: -0.5,
    },
    medium: {
      fontFamily: fonts.display,
      fontSize: 24,
      lineHeight: 30,
      fontWeight: "600" as const,
      letterSpacing: -0.4,
    },
    /** The KPI number. */
    small: {
      fontFamily: fonts.display,
      fontSize: 21,
      lineHeight: 26,
      fontWeight: "600" as const,
      letterSpacing: -0.3,
    },
  },
  heading: {
    /** Page title. */
    h1: {
      fontFamily: fonts.display,
      fontSize: 20,
      lineHeight: 26,
      fontWeight: "600" as const,
      letterSpacing: -0.3,
    },
    h2: {
      fontFamily: fonts.heading,
      fontSize: 17,
      lineHeight: 24,
      fontWeight: "600" as const,
      letterSpacing: -0.2,
    },
    /** Card / section title. */
    h3: {
      fontFamily: fonts.heading,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: "600" as const,
      letterSpacing: -0.1,
    },
    h4: {
      fontFamily: fonts.heading,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "600" as const,
      letterSpacing: 0,
    },
  },
  body: {
    large: {
      fontFamily: fonts.bodyRegular,
      fontSize: 15,
      lineHeight: 22,
      fontWeight: "400" as const,
    },
    /** Default body. */
    default: {
      fontFamily: fonts.bodyRegular,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "400" as const,
    },
    /** Table cells, secondary lines, dense lists. */
    small: {
      fontFamily: fonts.bodyRegular,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "400" as const,
    },
  },
  label: {
    large: {
      fontFamily: fonts.semibold,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "600" as const,
      letterSpacing: -0.1,
    },
    medium: {
      fontFamily: fonts.semibold,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "600" as const,
      letterSpacing: 0,
    },
    small: {
      fontFamily: fonts.semibold,
      // 12px is the floor for text that carries meaning; 11px reads as noise
      // on a phone and trips "text too small" audits.
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "600" as const,
      letterSpacing: 0.1,
    },
  },
  caption: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500" as const,
    letterSpacing: 0,
  },
  /**
   * Eyebrow labels. Dropped to 11px with tighter tracking — at 12/1.0 it
   * competed with the page title sitting directly under it.
   */
  overline: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "600" as const,
    letterSpacing: 0.6,
    textTransform: "uppercase" as const,
  },
} as const;

/**
 * Elevation.
 *
 * Resting surfaces get NO shadow — a hairline border on a tinted canvas does
 * the separating. These exist for things that genuinely float above the page.
 */
const soft = (y: number, blur: number, opacity: number, elev: number) => ({
  shadowColor: "#2B3F99",
  shadowOffset: { width: 0, height: y },
  shadowOpacity: opacity,
  shadowRadius: blur,
  elevation: elev,
});

export const shadows = {
  none: {},
  xs: soft(1, 2, 0.03, 1),
  sm: soft(1, 3, 0.05, 2),
  md: soft(4, 12, 0.07, 4),
  lg: soft(8, 24, 0.1, 8),
  xl: soft(16, 36, 0.12, 14),
} as const;

export const elevation = {
  /** Cards at rest — a faint blue lift, as in the Aivarnix design. */
  base: shadows.sm,
  raised: shadows.xs,
  /** Menus, pickers, the FAB. */
  floating: shadows.md,
  /** Dialogs and sheets. */
  overlay: shadows.lg,
} as const;

export const motion = {
  duration: { fast: 150, medium: 250, slow: 400 },
  spring: {
    gentle: { damping: 18, stiffness: 180 },
    default: { damping: 20, stiffness: 220 },
    bouncy: { damping: 12, stiffness: 200 },
    crisp: { damping: 25, stiffness: 300 },
  },
} as const;

/**
 * Gradients.
 *
 * The green→blue sweep is retired from product surfaces: a gradient banner at
 * the top of a working dashboard is decoration where the user wants density,
 * and it was the loudest thing on the screen. These are kept for auth/marketing
 * panels, where a brand moment is the actual job.
 */
export const gradients = {
  hero: ["#2F6BFF", "#4B4BFF", "#6D4AFF"] as const,
  /** Filled primary buttons: deep enough for white labels at 4.5:1+. */
  primary: ["#2453F0", "#4438E6", "#5B36F0"] as const,
  teal: ["#0FA05C", "#0A6B3B"] as const,
  cobalt: ["#3B9AEA", "#1673C0"] as const,
  light: ["#FFFFFF", "#F6F8F8"] as const,
  mist: ["#EEFBF5", "#EFF6FE"] as const,
} as const;

/** Glass — translucent frosted panels for overlays over gradients/imagery. */
export const glass = {
  light: {
    backgroundColor: "rgba(255,255,255,0.16)",
    borderColor: "rgba(255,255,255,0.28)",
    borderWidth: 1,
  },
  lighter: {
    backgroundColor: "rgba(255,255,255,0.10)",
    borderColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
  },
  dark: {
    backgroundColor: "rgba(15,23,42,0.30)",
    borderColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
  },
} as const;

/**
 * Responsive breakpoints (min-width, px). One source of truth so "narrow vs
 * wide" behaves the same everywhere instead of each screen hardcoding 640/700/
 * 760/900/1100. Consume via the `useBreakpoint` hook.
 */
export const breakpoints = {
  sm: 640,
  md: 760,
  lg: 900,
  xl: 1100,
  xxl: 1200,
} as const;

export const layout = {
  /** Page gutter. Phones get less — 24px on a 390px screen is 12% of it. */
  screenPadding: 24,
  screenPaddingPhone: 16,
  /** Card padding — Polaris ships exactly this and it is the right number. */
  cardPadding: 16,
  cardPaddingCompact: 12,
  /** Inputs, selects, comboboxes. Consume via `useControlHeight()`. */
  controlHeight: 38,
  controlHeightPhone: 46,
  sectionGap: 24,
  itemGap: 12,
  sidebarWidth: 240,
  sidebarCollapsedWidth: 68,
  /** Sidebar nav rows. 48px was a touch target on a desktop pointer surface. */
  navRowHeight: 36,
  tabBarHeight: 64,
  tabBarClearance: 88,
  chipHeight: 30,
  chipRowHeight: 38,
  /** Table/list metrics. */
  rowHeight: 44,
  rowHeightDense: 36,
  rowHeightPhone: 60,
  tableHeaderHeight: 36,
  contentMaxWidth: 1240,
  // Width at/above which the layout switches to the desktop sidebar shell.
  wideBreakpoint: 900,
} as const;
