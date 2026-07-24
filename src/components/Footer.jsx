import React, { useRef, memo } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { FiMail, FiPhone, FiClock, FiArrowUpRight } from 'react-icons/fi';
import { FaFacebook, FaTwitter, FaInstagram } from 'react-icons/fa';
import {
  RiMapPin2Line, RiHome3Line, RiDeviceLine,
  RiTruckLine, RiStore2Line, RiShieldCheckLine,
  RiVerifiedBadgeLine,
} from 'react-icons/ri';
import logo from '../images/final-logobg.webp';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const BrandIllustration = memo(({ darkMode }) => (
  <svg viewBox="0 0 220 180" className="w-full h-full">
    <circle cx="180" cy="30" r="46" fill={darkMode ? 'rgba(52,211,153,0.10)' : 'rgba(16,185,129,0.08)'} />
    <circle cx="30" cy="150" r="34" fill={darkMode ? 'rgba(52,211,153,0.08)' : 'rgba(16,185,129,0.06)'} />
    <g transform="translate(96,40)">
      <rect x="0" y="0" width="52" height="86" rx="9" fill="none" stroke={darkMode ? '#34d399' : '#10b981'} strokeWidth="2.4" strokeOpacity="0.55" />
      <rect x="8" y="10" width="36" height="56" rx="2" fill={darkMode ? 'rgba(52,211,153,0.10)' : 'rgba(16,185,129,0.08)'} />
      <circle cx="26" cy="76" r="3" fill={darkMode ? '#34d399' : '#10b981'} fillOpacity="0.5" />
    </g>
    <g transform="translate(140,64) rotate(28)">
      <rect x="-4" y="-26" width="8" height="36" rx="3" fill={darkMode ? '#34d399' : '#10b981'} fillOpacity="0.7" />
      <circle cx="0" cy="-26" r="10.5" fill="none" stroke={darkMode ? '#34d399' : '#10b981'} strokeOpacity="0.7" strokeWidth="5" />
    </g>
    <path d="M56 30 L62 14 L58 14 L64 -2 L54 12 L58 12 Z" fill="#fbbf24" fillOpacity="0.8" transform="translate(20,30)" />
    <circle cx="192" cy="118" r="3" fill={darkMode ? '#6ee7b7' : '#34d399'} fillOpacity="0.7" />
    <circle cx="204" cy="106" r="2" fill={darkMode ? '#6ee7b7' : '#34d399'} fillOpacity="0.6" />
    <circle cx="66" cy="18" r="2.4" fill={darkMode ? '#6ee7b7' : '#34d399'} fillOpacity="0.6" />
  </svg>
));

const FooterLink = ({ to, Icon, label, external }) => (
  <li>
    {external ? (
      <a href={to} target="_blank" rel="noopener noreferrer"
        className="group flex items-center gap-2.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all duration-200 hover:translate-x-1.5">
        {Icon && <Icon className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
        {label}
        <FiArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      </a>
    ) : (
      <Link to={to}
        className="group flex items-center gap-2.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all duration-200 hover:translate-x-1.5">
        {Icon && <Icon className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
        {label}
      </Link>
    )}
  </li>
);

const SocialBtn = ({ href, Icon, label }) => (
  <motion.a whileHover={{ y: -3, scale: 1.08 }} whileTap={{ scale: 0.95 }}
    href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
    className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-300 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-500 border border-gray-200 dark:border-gray-700 hover:border-emerald-500 transition-colors duration-200">
    <Icon className="w-4 h-4" />
  </motion.a>
);

const ContactRow = ({ Icon, darkMode, children }) => (
  <li className="flex items-start gap-3">
    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${darkMode ? 'bg-emerald-900/30' : 'bg-emerald-50'}`}>
      <Icon className="w-3.5 h-3.5 text-emerald-500" />
    </div>
    <div className="pt-1">{children}</div>
  </li>
);

const Footer = ({ darkMode }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  const quickLinks = [
    { to: '/',       Icon: RiHome3Line,  label: 'Home'        },
    { to: '/devices',Icon: RiDeviceLine, label: 'Devices'     },
    { to: '/track',  Icon: RiTruckLine,  label: 'Track Order' },
    { to: '/shops',  Icon: RiStore2Line, label: 'Shops'       },
  ];

  const services = [
    { to: '/services/repair',    label: 'Device Repair'      },
    { to: '/services/refurbish', label: 'Refurbished Sales'  },
    { to: '/services/warranty',  label: 'Warranty Plans',   Icon: RiShieldCheckLine },
    { to: '/services/delivery',  label: 'Fast Delivery',    Icon: RiTruckLine },
  ];

  return (
    <footer ref={ref} className="relative overflow-hidden bg-emerald-50/40 dark:bg-gray-950">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500" />

      <div className="absolute top-0 left-0 right-0 pointer-events-none">
        <svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg" className="w-full h-16" preserveAspectRatio="none">
          <path d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,20 1440,40 L1440,0 L0,0 Z"
            fill={darkMode ? '#111827' : '#f9fafb'} />
        </svg>
      </div>

      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(16,185,129,0.18) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          opacity: darkMode ? 0.06 : 0.5,
        }} />

      <div className="absolute top-1/4 left-0 w-72 h-72 rounded-full bg-emerald-400/10 dark:bg-emerald-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-96 h-96 rounded-full bg-teal-400/10 dark:bg-teal-500/5 blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-12 pt-16 pb-10">
        <motion.div
          variants={containerVariants} initial="hidden" animate={inView ? 'visible' : 'hidden'}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 mb-14">
            <motion.div variants={itemVariants} className="relative sm:col-span-2 lg:col-span-1 space-y-5 overflow-hidden">
              <div className="absolute -top-6 -right-10 w-48 h-40 opacity-90 pointer-events-none">
                <BrandIllustration darkMode={darkMode} />
              </div>
              <div className="relative flex items-center gap-3">
                <img src={logo} alt="Tech & Restore" className="h-12 w-auto rounded-xl" />
                <div>
                  <p className="text-gray-900 dark:text-white font-extrabold text-lg leading-tight">Tech & Restore</p>
                  <p className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold">Repair & Buy with Confidence</p>
                </div>
              </div>

              <p className="relative text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-xs">
                Your trusted partner for premium device repairs and certified refurbished electronics across Egypt.
              </p>

              <div className="relative flex flex-wrap gap-2">
                {['Certified', 'Genuine Parts', '6-Mo Warranty'].map((b) => (
                  <span key={b}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-emerald-400/10 text-emerald-700 dark:text-emerald-400 border border-emerald-400/20">
                    <RiVerifiedBadgeLine className="w-3 h-3" />{b}
                  </span>
                ))}
              </div>

              <div className="relative flex gap-2.5 pt-1">
                <SocialBtn href="https://facebook.com"  Icon={FaFacebook}  label="Facebook"  />
                <SocialBtn href="https://twitter.com"   Icon={FaTwitter}   label="Twitter"   />
                <SocialBtn href="https://instagram.com" Icon={FaInstagram} label="Instagram" />
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h3 className="text-gray-900 dark:text-white font-bold text-base mb-5 flex items-center gap-2">
                <span className="w-1 h-4 rounded-full bg-gradient-to-b from-emerald-400 to-teal-500 inline-block" />
                Quick Links
              </h3>
              <ul className="space-y-3">
                {quickLinks.map((l) => <FooterLink key={l.to} {...l} />)}
              </ul>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h3 className="text-gray-900 dark:text-white font-bold text-base mb-5 flex items-center gap-2">
                <span className="w-1 h-4 rounded-full bg-gradient-to-b from-emerald-400 to-teal-500 inline-block" />
                Our Services
              </h3>
              <ul className="space-y-3">
                {services.map((s) => <FooterLink key={s.to} {...s} />)}
              </ul>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h3 className="text-gray-900 dark:text-white font-bold text-base mb-5 flex items-center gap-2">
                <span className="w-1 h-4 rounded-full bg-gradient-to-b from-emerald-400 to-teal-500 inline-block" />
                Contact Us
              </h3>
              <ul className="space-y-4">
                <ContactRow Icon={RiMapPin2Line} darkMode={darkMode}>
                  <span className="text-gray-500 dark:text-gray-400 text-sm">Cairo, Al Maadi,<br />Egypt</span>
                </ContactRow>
                <ContactRow Icon={FiPhone} darkMode={darkMode}>
                  <a href="tel:+2019999" className="text-gray-500 dark:text-gray-400 text-sm hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">+20 19999</a>
                </ContactRow>
                <ContactRow Icon={FiMail} darkMode={darkMode}>
                  <a href="mailto:support@techbazaar.com" className="text-gray-500 dark:text-gray-400 text-sm hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors break-all">
                    support@techrestore.com
                  </a>
                </ContactRow>
                <ContactRow Icon={FiClock} darkMode={darkMode}>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">24/7 Customer Support</p>
                  <p className="text-emerald-600/70 dark:text-emerald-400/60 text-xs mt-0.5">Always here to help</p>
                </ContactRow>
              </ul>
            </motion.div>
          </div>
        </motion.div>

        <div className="border-t border-gray-200 dark:border-gray-800" />

        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 text-sm"
        >
          <p className="text-gray-500 dark:text-gray-500 text-center sm:text-left">
            © {new Date().getFullYear()}{' '}
            <span className="font-bold text-emerald-600 dark:text-emerald-400">Tech Restore</span>. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-5">
            {[
              { to: '/privacy', label: 'Privacy Policy'  },
              { to: '/terms',   label: 'Terms of Service'},
              { to: '/cookies', label: 'Cookie Policy'   },
            ].map(({ to, label }) => (
              <Link key={to} to={to}
                className="text-gray-400 dark:text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-200 text-sm">
                {label}
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default memo(Footer);