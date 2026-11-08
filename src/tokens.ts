// Silica — Apple Liquid Glass & Brutalist Minimalist Design Tokens

export interface ThemeColors {
  bg: string;
  bgGlass: string;
  card: string;
  cardOverlay: string;
  stroke: string;
  strokeGlass: string;
  ink: string;
  inkMid: string;
  inkDim: string;
  accent: string;
  accentText: string;
  badgeBg: string;
  badgeText: string;
  pillBg: string;
  pillBorder: string;
}

export const themes: { light: ThemeColors; dark: ThemeColors } = {
  light: {
    bg: '#FFFFFF',
    bgGlass: 'rgba(255, 255, 255, 0.78)',
    card: '#F6F6F8',
    cardOverlay: 'rgba(0, 0, 0, 0.45)',
    stroke: '#E5E5EA',
    strokeGlass: 'rgba(255, 255, 255, 0.45)',
    ink: '#111113',
    inkMid: '#636366',
    inkDim: '#8E8E93',
    accent: '#111113',
    accentText: '#FFFFFF',
    badgeBg: 'rgba(255, 255, 255, 0.25)',
    badgeText: '#FFFFFF',
    pillBg: 'rgba(240, 240, 243, 0.9)',
    pillBorder: '#E5E5EA',
  },
  dark: {
    bg: '#000000',
    bgGlass: 'rgba(25, 25, 28, 0.82)',
    card: '#141416',
    cardOverlay: 'rgba(0, 0, 0, 0.65)',
    stroke: '#2C2C2E',
    strokeGlass: 'rgba(255, 255, 255, 0.15)',
    ink: '#FFFFFF',
    inkMid: '#AEAEB2',
    inkDim: '#636366',
    accent: '#FFFFFF',
    accentText: '#000000',
    badgeBg: 'rgba(0, 0, 0, 0.4)',
    badgeText: '#FFFFFF',
    pillBg: 'rgba(28, 28, 30, 0.9)',
    pillBorder: '#2C2C2E',
  },
};

export const tokens = {
  radius: {
    hero: 24,       // Dual hero cards
    pill: 9999,     // Floating capsule nav & actions
    grid: 16,       // 3-col squircle photos
    sm: 10,
    avatar: 8,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
  shadow: {
    liquidGlass: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 6,
    },
    heroCard: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 18,
      elevation: 4,
    },
  },
};

