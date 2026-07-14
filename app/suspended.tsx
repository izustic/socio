import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tx } from "@/src/utils/localization";
import { Colors } from "@/src/constants/theme";

export default function SuspendedScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background,
      justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.warning }}>
        {tx("app.suspended.accountSuspended")}</Text>
      <Text style={{ color: Colors.textSecondary, marginTop: 8, textAlign: 'center' }}>
        {tx("app.suspended.yourAccountHasBeenTemporarilySuspended")}</Text>
      <Text style={{ color: Colors.textSecondary, marginTop: 8, textAlign: 'center' }}>
        {tx("app.suspended.pleaseCheckBackLaterOrContactSupport")}</Text>
    </SafeAreaView>
  );
}
