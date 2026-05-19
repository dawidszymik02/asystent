import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Linking, ActivityIndicator, Platform,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { useAuthStore } from '../../src/store/authStore';
import supabase from '../../src/lib/supabase';

export default function ProfileScreen() {
  const scheme = useColorScheme() ?? 'dark';
  const theme = colors[scheme];
  const { session, signOut } = useAuthStore();

  const fullName = session?.user?.user_metadata?.full_name ?? '';
  const email = session?.user?.email ?? '';
  const initials = fullName
    ? fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : email[0]?.toUpperCase() ?? '?';

  const [name, setName] = useState(fullName);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleSaveName = useCallback(async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: name.trim() },
      });
      if (error) throw error;
      setIsEditing(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Błąd zapisu';
      Alert.alert('Błąd', msg);
    } finally {
      setIsSaving(false);
    }
  }, [name]);

  const handleSignOut = () => {
    Alert.alert('Wylogowanie', 'Czy na pewno chcesz się wylogować?', [
      { text: 'Anuluj', style: 'cancel' },
      { text: 'Wyloguj', style: 'destructive', onPress: signOut },
    ]);
  };

  const handleTheme = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  const cardStyle = {
    backgroundColor: theme.surface,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: 'hidden' as const,
  };

  const sectionLabel = {
    fontSize: 11,
    fontWeight: '600' as const,
    color: theme.textMuted,
    letterSpacing: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Avatar */}
        <View style={{ alignItems: 'center', paddingVertical: 32 }}>
          <View style={{
            width: 80, height: 80, borderRadius: 40,
            backgroundColor: theme.accent,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ fontSize: 28, fontWeight: '700', color: theme.background }}>
              {initials}
            </Text>
          </View>
          <Text style={{ marginTop: 12, fontSize: 18, fontWeight: '600', color: theme.text }}>
            {fullName}
          </Text>
          <Text style={{ fontSize: 13, color: theme.textMuted, marginTop: 4 }}>
            {email}
          </Text>
        </View>

        {/* Karta: Konto */}
        <View style={cardStyle}>
          <Text style={sectionLabel}>KONTO</Text>

          {/* Imię i nazwisko */}
          <View style={{ borderBottomWidth: 1, borderBottomColor: theme.border, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="person-outline" size={20} color={theme.textMuted} />
            {!isEditing ? (
              <>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontSize: 12, color: theme.textMuted }}>Imię i nazwisko</Text>
                  <Text style={{ fontSize: 15, color: theme.text, marginTop: 2 }}>{name}</Text>
                </View>
                <TouchableOpacity onPress={() => setIsEditing(true)}>
                  <Ionicons name="pencil-outline" size={18} color={theme.textMuted} />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TextInput
                  style={{ flex: 1, marginLeft: 12, fontSize: 15, color: theme.text }}
                  value={name}
                  onChangeText={setName}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleSaveName}
                />
                {isSaving ? (
                  <ActivityIndicator size="small" color={theme.accent} />
                ) : (
                  <TouchableOpacity onPress={handleSaveName} style={{ marginLeft: 8 }}>
                    <Ionicons name="checkmark-outline" size={22} color={theme.accent} />
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>

          {/* Email */}
          <View style={{ paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="mail-outline" size={20} color={theme.textMuted} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontSize: 12, color: theme.textMuted }}>Email</Text>
              <Text style={{ fontSize: 15, color: theme.text, marginTop: 2 }}>{email}</Text>
            </View>
          </View>
        </View>

        {/* Karta: Ustawienia */}
        <View style={cardStyle}>
          <Text style={sectionLabel}>USTAWIENIA</Text>

          {/* Motyw */}
          <TouchableOpacity
            onPress={handleTheme}
            style={{ borderBottomWidth: 1, borderBottomColor: theme.border, paddingHorizontal: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center' }}
          >
            <Ionicons name="contrast-outline" size={20} color={theme.textMuted} />
            <Text style={{ flex: 1, fontSize: 15, color: theme.text, marginLeft: 12 }}>Motyw aplikacji</Text>
            <Ionicons name="open-outline" size={16} color={theme.textMuted} />
          </TouchableOpacity>

          {/* Wersja */}
          <View style={{ paddingHorizontal: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="information-circle-outline" size={20} color={theme.textMuted} />
            <Text style={{ flex: 1, fontSize: 15, color: theme.text, marginLeft: 12 }}>Wersja</Text>
            <Text style={{ fontSize: 14, color: theme.textMuted }}>1.0.0</Text>
          </View>
        </View>

        {/* Wyloguj */}
        <TouchableOpacity
          onPress={handleSignOut}
          style={{
            marginHorizontal: 16,
            marginTop: 8,
            paddingVertical: 16,
            borderRadius: 16,
            backgroundColor: theme.surface,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Ionicons name="log-out-outline" size={20} color={theme.error} />
          <Text style={{ fontSize: 16, fontWeight: '600', color: theme.error }}>Wyloguj się</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({});
