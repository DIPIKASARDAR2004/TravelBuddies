import React from 'react';

export default function CheckoutSummary({ booking }: { booking: any }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Booking Summary</h2>
      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-2 text-sm text-gray-800 dark:text-gray-200">
        <p><span className="font-medium">Hotel:</span> {booking.hotel_snapshot?.name}</p>
        <p><span className="font-medium">Destination:</span> {booking.destination}</p>
        <p><span className="font-medium">Travellers:</span> {booking.travellers}</p>
        <p><span className="font-medium">Nights:</span> {booking.nights} (Rooms: {booking.rooms})</p>
        <div className="pt-2 mt-2 border-t dark:border-gray-600 font-bold text-lg text-gray-900 dark:text-white flex justify-between">
          <span>Total Amount:</span>
          <span>₹{(booking.amount_paise / 100).toLocaleString()}</span>
        </div>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 italic">
        Prototype reservation — Real-time hotel availability is not yet confirmed. No real money is transferred.
      </p>
    </div>
  );
}
