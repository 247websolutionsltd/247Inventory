/**
 * Stockroom design tokens.
 * A warm "kraft paper & espresso" look: cream paper surfaces, coffee-brown ink, copper and brass
 * accents, hairline borders and tight corners. The dark mode is a deep roast with caramel accents.
 * Hero surfaces (dashboard ledger, auth header, splash) stay espresso in both modes.
 */
import '@/global.css';

import { Platform } from 'react-native';

const palette = {
  roast950: '#150D08',
  roast900: '#1C120B',
  roast850: '#241811',
  roast800: '#2E1F15',
  roast700: '#3D2A1C',
  roast600: '#4F3724',
  espresso: '#33200F',
  mocha: '#6B4423',
  copper: '#A5622B',
  caramel: '#D9A066',
  brass: '#E3B25C',
  cream: '#F7F0E5',
  kraft: '#EADBC4',
  white: '#FFFFFF',
  danger: '#E5735B',
  warning: '#E7B04C',
  success: '#9BC27A',
} as const;

export const Colors = {
  // Brand constants (theme independent)
  primary: palette.mocha,
  primaryDark: palette.espresso,
  primaryTint: palette.kraft,
  brass: palette.brass,
  palette,

  // Hero surfaces stay espresso in both modes
  hero: palette.espresso,
  heroDeep: palette.roast900,
  heroLine: 'rgba(227,178,92,0.16)',
  heroText: '#FFF8EC',
  heroMuted: 'rgba(255,248,236,0.68)',
  heroChip: 'rgba(255,248,236,0.12)',

  light: {
    text: '#2B1A0F',
    textSecondary: '#7B6451',
    background: '#F6EFE4',
    paper: '#F6EFE4',
    card: '#FFFBF4',
    cardAlt: '#EFE3D0',
    backgroundElement: '#EFE3D0',
    backgroundSelected: '#E4D3BA',
    line: '#E0D0B8',
    tint: '#F1E4D1',
    inkSoft: '#A28B76',
    accent: '#8A4B1E',
    accentSurface: '#F3E3CF',
    accentText: '#5E3212',
    cta: '#3A2312',
    ctaText: '#FFF8EC',
    controlOff: '#D6C4AB',
    controlThumb: '#FFFBF4',
    danger: '#B2432C',
    dangerSurface: '#F7E0D8',
    success: '#4B7A33',
    successSurface: '#E3EDD6',
    warning: '#A86A0C',
    warningSurface: '#F8E8C6',
    overlay: 'rgba(30,16,8,0.5)',
  },
  dark: {
    text: '#F6EBDC',
    textSecondary: '#B59C84',
    background: palette.roast950,
    paper: palette.roast950,
    card: palette.roast850,
    cardAlt: palette.roast800,
    backgroundElement: palette.roast800,
    backgroundSelected: palette.roast700,
    line: '#3A281A',
    tint: palette.roast700,
    inkSoft: '#8A7159',
    accent: palette.caramel,
    accentSurface: '#35241A',
    accentText: palette.caramel,
    cta: palette.caramel,
    ctaText: palette.roast950,
    controlOff: '#4A3624',
    controlThumb: '#FFFBF4',
    danger: palette.danger,
    dangerSurface: '#3E2119',
    success: palette.success,
    successSurface: '#25301B',
    warning: palette.warning,
    warningSurface: '#3A2D14',
    overlay: 'rgba(0,0,0,0.65)',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
export type AppColors = typeof Colors.light | typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'Georgia',
    rounded: 'ui-rounded',
    mono: 'Menlo',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
}) as { sans: string; serif: string; rounded: string; mono: string };

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

/** Tight, crate-like corners: a deliberate step away from soft pill shapes. */
export const Radius = {
  xs: 4,
  sm: 8,
  md: 10,
  lg: 14,
  xl: 18,
  pill: 999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

/** Bottom padding tab screens need so content clears the tab bar. */
export const TabBarSpace = 112;
/** Horizontal screen padding. */
export const PAD = 20;
