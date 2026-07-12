import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tx } from "@/src/utils/localization";

export default function SuspendedScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', 
      justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 18, fontWeight: '700', color: '#FF9800' }}>
        {tx("app.suspended.accountSuspended")}</Text>
      <Text style={{ color: '#6B6B6B', marginTop: 8, textAlign: 'center' }}>
        {tx("app.suspended.yourAccountHasBeenTemporarilySuspended")}</Text>
      <Text style={{ color: '#6B6B6B', marginTop: 8, textAlign: 'center' }}>
        {tx("app.suspended.pleaseCheckBackLaterOrContactSupport")}</Text>
    </SafeAreaView>
  );
}
