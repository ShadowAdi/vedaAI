'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Users,
  ClipboardList,
  Sparkles,
  Library,
  Settings,
  SparklesIcon,
  X
} from 'lucide-react';
import Image from 'next/image';

const menuItems = [
  { name: 'Home', icon: Home, href: '/' },
  { name: 'My Groups', icon: Users, href: '/groups' },
  { name: 'Assignments', icon: ClipboardList, href: '/assignments' },
  { name: "AI Teacher's Toolkit", icon: Sparkles, href: '/toolkit' },
  { name: 'My Library', icon: Library, href: '/library' },
];

export default function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={onClose}
        />
      )}
      
      <aside className={`w-72 bg-white border-r border-gray-200 flex flex-col overflow-hidden fixed md:relative z-40 md:z-auto h-full md:h-auto transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="flex flex-col h-full overflow-y-auto px-5 py-6 mb-6">
          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="md:hidden absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>

          <div className="flex items-center gap-3 mb-6">
            <Image
              src="/VedaAiLogo.png"
              height={50}
              width={50}
              alt="logo"
              className="object-contain shrink-0"
              priority
            />

            <span className="text-[20px] font-bold text-gray-900 leading-none">
              VedaAI
            </span>
          </div>
          <div className="mb-6">
            <Link
              href="/assignments/create"
              className="relative block rounded-full p-0.5 bg-linear-to-r from-[#FF7950] to-[#C0350A]"
            >
              <div className="flex items-center justify-center gap-2 rounded-full bg-[#2C2C2C] px-4 py-3 text-white font-medium shadow-md">
                <SparklesIcon className="w-4 h-4" />
                Create Assignment
              </div>
            </Link>
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                    isActive
                      ? 'bg-gray-200 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <item.icon
                    className={`w-5 h-5 ${
                      isActive ? 'text-gray-900' : 'text-gray-400'
                    }`}
                  />

                  <span className="flex-1">{item.name}</span>

                  {item.name === 'Assignments' && (
                    <span className="bg-[#FF5A2C] text-white text-xs px-2 py-0.5 rounded-full">
                      10
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 space-y-3">

            <Link
              href="/settings"
              className="flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
            >
              <Settings className="w-5 h-5 text-gray-400" />
              Settings
            </Link>

            <div className="flex items-center gap-3 px-3 py-3 bg-gray-200 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-linear-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold">
                D
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  Delhi Public School
                </p>
                <p className="text-xs text-gray-500 truncate">
                  Bokaro Steel City
                </p>
              </div>
            </div>

          </div>
        </div>
      </aside>
    </>
  );
}