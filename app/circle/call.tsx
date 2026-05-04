import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CallScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', 
      justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 18, fontWeight: '700' }}>
        Circle Call Screen
      </Text>
      <Text style={{ color: '#6B6B6B', marginTop: 8 }}>
        E2EE group call
      </Text>
      <Text style={{ color: '#6B6B6B', marginTop: 8 }}>
        Implementation coming in Phase 7
      </Text>
    </SafeAreaView>
  );
}
