import React from 'react';

export default function CheckoutActions({ 
  booking, 
  handleDemoAction, 
  handleAdminAction, 
  isProcessing 
}: { 
  booking: any, 
  handleDemoAction: (action: 'release' | 'cancel' | 'dispute') => void, 
  handleAdminAction: (action: 'CANCEL' | 'NO_SHOW') => void,
  isProcessing: boolean
}) {
  if (booking.status !== 'PROTECTED') return null;

  return (
    <div className="flex flex-col gap-3 mt-6 pt-6 border-t dark:border-gray-700 border-dashed">
      <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider text-center">User Actions</p>
      <button 
        onClick={() => handleDemoAction('release')}
        disabled={isProcessing}
        className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors text-sm disabled:opacity-50"
      >
        Confirm Checkout & Simulate Release
      </button>
      <button 
        onClick={() => handleDemoAction('cancel')}
        disabled={isProcessing}
        className="w-full py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium rounded-md transition-colors text-sm disabled:opacity-50"
      >
        Cancel Booking (Tiered Refund)
      </button>
      <button 
        onClick={() => handleDemoAction('dispute')}
        disabled={isProcessing}
        className="w-full py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/60 text-red-800 dark:text-red-300 font-medium rounded-md transition-colors text-sm disabled:opacity-50"
      >
        Report Denied Entry / Overbooking (Freeze Payout)
      </button>
      
      <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider text-center mt-4">Hotel Admin Actions</p>
      <button 
        onClick={() => handleAdminAction('CANCEL')}
        disabled={isProcessing}
        className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors text-sm disabled:opacity-50"
      >
        Hotel Cancels Booking (100% Refund)
      </button>
      <button 
        onClick={() => handleAdminAction('NO_SHOW')}
        disabled={isProcessing}
        className="w-full py-2 bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700 text-white font-medium rounded-md transition-colors text-sm disabled:opacity-50"
      >
        Mark as No-Show (Charge 1 Night)
      </button>
    </div>
  );
}
