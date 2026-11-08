import { create } from 'zustand';
import { useColorScheme } from 'react-native';
import { themes, ThemeColors, tokens } from '../tokens';

export type NightMode = 'system' | 'light' | 'dark';

interface ThemeState {
  nightMode: NightMode;
  setNightMode: (mode: NightMode) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  nightMode: 'dark',
  setNightMode: (mode) => set({ nightMode: mode }),
  toggleTheme: () => {
    set((state) => ({
      nightMode: state.nightMode === 'dark' ? 'light' : 'dark',
    }));
  },
}));

export const useTheme = () => {
  const systemScheme = useColorScheme();
  const nightMode = useThemeStore((s) => s.nightMode);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  const isDark =
    nightMode === 'system' ? systemScheme === 'dark' : nightMode === 'dark';

  const colors: ThemeColors = isDark ? themes.dark : themes.light;

  return {
    isDark,
    colors,
    radius: tokens.radius,
    spacing: tokens.spacing,
    shadow: tokens.shadow,
    toggleTheme,
  };
};
