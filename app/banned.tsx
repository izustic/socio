import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BannedScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', 
      justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 18, fontWeight: '700', color: '#FF5252' }}>
        Account Banned
      </Text>
      <Text style={{ color: '#6B6B6B', marginTop: 8, textAlign: 'center' }}>
        Your account has been permanently banned.
      </Text>
      <Text style={{ color: '#6B6B6B', marginTop: 8, textAlign: 'center' }}>
        Contact support for more information.
      </Text>
    </SafeAreaView>
  );
}
