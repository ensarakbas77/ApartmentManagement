import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { radius, spacing, typography, useThemeColors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { createIssue, IssueError } from '@/services/issues';
import {
  ISSUE_CATEGORIES,
  ISSUE_CATEGORY_INFO,
  ISSUE_DESCRIPTION_MAX,
  ISSUE_LOCATION_MAX,
  ISSUE_TITLE_MAX,
  type IssueCategory,
} from '@/types/issue';

/** Sakin ve yönetici için ortak "arıza / istek bildir" ekranı. */
export function NewIssueScreen() {
  const colors = useThemeColors();
  const { profile } = useAuth();

  const [category, setCategory] = useState<IssueCategory | null>(null);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!profile) return;
    if (!category) {
      setError('Bir kategori seçin.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await createIssue({ category, title, location, description }, profile);
      router.back();
    } catch (err) {
      setError(err instanceof IssueError ? err.message : 'Talep gönderilemedi.');
      setSaving(false);
    }
  }

  return (
    <Screen edges={['bottom']}>
      <Card style={styles.section}>
        <Text style={[typography.label, { color: colors.textMuted }]}>KATEGORİ</Text>
        <View style={styles.categories}>
          {ISSUE_CATEGORIES.map((key) => {
            const info = ISSUE_CATEGORY_INFO[key];
            const selected = key === category;
            return (
              <Pressable
                key={key}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                onPress={() => setCategory(key)}
                disabled={saving}
                style={[
                  styles.category,
                  {
                    borderColor: selected ? colors.primary : colors.border,
                    backgroundColor: selected ? colors.primarySoft : colors.surface,
                  },
                ]}>
                <Ionicons name={info.icon} size={18} color={selected ? colors.primary : colors.textMuted} />
                <Text
                  style={[
                    styles.categoryText,
                    { color: selected ? colors.primary : colors.text },
                    selected && styles.bold,
                  ]}>
                  {info.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card style={styles.section}>
        <TextField
          label="Başlık"
          value={title}
          onChangeText={setTitle}
          placeholder="örn. Asansör çalışmıyor"
          autoCapitalize="sentences"
          autoCorrect
          maxLength={ISSUE_TITLE_MAX}
          editable={!saving}
        />
        <TextField
          label="Yer (isteğe bağlı)"
          icon="location-outline"
          value={location}
          onChangeText={setLocation}
          placeholder="örn. 3. kat koridor"
          autoCapitalize="sentences"
          autoCorrect
          maxLength={ISSUE_LOCATION_MAX}
          editable={!saving}
        />
        <TextField
          label="Açıklama (isteğe bağlı)"
          value={description}
          onChangeText={setDescription}
          placeholder="Sorunu kısaca anlatın. Ne zamandır var, nasıl fark ettiniz?"
          autoCapitalize="sentences"
          autoCorrect
          multiline
          maxLength={ISSUE_DESCRIPTION_MAX}
          editable={!saving}
        />
      </Card>

      <Notice message="Talebiniz tüm sakinlere görünür; aynı sorunun tekrar bildirilmesini önler. Fotoğraf ekleme yakında gelecek." />

      {error ? <Notice tone="danger" message={error} /> : null}

      <Button title="Bildir" icon="paper-plane-outline" onPress={handleSubmit} loading={saving} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  bold: { fontWeight: '700' },
  section: {
    gap: spacing.md,
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  category: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  categoryText: {
    fontSize: 14,
  },
});
