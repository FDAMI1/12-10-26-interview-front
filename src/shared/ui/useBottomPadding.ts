import { useSafeAreaInsets } from "react-native-safe-area-context";
import { layout } from "../designSystem";

/** Bottom padding that clears the safe-area inset for scroll content. */
export function useBottomPadding(extra = 24) {
  const insets = useSafeAreaInsets();
  return insets.bottom + extra;
}

/** Bottom padding that also clears a floating tab bar (narrow layout). */
export function useTabBottomPadding(extra = 0) {
  const insets = useSafeAreaInsets();
  return insets.bottom + layout.tabBarClearance + extra;
}
