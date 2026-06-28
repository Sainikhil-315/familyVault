import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ViewStyle,
  StyleProp,
  ScrollViewProps,
} from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { colors, spacing, layout } from '../../theme';

interface ScreenProps {
  children: React.ReactNode;
  /** Wrap body in a ScrollView. Default true. */
  scroll?: boolean;
  /** Apply default horizontal padding to the content. Default true. */
  padded?: boolean;
  /** Wrap in KeyboardAvoidingView (forms). Default false. */
  keyboardAvoiding?: boolean;
  /** Element pinned to the bottom, outside the scroll area (e.g. primary action). */
  footer?: React.ReactNode;
  /** Element rendered above the scroll area (e.g. AppHeader). */
  header?: React.ReactNode;
  backgroundColor?: string;
  edges?: Edge[];
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  scrollProps?: ScrollViewProps;
}

export function Screen({
  children,
  scroll = true,
  padded = true,
  keyboardAvoiding = false,
  footer,
  header,
  backgroundColor = colors.background,
  edges,
  contentContainerStyle,
  style,
  scrollProps,
}: ScreenProps) {
  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[
        styles.scrollContent,
        padded && styles.padded,
        contentContainerStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      {...scrollProps}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, padded && styles.padded, contentContainerStyle]}>{children}</View>
  );

  const inner = (
    <>
      {header}
      {keyboardAvoiding ? (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {body}
          {footer}
        </KeyboardAvoidingView>
      ) : (
        <>
          {body}
          {footer}
        </>
      )}
    </>
  );

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor }, style]} edges={edges}>
      {inner}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingVertical: spacing.lg },
  padded: { paddingHorizontal: layout.screenPadding },
});

export default Screen;
