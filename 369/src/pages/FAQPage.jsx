import React, { useState, useEffect } from 'react';
import { ChevronDown, MessageCircle, PlayCircle, ShieldCheck, Truck, RotateCcw, Lock } from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Link } from 'react-router-dom';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

export function FAQPage() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState('en');
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    fetch(`${BACKEND_URL}/faqs`)
      .then(r => r.json())
      .then(d => {
        setFaqs(d.faqs || []);
        setLoading(false);
        if (d.faqs?.length > 0) setOpenId(d.faqs[0].id);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 md:py-12">
        {/* Header Section */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
            {lang === 'te' ? 'తరచుగా అడిగే ప్రశ్నలు (FAQ)' : 'Frequently Asked Questions (FAQ)'}
          </h1>
          <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto">
            {lang === 'te' 
              ? 'ULMGH-369 వద్ద షాపింగ్ ఎలా చేయాలో అర్థం చేసుకోవడానికి మీ సహాయార్థం.'
              : 'Everything you need to know about shopping on ULMGH-369.'}
          </p>
          
          <div className="inline-flex bg-white rounded-full p-1 shadow-sm border border-gray-100 mt-6">
            <button onClick={() => setLang('en')} className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${lang === 'en' ? 'bg-[#036e26] text-white shadow-md' : 'text-gray-600 hover:text-gray-900'}`}>English</button>
            <button onClick={() => setLang('te')} className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${lang === 'te' ? 'bg-[#036e26] text-white shadow-md' : 'text-gray-600 hover:text-gray-900'}`}>తెలుగు (Telugu)</button>
          </div>
        </div>

        {/* Video Section */}
        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 mb-10 overflow-hidden relative group cursor-pointer hover:shadow-md transition-shadow">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 rounded-[24px] flex flex-col justify-end p-6">
            <h3 className="text-white text-xl font-bold mb-1 flex items-center gap-2">
              <PlayCircle className="w-6 h-6 text-[#fe6603]" /> 
              {lang === 'te' ? 'ఎలా ఆర్డర్ చేయాలి?' : 'How to Place an Order?'}
            </h3>
            <p className="text-white/80 text-sm">
              {lang === 'te' ? 'మా ప్లాట్‌ఫామ్‌లో మీ మొదటి కొనుగోలు ప్రయాణం.' : 'Customer Shopping Journey on ULMGH-369'}
            </p>
          </div>
          {/* Placeholder for Video. The user mentioned adding a youtube link in the future. */}
          <div className="w-full aspect-video bg-gray-200 rounded-xl relative overflow-hidden">
            <img src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80" alt="Shopping Journey" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="absolute inset-0 z-20 flex items-center justify-center">
              <div className="w-16 h-16 bg-[#fe6603] rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                <PlayCircle className="w-8 h-8 text-white ml-1" />
              </div>
            </a>
          </div>
        </div>

        {/* Accordion FAQ List */}
        <div className="space-y-4 mb-12">
          {loading ? (
            <div className="text-center py-10">
              <div className="w-10 h-10 border-4 border-[#036e26]/20 border-t-[#036e26] rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            faqs.map((faq) => {
              const q = (lang === 'te' && faq.question_te) ? faq.question_te : faq.question_en;
              const a = (lang === 'te' && faq.answer_te) ? faq.answer_te : faq.answer_en;
              const isOpen = openId === faq.id;

              return (
                <div key={faq.id} className="bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden">
                  <button 
                    onClick={() => setOpenId(isOpen ? null : faq.id)}
                    className="w-full px-6 py-5 flex items-center justify-between gap-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className={`font-semibold text-base ${isOpen ? 'text-[#036e26]' : 'text-gray-900'}`}>{q}</span>
                    <ChevronDown className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#036e26]' : 'text-gray-400'}`} />
                  </button>
                  <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="px-6 pb-5 pt-2 border-t border-gray-50 text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                      {a}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Quick Links Section */}
        <div className="bg-white rounded-[24px] p-6 sm:p-8 shadow-sm border border-gray-100 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            {lang === 'te' ? 'ఇతర సమాచారం' : 'Need more detailed information?'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/shipping-policy" className="flex flex-col items-center gap-3 p-4 rounded-[16px] hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center"><Truck className="w-6 h-6" /></div>
              <span className="font-semibold text-sm text-gray-800">Shipping Policy</span>
            </Link>
            <Link to="/returns-policy" className="flex flex-col items-center gap-3 p-4 rounded-[16px] hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all">
              <div className="w-12 h-12 bg-orange-50 text-[#fe6603] rounded-full flex items-center justify-center"><RotateCcw className="w-6 h-6" /></div>
              <span className="font-semibold text-sm text-gray-800">Returns & Exchanges</span>
            </Link>
            <Link to="/privacy-policy" className="flex flex-col items-center gap-3 p-4 rounded-[16px] hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center"><Lock className="w-6 h-6" /></div>
              <span className="font-semibold text-sm text-gray-800">Privacy Policy</span>
            </Link>
            <Link to="/contact" className="flex flex-col items-center gap-3 p-4 rounded-[16px] hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all">
              <div className="w-12 h-12 bg-green-50 text-[#036e26] rounded-full flex items-center justify-center"><MessageCircle className="w-6 h-6" /></div>
              <span className="font-semibold text-sm text-gray-800">Customer Support</span>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
