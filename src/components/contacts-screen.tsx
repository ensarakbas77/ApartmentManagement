import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { IbanCard } from '@/components/iban-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { SkeletonList } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { radius, spacing, typography, useThemeColors } from '@/constants/theme';
import { firestoreErrorMessage } from '@/lib/firestore-errors';
import { tapFeedback } from '@/lib/haptics';
import { callPhone, formatPhone } from '@/lib/phone';
import { subscribeToContacts, type Contact } from '@/services/contacts';

interface ContactsScreenProps {
  /** Verilirse ekleme/düzenleme açılır (sadece yönetici). */
  onCreate?: () => void;
  onEdit?: (id: string) => void;
}

/** Önemli numaralar rehberi: dokununca arar. */
export function ContactsScreen({ onCreate, onEdit }: ContactsScreenProps) {
  const colors = useThemeColors();
  const [contacts, setContacts] = useState<Contact[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(
    () =>
      subscribeToContacts(
        (list) => {
          setContacts(list);
          setError(null);
        },
        (err) => setError(firestoreErrorMessage(err, 'Rehber yüklenemedi')),
      ),
    [],
  );

  return (
    <Screen edges={['bottom']}>
      {onCreate ? <Button title="Numara ekle" icon="add-circle-outline" onPress={onCreate} /> : null}

      {error ? <Notice tone="danger" message={error} /> : null}
      {contacts === null && !error ? <SkeletonList /> : null}

      {contacts?.length === 0 ? (
        <EmptyState
          icon="call-outline"
          title="Rehber boş"
          description={
            onCreate
              ? 'Yönetici, asansör firması, tesisatçı gibi numaraları ekleyin; sakinler tek dokunuşla arasın.'
              : 'Yönetici önemli numaraları eklediğinde burada görünecek.'
          }
        />
      ) : null}

      {contacts && contacts.length > 0 ? (
        <Card padded={false}>
          {contacts.map((contact, index) => (
            <View
              key={contact.id}
              style={[
                styles.row,
                index < contacts.length - 1 && {
                  borderBottomColor: colors.border,
                  borderBottomWidth: StyleSheet.hairlineWidth,
                },
              ]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={onEdit ? `${contact.name} kaydını düzenle` : undefined}
                disabled={!onEdit}
                onPress={() => onEdit?.(contact.id)}
                style={styles.info}>
                <Text style={[typography.caption, { color: colors.textMuted }]} numberOfLines={1}>
                  {contact.role}
                </Text>
                <Text style={[typography.bodyStrong, { color: colors.text }]} numberOfLines={1}>
                  {contact.name}
                </Text>
                <Text style={[typography.caption, { color: colors.textMuted }]}>{formatPhone(contact.phone)}</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${contact.name} ara`}
                onPress={() => {
                  tapFeedback();
                  callPhone(contact.phone);
                }}
                hitSlop={6}
                style={({ pressed }) => [
                  styles.call,
                  { backgroundColor: colors.success },
                  pressed && { opacity: 0.8 },
                ]}>
                <Ionicons name="call" size={20} color="#FFFFFF" />
              </Pressable>
            </View>
          ))}
        </Card>
      ) : null}

      {onEdit && contacts && contacts.length > 0 ? (
        <Text style={[typography.caption, styles.center, { color: colors.textMuted }]}>
          Düzenlemek için kayda dokunun.
        </Text>
      ) : null}

      <IbanCard />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  info: {
    flex: 1,
    gap: 1,
  },
  call: {
    width: 46,
    height: 46,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
