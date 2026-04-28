import heroComputers from '../assets/homepage/hero-computers.jpg';
import heroDisplays from '../assets/homepage/hero-displays.jpg';
import heroAi from '../assets/homepage/hero-ai.jpg';
import heroEnterprise from '../assets/homepage/hero-enterprise.jpg';
import heroProjector from '../assets/homepage/hero-projector.jpg';
import dellLogo from '../assets/brands/dell.svg';
import hpLogo from '../assets/brands/hp.svg';
import googleLogo from '../assets/brands/google.svg';
import lenovoLogo from '../assets/brands/lenovo.svg';
import epsonLogo from '../assets/brands/epson.png';
import microsoftLogo from '../assets/brands/microsoft.png';
import BenQLogo from '../assets/brands/BenQlogo.png';
import appleLogo from '../assets/brands/apple.png';

export const heroSlides = [
  {
    id: 'computers-accessories',
    eyebrow: 'Computers & Accessories',
    headline: 'Unlock performance that powers your business',
    subheadline:
      'High-performance laptops and desktops built for productivity, speed, and scalability.',
    ctaLabel: 'Explore Now',
    href: '/products/laptops',
    image: heroComputers,
    overlayTone: 'from-slate-950/90 via-slate-900/72 to-slate-900/28',
    stats: [
      { label: 'Business-ready devices', value: '500+' },
      { label: 'Fulfilment coverage', value: 'Pan-India' },
      { label: 'Deployment speed', value: '48h' },
    ],
    highlights: ['Commercial pricing', 'Deployment-ready bundles', 'Dedicated account support'],
  },
  {
    id: 'monitors-displays',
    eyebrow: 'Monitors & Display',
    headline: 'See more. Do more.',
    subheadline: 'High-resolution displays designed for clarity, creativity, and precision.',
    ctaLabel: 'View Displays',
    href: '/products/monitors',
    image: heroDisplays,
    overlayTone: 'from-slate-950/84 via-slate-900/62 to-slate-900/12',
    stats: [
      { label: 'Display categories', value: '4K+' },
      { label: 'Workspace readiness', value: 'Multi-screen' },
      { label: 'Support window', value: '24/7' },
    ],
    highlights: ['Monitor bundles', 'Workspace accessories', 'Ready-to-quote inventory'],
  },
  {
    id: 'future-tech-ai',
    eyebrow: 'AI & Future Tech',
    headline: 'Unlock efficiencies across the business',
    subheadline: 'Experience next-generation AI-powered devices built for the future.',
    ctaLabel: 'Explore Innovation',
    href: '/products',
    image: heroAi,
    overlayTone: 'from-slate-950/88 via-slate-900/64 to-slate-900/18',
    stats: [
      { label: 'AI-ready systems', value: 'Next Gen' },
      { label: 'Performance uplift', value: 'Accelerated' },
      { label: 'Future-ready stack', value: 'Unified' },
    ],
    highlights: ['Copilot-ready devices', 'AI productivity workflows', 'Advanced graphics + compute'],
  },
  {
    id: 'enterprise-solutions',
    eyebrow: 'Enterprise Solutions',
    headline: 'Transform your enterprise with smarter technology',
    subheadline: 'End-to-end IT solutions tailored for modern businesses and large-scale operations.',
    ctaLabel: 'Discover Solutions',
    href: '/products/desktops',
    image: heroEnterprise,
    overlayTone: 'from-slate-950/90 via-slate-900/70 to-slate-900/25',
    stats: [
      { label: 'Managed environments', value: 'Secure' },
      { label: 'Infrastructure uptime', value: '99.9%' },
      { label: 'Operational support', value: 'Always-on' },
    ],
    highlights: ['Server infrastructure', 'Network resilience', 'Security-first procurement'],
  },
  {
    id: 'av-projectors',
    eyebrow: 'Audio & Visual',
    headline: 'Command the room.',
    subheadline: 'Professional-grade projectors built for brilliant presentations and immersive large-scale collaboration.',
    ctaLabel: 'View Projectors',
    href: '/products/projectors',
    image: heroProjector,
  },
];



export const categoryBrandStrip = {
  label: 'Trusted OEM Network',
  title: 'Built with the best in tech',
  description:
    'We bring you advanced procurement-ready solutions by partnering with leading global technology brands.',
  ctaLabel: 'View Full Catalog',
  ctaHref: '/products',
  brands: [
    { name: 'Dell', logo: dellLogo },
    { name: 'HP', logo: hpLogo },
    { name: 'BenQ', logo: BenQLogo },
    { name: 'Microsoft', logo: microsoftLogo },
    { name: 'Apple', logo: appleLogo },
    { name: 'Google', logo: googleLogo },
    { name: 'Lenovo', logo: lenovoLogo },
    { name: 'Epson', logo: epsonLogo },
  ],
};

