import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tx } from "@/src/utils/localization";

export default function BannedScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', 
      justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 18, fontWeight: '700', color: '#FF5252' }}>
        {tx("app.banned.accountBanned")}</Text>
      <Text style={{ color: '#6B6B6B', marginTop: 8, textAlign: 'center' }}>
        {tx("app.banned.yourAccountHasBeenPermanentlyBanned")}</Text>
      <Text style={{ color: '#6B6B6B', marginTop: 8, textAlign: 'center' }}>
        {tx("app.banned.contactSupportForMoreInformation")}</Text>
    </SafeAreaView>
  );
}
