const { registerGlobals } = require('@livekit/react-native');

// LiveKit needs WebRTC globals registered before Expo Router imports app code.
registerGlobals();

require('expo-router/entry');
