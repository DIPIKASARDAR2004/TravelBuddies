"use client";

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
} from 'react-icons/fa';
import { MdHealthAndSafety } from 'react-icons/md';
import styles from './home.module.css';

interface NavItem {
  href: string;
  label: string;
  icon: JSX.Element;
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

export default function Navbar(): JSX.Element {
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
