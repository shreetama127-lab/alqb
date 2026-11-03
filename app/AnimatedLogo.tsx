"use client";

export default function AnimatedLogo() {
  return (
    <div className="relative inline-block">
      <img src="/logo.png" alt="ALQB logo" className="logo-img h-52 w-auto" />
      <span className="bubble b1" />
      <span className="bubble b2" />
      <span className="bubble b3" />
      <span className="bubble b4" />
      <span className="bubble b5" />
      <style jsx>{`
        .logo-img {
          animation: bob 3.5s ease-in-out infinite;
          will-change: transform;
        }
        @keyframes bob {
          0%, 100% { transform: translateY(0) rotate(-1deg); }
          50% { transform: translateY(-6px) rotate(1deg); }
        }
        .bubble {
          position: absolute;
          bottom: 34%;
          border-radius: 9999px;
          background: rgba(16, 185, 129, 0.55);
          opacity: 0;
          pointer-events: none;
        }
        .b1 { left: 44%; width: 10px; height: 10px; animation: rise 3s ease-in infinite; }
        .b2 { left: 51%; width: 7px;  height: 7px;  animation: rise 3.6s ease-in infinite 0.6s; }
        .b3 { left: 47%; width: 13px; height: 13px; animation: rise 4.2s ease-in infinite 1.2s; }
        .b4 { left: 54%; width: 6px;  height: 6px;  animation: rise 3.2s ease-in infinite 1.8s; }
        .b5 { left: 42%; width: 9px;  height: 9px;  animation: rise 3.8s ease-in infinite 2.4s; }
        @keyframes rise {
          0%   { transform: translateY(0) scale(0.6); opacity: 0; }
          20%  { opacity: 0.85; }
          100% { transform: translateY(-80px) scale(1.1); opacity: 0; }
        }
      `}</style>
    </div>
  );
}