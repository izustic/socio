import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CompleteScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', 
      justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 18, fontWeight: '700' }}>
        Circle Complete Screen
      </Text>
      <Text style={{ color: '#6B6B6B', marginTop: 8 }}>
        Circle full → unlock chat
      </Text>
      <Text style={{ color: '#6B6B6B', marginTop: 8 }}>
        Implementation coming in Phase 6
      </Text>
    </SafeAreaView>
  );
}
