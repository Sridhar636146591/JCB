import React, { useEffect, useState } from 'react';
import { Settings, AlertTriangle } from 'lucide-react';
import { authService } from '../services/auth';

interface SplashScreenProps {
  onFinished: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinished }) => {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Initializing Systems...');
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // PIN states
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // Only run interval if there is no error and progress is under 100%
    if (error || progress >= 100) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        // Faster incremental jumps
        const step = Math.floor(Math.random() * 15) + 10;
        const next = prev + step;
        return next > 100 ? 100 : next;
      });
    }, 60);

    return () => clearInterval(interval);
  }, [progress, error]);

  // Map progress to mechanical/fleet themed status texts
  useEffect(() => {
    if (error) return;

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
      const authAndPrepare = async () => {
        if (!authService.isAuthenticated()) {
          setStatusText('Authenticating secure portal access...');
          try {
            // Try to log in with admin/admin123
            await authService.login({ username: 'admin', password: 'admin123' });
          } catch (loginErr) {
            console.log("Auto-login failed, attempting automatic registration...");
            try {
              // If user does not exist, register the admin user automatically
              await authService.register({ username: 'admin', password: 'admin123' });
            } catch (regErr) {
              console.error("Auto-registration failed:", regErr);
              setError('Failed to connect to the backend database service. Please check your Render VITE_API_URL settings or verify if the backend is running.');
              return;
            }
          }
        }
        // Background login complete, now show PIN page
        setShowPin(true);
      };

      authAndPrepare();
    }
  }, [progress, error]);

  const handlePinInput = (num: string) => {
    if (pin.length < 4 && !isSuccess && !isShaking) {
      const nextPin = pin + num;
      setPin(nextPin);
      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    if (!isSuccess && !isShaking) {
      setPin(prev => prev.slice(0, -1));
    }
  };

  const handleClear = () => {
    if (!isSuccess && !isShaking) {
      setPin('');
    }
  };

  const verifyPin = (enteredPin: string) => {
    if (enteredPin === '3121') {
      setIsSuccess(true);
      // Success haptic (single short buzz)
      if (navigator.vibrate) navigator.vibrate(80);
      setTimeout(() => {
        setIsFadingOut(true);
        setTimeout(() => {
          onFinished();
        }, 600);
      }, 500);
    } else {
      // Wrong PIN — shake + double vibration buzz
      setIsShaking(true);
      setPinError(true);
      if (navigator.vibrate) navigator.vibrate([100, 60, 100, 60, 100]);
      setTimeout(() => {
        setPin('');
        setIsShaking(false);
        setPinError(false);
      }, 800);
    }
  };

  // Keyboard support for security PIN
  useEffect(() => {
    if (!showPin || isSuccess || isShaking) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handlePinInput(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape' || e.key === 'Delete') {
        handleClear();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPin, pin, isSuccess, isShaking]);

  const handleRetry = () => {
    setError(null);
    setProgress(75); // Reset progress back to 75% to trigger re-connection loop
  };

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

        {/* Progress / PIN Lock Section */}
        <div className="w-80 flex flex-col items-center min-h-[300px]">
          {error ? (
            <div className="w-full bg-rose-950/30 border border-rose-900/40 p-4 rounded-xl flex flex-col items-center shadow-lg transition animate-fade-in-up">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider mb-2">
                <AlertTriangle size={16} />
                <span>Connection Error</span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed font-semibold mb-4 text-center">
                {error}
              </p>
              <button
                onClick={handleRetry}
                className="bg-amber-500 hover:bg-amber-600 active:scale-[0.97] text-slate-950 px-5 py-2 rounded-xl text-xs font-bold transition duration-200 cursor-pointer shadow-lg shadow-amber-500/10"
              >
                Retry Connection
              </button>
            </div>
          ) : showPin ? (
            <div className="flex flex-col items-center w-full animate-fade-in-up">
              {/* Header inside PIN UI */}
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-6">
                Enter Security PIN to Unlock
              </p>
              
              {/* PIN Indicator Dots */}
              <div className={`flex gap-6 justify-center mb-8 ${isShaking ? 'animate-shake' : ''}`}>
                {[0, 1, 2, 3].map((index) => {
                  const isActive = index < pin.length;
                  return (
                    <div
                      key={index}
                      className={`w-4 h-4 rounded-full transition-all duration-300 ${
                        isSuccess
                          ? 'bg-emerald-500 shadow-[0_0_12px_#10b981] scale-110'
                          : pinError
                          ? 'bg-rose-500 shadow-[0_0_12px_#f43f5e]'
                          : isActive
                          ? 'bg-amber-500 shadow-[0_0_10px_#f59e0b] scale-110'
                          : 'bg-slate-800 border border-slate-700/80'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Keypad Grid */}
              <div className="grid grid-cols-3 gap-4 max-w-[280px] w-full">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handlePinInput(num.toString())}
                    className="w-16 h-16 rounded-full bg-slate-900/60 border border-slate-800/80 hover:border-amber-500/50 hover:bg-amber-500/5 text-xl font-extrabold text-white transition-all active:scale-[0.9] flex items-center justify-center cursor-pointer shadow-lg hover:shadow-amber-500/5 focus:outline-none"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleClear}
                  className="w-16 h-16 rounded-full text-slate-500 hover:text-slate-300 text-xs font-black transition-all active:scale-[0.9] flex items-center justify-center cursor-pointer focus:outline-none"
                >
                  CLEAR
                </button>
                <button
                  type="button"
                  onClick={() => handlePinInput('0')}
                  className="w-16 h-16 rounded-full bg-slate-900/60 border border-slate-800/80 hover:border-amber-500/50 hover:bg-amber-500/5 text-xl font-extrabold text-white transition-all active:scale-[0.9] flex items-center justify-center cursor-pointer shadow-lg hover:shadow-amber-500/5 focus:outline-none"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="w-16 h-16 rounded-full text-slate-500 hover:text-slate-350 transition-all active:scale-[0.9] flex items-center justify-center cursor-pointer focus:outline-none"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75L14.25 12m0 0l2.25 2.25M14.25 12l2.25-2.25M14.25 12L12 14.25m-2.58 4.92l-6.375-6.375a1.125 1.125 0 010-1.59L9.42 4.83c.211-.211.498-.33.796-.33H19.5a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25h-9.284c-.298 0-.585-.119-.796-.33z" />
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center animate-fade-in-up">
              {/* Progress Bar Container */}
              <div className="w-full bg-slate-900/80 border border-slate-800/80 h-3 rounded-full overflow-hidden p-0.5 shadow-inner relative flex items-center">
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
          )}
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
