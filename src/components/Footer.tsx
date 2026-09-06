"use client";

import React from "react";
import Image from "next/image";

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-slate-50/60 border-t border-slate-200/60 py-3.5 px-4 sm:px-6 no-print mt-6 transition-all">
      <div className="max-w-xl mx-auto flex flex-col items-center justify-center text-center space-y-1.5">
        {/* Centered Brand & Logo */}
        <div className="flex items-center justify-center gap-2">
          <div className="relative w-5 h-5 rounded-md bg-white p-0.5 flex items-center justify-center border border-slate-200/80 shadow-2xs overflow-hidden shrink-0">
            <Image
              src="/logo-kemenkopangan.png"
              alt="Logo Coordinating Ministry for Food Affairs"
              width={18}
              height={18}
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-[11px] font-semibold text-slate-800 tracking-tight">
            Inspectorate • Coordinating Ministry for Food Affairs RI
          </span>
        </div>

        {/* System Subtitle */}
        <p className="text-[10px] text-slate-400 leading-tight">
          Official Travel Accountability & Financial Allowance Calculation System
        </p>

        {/* Copyright, Rights Reserved & License */}
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-[10px] text-slate-400 pt-1.5 border-t border-slate-200/60 w-full max-w-xs">
          <span>&copy; {currentYear} Inspektorat Kemenko Pangan.</span>
          <span className="w-0.5 h-0.5 rounded-full bg-slate-300" />
          <span>All Rights Reserved.</span>
          <span className="w-0.5 h-0.5 rounded-full bg-slate-300" />
          <span className="font-medium text-slate-500">MIT License</span>
        </div>
      </div>
    </footer>
  );
};
