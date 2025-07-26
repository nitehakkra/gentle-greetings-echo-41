import React, { ReactNode } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

interface MainLayoutProps {
  children: ReactNode;
  className?: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, className = '' }) => {
  return (
    <div className={`min-h-screen flex flex-col ${className}`}>
      <main className="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {children}
      </main>
      <Toaster />
      <Sonner />
    </div>
  );
};

export default MainLayout;
