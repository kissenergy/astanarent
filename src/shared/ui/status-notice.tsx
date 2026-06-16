import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/theme-provider';

type StatusNoticeProps = {
  title?: string;
  message: string;
  tone?: 'info' | 'warning' | 'danger' | 'success';
};

export function StatusNotice({ title, message, tone = 'info' }: StatusNoticeProps) {
  const { theme } = useTheme();
  const colors = {
    info: { background: theme.colors.accentSoft, border: theme.colors.actionBlue, text: theme.colors.accentStrong, icon: 'i' },
    warning: { background: '#FFF7DF', border: theme.colors.warning, text: '#8A5A00', icon: '!' },
    danger: { background: theme.colors.dangerSoft, border: theme.colors.danger, text: theme.colors.danger, icon: '!' },
    success: { background: '#EAFBF1', border: theme.colors.whatsapp, text: '#087A3E', icon: '✓' },
  }[tone];

  return (
    <View style={[styles.box, { backgroundColor: colors.background, borderColor: colors.border }]}>
      <View style={[styles.icon, { backgroundColor: colors.border }]}>
        <Text style={styles.iconText}>{colors.icon}</Text>
      </View>
      <View style={styles.copy}>
        {title ? <Text style={[styles.title, { color: colors.text }]}>{title}</Text> : null}
        <Text style={[styles.message, { color: colors.text }]}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'flex-start',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    padding: 13,
  },
  icon: {
    alignItems: 'center',
    borderRadius: 14,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  iconText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  copy: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
});
