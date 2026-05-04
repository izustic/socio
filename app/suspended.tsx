import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SuspendedScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', 
      justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 18, fontWeight: '700', color: '#FF9800' }}>
        Account Suspended
      </Text>
      <Text style={{ color: '#6B6B6B', marginTop: 8, textAlign: 'center' }}>
        Your account has been temporarily suspended.
      </Text>
      <Text style={{ color: '#6B6B6B', marginTop: 8, textAlign: 'center' }}>
        Please check back later or contact support.
      </Text>
    </SafeAreaView>
  );
}
