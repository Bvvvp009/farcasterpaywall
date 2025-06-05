import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import {
  parseWebhookEvent,
  verifyAppKeyWithNeynar,
} from "@farcaster/frame-node"

type NotificationDetails = {
  token: string;
  url: string;
}

type WebhookEventData = {
  fid: number;
  event: {
    event: 'frame_added' | 'frame_removed' | 'notifications_enabled' | 'notifications_disabled';
    notificationDetails?: NotificationDetails;
  };
}

// Store notification tokens in KV store
async function storeNotificationToken(fid: number, token: string, url: string) {
  const key = `notif:${fid}`
  await kv.set(key, { token, url })
}

// Remove notification token from KV store
async function removeNotificationToken(fid: number) {
  const key = `notif:${fid}`
  await kv.del(key)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Parse and verify the webhook event
    const data = await parseWebhookEvent(body, verifyAppKeyWithNeynar) as unknown as WebhookEventData
    
    // Handle different event types
    switch (data.event.event) {
      case 'frame_added':
        if (data.event.notificationDetails) {
          await storeNotificationToken(
            data.fid,
            data.event.notificationDetails.token,
            data.event.notificationDetails.url
          )
        }
        break

      case 'frame_removed':
      case 'notifications_disabled':
        await removeNotificationToken(data.fid)
        break

      case 'notifications_enabled':
        if (data.event.notificationDetails) {
          await storeNotificationToken(
            data.fid,
            data.event.notificationDetails.token,
            data.event.notificationDetails.url
          )
        }
        break
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Webhook error:', error)
    
    if (error && typeof error === 'object' && 'name' in error) {
      const err = error as { name: string }
      switch (err.name) {
        case "VerifyJsonFarcasterSignature.InvalidDataError":
        case "VerifyJsonFarcasterSignature.InvalidEventDataError":
          return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
        case "VerifyJsonFarcasterSignature.InvalidAppKeyError":
          return NextResponse.json({ error: 'Invalid app key' }, { status: 401 })
        case "VerifyJsonFarcasterSignature.VerifyAppKeyError":
          return NextResponse.json({ error: 'Error verifying app key' }, { status: 500 })
      }
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 