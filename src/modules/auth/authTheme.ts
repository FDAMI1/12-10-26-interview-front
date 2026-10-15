/**
 * The Aivarnix sign-in look: pale-blue glass surfaces, navy type, electric
 * blue to violet actions. Used by the auth screens only; the rest of the app
 * keeps the shared design system.
 */
export const authTheme = {
  navy: "#0B1640",
  muted: "#5B6788",
  blue: "#2F5BFF",
  violet: "#6D4AFF",
  link: "#2447E6",
  background: ["#F4F7FF", "#EAF0FF", "#E8E6FF"] as const,
  primary: ["#2F6BFF", "#4B4BFF", "#6D4AFF"] as const,
  glass: "rgba(255,255,255,0.72)",
  glassBorder: "rgba(255,255,255,0.95)",
  ring: "rgba(76,110,255,0.18)",
  shadow: "#4E63B8",
  focus: "#3B5BFF",
  danger: "#C62F3A",
};
