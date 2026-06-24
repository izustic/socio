import { Redirect } from 'expo-router';
import React from 'react';

export default function SwipeScreen() {
  // Redirect to swipe-users for host swiping
  return <Redirect href="/circle/swipe-users" />;
}
