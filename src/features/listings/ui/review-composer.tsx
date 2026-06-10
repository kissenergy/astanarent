import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { addListingReview } from '../data/listing-repository';
import { useSession } from '../../auth/data/use-session';
import { useTheme } from '../../../shared/theme/theme-provider';
import { TooltipPressable } from '../../../shared/ui/tooltip-pressable';

type ReviewComposerProps = {
  listingId: string;
};

export function ReviewComposer({ listingId }: ReviewComposerProps) {
  const { theme } = useTheme();
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => addListingReview(listingId, { rating, text }),
    onSuccess: async () => {
      setText('');
      setRating(5);
      setError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['feed-listings'] }),
        queryClient.invalidateQueries({ queryKey: ['listing', listingId] }),
      ]);
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Не удалось сохранить отзыв'),
  });

  if (!user) {
    return (
      <TooltipPressable
        tooltip="Войдите или зарегистрируйтесь, чтобы оставить отзыв"
        onPress={() => router.push('/auth')}
        style={[styles.loginBox, { backgroundColor: theme.colors.accentSoft, borderColor: theme.colors.border }]}
      >
        <Text style={[styles.loginText, { color: theme.colors.accentStrong }]}>Войдите, чтобы оставить отзыв</Text>
      </TooltipPressable>
    );
  }

  return (
    <View style={[styles.box, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((value) => (
          <Pressable key={value} onPress={() => setRating(value)} hitSlop={8}>
            <Text style={[styles.star, { color: value <= rating ? theme.colors.warning : theme.colors.textMuted }]}>★</Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Напишите отзыв по квартире"
        placeholderTextColor={theme.colors.textMuted}
        multiline
        style={[styles.input, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.text }]}
      />
      {error ? <Text style={[styles.error, { color: theme.colors.danger }]}>{error}</Text> : null}
      <TooltipPressable
        tooltip="Сохранить отзыв и оценку"
        disabled={mutation.isPending}
        onPress={() => mutation.mutate()}
        style={[styles.submit, { backgroundColor: theme.colors.accent }]}
      >
        <Text style={styles.submitText}>{mutation.isPending ? 'Сохраняем...' : 'Оставить отзыв'}</Text>
      </TooltipPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    marginBottom: 10,
    padding: 12,
  },
  loginBox: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    padding: 12,
  },
  loginText: {
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
  },
  stars: {
    flexDirection: 'row',
    gap: 4,
  },
  star: {
    fontSize: 22,
    lineHeight: 26,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 13,
    minHeight: 70,
    padding: 10,
    textAlignVertical: 'top',
  },
  error: {
    fontSize: 12,
    fontWeight: '800',
  },
  submit: {
    alignItems: 'center',
    borderRadius: 12,
    minHeight: 42,
    justifyContent: 'center',
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
});
