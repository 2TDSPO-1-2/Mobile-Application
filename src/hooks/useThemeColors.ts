import { useTheme } from '../context/ThemeContext';
import { lightColors, darkColors } from '../styles/colors';

export function useThemeColors() {
  const { mode } = useTheme();
  return mode === 'dark' ? darkColors : lightColors;
}
