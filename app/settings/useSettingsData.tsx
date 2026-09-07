'use client'

import { useContext } from 'react'
import { ProfileContext } from '@/app/client-layout'
import { ProfileData } from '@/lib/types'

export function useSettingsData(): ProfileData | null {
  return useContext(ProfileContext)
}
