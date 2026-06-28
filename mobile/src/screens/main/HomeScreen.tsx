import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { signOut } from 'firebase/auth';
import { firebaseAuth } from '../../config/firebase';
import { colors, spacing, fontSize } from '../../theme';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🏠 FamilyVault</Text>
        <Text style={styles.subtitle}>Sprint 2 coming soon — document upload & member management</Text>
      </View>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.signOutBtn} onPress={() => signOut(firebaseAuth)}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xl },
  title: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  subtitle: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center' },
  footer: { padding: spacing.xl },
  signOutBtn: {
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  signOutText: { color: colors.textSecondary, fontSize: fontSize.md, fontWeight: '500' },
});
