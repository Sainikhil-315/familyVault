import React, { useState, useMemo } from 'react';
import {
  View, StyleSheet, Alert, Modal, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Contacts from 'expo-contacts/legacy';

// Minimal shape of what we need from a contact
interface ContactItem {
  id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  phoneNumbers?: { number?: string; label?: string }[];
}
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../types/navigation';
import { inviteMember } from '../../api/family.api';
import { useAuth } from '../../contexts/AuthContext';
import {
  Screen, AppHeader, Text, Input, Button, Icon,
} from '../../components/ui';
import { colors, spacing, radius, shadows } from '../../theme';

type Props = {
  navigation: NativeStackNavigationProp<AppStackParamList, 'InviteMember'>;
};

function formatForInvite(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  // If number already has a country code prefix, keep + and strip formatting chars.
  // Handles: "+91 98765 43210", "+91-98765-43210", "+919876543210"
  return raw.trim().startsWith('+') ? `+${digits}` : `+91${digits}`;
}

function isValidPhone(formatted: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(formatted);
}

export default function InviteMemberScreen({ navigation }: Props) {
  const { familyId } = useAuth();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  // Contact picker state
  const [showPicker, setShowPicker] = useState(false);
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [contactSearch, setContactSearch] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(false);

  const formattedPhone = formatForInvite(phone);
  const isValid = isValidPhone(formattedPhone) && phone.replace(/\D/g, '').length >= 10;

  async function sendInvite(rawPhone: string, label?: string) {
    if (!familyId) return;
    const formatted = formatForInvite(rawPhone);
    if (!isValidPhone(formatted)) {
      Alert.alert('Invalid number', 'Enter a valid 10-digit number.');
      return;
    }
    setLoading(true);
    try {
      await inviteMember(familyId, formatted);
      Alert.alert(
        'Invitation Sent',
        `${label ?? formatted} can now join your family vault.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not create invitation');
    } finally {
      setLoading(false);
    }
  }

  async function openContactPicker() {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Contact access is needed to pick a number.');
      return;
    }
    setLoadingContacts(true);
    setShowPicker(true);
    try {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
        sort: Contacts.SortTypes.FirstName,
      });
      const items = data as unknown as ContactItem[];
      setContacts(items.filter((c) => c.phoneNumbers && c.phoneNumbers.length > 0));
    } catch {
      Alert.alert('Error', 'Could not load contacts.');
      setShowPicker(false);
    } finally {
      setLoadingContacts(false);
    }
  }

  function handleContactSelect(contact: ContactItem) {
    if (!contact.phoneNumbers?.length) return;
    const phoneEntry = contact.phoneNumbers[0];
    const raw = phoneEntry.number ?? '';
    const name = contact.name || `${contact.firstName ?? ''} ${contact.lastName ?? ''}`.trim() || raw;

    setShowPicker(false);
    setContactSearch('');

    Alert.alert(
      'Invite to Family Vault',
      `Do you want to invite ${name} (${raw}) to your family vault?`,
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes', onPress: () => sendInvite(raw, name) },
      ]
    );
  }

  const filteredContacts = useMemo(() => {
    const q = contactSearch.toLowerCase().trim();
    if (!q) return contacts;
    return contacts.filter((c) => {
      const displayName = c.name ?? `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim();
      const nameMatch = displayName.toLowerCase().includes(q);
      const phoneMatch = c.phoneNumbers?.some((p: { number?: string }) => (p.number ?? '').includes(q));
      return nameMatch || phoneMatch;
    });
  }, [contacts, contactSearch]);

  return (
    <>
      <Screen
        keyboardAvoiding
        header={<AppHeader title="Invite Member" onBack={() => navigation.goBack()} />}
        footer={
          <View style={styles.footer}>
            <Button
              title="Send Invitation"
              onPress={() => sendInvite(phone)}
              disabled={!isValid || loading}
              loading={loading}
            />
          </View>
        }
        contentContainerStyle={styles.content}
      >
        <Input
          label="Phone Number"
          placeholder="98765 43210"
          keyboardType="phone-pad"
          maxLength={13}
          value={phone}
          onChangeText={setPhone}
          autoFocus
          hint="+91 added automatically for 10-digit numbers"
        />

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text variant="caption" style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity style={styles.contactsBtn} onPress={openContactPicker} activeOpacity={0.7}>
          <View style={styles.contactsBtnIcon}>
            <Icon name="people-outline" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="bodyMedium">Pick from Contacts</Text>
            <Text variant="caption" style={{ color: colors.textSecondary }}>Choose a contact to invite</Text>
          </View>
          <Icon name="chevron-forward" size={18} color={colors.textTertiary} />
        </TouchableOpacity>
      </Screen>

      {/* Contact picker modal */}
      <Modal visible={showPicker} animationType="slide" onRequestClose={() => { setShowPicker(false); setContactSearch(''); }}>
        <SafeAreaView style={styles.pickerContainer} edges={['top', 'left', 'right']}>
          {/* Header */}
          <View style={styles.pickerHeader}>
            <TouchableOpacity onPress={() => { setShowPicker(false); setContactSearch(''); }} style={styles.pickerClose}>
              <Icon name="close" size={22} color={colors.text} />
            </TouchableOpacity>
            <Text variant="h2" style={{ flex: 1 }}>Select Contact</Text>
          </View>

          {/* Search */}
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.searchRow}>
              <Icon name="search-outline" size={18} color={colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search name or number"
                placeholderTextColor={colors.textTertiary}
                value={contactSearch}
                onChangeText={setContactSearch}
                autoCorrect={false}
              />
              {contactSearch.length > 0 && (
                <TouchableOpacity onPress={() => setContactSearch('')}>
                  <Icon name="close-circle" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          </KeyboardAvoidingView>

          {loadingContacts ? (
            <View style={styles.pickerCenter}>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text variant="caption" style={{ marginTop: spacing.sm }}>Loading contacts...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredContacts}
              keyExtractor={(item) => item.id ?? item.name ?? Math.random().toString()}
              renderItem={({ item }: { item: ContactItem }) => {
                const itemPhone = item.phoneNumbers?.[0]?.number ?? '';
                const displayName = item.name || `${item.firstName ?? ''} ${item.lastName ?? ''}`.trim() || itemPhone;
                const initial = displayName.charAt(0).toUpperCase();
                return (
                  <TouchableOpacity style={styles.contactRow} onPress={() => handleContactSelect(item)} activeOpacity={0.6}>
                    <View style={styles.contactAvatar}>
                      <Text style={styles.contactAvatarText}>{initial}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyMedium" numberOfLines={1}>{displayName}</Text>
                      <Text variant="caption" style={{ color: colors.textSecondary }}>{itemPhone}</Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
              ItemSeparatorComponent={() => <View style={styles.contactSep} />}
              contentContainerStyle={styles.contactList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.pickerCenter}>
                  <Icon name="people-outline" size={40} color={colors.textTertiary} />
                  <Text variant="caption" style={{ marginTop: spacing.sm, color: colors.textSecondary }}>
                    {contactSearch ? 'No contacts match' : 'No contacts with phone numbers'}
                  </Text>
                </View>
              }
            />
          )}
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg },
  footer: { padding: spacing.lg },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  dividerText: { color: colors.textTertiary },
  contactsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadows.sm,
  },
  contactsBtnIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Picker modal
  pickerContainer: { flex: 1, backgroundColor: colors.background },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pickerClose: { padding: spacing.xs },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    height: 44,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    height: '100%',
  },
  pickerCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  contactList: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactAvatarText: { fontSize: 18, fontWeight: '600', color: colors.primary },
  contactSep: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: 60 },
});
