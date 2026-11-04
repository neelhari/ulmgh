import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import logoImg from '../assets/logo.webp';

export function SplashScreen({ onComplete }) {
  const container = useRef(null);
  const logo = useRef(null);
  const textRef = useRef(null);
  const glowRef = useRef(null);

  useGSAP(() => {
    const tl = gsap.timeline({
      onComplete: () => {
        if (onComplete) onComplete();
      }
    });

    // Phase 1: Reveal logo with a snappy, bouncy pop-up (0.85s)
    tl.fromTo(logo.current, {
      y: 30,
      scale: 0.6,
      opacity: 0
    }, {
      y: 0,
      scale: 1,
      opacity: 1,
      duration: 0.85,
      ease: 'back.out(1.6)'
    })
    // Phase 1.5: Expand the ambient glow behind the logo
    .fromTo(glowRef.current, {
      opacity: 0,
      scale: 0.4
    }, {
      opacity: 1,
      scale: 1,
      duration: 0.85,
      ease: 'power2.out'
    }, "-=0.6")
    // Phase 2: Text gently fades and slides in
    .fromTo(textRef.current, {
      y: 15,
      opacity: 0
    }, {
      y: 0,
      opacity: 1,
      duration: 0.5,
      ease: 'power2.out'
    }, "-=0.4")
    // Hold for a moment to admire the branding
    .to({}, { duration: 1.1 })
    // Phase 3: Logo and elements smoothly scale up and fade out (0.45s)
    .to([logo.current, glowRef.current], {
      scale: 1.12,
      opacity: 0,
      duration: 0.45,
      ease: 'power2.in'
    })
    .to(textRef.current, {
      opacity: 0,
      y: -8,
      duration: 0.35,
      ease: 'power2.in'
    }, "-=0.35")
    // Phase 4: Container fades to transparent to reveal the app (0.45s, 3s total)
    .to(container.current, {
      opacity: 0,
      duration: 0.45,
      ease: 'power2.inOut'
    }, "-=0.15");
  }, { scope: container });

  return (
    <div
      ref={container}
      className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center w-full h-full overflow-hidden"
    >
      {/* Background Ambient Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-orange-50 to-white pointer-events-none" />
      
      <div className="relative flex flex-col items-center justify-center gap-8 z-10 w-full px-4">
        {/* Dynamic Center Glow */}
        <div ref={glowRef} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 md:w-80 md:h-80 bg-brand-orange/20 rounded-full blur-[80px] pointer-events-none" />
        
        {/* Logo */}
        <div ref={logo} className="relative w-full max-w-[270px] md:max-w-xs flex justify-center">
          <div className="rounded-[28px] overflow-hidden shadow-2xl shadow-blue-950/15 border-2 border-white/90 p-0.5 bg-white">
            <img
              src={logoImg}
              alt="ULMGH369"
              className="w-full h-auto object-contain rounded-[24px]"
            />
          </div>
        </div>
        
        {/* Subtitle */}
        <div ref={textRef} className="text-center overflow-hidden relative mt-2">
          <p className="text-gray-600 text-[11px] md:text-sm font-extrabold tracking-[0.3em] uppercase opacity-90">
            Your Choice, From Anywhere.
          </p>
        </div>
      </div>
    </div>
  );
}
