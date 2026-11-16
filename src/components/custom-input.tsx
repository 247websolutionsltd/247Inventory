import { Radius, Spacing } from "@/constants/theme";
import { IconName } from "@/data/catalog";
import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import { ReactNode, useState } from "react";
import { ScrollView, TextInput, TextInputProps, TouchableOpacity, View } from "react-native";
import { ThemedText } from "./themed-text";
import { Chip } from "./ui";

interface InputProps extends TextInputProps {
  label?: string;
  icon?: IconName;
  prefix?: string;
  suffix?: string;
  password?: boolean;
  number?: boolean;
  desc?: boolean;
  error?: string | null;
  hint?: string;
  right?: ReactNode;
}

/** Boxed field with a small-caps label above it and a heavier edge when focused. */
export default function Input({ label, icon, prefix, suffix, password, number = false, desc, error, hint, right, style, onFocus, onBlur, ...rest }: InputProps) {
  const theme = useTheme();
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <View style={{ paddingVertical: Spacing.two }}>
      {label ? (
        <ThemedText type="label" themeColor="textSecondary" style={{ marginBottom: 7 }}>
          {label}
        </ThemedText>
      ) : null}
      <View
        style={{
          flexDirection: "row",
          alignItems: desc ? "flex-start" : "center",
          minHeight: desc ? 100 : 54,
          paddingHorizontal: Spacing.three - 2,
          borderRadius: Radius.md,
          backgroundColor: theme.card,
          borderWidth: 1.25,
          borderBottomWidth: focused || error ? 3 : 1.25,
          borderColor: error ? theme.danger : focused ? theme.accent : theme.line,
        }}
      >
        {icon && <Ionicons name={icon} size={19} color={focused ? theme.accent : theme.textSecondary} style={{ marginRight: Spacing.two, marginTop: desc ? 15 : 0 }} />}
        {prefix && (
          <ThemedText type="bold" themeColor="textSecondary" style={{ marginRight: Spacing.one, marginTop: desc ? 13 : 0 }}>
            {prefix}
          </ThemedText>
        )}
        <TextInput
          {...rest}
          style={[
            {
              flex: 1,
              color: theme.text,
              fontSize: 16,
              paddingVertical: desc ? 14 : 0,
              height: desc ? undefined : 54,
              minHeight: desc ? 100 : undefined,
              textAlignVertical: desc ? "top" : "center",
              outlineStyle: "none",
            } as any,
            style,
          ]}
          secureTextEntry={password === true && !show}
          keyboardType={number ? "decimal-pad" : (rest.keyboardType ?? "default")}
          multiline={desc}
          placeholderTextColor={theme.inkSoft}
          selectionColor={theme.accent}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
        />
        {suffix ? (
          <ThemedText type="small" themeColor="textSecondary" style={{ marginLeft: Spacing.one }}>
            {suffix}
          </ThemedText>
        ) : null}
        {password && (
          <TouchableOpacity onPress={() => setShow(!show)} hitSlop={10} accessibilityLabel={show ? "Hide password" : "Show password"}>
            <Ionicons name={show ? "eye-off-outline" : "eye-outline"} size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        )}
        {right}
      </View>
      {error ? (
        <ThemedText type="caption" style={{ color: theme.danger, marginTop: Spacing.one + 1 }}>
          {error}
        </ThemedText>
      ) : hint ? (
        <ThemedText type="caption" themeColor="textSecondary" style={{ marginTop: Spacing.one + 1 }}>
          {hint}
        </ThemedText>
      ) : null}
    </View>
  );
}

/** Single-choice picker rendered as a row of chips. */
export function ChipField<T extends string>({
  label,
  options,
  value,
  onChange,
  wrap = false,
}: {
  label?: string;
  options: readonly { id: T; label: string; icon?: IconName }[];
  value: T | undefined;
  onChange: (v: T) => void;
  wrap?: boolean;
}) {
  const chips = options.map((o) => <Chip key={o.id} label={o.label} icon={o.icon} selected={value === o.id} onPress={() => onChange(o.id)} />);
  return (
    <View style={{ paddingVertical: Spacing.two }}>
      {label ? (
        <ThemedText type="label" themeColor="textSecondary" style={{ marginBottom: 8 }}>
          {label}
        </ThemedText>
      ) : null}
      {wrap ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: Spacing.two }}>{chips}</View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.two }}>
          {chips}
        </ScrollView>
      )}
    </View>
  );
}
