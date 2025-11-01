import React from "react";

export default function SurgeLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <span className="text-lg font-bold text-blue-400 tracking-widest">SURGE</span>
      </div>
    </div>
  );
}
