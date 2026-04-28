import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight,
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MessageCircle,
  PhoneCall,
  Youtube,
} from 'lucide-react';
import { useProducts } from '@/features/catalog/hooks/useProducts';
import { slugify } from '../../utils/helpers';

const contactChannels = [
  {
    label: 'Call Sales',
    value: '+91 9701314138',
    href: 'tel:+919701314138',
    Icon: PhoneCall,
  },
  {
    label: 'WhatsApp',
    value: '+91 9701314138',
    href: 'https://wa.me/919701314138',
    Icon: MessageCircle,
  },
  {
    label: 'Email Desk',
    value: 'sales@sriainfotech.com',
    href: 'mailto:sales@sriainfotech.com',
    Icon: Mail,
  },
];

const supportLinks = [
  { label: 'Contact Support', to: '/contact' },
  { label: 'Partner Login', to: '/login' },
  { label: 'Create Account', to: '/register' },
  { label: 'Browse Catalog', to: '/products' },
  { label: 'Terms & Conditions', to: '/terms-conditions' },
  { label: 'Privacy Policy', to: '/privacy-policy' },
];

const socialLinks = [
  { label: 'LinkedIn', Icon: Linkedin, to: '/contact' },
  { label: 'Instagram', Icon: Instagram, to: '/contact' },
  { label: 'Facebook', Icon: Facebook, to: '/contact' },
  { label: 'YouTube', Icon: Youtube, to: '/contact' },
];

function Footer() {
  const { categories = [] } = useProducts() ?? {};
  const footerCategories = useMemo(() => categories.slice(0, 6), [categories]);

  return (
    <footer className="mt-auto border-t border-slate-200 bg-[#121212] text-white">
      <div className="container-shell py-12 sm:py-14 lg:py-16">
        <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] shadow-[0_24px_60px_rgba(0,0,0,0.24)]">
          <div className="grid gap-8 border-b border-white/10 px-5 py-6 sm:px-6 sm:py-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:px-8">
            <div className="space-y-4">
              <p className="text-[11px] font-black uppercase tracking-[0.34em] text-primary">SRIA Distribution</p>
              <h2 className="max-w-2xl text-2xl font-black tracking-tight text-white sm:text-3xl">
                Enterprise procurement, coordinated with distributor-grade support.
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Source business hardware, accessories, and infrastructure products through a storefront designed for bulk purchasing, category discovery, and partner-assisted quoting.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {contactChannels.map(({ label, value, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel={href.startsWith('http') ? 'noreferrer' : undefined}
                  className="group rounded-2xl border border-white/10 bg-white/5 p-4 transition-all duration-300 hover:border-primary hover:bg-white/10"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-textMain">
                    <Icon size={18} />
                  </span>
                  <p className="mt-4 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                    {label}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white transition-colors group-hover:text-primary">
                    {value}
                  </p>
                </a>
              ))}
            </div>
          </div>

          <div className="grid gap-10 px-5 py-8 sm:px-6 md:grid-cols-2 xl:grid-cols-4 lg:px-8">
            <div className="space-y-4">
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-white">Dynamic Categories</h3>
              <ul className="space-y-3 text-sm text-slate-300">
                {footerCategories.length ? (
                  footerCategories.map((category) => (
                    <li key={category.id}>
                      <Link
                        to={`/products/${slugify(category.name)}`}
                        className="inline-flex items-center gap-2 transition-colors hover:text-primary"
                      >
                        <ChevronRight size={14} className="text-primary" />
                        <span>{category.name}</span>
                      </Link>
                    </li>
                  ))
                ) : (
                  <li className="text-slate-400">Categories load from the live catalog.</li>
                )}
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-white">Help & Support</h3>
              <ul className="space-y-3 text-sm text-slate-300">
                {supportLinks.map((item) => (
                  <li key={item.label}>
                    <Link to={item.to} className="transition-colors hover:text-primary">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-white">Coverage</h3>
              <ul className="space-y-3 text-sm text-slate-300">
                <li>Bulk order coordination</li>
                <li>Commercial pricing assistance</li>
                <li>Pre-sales specification guidance</li>
                <li>After-sales support escalation</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-white">Social Media</h3>
              <div className="flex flex-wrap gap-3">
                {socialLinks.map(({ label, Icon, to }) => (
                  <Link
                    key={label}
                    to={to}
                    aria-label={`${label} updates`}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition-all duration-300 hover:border-primary hover:text-primary"
                  >
                    <Icon size={18} />
                  </Link>
                ))}
              </div>
              <p className="text-sm leading-6 text-slate-400">
                Reach the partner desk for the latest announcements, launches, and channel updates.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-white/10 px-5 py-5 text-xs text-slate-400 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <p>© {new Date().getFullYear()} SRIA Distribution. All rights reserved.</p>

            <p className="text-center lg:absolute lg:left-1/2 lg:-translate-x-1/2">
              Powered by <span className="text-primary font-medium">SRIA Infotech Pvt Ltd</span>
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link to="/products" className="transition-colors hover:text-primary">
                Catalog
              </Link>
              <Link to="/contact" className="transition-colors hover:text-primary">
                Contact
              </Link>
              <Link to="/terms-conditions" className="transition-colors hover:text-primary">
                Terms & Conditions
              </Link>
              <Link to="/privacy-policy" className="transition-colors hover:text-primary">
                Privacy Policy
              </Link>
              <a href="mailto:sales@sriainfotech.com" className="transition-colors hover:text-primary">
                sales@sriainfotech.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
