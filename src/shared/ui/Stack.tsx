/** Stack — vertical or horizontal flex container with a consistent gap. */
import React from "react";
import { View, ViewStyle, StyleProp } from "react-native";

interface Props {
  direction?: "row" | "column";
  gap?: number;
  align?: "flex-start" | "center" | "flex-end" | "stretch" | "baseline";
  justify?:
    | "flex-start"
    | "center"
    | "flex-end"
    | "space-between"
    | "space-around"
    | "space-evenly";
  wrap?: boolean;
  flex?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export function Stack({
  direction = "column",
  gap = 0,
  align,
  justify,
  wrap,
  flex,
  style,
  children,
}: Props) {
  return (
    <View
      style={[
        {
          flexDirection: direction,
          gap,
          alignItems: align,
          justifyContent: justify,
          flexWrap: wrap ? "wrap" : "nowrap",
          flex,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export const VStack = (props: Omit<Props, "direction">) => (
  <Stack {...props} direction="column" />
);
export const HStack = (props: Omit<Props, "direction">) => (
  <Stack {...props} direction="row" />
);
