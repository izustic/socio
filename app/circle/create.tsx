import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CreateCircleScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', 
      justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 18, fontWeight: '700' }}>
        Create Circle Screen
      </Text>
      <Text style={{ color: '#6B6B6B', marginTop: 8 }}>
        Stage 1: name, vibe, meetup details
      </Text>
      <Text style={{ color: '#6B6B6B', marginTop: 8 }}>
        Implementation coming in Phase 4
      </Text>
    </SafeAreaView>
  );
}
