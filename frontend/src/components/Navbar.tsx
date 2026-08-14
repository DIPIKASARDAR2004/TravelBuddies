"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaMoon, FaSun, FaMapMarkerAlt, FaChevronDown } from 'react-icons/fa';

interface NavItem {
  href: string;
  label: string;
  hasDropdown?: boolean;
}

const navItems: NavItem[] = [
  { href: '/explore', label: 'Explore', hasDropdown: true },
  { href: '/plan', label: 'Plan Trip' },
  { href: '/hotel', label: 'Stays' },
  { href: '/lady', label: 'Safety' },
  { href: '/map', label: 'Map' },
];

export default function Navbar() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 py-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-90 transition-opacity">
          <div className="bg-blue-600 text-white p-2 rounded-full">
            <FaMapMarkerAlt className="text-xl" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold leading-tight text-slate-800 dark:text-white">TravelBuddies</span>
            <span className="text-[10px] text-slate-500 font-medium">Travel Smart. Travel Safe.</span>
          </div>
        </Link>
      </div>

      {/* Center Links */}
      <ul className="hidden md:flex items-center gap-8">
        {navItems.map(({ href, label, hasDropdown }) => (
          <li key={label}>
            <Link 
              href={href} 
              className="flex items-center gap-1 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {label}
              {hasDropdown && <FaChevronDown className="text-[10px] opacity-70" />}
            </Link>
          </li>
        ))}
      </ul>

      {/* Right side Auth & Theme */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          aria-label="Toggle Theme"
        >
          {theme === 'light' ? <FaMoon /> : <FaSun />}
        </button>
        <div className="hidden sm:flex items-center gap-3">
          <Link 
            href="/login" 
            className="px-5 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Login
          </Link>
          <Link 
            href="/signup" 
            className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </nav>
  );
}
