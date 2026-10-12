export const colors = {
  // Backgrounds
  bg: '#0A0B14',
  surface: '#12131E',
  surfaceElevated: '#1C1D2E',
  surfaceHigh: '#252638',

  // Borders
  border: '#252638',
  borderSubtle: '#1A1B2A',

  // Brand
  red: '#FF3B4E',
  redMid: '#FF3B4E55',
  redDim: '#FF3B4E18',

  // States
  green: '#00D68F',
  greenMid: '#00D68F55',
  greenDim: '#00D68F18',
  yellow: '#FFB800',
  yellowDim: '#FFB80018',
  blue: '#4D9FFF',
  blueDim: '#4D9FFF18',

  // Text
  textPrimary: '#F0F0F8',
  textSecondary: '#8585A0',
  textMuted: '#4A4A62',

  // Utility
  white: '#FFFFFF',
  transparent: 'transparent',
};

export const font = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 30,
  xxxl: 40,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

// Contact avatar colors — deterministic by first letter
const avatarPalette = [
  '#FF6B6B', '#FF8E53', '#FFC107', '#66BB6A',
  '#26C6DA', '#42A5F5', '#AB47BC', '#EC407A',
];

export function avatarColor(name: string): string {
  const i = (name.charCodeAt(0) || 0) % avatarPalette.length;
  return avatarPalette[i];
}
