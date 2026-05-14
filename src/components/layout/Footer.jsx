import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="w-full py-xl px-lg grid grid-cols-1 md:grid-cols-4 gap-gutter max-w-container-max mx-auto bg-surface-container-low border-t border-outline-variant mt-auto">
      {/* Brand / Col 1 */}
      <div className="col-span-1">
        <span className="font-headline-sm text-primary mb-md block">Glasscart</span>
        <p className="text-body-sm font-body-sm text-on-surface-variant mb-md">Premium eyewear for the modern professional. Medical-grade precision meets contemporary design.</p>
        <p className="text-body-sm font-body-sm text-on-surface-variant">© {new Date().getFullYear()} Glasscart Optical. All rights reserved.</p>
      </div>

      {/* Links / Cols 2-4 (Distributed) */}
      <div className="col-span-1 md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-lg">
        <div className="flex flex-col space-y-sm">
          <span className="font-label-md text-label-md text-primary uppercase tracking-wider mb-sm">Shop</span>
          <Link className="text-body-sm font-body-sm text-on-surface-variant hover:text-secondary transition-colors opacity-80 hover:opacity-100" to="/products">Eyeglasses</Link>
          <Link className="text-body-sm font-body-sm text-on-surface-variant hover:text-secondary transition-colors opacity-80 hover:opacity-100" to="/products">Sunglasses</Link>
          <Link className="text-body-sm font-body-sm text-on-surface-variant hover:text-secondary transition-colors opacity-80 hover:opacity-100" to="/products">Contact Lenses</Link>
          <Link className="text-body-sm font-body-sm text-on-surface-variant hover:text-secondary transition-colors opacity-80 hover:opacity-100" to="/products">Accessories</Link>
        </div>
        
        <div className="flex flex-col space-y-sm">
          <span className="font-label-md text-label-md text-primary uppercase tracking-wider mb-sm">Support</span>
          <Link className="text-body-sm font-body-sm text-on-surface-variant hover:text-secondary transition-colors opacity-80 hover:opacity-100" to="/contact">Contact Support</Link>
          <Link className="text-body-sm font-body-sm text-on-surface-variant hover:text-secondary transition-colors opacity-80 hover:opacity-100" to="/shipping">Shipping Info</Link>
          <Link className="text-body-sm font-body-sm text-on-surface-variant hover:text-secondary transition-colors opacity-80 hover:opacity-100" to="/returns">Returns & Exchanges</Link>
          <Link className="text-body-sm font-body-sm text-on-surface-variant hover:text-secondary transition-colors opacity-80 hover:opacity-100" to="/faq">FAQ</Link>
        </div>
        
        <div className="flex flex-col space-y-sm">
          <span className="font-label-md text-label-md text-primary uppercase tracking-wider mb-sm">Company</span>
          <Link className="text-body-sm font-body-sm text-on-surface-variant hover:text-secondary transition-colors opacity-80 hover:opacity-100" to="/about">About Us</Link>
          <Link className="text-body-sm font-body-sm text-on-surface-variant hover:text-secondary transition-colors opacity-80 hover:opacity-100" to="/privacy">Privacy Policy</Link>
          <Link className="text-body-sm font-body-sm text-on-surface-variant hover:text-secondary transition-colors opacity-80 hover:opacity-100" to="/terms">Terms of Service</Link>
          <Link className="text-body-sm font-body-sm text-on-surface-variant hover:text-secondary transition-colors opacity-80 hover:opacity-100" to="/careers">Careers</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
