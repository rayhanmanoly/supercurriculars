import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import {
  HomeIcon,
  BookOpenIcon,
  FolderIcon,
  CalendarIcon,
  UsersIcon,
  UserRoundCog
} from 'lucide-react';

const SidebarSkeleton = () => {
  // Navigation items with their respective icons
  const navItems = [
    { icon: HomeIcon, label: 'Dashboard' },
    { icon: BookOpenIcon, label: 'Resource Hub' },
    { icon: FolderIcon, label: 'Portfolio' },
    { icon: CalendarIcon, label: 'Events' },
    { icon: UsersIcon, label: 'Mentoring' },
    { icon: UserRoundCog, label: 'My Mentoring' }
  ];

  return (
    <div className="fixed left-0 top-0 h-screen w-60 bg-white p-6 flex flex-col border-r">
      {/* Logo section */}
      <div className="mb-8 flex justify-center">
        <Skeleton className="h-12 w-12 rounded-md" />
      </div>

      {/* Navigation section */}
      <nav className="space-y-4 flex-grow">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className="w-full flex items-center rounded-md px-2 py-2 hover:bg-gray-100"
            >
              <Icon className="mr-2 h-4 w-4 text-gray-400" />
              <Skeleton className="h-4 w-24" />
            </div>
          );
        })}
      </nav>

      {/* Profile section */}
      <div className="mt-auto">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SidebarSkeleton;