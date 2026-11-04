okay continuimport React, { useRef } from 'react';
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

    // Phase 1: Reveal logo with the original smooth popup style
    tl.from(logo.current, {
      y: 28,
      scale: 0.85,
      opacity: 0,
      duration: 1.0,
      ease: 'back.out(1.3)'
    })
      // Phase 1.5: Expand ambient glow behind the logo (overlapping seamlessly)
      .from(glowRef.current, {
        opacity: 0,
        scale: 0.5,
        duration: 1.3,
        ease: 'power2.out'
      }, "-=0.8")
      // Phase 2: Tagline gently fades and slides in
      .from(textRef.current, {
        y: 12,
        opacity: 0,
        duration: 0.7,
        ease: 'power2.out'
      }, "-=0.6")
      // Natural brief pause to admire branding (0.5s - never feels frozen or stuck)
      .to({}, { duration: 0.5 })
      // Phase 3: Logo and elements smoothly scale up and fade out
      .to([logo.current, glowRef.current], {
        scale: 1.15,
        opacity: 0,
        duration: 0.5,
        ease: 'power2.in'
      })
      .to(textRef.current, {
        opacity: 0,
        y: -8,
        duration: 0.35,
        ease: 'power2.in'
      }, "-=0.4")
      // Phase 4: Container fades to transparent to reveal the app (Total: 3.0s)
      .to(container.current, {
        opacity: 0,
        duration: 0.5,
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
