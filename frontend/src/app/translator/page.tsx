/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
"use client";

import React, { useState, useCallback } from 'react';
import { 
  ArrowRightLeftIcon, 
  CopyIcon, 
  CheckIcon, 
  XIcon, 
  MicIcon, 
  Volume2Icon 
} from '@/components/icons';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { translateText } from '@/lib/services/translationService';

// Helper for class names
const cx = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

// --- Language Configuration ---
const languages = [
    { code: 'bn-BD', name: 'Bangla' },
    { code: 'en-US', name: 'English' },
    { code: 'hi-IN', name: 'Hindi' },
    { code: 'ta-IN', name: 'Tamil' },
    { code: 'te-IN', name: 'Telugu' },
    { code: 'gu-IN', name: 'Gujarati' },
    { code: 'mr-IN', name: 'Marathi' },
];

export default function TranslatorPage() {
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLangCode, setSourceLangCode] = useState('bn-BD');
  const [targetLangCode, setTargetLangCode] = useState('en-US');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const maxChars = 5000;
  
  const sourceLangName = languages.find(l => l.code === sourceLangCode)?.name || 'Source Language';
  const targetLangName = languages.find(l => l.code === targetLangCode)?.name || 'Target Language';

  const { isListening, toggleListening, error, setError } = useSpeechRecognition(sourceLangCode, (text) => {
    setInputText(prev => prev.trim() ? `${prev.trim()} ${text}` : text);
  });

  const handleTranslate = useCallback(async () => {
    if (!inputText.trim()) {
      setError('Please enter some text to translate.');
      return;
    }
    setIsLoading(true);
    setError('');
    setTranslatedText('');

    try {
      const translation = await translateText(inputText, sourceLangName, targetLangName);
      setTranslatedText(translation);
    } catch (err: any) {
      setError(err.message || 'An error occurred during translation.');
    } finally {
      setIsLoading(false);
    }
  }, [inputText, sourceLangName, targetLangName, setError]);
  
  const handleCopy = () => {
    if (translatedText) {
      navigator.clipboard.writeText(translatedText).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(err => {
        console.error('Failed to copy text: ', err);
      });
    }
  };

  const handleClear = () => {
    setInputText('');
    setTranslatedText('');
    setError('');
  };
  
  const handleSwapLanguages = () => {
    setSourceLangCode(targetLangCode);
    setTargetLangCode(sourceLangCode);
    setInputText(translatedText);
    setTranslatedText(inputText);
  };
  
  const handleSpeak = () => {
    if (translatedText && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(translatedText);
        utterance.lang = targetLangCode;
        window.speechSynthesis.speak(utterance);
    }
  };
  
  const LanguageSelector = ({ selected, onChange }: { selected: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void }) => (
    <div className="relative">
      <select 
        value={selected}
        onChange={onChange}
        className="appearance-none w-full bg-gray-50 border-2 border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white dark:bg-slate-800 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 text-lg font-semibold"
      >
        {languages.map(lang => (
            <option key={lang.code} value={lang.code}>{lang.name}</option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 font-sans text-gray-800 pt-24">
      <main className="flex-grow container mx-auto p-4 md:p-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 border border-gray-200/80">
        <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-800">
              AI Language Translator
            </h1>
            <p className="text-gray-500 mt-2 text-md">Powered by Gemini AI</p>
        </div>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 md:gap-6 items-center mb-6">
            <LanguageSelector selected={sourceLangCode} onChange={e => setSourceLangCode(e.target.value)} />
            <div className="flex justify-center items-center">
                <button
                    onClick={handleSwapLanguages}
                    className="p-3 rounded-full text-gray-600 bg-gray-100 hover:bg-pink-100 hover:text-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-110"
                    aria-label="Swap languages"
                >
                    <ArrowRightLeftIcon className="w-5 h-5" />
                </button>
            </div>
            <LanguageSelector selected={targetLangCode} onChange={e => setTargetLangCode(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Input Text Area */}
            <div className="relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Enter ${sourceLangName} text here...`}
                maxLength={maxChars}
                className="w-full h-72 p-4 pb-16 text-lg border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition duration-200 resize-none leading-relaxed shadow-inner"
                disabled={isLoading}
              />
              <div className="absolute bottom-4 left-4 flex items-center space-x-4">
                 <button onClick={toggleListening} className={cx("w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 shadow-md", isListening ? "bg-green-500 text-white animate-pulse" : "bg-gray-500 hover:bg-blue-600 text-white")}>
                    <MicIcon className="w-6 h-6"/>
                </button>
                <div className="text-xs text-gray-400">
                    {inputText.length} / {maxChars}
                </div>
              </div>

               {inputText && (
                  <button onClick={handleClear} className="absolute top-4 right-4 p-2 rounded-full bg-gray-200 text-gray-600 hover:bg-red-200">
                      <XIcon className="w-5 h-5"/>
                  </button>
                )}
            </div>

            {/* Output Text Area */}
            <div className="relative bg-gray-50 rounded-xl border-2 border-gray-200 group">
              <textarea
                value={isLoading ? "Translating..." : translatedText}
                readOnly
                placeholder="Translation will appear here..."
                className="w-full h-72 p-4 text-lg bg-transparent rounded-xl resize-none focus:outline-none leading-relaxed"
              />
              {translatedText && !isLoading && (
                 <div className="absolute top-4 right-4 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={handleSpeak}
                        className="p-2 rounded-full bg-gray-200 text-gray-600 hover:bg-pink-100"
                        aria-label="Speak translated text"
                    >
                       <Volume2Icon className="w-5 h-5"/>
                    </button>
                    <button 
                    onClick={handleCopy}
                    className="p-2 rounded-full bg-gray-200 text-gray-600 hover:bg-pink-100"
                    aria-label="Copy translated text"
                    >
                    {copied ? <CheckIcon className="w-5 h-5 text-pink-600"/> : <CopyIcon className="w-5 h-5"/>}
                    </button>
                 </div>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-6 text-center text-red-600 bg-red-100 p-3 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleTranslate}
              disabled={isLoading || !inputText.trim()}
              className={cx(
                "w-full sm:w-auto px-10 py-4 text-lg font-bold text-white rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-offset-2 transform hover:scale-105 shadow-lg hover:shadow-xl",
                "bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:from-pink-600 hover:to-fuchsia-700 focus:ring-fuchsia-500",
                (isLoading || !inputText.trim()) && "bg-gradient-to-r from-pink-300 to-fuchsia-400 cursor-not-allowed shadow-none scale-100"
              )}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Translating...</span>
                </div>
              ) : (
                'Translate Text'
              )}
            </button>
          </div>
        </div>
      </main>
      
      <footer className="text-center p-6 text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} AI Translator. All rights reserved.</p>
      </footer>
    </div>
  );
}
