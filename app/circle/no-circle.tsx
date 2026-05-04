import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NoCircleScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', 
      justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 18, fontWeight: '700' }}>
        No Circle Screen
      </Text>
      <Text style={{ color: '#6B6B6B', marginTop: 8 }}>
        Create or Join Circle CTA
      </Text>
      <Text style={{ color: '#6B6B6B', marginTop: 8 }}>
        Implementation coming in Phase 4
      </Text>
    </SafeAreaView>
  );
}
