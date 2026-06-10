import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { updateMe } from '../auth/data/auth-repository';
import { useSession } from '../auth/data/use-session';
import { formatKzPhoneInput, normalizeKzPhone } from '../../shared/lib/phone';
import { useTheme } from '../../shared/theme/theme-provider';
import { TooltipPressable } from '../../shared/ui/tooltip-pressable';

export function ProfileScreen() {
  const { theme } = useTheme();
  const { user, loading, refresh, signOut } = useSession();
  const [phone, setPhone] = useState('+7');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth');
    }
  }, [loading, user]);

  useEffect(() => {
    if (user?.phone) {
      setPhone(formatKzPhoneInput(user.phone));
    }
  }, [user?.phone]);

  if (loading || !user) {
    return null;
  }

  const savePhone = async () => {
    const normalized = normalizeKzPhone(phone);
    if (!normalized) {
      setMessage('Введите корректный номер Казахстана');
      return;
    }

    try {
      setSaving(true);
      await updateMe({ phone: normalized });
      await refresh();
      setMessage('Телефон обновлен');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Не удалось обновить телефон');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Личный кабинет</Text>
      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Text style={[styles.label, { color: theme.colors.textMuted }]}>Роль</Text>
        <Text style={[styles.value, { color: theme.colors.text }]}>{user.role === 'realtor' ? 'Риелтор' : 'Клиент'}</Text>

        <Text style={[styles.label, { color: theme.colors.textMuted }]}>Имя</Text>
        <Text style={[styles.value, { color: theme.colors.text }]}>{user.name}</Text>

        <Text style={[styles.label, { color: theme.colors.textMuted }]}>Телефон</Text>
        <TextInput
          value={phone}
          onChangeText={(value) => setPhone(formatKzPhoneInput(value))}
          keyboardType="phone-pad"
          style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.background }]}
        />
        <TooltipPressable tooltip="Сохранить новый номер телефона" onPress={savePhone} disabled={saving} style={[styles.primary, { backgroundColor: theme.colors.accent }]}>
          <Text style={styles.primaryText}>{saving ? 'Сохраняем...' : 'Сохранить телефон'}</Text>
        </TooltipPressable>

        {message ? <Text style={[styles.message, { color: theme.colors.accent }]}>{message}</Text> : null}

        {user.email ? (
          <>
            <Text style={[styles.label, { color: theme.colors.textMuted }]}>Email</Text>
            <Text style={[styles.value, { color: theme.colors.text }]}>{user.email}</Text>
          </>
        ) : null}
      </View>

      {user.role === 'realtor' ? (
        <TooltipPressable tooltip="Открыть список ваших объявлений" onPress={() => router.push('/my-listings')} style={[styles.menu, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.menuText, { color: theme.colors.text }]}>Мои объявления</Text>
        </TooltipPressable>
      ) : null}

      {user.isAdmin ? (
        <TooltipPressable tooltip="Открыть список пользователей и управлять ролью риелтора" onPress={() => router.push('/admin-users')} style={[styles.menu, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.menuText, { color: theme.colors.text }]}>Пользователи</Text>
        </TooltipPressable>
      ) : null}

      <Pressable
        onPress={async () => {
          await signOut();
          router.replace('/');
        }}
        style={[styles.logout, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
      >
        <Text style={[styles.logoutText, { color: theme.colors.text }]}>Выйти</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 20,
    paddingBottom: 104,
    paddingTop: 64,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 20,
  },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    elevation: 4,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 14,
  },
  value: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    marginTop: 8,
    minHeight: 50,
    paddingHorizontal: 12,
  },
  primary: {
    alignItems: 'center',
    borderRadius: 14,
    elevation: 3,
    marginTop: 12,
    minHeight: 48,
    justifyContent: 'center',
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  message: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 10,
  },
  menu: {
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 12,
    padding: 16,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '800',
  },
  logout: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 16,
    minHeight: 52,
    justifyContent: 'center',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '800',
  },
});
