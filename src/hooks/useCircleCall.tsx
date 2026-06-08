import {
  ConnectionState,
  Participant,
  Room,
  RoomEvent,
  Track,
  VideoTrack,
} from "livekit-client";
import { useCallback, useEffect, useRef, useState } from "react";
import { getLivekitToken } from "../services/livekit";

const LIVEKIT_URL = process.env.EXPO_PUBLIC_LIVEKIT_URL!;

export interface CallParticipant {
  identity: string;
  name: string;
  isMicEnabled: boolean;
  isCameraEnabled: boolean;
  isLocal: boolean;
  participant: Participant;
  videoTrack?: VideoTrack;
}

export const useCircleCall = (
  circleId: string,
  userName: string,
) => {
  const roomRef = useRef<Room | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.Disconnected,
  );
  const [participants, setParticipants] = useState<CallParticipant[]>([]);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isConnected = connectionState === ConnectionState.Connected;
  const isConnecting = connectionState === ConnectionState.Connecting;

  const buildParticipantList = useCallback((room: Room) => {
    const list: CallParticipant[] = [];
    const getCameraTrack = (participant: Participant): VideoTrack | undefined => {
      const publication = participant.getTrackPublication(Track.Source.Camera);

      return publication?.videoTrack;
    };

    const local = room.localParticipant;
    list.push({
      identity: local.identity,
      name: local.name ?? local.identity,
      isMicEnabled: local.isMicrophoneEnabled,
      isCameraEnabled: local.isCameraEnabled,
      isLocal: true,
      participant: local,
      videoTrack: getCameraTrack(local),
    });

    room.remoteParticipants.forEach((remote) => {
      list.push({
        identity: remote.identity,
        name: remote.name ?? remote.identity,
        isMicEnabled: remote.isMicrophoneEnabled,
        isCameraEnabled: remote.isCameraEnabled,
        isLocal: false,
        participant: remote,
        videoTrack: getCameraTrack(remote),
      });
    });

    setParticipants(list);
  }, []);

  const connect = useCallback(async () => {
    if (roomRef.current) return;

    try {
      setError(null);
      setConnectionState(ConnectionState.Connecting);
      const tokenData = await getLivekitToken(circleId, userName);
      const livekitUrl = tokenData.url || LIVEKIT_URL;

      if (!livekitUrl) {
        throw new Error("LiveKit URL is not configured");
      }

      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      });

      roomRef.current = room;

      // Room event listeners
      room.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
        setConnectionState(state);
      });

      room.on(RoomEvent.ParticipantConnected, () => buildParticipantList(room));
      room.on(RoomEvent.ParticipantDisconnected, () =>
        buildParticipantList(room),
      );
      room.on(RoomEvent.TrackPublished, () => buildParticipantList(room));
      room.on(RoomEvent.TrackUnpublished, () => buildParticipantList(room));
      room.on(RoomEvent.TrackSubscribed, () => buildParticipantList(room));
      room.on(RoomEvent.TrackUnsubscribed, () => buildParticipantList(room));
      room.on(RoomEvent.TrackMuted, () => buildParticipantList(room));
      room.on(RoomEvent.TrackUnmuted, () => buildParticipantList(room));

      room.on(RoomEvent.Disconnected, () => {
        setConnectionState(ConnectionState.Disconnected);
        setParticipants([]);
        roomRef.current = null;
      });

      await room.connect(livekitUrl, tokenData.token);

      await room.localParticipant.enableCameraAndMicrophone();

      setIsMicEnabled(true);
      setIsCameraEnabled(true);
      buildParticipantList(room);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to connect to call";
      setError(message);
      roomRef.current = null;
      setConnectionState(ConnectionState.Disconnected);
    }
  }, [circleId, userName, buildParticipantList]);

  const disconnect = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    await room.disconnect();
    roomRef.current = null;
    setParticipants([]);
    setConnectionState(ConnectionState.Disconnected);
  }, []);

  const toggleMic = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    const enabled = !isMicEnabled;
    await room.localParticipant.setMicrophoneEnabled(enabled);
    setIsMicEnabled(enabled);
    buildParticipantList(room);
  }, [isMicEnabled, buildParticipantList]);

  const toggleCamera = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    const enabled = !isCameraEnabled;
    await room.localParticipant.setCameraEnabled(enabled);
    setIsCameraEnabled(enabled);
    buildParticipantList(room);
  }, [isCameraEnabled, buildParticipantList]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      roomRef.current?.disconnect();
      roomRef.current = null;
    };
  }, []);

  return {
    connect,
    disconnect,
    toggleMic,
    toggleCamera,
    connectionState,
    isConnected,
    isConnecting,
    participants,
    isMicEnabled,
    isCameraEnabled,
    error,
  };
};
