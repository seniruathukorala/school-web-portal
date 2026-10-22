import React from 'react';
import { motion } from 'framer-motion';
import crest from '../assets/logo.jpg';
import './Nav.css';

export default function Navbar({ onOpenPortal, onOpenTeacherPortal }) {
  // Navigation Links Data
  const navLinks = [
    { title: 'මුල් පිටුව', href: '#home' },
    { title: 'අප ගැන', href: '#about' },
    { title: 'විදුහල්පති පණිවිඩය', href: '#principal' },
    { title: 'නිවේදන', href: '#notices' },
    { title: 'සම්බන්ධ වීමට', href: '#contact' },
    { title: 'පාසල් ගීතය', href: '#anthem' },
  ];

  return (
    // 1. Slide down smooth entry animation on initial load
    <motion.header
      className="navbar"
      initial={{ y: -70, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="nav-container">
        {/* Logo & School Name */}
        <div className="logo-area" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* 2. Crest hover micro-interaction */}
          <motion.img
            src={crest}
            alt="School Crest"
            className="crest-img"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          />
          <div className="school-title">
            <h1>තක්ෂිලා මහා විද්‍යාලය-හොරණ</h1>
            <span>Taxila Maha Vidyalaya - Horana</span>
          </div>
        </div>

        <nav>
          <ul className="nav-links">
            {/* 3. Nav item subtle hover bounce */}
            {navLinks.map((item, index) => (
              <motion.li
                key={index}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <a href={item.href}>{item.title}</a>
              </motion.li>
            ))}

            {/* 4. Student Portal Button (Spring click & hover scale) */}
            <li>
              <motion.button
                className="portal-btn"
                onClick={onOpenPortal}
                whileHover={{ scale: 1.05, boxShadow: '0 8px 18px rgba(37, 99, 235, 0.35)' }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              >
                Student Portal
              </motion.button>
            </li>

            {/* 5. Teacher Portal Button (Spring click & hover scale) */}
            <li>
              <motion.button
                className="portal-btn"
                onClick={onOpenTeacherPortal}
                style={{ background: '#059669', color: '#fff' }}
                whileHover={{ scale: 1.05, boxShadow: '0 8px 18px rgba(5, 150, 105, 0.35)' }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              >
                Teacher Portal
              </motion.button>
            </li>
          </ul>
        </nav>
      </div>
    </motion.header>
  );
}