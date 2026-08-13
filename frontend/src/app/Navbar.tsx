"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  FaHotel,
  FaHome,
  FaMap,
  FaTrain,
  FaBus,
  FaInfoCircle,
  FaFemale ,
  FaMoneyBill,
  FaLanguage,
  FaSun,
  FaMoon,
} from 'react-icons/fa';
import { MdHealthAndSafety } from 'react-icons/md';
import styles from './home.module.css';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  
  { href: '/hotel',     label: 'Hotels',            icon: <FaHotel style={{ color: "blue", fontSize: "24px" }} /> },
  { href: '/map',   label: 'Map',  icon: <FaMap style={{ color: "blue", fontSize: "24px" }} /> },
  { href: '/train',     label: 'trains',            icon: <FaTrain style={{ color: "blue", fontSize: "24px" }} /> },
  { href: '/bus',      label: 'Buses',             icon: <FaBus style={{ color: "blue", fontSize: "24px" }} /> },
  { href: '/about', label: 'About Us', icon: <FaInfoCircle style={{ color: "blue", fontSize: "24px" }} /> },
  { href: '/lady', label: 'only ladies', icon: <FaFemale style={{ color: "blue", fontSize: "24px" }} /> },
  { href: '/budgets', label: 'Budget calculation', icon: <FaMoneyBill style={{ color: "blue", fontSize: "24px" }} /> },
  { href: '/translator', label: 'Translator', icon: <FaLanguage style={{ color: "blue", fontSize: "24px" }} /> },
  
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
    <nav className={styles.navbar}>
      <div className={styles.logo}>
        <Link href="/" className={styles.logoLink}>
          <Image
            src="/imag.png"
            alt="Logo"
            width={140}
            height={90}
            className={styles.logoImage}
          />
        </Link>
      </div>

      <ul className={styles.navItems}>
        {navItems.map(({ href, label, icon }) => (
          <li key={href} className={styles.navItem}>
            <Link href={href} className={styles.link}>
              <span className={styles.icon}>{icon}</span>
              <span className={styles.label}>{label}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className={styles.authLinks}>
        <button
          onClick={toggleTheme}
          className={styles.themeToggle}
          aria-label="Toggle Theme"
        >
          {theme === 'light' ? (
            <FaMoon className={styles.themeToggleIcon} />
          ) : (
            <FaSun className={styles.themeToggleIcon} />
          )}
        </button>
        <Link href="/login" className={styles.authButton}>
          Login
        </Link>
        <span className={styles.authDivider}>/</span>
        <Link href="/login" className={styles.authButton}>
          Create Account
        </Link>
      </div>
    </nav>
  );
}
