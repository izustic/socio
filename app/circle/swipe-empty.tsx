import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tx } from "@/src/utils/localization";

export default function SwipeEmptyScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', 
      justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 18, fontWeight: '700' }}>
        {tx("app.circle.swipeEmpty.swipeEmptyScreen")}</Text>
      <Text style={{ color: '#6B6B6B', marginTop: 8 }}>
        {tx("app.circle.swipeEmpty.noMoreProfilesCirclesToSwipe")}</Text>
      <Text style={{ color: '#6B6B6B', marginTop: 8 }}>
        {tx("app.circle.swipeEmpty.implementationComingInPhase5")}</Text>
    </SafeAreaView>
  );
}
