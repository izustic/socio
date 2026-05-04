import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ReportDetail() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', 
      justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 18, fontWeight: '700' }}>
        Report Detail
      </Text>
      <Text style={{ color: '#6B6B6B', marginTop: 8, textAlign: 'center' }}>
        Report detail functionality coming soon
      </Text>
    </SafeAreaView>
  );
}