import { API_BASE } from '@/lib/trpc';

export async function sendGuardianSMS(to: string, message: string): Promise<boolean> {
  try {
    console.log('SMS: Sending to', to, 'message:', message);
    const res = await fetch(`${API_BASE}/sms/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, message }),
    });
    const result = await res.json();
    console.log('SMS: Result', result);
    return result.success;
  } catch (error) {
    console.log('SMS: Error', error);
    return false;
  }
}

export function formatGuardianMessage(type: 'started' | 'arrived' | 'late' | 'sos' | 'cancelled', context: {
  userName: string;
  guardianName: string;
  time?: string;
  location?: string;
  eventName?: string;
}): string {
  const { userName, time, location, eventName } = context;

  switch (type) {
    case 'started':
      return `${userName} has turned on Safely and is heading home${eventName ? ` from ${eventName}` : ''}. You'll be notified when they arrive.`;
    case 'arrived':
      return `${userName} arrived home safely${time ? ` at ${time}` : ''} 🏠`;
    case 'late':
      return `${userName} hasn't arrived home yet.${location ? ` Last seen at ${location}` : ''}${time ? ` at ${time}` : ''}. Track: https://maps.google.com`;
    case 'sos':
      return `🚨 SOS ALERT: ${userName} needs help!${location ? ` Location: ${location}` : ''}${time ? ` Time: ${time}` : ''}. Please check on them immediately.`;
    case 'cancelled':
      return `${userName} cancelled their Safely session${time ? ` at ${time}` : ''}.`;
    default:
      return `Update from Safely: ${userName}`;
  }
}
