import twilio from 'twilio';
import { env } from '../config/env';

const client = twilio(env.twilio.accountSid, env.twilio.authToken);

export async function sendSms(to: string, body: string): Promise<void> {
  await client.messages.create({
    body,
    from: env.twilio.phoneNumber,
    to,
  });
}
