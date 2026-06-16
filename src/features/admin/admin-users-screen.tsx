import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { getAdminUsers, setAdminUserAdmin, setAdminUserRole } from '../auth/data/auth-repository';
import { UserRole } from '../../shared/types/database';
import { useTheme } from '../../shared/theme/theme-provider';
import { TooltipPressable } from '../../shared/ui/tooltip-pressable';

export function AdminUsersScreen() {
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const { data = [], isLoading, error } = useQuery({ queryKey: ['admin-users'], queryFn: getAdminUsers });
  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) => setAdminUserRole(id, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });
  const adminMutation = useMutation({
    mutationFn: ({ id, isAdmin }: { id: string; isAdmin: boolean }) => setAdminUserAdmin(id, isAdmin),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  return (
    <ScrollView style={[styles.screen, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Пользователи</Text>
      {isLoading ? <Text style={[styles.muted, { color: theme.colors.textMuted }]}>Загрузка...</Text> : null}
      {error ? <Text style={[styles.muted, { color: theme.colors.danger }]}>Доступно только админу</Text> : null}

      {data.map((user) => (
        <View key={user.id} style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          {(() => {
            const isPrimaryAdmin = user.phone === '+77075226839';
            return (
              <>
          <Text style={[styles.name, { color: theme.colors.text }]}>{user.name}</Text>
          <Text style={[styles.info, { color: theme.colors.textMuted }]}>{user.phone}</Text>
          <Text style={[styles.info, { color: theme.colors.textMuted }]}>{user.email ?? 'Email не указан'}</Text>
          <Text style={[styles.role, { color: theme.colors.accent }]}>
            {[user.isAdmin ? (isPrimaryAdmin ? 'Главный админ' : 'Админ') : null, user.role === 'realtor' ? 'Риелтор' : 'Пользователь']
              .filter(Boolean)
              .join(' · ')}
          </Text>
          <View style={styles.actions}>
            <TooltipPressable tooltip="Выдать пользователю роль риелтора" onPress={() => roleMutation.mutate({ id: user.id, role: 'realtor' })} style={[styles.action, { backgroundColor: theme.colors.accentSoft }]}>
              <Text style={[styles.actionText, { color: theme.colors.text }]}>Сделать риелтором</Text>
            </TooltipPressable>
            <TooltipPressable tooltip="Оставить пользователя без роли риелтора" onPress={() => roleMutation.mutate({ id: user.id, role: 'client' })} style={[styles.action, { backgroundColor: theme.colors.surfaceMuted }]}>
              <Text style={[styles.actionText, { color: theme.colors.text }]}>Убрать риелтора</Text>
            </TooltipPressable>
            {isPrimaryAdmin ? null : (
              <TooltipPressable
                tooltip={user.isAdmin ? 'Убрать права админа, роль пользователя не изменится' : 'Выдать права админа, роль пользователя не изменится'}
                onPress={() => adminMutation.mutate({ id: user.id, isAdmin: !user.isAdmin })}
                style={[styles.action, { backgroundColor: user.isAdmin ? theme.colors.dangerSoft : theme.colors.accentSoft }]}
              >
                <Text style={[styles.actionText, { color: theme.colors.text }]}>
                  {user.isAdmin ? 'Убрать админа' : 'Сделать админом'}
                </Text>
              </TooltipPressable>
            )}
          </View>
              </>
            );
          })()}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, paddingTop: 58, paddingBottom: 104 },
  title: { fontSize: 30, fontWeight: '900', marginBottom: 16 },
  muted: { fontSize: 14, fontWeight: '700' },
  card: { borderRadius: 22, borderWidth: 1, elevation: 4, marginBottom: 12, padding: 14, shadowColor: '#1D2B55', shadowOpacity: 0.1, shadowRadius: 18 },
  name: { fontSize: 17, fontWeight: '900' },
  info: { fontSize: 13, fontWeight: '700', marginTop: 4 },
  role: { fontSize: 13, fontWeight: '900', marginTop: 8 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  action: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 9 },
  actionText: { fontSize: 12, fontWeight: '900' },
});
