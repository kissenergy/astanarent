export type ThemeMode = 'light' | 'dark';

export const themes = {
  light: {
    mode: 'light',
    colors: {
      background: '#F4F6FF',
      surface: '#FFFFFF',
      surfaceMuted: '#EEF2FF',
      text: '#111827',
      textMuted: '#657084',
      border: '#DEE5F4',
      accent: '#315BFF',
      accentStrong: '#1537D8',
      accentSoft: '#E7ECFF',
      actionBlue: '#2F6BFF',
      actionBlueStrong: '#1947D8',
      glass: 'rgba(255,255,255,0.72)',
      glassBorder: 'rgba(255,255,255,0.58)',
      danger: '#E5484D',
      dangerSoft: '#FFEDEE',
      warning: '#F6B51E',
      shadow: '#1D2B55',
      whatsapp: '#19C66A',
      telegram: '#2AABEE',
    },
  },
  dark: {
    mode: 'dark',
    colors: {
      background: '#061326',
      surface: '#101D35',
      surfaceMuted: '#172846',
      text: '#F8FAFF',
      textMuted: '#AAB7D0',
      border: '#263A61',
      accent: '#5F7CFF',
      accentStrong: '#AFC0FF',
      accentSoft: '#1B2D5F',
      actionBlue: '#4F7DFF',
      actionBlueStrong: '#9CB4FF',
      glass: 'rgba(13,24,45,0.68)',
      glassBorder: 'rgba(255,255,255,0.18)',
      danger: '#FF6B72',
      dangerSoft: '#3A1C27',
      warning: '#FFC34D',
      shadow: '#000000',
      whatsapp: '#19C66A',
      telegram: '#229ED9',
    },
  },
} as const;

export type AppTheme = (typeof themes)[ThemeMode];
