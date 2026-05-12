import { useState, useEffect } from 'react';
import { generateCallToken, joinCall, leaveCall, toggleMicrophone, toggleCamera } from '@/src/services/livekit';

interface CallState {
  isConnected: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  participants: {
    id: string;
    name: string;
    isMuted: boolean;
    isCameraOff: boolean;
  }[];
  error: string | null;
}

export function useCircleCall(circleId: string) {
  const [callState, setCallState] = useState<CallState>({
    isConnected: false,
    isMuted: false,
    isCameraOff: false,
    participants: [],
    error: null,
  });

  const [loading, setLoading] = useState(false);

  const connectToCall = async (userId: string) => {
    setLoading(true);
    setCallState(prev => ({ ...prev, error: null }));

    try {
      const tokenData = await generateCallToken(circleId, userId);
      await joinCall(tokenData);
      
      setCallState(prev => ({
        ...prev,
        isConnected: true,
      }));
    } catch (error) {
      console.error('Call connection error:', error);
      setCallState(prev => ({
        ...prev,
        error: 'Failed to connect to call',
      }));
    } finally {
      setLoading(false);
    }
  };

  const disconnectFromCall = async () => {
    try {
      await leaveCall();
      setCallState({
        isConnected: false,
        isMuted: false,
        isCameraOff: false,
        participants: [],
        error: null,
      });
    } catch (error) {
      console.error('Call disconnection error:', error);
    }
  };

  const toggleMute = async () => {
    try {
      await toggleMicrophone(!callState.isMuted);
      setCallState(prev => ({
        ...prev,
        isMuted: !prev.isMuted,
      }));
    } catch (error) {
      console.error('Toggle mute error:', error);
    }
  };

  const toggleVideo = async () => {
    try {
      await toggleCamera(!callState.isCameraOff);
      setCallState(prev => ({
        ...prev,
        isCameraOff: !prev.isCameraOff,
      }));
    } catch (error) {
      console.error('Toggle video error:', error);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (callState.isConnected) {
        disconnectFromCall();
      }
    };
  }, [callState.isConnected]);

  return {
    connectToCall,
    disconnectFromCall,
    toggleMute,
    toggleVideo,
    loading,
    ...callState,
  };
}
