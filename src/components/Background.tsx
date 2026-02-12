import React from 'react';

export const Background: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-[#050508]">
      {/* Deep Space Gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/40 via-[#0a0a12] to-black" />

      {/* Vibrant Orbs */}
      <div className="absolute top-[-10%] left-[-20%] w-[80vw] h-[80vw] rounded-full bg-fuchsia-600/20 mix-blend-screen filter blur-[100px] animate-blob opacity-60" />
      <div className="absolute top-[40%] right-[-20%] w-[90vw] h-[90vw] rounded-full bg-blue-600/20 mix-blend-screen filter blur-[120px] animate-blob animation-delay-2000 opacity-50" />
      <div className="absolute bottom-[-20%] left-[10%] w-[70vw] h-[70vw] rounded-full bg-emerald-500/10 mix-blend-screen filter blur-[90px] animate-blob animation-delay-4000 opacity-40" />
      
      {/* Subtle Aurora Streak */}
      <div className="absolute top-1/4 left-0 w-full h-32 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent transform -skew-y-12 blur-3xl" />

      {/* Noise Texture for that premium film grain look */}
      <div className="absolute inset-0 opacity-[0.07] mix-blend-overlay pointer-events-none" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
      </div>
    </div>
  );
};