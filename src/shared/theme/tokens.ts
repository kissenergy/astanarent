export type ThemeMode = 'light' | 'dark';

export const themes = {
  light: {
    mode: 'light',
    colors: {
      background: '#F8F6F1',
      surface: '#FFFEFB',
      surfaceMuted: '#EFEAE1',
      text: '#151815',
      textMuted: '#6D746E',
      border: '#E2DCD2',
      accent: '#2F7D62',
      accentStrong: '#1F604A',
      accentSoft: '#E2F0E8',
      actionBlue: '#2AABEE',
      actionBlueStrong: '#168AC4',
      glass: 'rgba(255,255,255,0.62)',
      glassBorder: 'rgba(255,255,255,0.42)',
      danger: '#DC5A3E',
      dangerSoft: '#FDE7DF',
      warning: '#E1A21F',
      shadow: '#17231D',
      whatsapp: '#25D366',
      telegram: '#229ED9',
    },
  },
  dark: {
    mode: 'dark',
    colors: {
      background: '#081B20',
      surface: '#0F252B',
      surfaceMuted: '#18333A',
      text: '#F7F3EA',
      textMuted: '#AEBAB8',
      border: '#27434A',
      accent: '#7FC7A2',
      accentStrong: '#A7E1C0',
      accentSoft: '#193C31',
      actionBlue: '#2AABEE',
      actionBlueStrong: '#7DD3FC',
      glass: 'rgba(10,27,32,0.64)',
      glassBorder: 'rgba(255,255,255,0.14)',
      danger: '#F06F57',
      dangerSoft: '#3F221F',
      warning: '#F0B429',
      shadow: '#000000',
      whatsapp: '#25D366',
      telegram: '#229ED9',
    },
  },
} as const;

export type AppTheme = (typeof themes)[ThemeMode];
