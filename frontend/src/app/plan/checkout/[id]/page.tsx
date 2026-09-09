"use client";

import { useEffect, useState, use } from 'react';
import { supabaseBrowser as supabase } from '@/lib/supabaseBrowserClient';
import { useRouter } from 'next/navigation';
import { useRazorpay } from '@/hooks/useRazorpay';
import CheckoutSummary from '../components/CheckoutSummary';
import CheckoutActions from '../components/CheckoutActions';
import { usePlanStore } from '@/store/usePlanStore';

export default function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const bookingId = unwrappedParams.id;
  const router = useRouter();
  
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { tripDetails } = usePlanStore();
  const [checkIn, setCheckIn] = useState(tripDetails?.dates?.startDate || '');
  const [checkOut, setCheckOut] = useState(tripDetails?.dates?.endDate || '');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { isProcessing, handlePayment, setIsProcessing } = useRazorpay({
    bookingId,
    booking,
    onSuccess: (message) => {
      setBooking((prev: any) => ({ ...prev, status: 'PROTECTED' }));
      setSuccessMessage(message);
    },
    onError: (err) => setError(err)
  });

  useEffect(() => {
    const fetchBooking = async () => {
      const { data, error: fetchError } = await supabase
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

  const executeAction = async (url: string, method: string, body?: any) => {
    setIsProcessing(true);
    setError('');
    setSuccessMessage('');
    try {
      const res = await fetch(url, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined
      });
      const data = await res.json();
      if (data.success) {
        setBooking((prev: any) => ({ ...prev, status: data.status }));
        let msg = data.message;
        if (data.customer_refund_amount !== undefined) {
          msg += ` (Refunded: ₹${(data.customer_refund_amount / 100).toLocaleString()})`;
        }
        setSuccessMessage(msg);
      } else {
        setError(data.error || `Action failed`);
      }
    } catch (err) {
      setError(`An error occurred while trying to perform the action.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDemoAction = (action: 'release' | 'cancel' | 'dispute') => 
    executeAction(`/api/bookings/${bookingId}/${action}`, 'POST');

  const handleAdminAction = (action: 'CANCEL' | 'NO_SHOW') => 
    executeAction(`/api/hotel-admin/bookings/${bookingId}/cancel`, 'POST', { action });

  if (loading) return <div className="p-10 text-center animate-pulse dark:text-gray-300">Loading secure checkout...</div>;
  if (!booking) return <div className="p-10 text-center text-red-500">{error}</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 mt-10 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 transition-colors">
      <div className="flex justify-between items-center mb-6 border-b dark:border-gray-700 pb-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Protected Hotel Checkout</h1>
        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-semibold rounded-full flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse"></span>
          Test Mode Active
        </span>
      </div>

      {error && <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg">{error}</div>}
      {successMessage && <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-lg font-medium shadow-sm">{successMessage}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <CheckoutSummary booking={booking} />

        <div className="space-y-6">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Travel Dates</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Check-in</label>
                <input 
                  type="date" 
                  value={checkIn} 
                  readOnly
                  className="w-full p-2 border rounded-md text-sm bg-gray-100 text-gray-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Check-out</label>
                <input 
                  type="date" 
                  value={checkOut} 
                  readOnly
                  className="w-full p-2 border rounded-md text-sm bg-gray-100 text-gray-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Payment Status</h2>
            
            <div className="flex flex-col gap-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm font-medium">
              <div className={`flex items-center gap-2 ${booking.status === 'PAYMENT_PENDING' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}>
                <div className={`w-3 h-3 rounded-full ${booking.status === 'PAYMENT_PENDING' ? 'bg-blue-600 dark:bg-blue-400' : 'bg-gray-300 dark:bg-gray-500'}`}></div>
                Payment Pending
              </div>
              <div className={`flex items-center gap-2 ${booking.status === 'PROTECTED' ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                <div className={`w-3 h-3 rounded-full ${booking.status === 'PROTECTED' ? 'bg-green-600 dark:bg-green-400' : 'bg-gray-300 dark:bg-gray-500'}`}></div>
                Payment Protected — Prototype
              </div>
              <div className={`flex items-center gap-2 ${['RELEASED', 'REFUNDED', 'CANCELLED', 'CANCELLED_BY_USER', 'CANCELLED_BY_HOTEL', 'CANCELLED_NO_REFUND', 'NO_SHOW', 'DISPUTED'].includes(booking.status) ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400 dark:text-gray-500'}`}>
                <div className={`w-3 h-3 rounded-full ${['RELEASED', 'REFUNDED', 'CANCELLED', 'CANCELLED_BY_USER', 'CANCELLED_BY_HOTEL', 'CANCELLED_NO_REFUND', 'NO_SHOW', 'DISPUTED'].includes(booking.status) ? 'bg-purple-600 dark:bg-purple-400' : 'bg-gray-300 dark:bg-gray-500'}`}></div>
                {booking.status === 'RELEASED' ? 'Released — Simulated' : booking.status === 'DISPUTED' ? 'Disputed / Frozen' : ['REFUNDED', 'CANCELLED_BY_USER', 'CANCELLED_BY_HOTEL'].includes(booking.status) ? 'Refunded / Cancelled' : booking.status === 'NO_SHOW' ? 'No Show Logged' : 'Closed'}
              </div>
            </div>

            {booking.status === 'PAYMENT_PENDING' && (
              <button 
                onClick={() => handlePayment(checkIn, checkOut)}
                disabled={isProcessing}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : 'Pay Securely in Test Mode'}
              </button>
            )}

            <CheckoutActions 
              booking={booking} 
              handleDemoAction={handleDemoAction} 
              handleAdminAction={handleAdminAction} 
              isProcessing={isProcessing}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
