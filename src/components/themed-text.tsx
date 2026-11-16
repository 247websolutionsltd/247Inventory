import { StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?:
    | 'default'
    | 'display'
    | 'title'
    | 'subtitle'
    | 'large'
    | 'big'
    | 'bold'
    | 'mid'
    | 'small'
    | 'smallBold'
    | 'caption'
    | 'label'
    | 'amount'
    | 'mono';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();
  return <Text style={[{ color: theme[themeColor ?? 'text'] }, styles[type], style]} {...rest} />;
}

const styles = StyleSheet.create({
  default: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  // Headings use a serif face for an editorial, ledger-book feel.
  display: { fontFamily: Fonts.serif, fontSize: 42, lineHeight: 46, fontWeight: '700', letterSpacing: -0.8 },
  title: { fontFamily: Fonts.serif, fontSize: 30, lineHeight: 36, fontWeight: '700', letterSpacing: -0.4 },
  subtitle: { fontFamily: Fonts.serif, fontSize: 24, lineHeight: 30, fontWeight: '700', letterSpacing: -0.2 },
  large: { fontFamily: Fonts.serif, fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: -0.3 },
  big: { fontFamily: Fonts.serif, fontSize: 21, lineHeight: 27, fontWeight: '700', letterSpacing: -0.1 },
  bold: { fontSize: 16, lineHeight: 22, fontWeight: '700' },
  mid: { fontSize: 15, lineHeight: 21, fontWeight: '500' },
  small: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
  smallBold: { fontSize: 14, lineHeight: 20, fontWeight: '700' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
  label: { fontSize: 10.5, lineHeight: 14, fontWeight: '800', letterSpacing: 1.4, textTransform: 'uppercase' },
  amount: { fontSize: 16, lineHeight: 22, fontWeight: '700', fontVariant: ['tabular-nums'] },
  mono: { fontFamily: Fonts.mono, fontSize: 12, lineHeight: 16, fontWeight: '500', letterSpacing: 0.3 },
});
