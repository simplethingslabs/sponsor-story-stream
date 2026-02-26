import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

let resend: Resend | null = null;

export function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export const emailConfig = {
  from: `${process.env.FROM_NAME || 'Sponsor Portal'} <${process.env.FROM_EMAIL || 'noreply@example.com'}>`,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
};

export function verifyResendConfig(): boolean {
  return !!process.env.RESEND_API_KEY;
}
