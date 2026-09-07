'use client'

import { useContext } from 'react'
import { ProfileContext } from '@/app/client-layout'
import { ManageResourcesContent } from './ManageResourcesContent'
import { ManageResourcesSkeleton } from './skeleton'

export default function ManageResources() {
  const profile = useContext(ProfileContext)

  if (!profile) return <ManageResourcesSkeleton />

  return <ManageResourcesContent profile={profile} />
}
