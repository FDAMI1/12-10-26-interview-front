import {
  LayoutDashboard,
  Mic,
  Building2,
  ShieldCheck,
  UserRound,
  type LucideIcon,
} from "lucide-react-native";
import { useAuthStore } from "@shared/store/useAuthStore";

export interface NavItem {
  name: string;
  label: string;
  icon: LucideIcon;
  /** Visible to platform admins only. */
  adminOnly?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { name: "Dashboard", label: "Dashboard", icon: LayoutDashboard },
  { name: "Interviews", label: "Interviews", icon: Mic },
  { name: "Company", label: "Company", icon: Building2 },
  { name: "Admin", label: "Admin", icon: ShieldCheck, adminOnly: true },
  { name: "Profile", label: "Profile", icon: UserRound },
];

/** Server-side checks remain the real guard; this keeps the UI honest. */
export function useVisibleNavItems(): NavItem[] {
  const isAdmin = useAuthStore((s) => s.user?.role === "platform_admin");
  return NAV_ITEMS.filter((it) => !it.adminOnly || isAdmin);
}

/**
 * Screens the navigation itself lands on. `Screen` reads this to decide
 * whether to offer a back link: anything not listed was opened on top of
 * something and gets one.
 */
export const LANDING_SCREENS = new Set<string>([
  ...NAV_ITEMS.map((it) => it.name),
  "InterviewsList",
  "Workspaces",
  "AdminOverview",
]);
