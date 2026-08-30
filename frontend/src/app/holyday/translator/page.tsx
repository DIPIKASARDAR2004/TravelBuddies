"use client";

import React, { useState } from "react";
import { FaMicrophone, FaRocket, FaLanguage } from "react-icons/fa";

export default function Translator() {
  const [text, setText] = useState("");
  const [translated, setTranslated] = useState("");
  const [listening, setListening] = useState(false);
  const [confidence, setConfidence] = useState<number | null>(null);

  // 🎤 Fake voice input
  const startListening = () => {
    setListening(true);
    setTimeout(() => {
      const fakeSpeech = "Good morning";
      setText(fakeSpeech);
      fakeTranslate(fakeSpeech);
      setListening(false);
    }, 2500);
  };

  // 🌍 Fake translation
  const fakeTranslate = (inputText: string) => {
    if (!inputText.trim()) {
      setTranslated("⚠️ Please enter text first.");
      return;
    }

    const mockTranslations: Record<string, string> = {
      hello: "नमस्ते",
      world: "दुनिया",
      food: "भोजन",
      travel: "यात्रा",
      "good morning": "सुप्रभात",
    };

    const result =
      mockTranslations[inputText.toLowerCase()] || "✨ [Creative Translation Output]";

    const fakeConfidence = Math.floor(Math.random() * 30) + 70;
    setConfidence(fakeConfidence);

    let i = 0;
    setTranslated("");
    const interval = setInterval(() => {
      setTranslated((prev) => prev + result[i]);
      i++;
      if (i >= result.length) clearInterval(interval);
    }, 60);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-700 via-pink-600 to-indigo-700 p-6 text-white">
      {/* Glass Card */}
      <div className="w-full max-w-4xl bg-white dark:bg-slate-800/10 backdrop-blur-md shadow-2xl rounded-3xl border border-white/20 p-10">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <FaLanguage className="text-5xl text-yellow-300 animate-bounce mb-3" />
          <h1 className="text-4xl font-extrabold tracking-wide text-yellow-100 drop-shadow-lg">
            🌍 Creative AI Translator
          </h1>
          <p className="text-sm text-yellow-200 mt-2">
            Type, Speak & Watch Magic Happen ✨
          </p>
        </div>

        {/* Input + Output */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Input Box */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-yellow-200 mb-2">
              Your Text
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="✍️ Start typing..."
              className="w-full h-40 p-4 rounded-xl text-gray-900 text-lg shadow-inner border-2 border-yellow-300 focus:ring-4 focus:ring-yellow-400 focus:outline-none"
            />
          </div>

          {/* Output Box */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-yellow-200 mb-2">
              Translation
            </label>
            <div className="w-full h-40 p-4 rounded-xl bg-black/30 border-2 border-yellow-400 text-xl font-semibold shadow-inner overflow-y-auto">
              {translated || "⚡ Translation will appear here..."}
            </div>
            {confidence && (
              <p className="text-sm text-yellow-300 mt-2">
                🤖 Confidence: {confidence}%
              </p>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-center gap-6 mt-10">
          <button
            onClick={() => fakeTranslate(text)}
            className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-6 py-3 rounded-xl font-bold text-lg shadow-lg transition transform hover:scale-105"
          >
            <FaRocket /> Translate
          </button>

          <button
            onClick={startListening}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-lg shadow-lg transform transition hover:scale-105 ${
              listening
                ? "bg-red-500 animate-pulse text-white"
                : "bg-green-400 hover:bg-green-500 text-gray-900"
            }`}
          >
            <FaMicrophone />
            {listening ? "Listening..." : "Speak"}
          </button>
        </div>
      </div>
    </div>
  );
}
