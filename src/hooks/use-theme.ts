import { Colors } from '@/constants/theme';
import { useAppTheme } from '@/context/PageContext';

/** Returns the active palette (light "paper" by default, user-toggleable in More > Appearance). */
export function useTheme() {
  const { themeMode } = useAppTheme();
  return Colors[themeMode];
}
