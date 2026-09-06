"use client";

import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const bookingId = unwrappedParams.id;
  const router = useRouter();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load Razorpay Script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    // Fetch Booking
    const fetchBooking = async () => {
      const { data, error } = await supabase
        .from('protected_bookings')
        .select('*')
        .eq('id', bookingId)
        .single();
        
      if (data) {
        setBooking(data);
        if (data.check_in_date) setCheckIn(data.check_in_date);
        if (data.check_out_date) setCheckOut(data.check_out_date);
      } else {
        setError('Booking not found.');
      }
      setLoading(false);
    };
    fetchBooking();
  }, [bookingId]);

  const handlePayment = async () => {
    if (!checkIn || !checkOut) {
      setError('Please select Check-in and Check-out dates first.');
      return;
    }
    setError('');
    setIsProcessing(true);

    try {
      // 1. We already have the order_id generated in DRAFT. But wait, if they didn't generate it yet, we generate it now.
      // Wait, in our backend API `create-order`, it expects us to pass the trip details to create a draft. 
      // If we are already on the checkout page, the draft exists. We just need to verify payment.
      // Ah! The `create-order` API returns the razorpay_order_id. We should have called it BEFORE coming to this page!
      // Yes, TripCustomizer calls `create-order`, gets the draft ID and order ID, and redirects here.
      
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder', // Test Key
        amount: booking.amount_paise,
        currency: booking.currency,
        name: 'Journey Pilot',
        description: `Protected Booking: ${booking.hotel_snapshot?.name || 'Hotel'}`,
        order_id: booking.razorpay_order_id,
        handler: async function (response: any) {
          // 2. Verify Payment on Server
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
            setBooking((prev: any) => ({ ...prev, status: 'PROTECTED' }));
          } else {
            setError(verifyData.error || 'Payment verification failed');
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
        setError('Payment Failed: ' + response.error.description);
        setIsProcessing(false);
      });
      rzp.open();
    } catch (err: any) {
      setError('Failed to initiate payment.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDemoAction = async (action: 'release' | 'cancel') => {
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/${action}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setBooking((prev: any) => ({ ...prev, status: data.status }));
      } else {
        setError(data.error || `Failed to ${action}`);
      }
    } catch (err) {
      setError(`An error occurred while trying to ${action}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="p-10 text-center animate-pulse">Loading secure checkout...</div>;
  if (!booking) return <div className="p-10 text-center text-red-500">{error}</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 mt-10 bg-white rounded-xl shadow-lg border border-gray-100">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-800">Protected Hotel Checkout</h1>
        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
          Test Mode Active
        </span>
      </div>

      {error && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Summary Column */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-700">Booking Summary</h2>
          <div className="p-4 bg-gray-50 rounded-lg space-y-2 text-sm">
            <p><span className="font-medium">Hotel:</span> {booking.hotel_snapshot?.name}</p>
            <p><span className="font-medium">Destination:</span> {booking.destination}</p>
            <p><span className="font-medium">Travellers:</span> {booking.travellers}</p>
            <p><span className="font-medium">Nights:</span> {booking.nights} (Rooms: {booking.rooms})</p>
            <div className="pt-2 mt-2 border-t font-bold text-lg text-gray-900 flex justify-between">
              <span>Total Amount:</span>
              <span>₹{(booking.amount_paise / 100).toLocaleString()}</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 italic">
            Prototype reservation — Real-time hotel availability is not yet confirmed. No real money is transferred.
          </p>
        </div>

        {/* Action Column */}
        <div className="space-y-6">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-700">Travel Dates</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Check-in</label>
                <input 
                  type="date" 
                  value={checkIn} 
                  onChange={(e) => setCheckIn(e.target.value)}
                  disabled={booking.status !== 'PAYMENT_PENDING'}
                  className="w-full p-2 border rounded-md text-sm disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Check-out</label>
                <input 
                  type="date" 
                  value={checkOut} 
                  onChange={(e) => setCheckOut(e.target.value)}
                  disabled={booking.status !== 'PAYMENT_PENDING'}
                  className="w-full p-2 border rounded-md text-sm disabled:bg-gray-100"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-700">Payment Status</h2>
            
            {/* Status Timeline */}
            <div className="flex flex-col gap-2 p-4 bg-gray-50 rounded-lg text-sm font-medium">
              <div className={`flex items-center gap-2 ${booking.status === 'PAYMENT_PENDING' ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-3 h-3 rounded-full ${booking.status === 'PAYMENT_PENDING' ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                Payment Pending
              </div>
              <div className={`flex items-center gap-2 ${booking.status === 'PROTECTED' ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-3 h-3 rounded-full ${booking.status === 'PROTECTED' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
                Payment Protected — Prototype
              </div>
              <div className={`flex items-center gap-2 ${['RELEASED', 'REFUNDED', 'CANCELLED'].includes(booking.status) ? 'text-purple-600' : 'text-gray-400'}`}>
                <div className={`w-3 h-3 rounded-full ${['RELEASED', 'REFUNDED', 'CANCELLED'].includes(booking.status) ? 'bg-purple-600' : 'bg-gray-300'}`}></div>
                {booking.status === 'RELEASED' ? 'Released — Simulated' : booking.status === 'REFUNDED' ? 'Refunded' : 'Closed'}
              </div>
            </div>

            {/* Primary Action Button */}
            {booking.status === 'PAYMENT_PENDING' && (
              <button 
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : 'Pay Securely in Test Mode'}
              </button>
            )}

            {/* Demo Controls */}
            {booking.status === 'PROTECTED' && (
              <div className="flex flex-col gap-3 mt-6 pt-6 border-t border-dashed">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider text-center">Demo Controls</p>
                <button 
                  onClick={() => handleDemoAction('release')}
                  disabled={isProcessing}
                  className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors text-sm"
                >
                  Confirm Checkout & Simulate Release
                </button>
                <button 
                  onClick={() => handleDemoAction('cancel')}
                  disabled={isProcessing}
                  className="w-full py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-md transition-colors text-sm"
                >
                  Cancel Booking & Request Test Refund
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
