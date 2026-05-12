import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { AccessToken, VideoGrant } from 'https://cdn.jsdelivr.net/npm/livekit-server-sdk@1.2.11/+esm';

interface TokenRequest {
  roomName: string;
  participantName: string;
  participantIdentity: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // Verify authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get LiveKit config from environment
    const livekitUrl = Deno.env.get('LIVEKIT_URL');
    const livekitApiKey = Deno.env.get('LIVEKIT_API_KEY');
    const livekitApiSecret = Deno.env.get('LIVEKIT_API_SECRET');

    if (!livekitUrl || !livekitApiKey || !livekitApiSecret) {
      return new Response(JSON.stringify({ error: 'LiveKit not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const { roomName, participantName, participantIdentity }: TokenRequest = await req.json();

    if (!roomName || !participantIdentity) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create access token
    const at = new AccessToken(livekitApiKey, livekitApiSecret, {
      identity: participantIdentity,
      name: participantName || participantIdentity,
    });

    // Grant access to the room
    const grant: VideoGrant = {
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    };
    at.addGrant(grant);

    // Generate token
    const token = await at.toJwt();

    return new Response(JSON.stringify({ token }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error generating LiveKit token:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});