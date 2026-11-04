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

    // 1. Pop-up entrance: Logo reveals and enlarges from scale 0.7 to 1.0 (0.75s)
    tl.from(logo.current, {
      y: 35,
      scale: 0.7,
      opacity: 0,
      duration: 0.75,
      ease: 'back.out(1.4)'
    })
      // 2. Ambient glow expands behind logo
      .from(glowRef.current, {
        opacity: 0,
        scale: 0.4,
        duration: 0.9,
        ease: 'power2.out'
      }, "-=0.6")
      // 3. Tagline slides in
      .from(textRef.current, {
        y: 12,
        opacity: 0,
        duration: 0.5,
        ease: 'power2.out'
      }, "-=0.5")
      // 4. Continuous Enlarging: Logo keeps smoothly enlarging forward (NEVER static/frozen)
      .to(logo.current, {
        scale: 1.08,
        duration: 0.8,
        ease: 'sine.inOut'
      }, "-=0.4")
      // 5. Exit zoom: Accelerates enlargement forward and fades into app
      .to([logo.current, glowRef.current], {
        scale: 1.25,
        opacity: 0,
        duration: 0.45,
        ease: 'power2.in'
      }, "-=0.1")
      .to(textRef.current, {
        opacity: 0,
        y: -8,
        duration: 0.35,
        ease: 'power2.in'
      }, "-=0.4")
      // 6. Container fades to reveal the app seamlessly (Total: ~2.2s)
      .to(container.current, {
        opacity: 0,
        duration: 0.45,
        ease: 'power2.inOut'
      }, "-=0.2");
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
          <div className="rounded-[32px] overflow-hidden shadow-2xl shadow-blue-950/15 border-2 border-white/90 p-0.5 bg-white">
            <img
              src={logoImg}
              alt="ULMGH369"
              className="w-full h-auto object-contain rounded-[28px]"
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
