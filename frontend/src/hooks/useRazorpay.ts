import { useState, useEffect } from 'react';

interface RazorpayOptions {
  bookingId: string;
  booking: any;
  onSuccess: (message: string) => void;
  onError: (error: string) => void;
}

export function useRazorpay({ bookingId, booking, onSuccess, onError }: RazorpayOptions) {
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
        if(document.body.contains(script)) {
            document.body.removeChild(script);
        }
    }
  }, []);

  const handlePayment = async (checkIn: string, checkOut: string) => {
    onError('');
    
    if (!checkIn || !checkOut) {
      onError('Please select Check-in and Check-out dates first.');
      return;
    }
    
    setIsProcessing(true);

    try {
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
        amount: booking.amount_paise,
        currency: booking.currency,
        name: 'Journey Pilot',
        description: `Protected Booking: ${booking.hotel_snapshot?.name || 'Hotel'}`,
        order_id: booking.razorpay_order_id,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                booking_id: bookingId,
              }),
            });
            const verifyData = await verifyRes.json();
            
            if (verifyData.success) {
              onSuccess('Payment successful! Your booking is now PROTECTED.');
            } else {
              onError(verifyData.error || 'Payment verification failed');
            }
          } catch (err) {
            onError('Payment verification request failed.');
          } finally {
             setIsProcessing(false);
          }
        },
        prefill: {
          name: 'Test User',
          email: 'test@journeypilot.com',
        },
        theme: {
          color: '#3b82f6',
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        onError('Payment Failed: ' + response.error.description);
        setIsProcessing(false);
      });
      rzp.open();
    } catch (err: any) {
      onError('Failed to initiate payment.');
      setIsProcessing(false);
    }
  };

  return { isProcessing, handlePayment, setIsProcessing };
}
