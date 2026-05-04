import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditProfileScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', 
      justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 18, fontWeight: '700' }}>
        Edit Profile Screen
      </Text>
      <Text style={{ color: '#6B6B6B', marginTop: 8 }}>
        Full profile editor (mirrors onboarding fields)
      </Text>
      <Text style={{ color: '#6B6B6B', marginTop: 8 }}>
        Implementation coming in Phase 4
      </Text>
    </SafeAreaView>
  );
}
