import useSWR from 'swr'
import { Opportunity } from '@/lib/types'
import {
  getTeacherViewOpportunities,
  updateOpportunity,
  deleteOpportunity,
  getSubmittedOpportunities,
  updateOpportunityStatus,
} from '@/lib/actions'

export function useManageResourcesData(isTeacher: boolean) {
  const {
    data: opportunities = [],
    isLoading,
    error,
    mutate: refreshOpportunities,
  } = useSWR<Opportunity[]>(
    isTeacher ? 'manage-resources:teacher' : 'manage-resources:submitted',
    isTeacher ? getTeacherViewOpportunities : getSubmittedOpportunities,
    {
      revalidateOnFocus: false,
      refreshInterval: 5 * 60 * 1000,
    }
  )

  const deleteResource = async (opportunityId: string) => {
    await deleteOpportunity(opportunityId)
    await refreshOpportunities()
    return { success: true }
  }

  const updateResource = async (data: any, opportunityId?: string, asTeacher?: boolean) => {
    try {
      await updateOpportunity(data, opportunityId, asTeacher)
      await refreshOpportunities()
      return { success: true }
    } catch (error) {
      return { success: false, error }
    }
  }

  const updateStatus = async (data: any, opportunityId?: string) => {
    await updateOpportunityStatus(data, opportunityId)
    await refreshOpportunities()
    return { success: true }
  }

  return {
    opportunities,
    isLoading,
    error,
    deleteResource,
    updateResource,
    refreshOpportunities,
    updateStatus,
  }
}
