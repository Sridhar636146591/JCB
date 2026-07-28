import React, { useEffect, useState } from 'react';
import { Settings } from 'lucide-react';

interface SplashScreenProps {
  onFinished: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinished }) => {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Initializing Systems...');
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Increment progress over ~2.4 seconds
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        // Random incremental jumps
        const step = Math.floor(Math.random() * 8) + 4;
        const next = prev + step;
        return next > 100 ? 100 : next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Map progress to mechanical/fleet themed status texts
  useEffect(() => {
    if (progress < 25) {
      setStatusText('Powering up heavy engine systems...');
    } else if (progress < 50) {
      setStatusText('Calibrating hydraulic valves...');
    } else if (progress < 75) {
      setStatusText('Synchronizing operator schedules...');
    } else if (progress < 95) {
      setStatusText('Establishing secure database connection...');
    } else {
      setStatusText('All systems operational! Ready to scoop.');
    }

    if (progress === 100) {
      // Trigger fade out transition 400ms after reaching 100%
      const fadeTimeout = setTimeout(() => {
        setIsFadingOut(true);
        // Call onFinished after the transition finishes (~600ms)
        const finishTimeout = setTimeout(() => {
          onFinished();
        }, 600);
        return () => clearTimeout(finishTimeout);
      }, 500);

      return () => clearTimeout(fadeTimeout);
    }
  }, [progress, onFinished]);

  return (
    <div
      className={`fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center overflow-hidden transition-all duration-700 ease-in-out ${
        isFadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Moving Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-amber-500/10 blur-[130px] pointer-events-none animate-ambient-slow" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[450px] h-[450px] rounded-full bg-amber-600/10 blur-[160px] pointer-events-none animate-ambient-slow" style={{ animationDelay: '-4s' }} />

      <div className="flex flex-col items-center max-w-xl px-6 text-center z-10">
        
        {/* Animated Mechanical Gears & Logo Container */}
        <div className="relative mb-8 p-1">
          {/* Outer glowing border ring */}
          <div className="absolute inset-0 rounded-full border border-amber-500/30 animate-pulse-glow" />
          
          {/* Floating gears */}
          <div className="absolute -top-3 -right-3 text-amber-500/40 animate-gear-spin">
            <Settings size={28} className="stroke-[1.5]" />
          </div>
          <div className="absolute -bottom-2 -left-3 text-amber-500/35 animate-gear-spin-reverse">
            <Settings size={34} className="stroke-[1.2]" />
          </div>
          
          {/* Logo frame */}
          <div className="relative bg-slate-900 p-6 rounded-full shadow-2xl border border-slate-800 flex items-center justify-center overflow-hidden animate-logo-entrance">
            <img 
              src="/jcb.png" 
              alt="Sri Lakshmi Narayana Swamy Earth Movers" 
              className="w-24 h-24 object-contain"
            />
            {/* Hologram Scanner Line */}
            <div className="absolute left-0 right-0 h-0.5 bg-amber-500/60 shadow-[0_0_10px_#f59e0b] pointer-events-none animate-scanner" />
          </div>
        </div>

        {/* Business Title */}
        <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-wider mb-2 animate-tracking-expand">
          Sri Lakshmi Narayana Swamy
          <span className="block mt-1.5 text-amber-500 font-extrabold tracking-widest text-lg md:text-xl">
            Earth Movers
          </span>
        </h1>
        
        {/* Tagline */}
        <p className="text-slate-400 font-bold tracking-widest text-xs uppercase mb-12 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          JCB & Tractor Rental Portal
        </p>

        {/* Progress & Loader Section */}
        <div className="w-80 flex flex-col items-center animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          {/* Progress Bar Container */}
          <div className="w-full bg-slate-900/80 border border-slate-800/80 h-3 rounded-full overflow-hidden p-0.5 shadow-inner relative flex items-center">
            {/* Glowing amber bar */}
            <div 
              className="bg-amber-500 h-full rounded-full transition-all duration-100 ease-out shadow-[0_0_8px_rgba(245,158,11,0.5)]"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Details below bar */}
          <div className="w-full flex justify-between items-center mt-3 text-slate-500 font-semibold text-xs tracking-wider">
            <span className="text-amber-500/80 italic font-medium transition-all duration-300">
              {statusText}
            </span>
            <span className="font-mono text-amber-500 font-bold ml-2">
              {progress}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
