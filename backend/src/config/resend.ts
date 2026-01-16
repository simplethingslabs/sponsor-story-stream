import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

export const emailConfig = {
  from: `${process.env.FROM_NAME || 'Sponsor Portal'} <${process.env.FROM_EMAIL || 'noreply@example.com'}>`,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
};

// Verify configuration
export function verifyResendConfig(): boolean {
  return !!process.env.RESEND_API_KEY;
}

export default resend;
