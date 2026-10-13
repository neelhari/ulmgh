import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, ChevronRight } from 'lucide-react';
import logoUrl from '../assets/logo.png';

export function Footer() {
  return (
    <footer className="hidden md:block bg-[#022A21] border-t-2 border-brand-orange/40 mt-12 w-full relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-brand-orange/10 blur-[120px] pointer-events-none rounded-full" />
      
      {/* Newsletter Section */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-16 pb-12 border-b border-[#054335] relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 bg-[#033429] p-8 md:p-10 rounded-3xl border border-[#065A46] shadow-xl">
          <div className="max-w-xl text-center md:text-left">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-3" style={{ fontFamily: 'Georgia, serif' }}>Join the ULMGH-369 Community</h3>
            <p className="text-gray-300 text-sm md:text-base">Subscribe to receive exclusive offers, new product updates, special opportunities, and inspiring stories from local businesses and creators across our growing marketplace.</p>
          </div>
          <div className="w-full md:w-auto flex-1 max-w-md flex items-center gap-2 relative">
            <input 
              type="email" 
              placeholder="Enter your email address..." 
              className="w-full bg-[#022A21] border border-[#065A46] rounded-full py-3.5 pl-6 pr-32 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-orange transition-all"
            />
            <button className="absolute right-1.5 top-1.5 bottom-1.5 bg-gradient-to-r from-brand-orange to-yellow-500 hover:from-brand-orange/90 hover:to-yellow-500/90 text-white font-bold px-6 rounded-full text-sm transition-all shadow-lg hover:shadow-brand-orange/30">
              Subscribe
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-12 pb-24 md:pb-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-12">
          
          {/* Brand Info */}
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <img src={logoUrl} alt="ULMGH369" className="w-16 md:w-20 object-contain filter drop-shadow-sm" />
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-serif" style={{ fontFamily: 'Georgia, serif' }}>
                ULMGH-369
              </h2>
            </div>
            <p className="text-[14px] text-gray-300 leading-relaxed pr-4">
              Your trusted online marketplace connecting local entrepreneurs, farmers, artisans, weavers, manufacturers, and businesses with customers across India and beyond. Discover genuine products, quality, convenience, and trusted service — all in one platform.
            </p>
            <div className="text-brand-orange font-bold text-sm uppercase tracking-wider mt-2 mb-2">Local to Global</div>
            <div className="flex items-center gap-3 mt-2">
              <a href="#" className="w-10 h-10 rounded-full bg-[#054335] border border-brand-orange/30 flex items-center justify-center text-brand-orange hover:bg-brand-orange hover:text-white transition-all hover:-translate-y-1 shadow-[0_4px_10px_rgba(255,153,0,0.1)]">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/></svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-[#054335] border border-brand-orange/30 flex items-center justify-center text-brand-orange hover:bg-brand-orange hover:text-white transition-all hover:-translate-y-1 shadow-[0_4px_10px_rgba(255,153,0,0.1)]">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-[#054335] border border-brand-orange/30 flex items-center justify-center text-brand-orange hover:bg-brand-orange hover:text-white transition-all hover:-translate-y-1 shadow-[0_4px_10px_rgba(255,153,0,0.1)]">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-[#054335] border border-brand-orange/30 flex items-center justify-center text-brand-orange hover:bg-brand-orange hover:text-white transition-all hover:-translate-y-1 shadow-[0_4px_10px_rgba(255,153,0,0.1)]">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.015 3.015 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.501 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.55 9.377.55 9.377.55s7.505 0 9.377-.55a3.015 3.015 0 0 0 2.122 2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-bold text-white mb-2 relative inline-block">
              Quick Links
              <span className="absolute -bottom-1 left-0 w-8 h-1 bg-brand-orange rounded-full"></span>
            </h3>
            {[
              { name: 'Home', path: '/' },
              { name: 'Shop All', path: '/category/all' },
              { name: 'Heartfulness Meditation', path: '/meditation' },
              { name: 'My Account', path: '/profile' },
              { name: 'Order Tracking', path: '/my-orders' }
            ].map(link => (
              <Link key={link.name} to={link.path} className="group flex items-center text-[14px] text-gray-300 hover:text-brand-orange transition-colors w-fit">
                <ChevronRight className="w-4 h-4 mr-1 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all text-brand-orange" />
                <span className="group-hover:translate-x-1 transition-transform">{link.name}</span>
              </Link>
            ))}
          </div>

          {/* Customer Service */}
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-bold text-white mb-2 relative inline-block">
              Customer Help & Support
              <span className="absolute -bottom-1 left-0 w-8 h-1 bg-brand-orange rounded-full"></span>
            </h3>
            {[
              { name: 'Contact Us', path: '/contact' },
              { name: 'About Us', path: '/about' },
              { name: 'Shipping Policy', path: '/shipping-policy' },
              { name: 'Replacements & Exchanges', path: '/returns-policy' },
              { name: 'FAQ & Help', path: '/faqs' },
              { name: 'Vendor Guidelines', path: '/vendor-guidelines' },
              { name: 'How to Shop (Video)', path: 'https://youtube.com/', external: true }
            ].map(link => (
              link.external ? (
                <a key={link.name} href={link.path} target="_blank" rel="noopener noreferrer" className="group flex items-center text-[14px] text-gray-300 hover:text-brand-orange transition-colors w-fit">
                  <ChevronRight className="w-4 h-4 mr-1 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all text-brand-orange" />
                  <span className="group-hover:translate-x-1 transition-transform">{link.name}</span>
                </a>
              ) : (
                <Link key={link.name} to={link.path} className="group flex items-center text-[14px] text-gray-300 hover:text-brand-orange transition-colors w-fit">
                  <ChevronRight className="w-4 h-4 mr-1 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all text-brand-orange" />
                  <span className="group-hover:translate-x-1 transition-transform">{link.name}</span>
                </Link>
              )
            ))}
          </div>

          {/* Contact Info */}
          <div className="flex flex-col gap-5">
            <h3 className="text-lg font-bold text-white mb-1 relative inline-block">
              Contact Us
              <span className="absolute -bottom-1 left-0 w-8 h-1 bg-brand-orange rounded-full"></span>
            </h3>
            <div className="flex items-start gap-3 text-[14px] text-gray-300 group cursor-default">
              <div className="w-9 h-9 rounded-full bg-[#054335] border border-brand-orange/20 flex items-center justify-center shrink-0 group-hover:bg-brand-orange group-hover:border-brand-orange transition-all text-brand-orange group-hover:text-white">
                <MapPin className="w-4 h-4" />
              </div>
              <span className="leading-relaxed mt-1 group-hover:text-white transition-colors">D.No.70-126-G-3-6-1,<br/>Near Beearappa Swamy Temple,<br/>Kallur, Kurnool – 518003<br/>Andhra Pradesh - India<br/><span className="text-[11px] text-brand-orange/70 font-medium tracking-wider"></span></span>
            </div>
            <div className="flex items-center gap-3 text-[14px] text-gray-300 group cursor-default">
              <div className="w-9 h-9 rounded-full bg-[#054335] border border-brand-orange/20 flex items-center justify-center shrink-0 group-hover:bg-brand-orange group-hover:border-brand-orange transition-all text-brand-orange group-hover:text-white">
                <Phone className="w-4 h-4" />
              </div>
              <span className="font-medium group-hover:text-white transition-colors">+91 90326 75205</span>
            </div>
            <div className="flex items-center gap-3 text-[14px] text-gray-300 group cursor-default">
              <div className="w-9 h-9 rounded-full bg-[#054335] border border-brand-orange/20 flex items-center justify-center shrink-0 group-hover:bg-brand-orange group-hover:border-brand-orange transition-all text-brand-orange group-hover:text-white">
                <Mail className="w-4 h-4" />
              </div>
              <span className="font-medium group-hover:text-white transition-colors">ulmgh369@gmail.com</span>
            </div>
          </div>

        </div>

        <div className="mt-12 pt-6 border-t border-[#054335] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[14px] text-gray-400 font-medium tracking-wide">
            &copy; {new Date().getFullYear()} ULMGH-369. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link to="/privacy-policy" className="text-[14px] text-gray-400 hover:text-brand-orange transition-colors font-medium">Privacy Policy</Link>
            <Link to="/terms" className="text-[14px] text-gray-400 hover:text-brand-orange transition-colors font-medium">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
