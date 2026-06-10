import { router, usePathname } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSession } from '../../features/auth/data/use-session';
import { useTheme } from '../theme/theme-provider';
import { TooltipPressable } from './tooltip-pressable';

export function BottomNavigation() {
  const pathname = usePathname();
  const { theme, mode } = useTheme();
  const { user } = useSession();
  const isDark = mode === 'dark';
  const active = (path: string) => pathname === path || (path !== '/' && pathname.startsWith(path));
  const iconColor = isDark ? '#FFFFFF' : theme.colors.text;
  const mutedColor = isDark ? 'rgba(255,255,255,0.74)' : theme.colors.textMuted;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        {
          backgroundColor: isDark ? 'rgba(8,27,32,0.78)' : 'rgba(255,254,251,0.78)',
          borderColor: isDark ? theme.colors.glassBorder : theme.colors.border,
        },
      ]}
    >
      <NavItem
        active={active('/')}
        icon="⌂"
        label="Главная"
        color={active('/') ? theme.colors.accent : iconColor}
        mutedColor={mutedColor}
        tooltip="Открыть ленту объявлений"
        onPress={() => router.push('/')}
      />
      <NavItem
        active={active('/favorites')}
        icon={active('/favorites') ? '♥' : '♡'}
        label="Избранное"
        color={active('/favorites') ? theme.colors.warning : iconColor}
        mutedColor={mutedColor}
        tooltip={user ? 'Открыть избранные объявления' : 'Войдите, чтобы открыть избранное'}
        onPress={() => router.push(user ? '/favorites' : '/auth')}
      />
      <NavItem
        active={active('/profile')}
        icon="♙"
        label="Профиль"
        color={active('/profile') ? theme.colors.accent : iconColor}
        mutedColor={mutedColor}
        tooltip={user ? 'Открыть личный кабинет' : 'Войти или зарегистрироваться'}
        onPress={() => router.push(user ? '/profile' : '/auth')}
      />
    </View>
  );
}

function NavItem({
  active,
  icon,
  label,
  color,
  mutedColor,
  tooltip,
  onPress,
}: {
  active: boolean;
  icon: string;
  label: string;
  color: string;
  mutedColor: string;
  tooltip: string;
  onPress: () => void;
}) {
  return (
    <TooltipPressable tooltip={tooltip} onPress={onPress} style={styles.item}>
      <Text style={[styles.icon, { color }]}>{icon}</Text>
      <Text style={[styles.label, { color: active ? color : mutedColor }]}>{label}</Text>
    </TooltipPressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1,
    bottom: 16,
    elevation: 8,
    flexDirection: 'row',
    justifyContent: 'space-around',
    left: 16,
    minHeight: 62,
    paddingHorizontal: 8,
    position: 'absolute',
    right: 16,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 18,
  },
  item: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 52,
  },
  icon: {
    fontSize: 22,
    lineHeight: 24,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 3,
  },
});
