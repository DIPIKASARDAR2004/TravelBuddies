import Razorpay from 'razorpay';

/**
 * Singleton instance of Razorpay client.
 * Ensures we only initialize the Razorpay SDK once across the server environment.
 */
export const razorpayClient = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});
