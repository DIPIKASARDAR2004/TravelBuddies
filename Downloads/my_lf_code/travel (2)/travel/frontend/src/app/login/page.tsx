"use client";
import { useState } from "react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

export default function LoginPage() {
  const [tab, setTab] = useState("personal");
  const [phone, setPhone] = useState("");

  const isPhoneValid = phone.replace(/\D/g, "").length >= 10;

  const handleSubmit = async () => {
    const res = await fetch("/api/login", {
      method: "POST",
      body: JSON.stringify({ phone }),
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    alert(data.message);
  };

  return (
    <div className="flex flex-col md:flex-row bg-white rounded-xl shadow-lg p-4 max-w-2xl mx-auto mt-10">
      <span>
      <h2 className="text-xl font-bold text-center" >Sign up/Login now to</h2>
      </span>
      <div className="md:w-1/2 p-4">
        {/* Account type tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab("personal")}
            className={`flex-1 px-4 py-2 rounded font-medium ${
              tab === "personal" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
            }`}
          >
            PERSONAL ACCOUNT
          </button>
          <button
            onClick={() => setTab("business")}
            className={`flex-1 px-4 py-2 rounded font-medium ${
              tab === "business" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
            }`}
          >
            MYBIZ ACCOUNT
          </button>
        </div>

        {/* Phone input */}
        <PhoneInput
          country={"in"}
          value={phone}
          onChange={setPhone}
          inputStyle={{
            width: "100%",
            padding: "12px",
            fontSize: "16px",
            borderRadius: "6px",
            border: "1px solid #ccc",
          }}
          containerStyle={{ marginBottom: "1rem" }}
        />

        {/* Continue button */}
        <button
          onClick={handleSubmit}
          disabled={!isPhoneValid}
          className={`w-full py-2 rounded font-semibold transition ${
            isPhoneValid
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          CONTINUE
        </button>

        {/* Social login */}
        <div className="mt-4 text-center text-sm text-gray-500">Or Login/Signup With</div>
        <div className="flex justify-center gap-4 mt-2">
          <button className="bg-gray-100 p-2 rounded-full text-lg font-bold">G</button>
          <button className="bg-gray-100 p-2 rounded-full text-lg font-bold">@</button>
        </div>

        {/* Disclaimer */}
        <p className="mt-4 text-xs text-gray-400 text-center">
          By proceeding, you agree to our{" "}
          <a href="#" className="text-blue-500">Privacy Policy</a>,{" "}
          <a href="#" className="text-blue-500">User Agreement</a> and{" "}
          <a href="#" className="text-blue-500">T&Cs</a>.
        </p>
      </div>
    </div>
  );
}
