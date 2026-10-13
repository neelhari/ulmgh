import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '../components/Header';
import { 
  Heart, Sunrise, Leaf, Wind, Sun, Users, Clock, 
  PlayCircle, Bell, ArrowRight, Activity, Smile, Brain, X, Languages
} from 'lucide-react';

export function MeditationPage() {
  const [activeModal, setActiveModal] = useState(null);
  const [lang, setLang] = useState('en');

  const content = {
    en: {
      headerTitle: "Heartfulness Meditation",
      discoverPrefix: "Discover Inner ",
      discoverHighlight: "Peace",
      heroSub: "Take a few minutes every day for inner relaxation, mental calmness, and overall well-being. A simple practice for everyone.",
      beginBtn: "Begin Your Practice",
      visionTitle: "Our Vision for Well-being",
      vision1: "ULMGH-369 aims to bring together Commerce, Technology, Well-being, and Human Values on one platform. Heartfulness Meditation is intended to be an important well-being component of our platform, alongside our e-commerce ecosystem.",
      vision2: "This section is designed to be a peaceful, non-commercial space where you can explore simple guidance for beginners and experience the benefits of regular relaxation.",
      whoTitle: "Who Can Benefit?",
      whoSub: "Heartfulness is for people from all walks of life. No prior experience is needed.",
      practiceTitle: "Suggested Daily Practice",
      practiceSub: "We encourage you to spend 10–30 minutes a day for meditation, according to your individual comfort and availability.",
      habitTitle: "Build a Daily Habit",
      habitSub: "Set a gentle daily reminder to take time for yourself.",
      enableBtn: "Enable Reminders",
      startNowBtn: "Start Now",
      sessionSub: "Session",
      comingSoon: "Audio/Video content integration coming soon. <br/> Close your eyes and gently focus on your heart."
    },
    te: {
      headerTitle: "హార్ట్‌ఫుల్‌నెస్ ధ్యానం",
      discoverPrefix: "అంతరంగిక ",
      discoverHighlight: "శాంతిని కనుగొనండి",
      heroSub: "ఆంతరంగిక విశ్రాంతి, మానసిక ప్రశాంతత మరియు మొత్తం శ్రేయస్సు కోసం ప్రతిరోజూ కొన్ని నిమిషాలు కేటాయించండి. అందరికీ ఒక సులభమైన సాధన.",
      beginBtn: "మీ సాధన ప్రారంభించండి",
      visionTitle: "మా శ్రేయస్సు దృష్టి",
      vision1: "వాణిజ్యం, సాంకేతికత, శ్రేయస్సు మరియు మానవ విలువలను ఒకే వేదికపైకి తీసుకురావాలని ULMGH-369 లక్ష్యంగా పెట్టుకుంది. హార్ట్‌ఫుల్‌నెస్ ధ్యానం మా ఇ-కామర్స్ పర్యావరణ వ్యవస్థతో పాటు మా ప్లాట్‌ఫామ్‌లో ముఖ్యమైన భాగంగా ఉద్దేశించబడింది.",
      vision2: "ఈ విభాగం ఒక ప్రశాంతమైన, వాణిజ్యేతర ప్రదేశంగా రూపొందించబడింది, ఇక్కడ మీరు ప్రారంభకులకు సాధారణ మార్గదర్శకత్వాన్ని అన్వేషించవచ్చు మరియు రోజువారీ విశ్రాంతి ప్రయోజనాలను అనుభవించవచ్చు.",
      whoTitle: "ఎవరికి ప్రయోజనం?",
      whoSub: "హార్ట్‌ఫుల్‌నెస్ అన్ని వర్గాల ప్రజల కోసం. ఎలాంటి మునుపటి అనుభవం అవసరం లేదు.",
      practiceTitle: "సూచించిన రోజువారీ సాధన",
      practiceSub: "మీ వ్యక్తిగత సౌలభ్యం మరియు లభ్యతను బట్టి రోజుకు 10–30 నిమిషాలు ధ్యానం కోసం కేటాయించమని మేము మిమ్మల్ని ప్రోత్సహిస్తున్నాము.",
      habitTitle: "రోజువారీ అలవాటును చేసుకోండి",
      habitSub: "మీ కోసం సమయం కేటాయించడానికి సున్నితమైన రోజువారీ రిమైండర్‌ను సెట్ చేయండి.",
      enableBtn: "రిమైండర్లను ప్రారంభించండి",
      startNowBtn: "ఇప్పుడే ప్రారంభించండి",
      sessionSub: "సెషన్",
      comingSoon: "ఆడియో/వీడియో కంటెంట్ ఏకీకరణ త్వరలో రాబోతోంది. <br/> మీ కళ్ళు మూసుకుని సున్నితంగా మీ హృదయంపై దృష్టి పెట్టండి."
    }
  };

  const t = content[lang];

  const benefits = [
    { icon: <Brain className="w-6 h-6" />, title: 'Mental Clarity', desc: 'Reduce mental clutter and improve focus.' },
    { icon: <Smile className="w-6 h-6" />, title: 'Emotional Balance', desc: 'Cultivate inner peace and emotional resilience.' },
    { icon: <Activity className="w-6 h-6" />, title: 'Overall Well-being', desc: 'Lower stress levels and improve sleep quality.' },
    { icon: <Wind className="w-6 h-6" />, title: 'Deep Relaxation', desc: 'Experience profound calmness in just a few minutes.' },
  ];

  const targetAudience = [
    'Homemakers', 'Farmers', 'Students', 'Employees', 
    'Business owners & entrepreneurs', 'Doctors & healthcare professionals', 
    'Actors & artists', 'Software & other professionals', 
    'Public representatives', 'Senior citizens'
  ];

  const practiceOptions = [
    { duration: '10 Min', title: 'Quick Refresh', desc: 'Perfect for a short break during a busy day.', color: 'from-emerald-400 to-teal-500' },
    { duration: '15 Min', title: 'Deep Calm', desc: 'Ideal for morning centering or evening relaxation.', color: 'from-blue-400 to-indigo-500' },
    { duration: '30 Min', title: 'Profound Peace', desc: 'A deeper dive into stillness and self-discovery.', color: 'from-violet-400 to-purple-500' },
  ];

  return (
    <div className="bg-[#f0f9f6] min-h-screen font-sans text-gray-800 pb-20 md:pb-0 overflow-hidden relative">
      <Header variant="back" title={t.headerTitle} />
      
      {/* Language Toggle */}
      <div className="absolute top-20 right-4 z-50">
        <button 
          onClick={() => setLang(lang === 'en' ? 'te' : 'en')}
          className="flex items-center gap-2 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-teal-100 text-teal-800 font-medium shadow-sm hover:bg-teal-50 transition-colors"
        >
          <Languages className="w-4 h-4" />
          {lang === 'en' ? 'తెలుగు' : 'English'}
        </button>
      </div>

      {/* Hero Section */}
      <div className="relative pt-24 pb-20 md:pt-32 md:pb-28 px-4 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-teal-200/40 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-200/40 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 border border-teal-100 rounded-full text-teal-800 font-medium text-sm mb-6 backdrop-blur-sm">
              <Leaf className="w-4 h-4 text-teal-600" />
              Well-being & Human Values
            </div>
            <h1 className="text-4xl md:text-6xl font-serif text-[#0f4c3a] font-bold mb-6 leading-tight">
              {t.discoverPrefix} <span className="text-teal-600">{t.discoverHighlight}</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              {t.heroSub}
            </p>
            
            <button 
              onClick={() => document.getElementById('practice-section').scrollIntoView({ behavior: 'smooth' })}
              className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg shadow-teal-600/30 transition-all hover:-translate-y-1 flex items-center gap-2 mx-auto"
            >
              {t.beginBtn} <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 md:px-12 space-y-24 pb-24">
        
        {/* Introduction & Vision */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="bg-white/80 backdrop-blur-md rounded-3xl p-8 md:p-12 border border-white shadow-xl shadow-teal-900/5 text-center max-w-4xl mx-auto"
        >
          <Heart className="w-12 h-12 text-rose-400 mx-auto mb-6" />
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#0f4c3a] mb-6">{t.visionTitle}</h2>
          <p className="text-lg text-gray-600 leading-relaxed mb-6">
            {t.vision1}
          </p>
          <p className="text-lg text-gray-600 leading-relaxed font-medium">
            {t.vision2}
          </p>
        </motion.div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className="bg-white rounded-2xl p-6 border border-teal-50 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 mb-4">
                {benefit.icon}
              </div>
              <h3 className="text-lg font-bold text-[#0f4c3a] mb-2">{benefit.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{benefit.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Who Can Benefit */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="bg-[#0f4c3a] rounded-3xl p-10 md:p-16 text-center text-white relative overflow-hidden shadow-2xl"
        >
          <Sun className="absolute -top-10 -right-10 w-64 h-64 text-teal-800/30" />
          
          <div className="relative z-10">
            <h2 className="text-3xl font-serif font-bold mb-4">{t.whoTitle}</h2>
            <p className="text-teal-100 text-lg mb-10 max-w-2xl mx-auto">
              {t.whoSub}
            </p>
            
            <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
              {targetAudience.map((audience, i) => (
                <div key={i} className="bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-full text-sm font-medium text-teal-50">
                  {audience}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Practice Options */}
        <div id="practice-section" className="pt-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#0f4c3a] mb-4">{t.practiceTitle}</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t.practiceSub}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {practiceOptions.map((option, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -8 }}
                className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-gray-200/40 relative overflow-hidden group cursor-pointer"
                onClick={() => setActiveModal(option.duration)}
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${option.color} rounded-full blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity`} />
                
                <div className="flex items-center gap-3 mb-6 relative z-10">
                  <div className="bg-gray-50 p-3 rounded-2xl">
                    <Clock className="w-6 h-6 text-gray-700" />
                  </div>
                  <span className="text-xl font-black text-gray-800">{option.duration}</span>
                </div>
                
                <h3 className="text-2xl font-bold text-[#0f4c3a] mb-3 relative z-10">{option.title}</h3>
                <p className="text-gray-600 mb-8 relative z-10">{option.desc}</p>
                
                <button className="w-full bg-gray-50 hover:bg-teal-50 text-teal-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors relative z-10 group-hover:bg-teal-600 group-hover:text-white">
                  <PlayCircle className="w-5 h-5" /> {t.startNowBtn}
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Reminder Setup */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-teal-50 border border-teal-100 rounded-3xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8"
        >
          <div className="flex items-start gap-4">
            <div className="bg-teal-100 p-3 rounded-full shrink-0">
              <Bell className="w-6 h-6 text-teal-700" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#0f4c3a] mb-2">{t.habitTitle}</h3>
              <p className="text-teal-800/80">{t.habitSub}</p>
            </div>
          </div>
          <button 
            onClick={() => alert("Reminder settings will be available in the upcoming app update!")}
            className="bg-white border border-teal-200 text-teal-700 font-bold px-6 py-3 rounded-full hover:bg-teal-600 hover:text-white hover:border-teal-600 transition-all shadow-sm whitespace-nowrap shrink-0"
          >
            {t.enableBtn}
          </button>
        </motion.div>

      </div>

      {/* Audio/Video Player Modal (Placeholder for future) */}
      <AnimatePresence>
        {activeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
            onClick={() => setActiveModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#0f4c3a] w-full max-w-lg rounded-3xl p-8 md:p-12 text-center text-white relative shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518241353330-0f79754a1414?w=800&q=80')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
              
              <button 
                onClick={() => setActiveModal(null)}
                className="absolute top-6 right-6 text-white/60 hover:text-white bg-white/10 p-2 rounded-full backdrop-blur-md"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="relative z-10">
                <Leaf className="w-12 h-12 text-teal-300 mx-auto mb-6 opacity-80" />
                <h3 className="text-2xl font-serif font-bold mb-2">Guided Relaxation</h3>
                <p className="text-teal-100/80 mb-10">{activeModal} {t.sessionSub}</p>

                <div className="w-32 h-32 rounded-full border-[6px] border-teal-500/30 flex items-center justify-center mx-auto mb-10 relative">
                  <div className="w-28 h-28 rounded-full bg-teal-500/20 animate-pulse flex items-center justify-center">
                    <PlayCircle className="w-12 h-12 text-white ml-2" />
                  </div>
                </div>

                <p 
                  className="text-sm text-teal-100/60"
                  dangerouslySetInnerHTML={{ __html: t.comingSoon }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
