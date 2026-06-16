import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSession } from '../data/use-session';
import { AuthMode, AuthFormValues } from '../domain/auth-types';
import { formatKzPhoneInput } from '../../../shared/lib/phone';
import { useTheme } from '../../../shared/theme/theme-provider';
import { StatusNotice } from '../../../shared/ui/status-notice';

const initialValues: AuthFormValues = {
  email: '',
  name: '',
  phone: '+7',
  password: '',
};

export function AuthScreen() {
  const { theme } = useTheme();
  const { signIn, signUp } = useSession();
  const params = useLocalSearchParams<{ intent?: string }>();
  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [values, setValues] = useState<AuthFormValues>(initialValues);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isSignUp = mode === 'sign-up';

  const updateValue = <TKey extends keyof AuthFormValues>(key: TKey, value: AuthFormValues[TKey]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const submit = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      if (isSignUp) {
        await signUp(values);
      } else {
        await signIn(values);
      }

      router.replace('/');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось выполнить действие';
      setErrorMessage(translateAuthError(message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{isSignUp ? 'Регистрация' : 'Вход'}</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
          {params.intent === 'listing'
            ? 'Войдите или зарегистрируйтесь. Подавать объявления можно после подтверждения роли риелтора админом.'
            : 'Ленту можно смотреть без входа. Аккаунт нужен для избранного и личного кабинета.'}
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Text style={[styles.label, { color: theme.colors.text }]}>Телефон</Text>
        <TextInput
          value={values.phone}
          onChangeText={(value) => updateValue('phone', formatKzPhoneInput(value))}
          keyboardType="phone-pad"
          placeholder="+7 (___) ___-__-__"
          placeholderTextColor={theme.colors.textMuted}
          style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.background }]}
        />

        {isSignUp ? (
          <>
            <Text style={[styles.label, { color: theme.colors.text }]}>Имя</Text>
            <TextInput
              value={values.name}
              onChangeText={(value) => updateValue('name', value)}
              placeholder="Например: Алия"
              placeholderTextColor={theme.colors.textMuted}
              style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.background }]}
            />

            <Text style={[styles.label, { color: theme.colors.text }]}>Email, необязательно</Text>
            <TextInput
              value={values.email}
              autoCapitalize="none"
              autoCorrect={false}
              inputMode="email"
              keyboardType="email-address"
              onChangeText={(value) => updateValue('email', value.trim().toLowerCase())}
              placeholder="name@example.com"
              placeholderTextColor={theme.colors.textMuted}
              style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.background }]}
            />
          </>
        ) : null}

        <Text style={[styles.label, { color: theme.colors.text }]}>Пароль</Text>
        <TextInput
          value={values.password}
          onChangeText={(value) => updateValue('password', value)}
          placeholder="Минимум 6 символов"
          placeholderTextColor={theme.colors.textMuted}
          secureTextEntry
          style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.background }]}
        />

        {errorMessage ? (
          <StatusNotice title="Не получилось войти" message={errorMessage} tone="danger" />
        ) : null}

        <Pressable disabled={loading} onPress={submit} style={[styles.submit, { backgroundColor: theme.colors.accent }]}>
          <Text style={styles.submitText}>{loading ? 'Подождите...' : isSignUp ? 'Зарегистрироваться' : 'Войти'}</Text>
        </Pressable>

        <Pressable onPress={() => setMode(isSignUp ? 'sign-in' : 'sign-up')} style={styles.modeSwitch}>
          <Text style={[styles.modeText, { color: theme.colors.accent }]}>
            {isSignUp ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function translateAuthError(message: string) {
  if (message.includes('over_email_send_rate_limit') || message.includes('email rate limit exceeded')) {
    return 'Слишком много попыток регистрации. Подождите пару минут и попробуйте снова.';
  }

  if (message.includes('email_address_invalid') || message.includes('Email address')) {
    return 'Введите корректный email адрес.';
  }

  if (message.includes('duplicate key') || message.includes('profiles_phone_key')) {
    return 'Этот номер телефона уже зарегистрирован';
  }

  if (message.includes('Invalid login credentials')) {
    return 'Неверный телефон или пароль';
  }

  if (message.includes('User already registered')) {
    return 'Пользователь с таким email уже зарегистрирован';
  }

  return message;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
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
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  roleButton: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
  },
  roleText: {
    fontSize: 14,
    fontWeight: '800',
  },
  submit: {
    alignItems: 'center',
    borderRadius: 14,
    elevation: 3,
    marginTop: 22,
    minHeight: 54,
    justifyContent: 'center',
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  modeSwitch: {
    alignItems: 'center',
    paddingTop: 18,
  },
  modeText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
