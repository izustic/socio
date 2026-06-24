import { Redirect } from 'expo-router';
import React from 'react';

export default function CircleIndex() {
  // Redirect to no-circle screen for circle flow
  return <Redirect href="/circle/no-circle" />;
}