"use client";
import { useState } from "react";

export default function CurrencyConverter() {
  const [amount, setAmount] = useState(0);
  const [currency, setCurrency] = useState("EUR");
  const [converted, setConverted] = useState(0);

  const convertCurrency = () => {
    const rates: any = { USD: 1, EUR: 0.92, INR: 83 }; // mock rates
    setConverted(amount * rates[currency]);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <h2 className="text-2xl font-bold mb-4">💱 Currency Converter</h2>
      <input
        type="number"
        className="border p-2 rounded mb-2 w-48 text-center"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
        placeholder="Amount in USD"
      />
      <select
        className="border p-2 rounded mb-2 w-48 text-center"
        value={currency}
        onChange={(e) => setCurrency(e.target.value)}
      >
        <option value="EUR">EUR</option>
        <option value="INR">INR</option>
        <option value="USD">USD</option>
      </select>
      <button
        className="bg-green-500 text-white px-4 py-2 rounded"
        onClick={convertCurrency}
      >
        Convert
      </button>
      <p className="mt-4 text-lg font-semibold">
        Converted Amount: {converted.toFixed(2)} {currency}
      </p>
    </div>
  );
}
