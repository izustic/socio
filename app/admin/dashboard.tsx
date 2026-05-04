import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdminDashboard() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', 
      justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 18, fontWeight: '700' }}>
        Admin Dashboard
      </Text>
      <Text style={{ color: '#6B6B6B', marginTop: 8, textAlign: 'center' }}>
        Admin functionality coming soon
      </Text>
    </SafeAreaView>
  );
}