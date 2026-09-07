import { useState, useEffect } from 'react';
import { getResources, getProfileData, getUserActivitiesIDs, getIsMentor } from '@/lib/actions';
import { Opportunity, ProfileData } from '@/lib/types';
import useSWR from 'swr';
import { debugLog } from '@/lib/debug';

interface ResourceData {
  opportunities: Opportunity[];
  filteredOpportunities: Opportunity[];
  recommendedOpportunities: { [key: string]: Opportunity[] };
  userActivities: string[];
  isMentor: boolean;
}

const getRecommendedOpportunities = (opportunities: Opportunity[], profile: ProfileData, activities: string[]) => { //responsible for producing recommendations
    const recommended: {[key: string]: Opportunity[]} = {}; //gets passed all opportunities
    const userSubjects = profile.subjects || [];
    const userYearGroup = profile.current_year;

    opportunities.forEach(opp => {
        if (!recommended[opp.opportunity_type]) {
            recommended[opp.opportunity_type] = [];
        } //creates a type for each opportunity type
      
        const subjectMatch = Object.values(opp.subjects || {}).some(subject => userSubjects.includes(subject)); //filters recommendations based on user's subjects
        const yearMatch = Array.isArray(opp.year_groups) && userYearGroup && opp.year_groups.includes(userYearGroup); //filters recs based on year group

        if ((subjectMatch && yearMatch) && !activities.includes(opp.opportunity_id)) {  //only recommends if not doing already
            recommended[opp.opportunity_type].push(opp);
        }
    });
    debugLog(recommended)
    return recommended;
};

const fetchResourceData = async (): Promise<ResourceData> => {
    const [resourcesData, profile, activities, isMentorStatus] = await Promise.all([
      getResources(),
      getProfileData(),
      getUserActivitiesIDs(),
      getIsMentor()
    ]);
  
    return {
      opportunities: resourcesData,
      filteredOpportunities: resourcesData,
      recommendedOpportunities: getRecommendedOpportunities(resourcesData, profile, activities || []),
      userActivities: activities || [],
      isMentor: isMentorStatus
    };
  };

  export function useResourceData() {
    return useSWR<ResourceData>('resourceData', fetchResourceData, {
      revalidateOnFocus: false, // Don't revalidate when window regains focus
      revalidateOnReconnect: true, // Revalidate when browser regains connection
      refreshInterval: 1000 * 60 * 60, // Refresh every hour
      dedupingInterval: 1000 * 60 * 5, // Dedupe requests within 5 minutes
    });
  }