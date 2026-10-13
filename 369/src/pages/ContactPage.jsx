import React from 'react';
import { motion } from 'framer-motion';
import { Header } from '../components/Header';
import { Mail, Phone, MapPin, Send, Package, RefreshCcw, CreditCard, HelpCircle, MessageSquare } from 'lucide-react';

export function ContactPage() {
  const helpTopics = [
    { icon: Package, title: 'I want help with my orders', desc: 'Track, cancel or return orders' },
    { icon: RefreshCcw, title: 'I want help with returns & refunds', desc: 'Manage your return requests' },
    { icon: CreditCard, title: 'I want help with payment', desc: 'Payment issues, refunds' },
    { icon: HelpCircle, title: 'I want help with other issues', desc: 'Offers, account, etc.' }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <div className="bg-[#f9f9f9] min-h-screen pb-24 md:pb-16 font-sans relative">
      <Header title="Help Center" variant="home" />
      
      {/* Top Banner */}
      <div className="relative bg-white border-b border-gray-100 py-16 md:py-20 px-4 overflow-hidden mt-2 shadow-sm">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand-orange via-transparent to-transparent"></div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-6xl mx-auto relative z-10 text-center"
        >
          <h1 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight text-[#022A21] font-serif">How can we help you?</h1>
          <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">Our dedicated team is here to assist you 24x7. Reach out to us for any queries or support.</p>
        </motion.div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12 relative z-20">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col lg:flex-row gap-8"
        >
          
          {/* Left Column - Help Topics & Contact */}
          <div className="w-full lg:w-1/3 flex flex-col gap-6">
            
            {/* Help Topics */}
            <motion.div variants={itemVariants} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-md">
              <div className="p-5 border-b border-gray-100 bg-gray-50">
                <h2 className="text-sm font-extrabold text-[#022A21] uppercase tracking-wider flex items-center gap-2 font-serif">
                  <HelpCircle className="w-4 h-4 text-brand-orange" />
                  Quick Help Topics
                </h2>
              </div>
              <div className="flex flex-col p-2">
                {helpTopics.map((topic, index) => (
                  <motion.button 
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    key={index} 
                    className="flex items-start gap-4 p-3 m-1 rounded-xl hover:bg-orange-50/50 transition-all text-left group border border-transparent hover:border-brand-orange/20"
                  >
                    <div className="bg-orange-50 p-2 rounded-lg group-hover:bg-brand-orange/20 transition-colors">
                      <topic.icon className="w-5 h-5 text-brand-orange" />
                    </div>
                    <div className="mt-0.5">
                      <h3 className="text-sm font-bold text-[#022A21] group-hover:text-brand-orange transition-colors">{topic.title}</h3>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{topic.desc}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
            
            {/* Contact Info Card */}
            <motion.div variants={itemVariants} className="bg-white rounded-2xl border border-gray-100 p-6 relative overflow-hidden shadow-md">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -z-10 blur-xl"></div>
              <h2 className="text-sm font-extrabold text-[#022A21] uppercase tracking-wider mb-6 flex items-center gap-2 font-serif">
                <Phone className="w-4 h-4 text-brand-orange" />
                Get in Touch
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4 group">
                  <div className="bg-gray-50 border border-gray-100 p-2.5 rounded-xl group-hover:bg-gray-100 transition-colors shrink-0">
                    <MapPin className="w-5 h-5 text-brand-orange" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#022A21] mb-1">Corporate Office</p>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      D.No.70-126-G-3-6-1,<br/>
                      Near Beearappa Swamy Temple,<br/>
                      Kallur, Kurnool – 518003<br/>
                      Andhra Pradesh - India
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 group">
                  <div className="bg-gray-50 border border-gray-100 p-2.5 rounded-xl group-hover:bg-orange-50 transition-colors shrink-0">
                    <Phone className="w-5 h-5 text-brand-orange" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#022A21] mb-1">Customer Support</p>
                    <p className="text-sm text-gray-600 font-medium">+91 90326 75205</p>
                    <p className="text-xs text-gray-400 mt-0.5">Mon-Sat, 9:00 AM - 6:00 PM</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 group">
                  <div className="bg-gray-50 border border-gray-100 p-2.5 rounded-xl group-hover:bg-blue-50 transition-colors shrink-0">
                    <Mail className="w-5 h-5 text-brand-orange" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#022A21] mb-1">Email Address</p>
                    <a href="mailto:ulmgh369@gmail.com" className="text-sm text-brand-orange hover:text-brand-orange/80 hover:underline font-medium transition-colors">ulmgh369@gmail.com</a>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Contact Form */}
          <motion.div variants={itemVariants} className="w-full lg:w-2/3 flex flex-col">
            <div className="bg-white rounded-2xl border border-gray-100 p-8 md:p-10 flex-1 flex flex-col relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-50 to-transparent rounded-full blur-[80px] -z-10 pointer-events-none"></div>
              
              <div className="flex items-center gap-4 mb-8">
                <div className="bg-orange-50 border border-brand-orange/10 p-3 rounded-2xl shadow-sm">
                  <MessageSquare className="w-6 h-6 text-brand-orange" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-extrabold text-[#022A21] tracking-tight font-serif">Send us a Message</h2>
                  <p className="text-sm text-gray-500 mt-1">We typically reply within 24 hours.</p>
                </div>
              </div>
              
              <form className="space-y-6 flex-1 flex flex-col" onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider ml-1">Full Name</label>
                    <input type="text" className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-brand-orange transition-all bg-gray-50 hover:bg-gray-100 focus:bg-white placeholder-gray-400" placeholder="John Doe" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider ml-1">Email Address</label>
                    <input type="email" className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-brand-orange transition-all bg-gray-50 hover:bg-gray-100 focus:bg-white placeholder-gray-400" placeholder="john@example.com" />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider ml-1">Subject / Order ID</label>
                  <input type="text" className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-brand-orange transition-all bg-gray-50 hover:bg-gray-100 focus:bg-white placeholder-gray-400" placeholder="What is this regarding?" />
                </div>
                
                <div className="flex-1 flex flex-col space-y-1.5">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider ml-1">Description</label>
                  <textarea className="w-full flex-1 min-h-[180px] px-4 py-3.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-brand-orange transition-all bg-gray-50 hover:bg-gray-100 focus:bg-white resize-none placeholder-gray-400" placeholder="Please describe your issue in detail..."></textarea>
                </div>
                
                <div className="pt-4 flex justify-end">
                  <motion.button 
                    whileHover={{ scale: 1.02, translateY: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-gradient-to-r from-brand-orange to-yellow-500 text-white font-bold py-4 px-10 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 w-full md:w-auto overflow-hidden relative group"
                  >
                    <span className="absolute inset-0 w-full h-full bg-white/20 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300 ease-out"></span>
                    <Send className="w-5 h-5 relative z-10 drop-shadow-md" />
                    <span className="relative z-10 drop-shadow-md">Send Message</span>
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
          
        </motion.div>
      </div>
    </div>
  );
}
