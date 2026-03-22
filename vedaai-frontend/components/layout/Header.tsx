'use client';

import { Bell, ChevronDown, User, ArrowLeft, LayoutGrid, Menu } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const router = useRouter()
  return (
    <div className="p-3 md:p-4 bg-[#ececec]">
      <header className="h-14 md:h-16 bg-[#FFFFFFBF]  rounded-xl shadow-sm border border-gray-200 flex items-center justify-between px-4 md:px-6">

        <div className="flex items-center gap-3 md:gap-4">
          <button 
            onClick={onMenuClick}
            className="md:hidden p-2 rounded-full bg-white cursor-pointer"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>

          <button 
            onClick={() => window.history.back()}
            className="hidden md:block p-2 rounded-full bg-white cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>

          <div className="hidden sm:flex items-center gap-2 text-[#A9A9A9]">
            <LayoutGrid className="w-5 h-5 " />
            <h1 className="text-sm md:text-base font-medium ">
              Assignment
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-4">

          <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          <div className="flex items-center gap-2 md:gap-3 pl-2 md:pl-4 border-l border-gray-200">
            <div className="w-8 h-8 rounded-full overflow-hidden shadow-sm">
              <div className="w-full h-full bg-linear-to-br from-orange-400 via-pink-500 to-red-500 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            </div>

            <span className="hidden sm:block text-sm font-medium text-gray-700">
              John Doe
            </span>

            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </header>
    </div>
  );
}