'use client'


import React, { useState, useEffect, createContext} from "react";
import { usePathname } from "next/navigation";
import { getProfileData, getIsMentor } from "@/lib/actions";
import  AppSidebar  from "@/components/app-sidebar";
import { LoaderCircleIcon } from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ProfileData, Teacher } from "@/lib/types";
import { getTeachers } from "@/lib/actions";
import MobileRestriction from "@/components/mobile-restriction";

export const ProfileContext = createContext<ProfileData | null>(null);
export const TeacherContext = createContext<Teacher[] | null>(null);
export const IsMentorContext = createContext<boolean>(false);
export default function ClientLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    const [profile, setProfile] = useState<ProfileData | null>(null)
    const [teachers, setTeachers] = useState<Teacher[] | null>(null)
    const [isMentor, setIsMentor] = useState(false)
    const pathname = usePathname()
  
    const isLoginPage = pathname.startsWith('/login')
    const isHomePage = pathname === '/'
  
    useEffect(() => {
      if (!isLoginPage && !isHomePage) {
        const loadProfile = async () => {
          const [profileData, mentor, teachers] = await Promise.all([getProfileData(), getIsMentor(), getTeachers()])
          setProfile(profileData)
          setIsMentor(mentor)
          setTeachers(teachers)
        }
        loadProfile()
      }
    }, [isLoginPage, isHomePage])
    return (
      <IsMentorContext.Provider value={isMentor}>
      <ProfileContext.Provider value={profile}>
        <TeacherContext.Provider value={teachers}>
        <MobileRestriction>
        <div className="flex h-screen">
          {isLoginPage || isHomePage ? (
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          ) : profile ? (
            <SidebarProvider defaultOpen>
              <AppSidebar profile={profile} isMentor={isMentor}/>
              <main className="flex-1 overflow-auto">
                {React.Children.map(children, child =>
                  React.isValidElement(child)
                    ? React.cloneElement(child, { profile } as { profile: ProfileData | null })
                    : child
                )}
              </main>
            </SidebarProvider>
          ) : (
            <main className="flex-1 overflow-auto">
              <div className="flex w-full justify-center items-center h-screen">
                <LoaderCircleIcon className="animate-spin w-10 h-10" />
              </div>
            </main>
          )}
        </div>
        </MobileRestriction>
        </TeacherContext.Provider>
      </ProfileContext.Provider>
      </IsMentorContext.Provider>
    )
  }