import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from './config';

const QUEUE_KEY = 'safely_location_queue';

interface QueuedLocation {
  sessionId: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  timestamp: string;
}

export async function queueLocation(loc: QueuedLocation) {
  try {
    const existing = await AsyncStorage.getItem(QUEUE_KEY);
    const queue: QueuedLocation[] = existing ? JSON.parse(existing) : [];
    queue.push(loc);
    if (queue.length > 500) queue.splice(0, queue.length - 500);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    console.log('LocationQueue: Queued location, queue size:', queue.length);
  } catch (e) {
    console.log('LocationQueue: Queue save error:', e);
  }
}

export async function flushLocationQueue() {
  try {
    const existing = await AsyncStorage.getItem(QUEUE_KEY);
    if (!existing) return;
    const queue: QueuedLocation[] = JSON.parse(existing);
    if (queue.length === 0) return;

    console.log(`LocationQueue: Flushing ${queue.length} queued locations`);

    const failed: QueuedLocation[] = [];

    for (const loc of queue) {
      try {
        const res = await fetch(
          `${CONFIG.BACKEND_URL}/sessions/location`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loc),
          }
        );
        if (!res.ok) {
          failed.push(loc);
        }
      } catch {
        failed.push(loc);
        break;
      }
    }

    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(failed));
    if (failed.length === 0) {
      console.log('LocationQueue: Queue fully flushed');
    } else {
      console.log(`LocationQueue: ${failed.length} locations still queued`);
    }
  } catch (e) {
    console.log('LocationQueue: Flush error:', e);
  }
}

export async function getQueueSize(): Promise<number> {
  try {
    const existing = await AsyncStorage.getItem(QUEUE_KEY);
    if (!existing) return 0;
    return JSON.parse(existing).length;
  } catch {
    return 0;
  }
}

export async function clearLocationQueue() {
  await AsyncStorage.removeItem(QUEUE_KEY);
}
