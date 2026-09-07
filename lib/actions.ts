'use server'

import { createClient } from '../utils/supabase/server';
import { redirect } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { revalidatePath } from 'next/cache';

import { Opportunity } from './types';
import { debugLog } from './debug';
import { Meeting, ProfileData, Event, Teacher, GoogleCalendarEvent, AmbassadorStudent } from './types';





export async function getFirstTime() {
    const supabase = createClient()
    const user = supabase.auth.getUser()
    const userID = (await user).data.user?.id
    debugLog(userID)
    const {count, error} = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('id',userID)

    if (!error) {
        debugLog('Returnd data: ',count)
        return count
    }
  }

  
export async function getProfileData(): Promise<ProfileData> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login')
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, profile_url, current_year, subjects, can_add, role, email')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Supabase error:', error);
    throw new Error('Failed to fetch profile data');
  }

  if (!data) {
    throw new Error('No profile data found');
  }

  // Ensure all required fields are present
  if (!data.first_name || !data.last_name) {
    throw new Error('Incomplete profile data');
  }

  return {
    id: data.id,
    first_name: data.first_name,
    last_name: data.last_name,
    profile_url: data.profile_url || undefined,
    current_year: data.current_year || undefined,
    subjects: data.subjects || undefined,
    can_add: data.can_add,
    role: data.role,
    email: data.email
  };
}


export async function updateProfile(data: {
  first_name?: string;
  last_name?: string;
  current_year?: number | null;
  subjects?: string[];
}): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };
  const { error } = await supabase.from('profiles').update(data).eq('id', user.id);
  if (error) return { error: error.message };
  return { error: null };
}


  export async function SetProfile(profile_data:string) { ///NEED TO UPDATE DETAILS PERIODICALLY (INC PROFILE PIC)
    const supabase = createClient()
    const user = supabase.auth.getUser()
    const userID = (await user).data.user?.id
    var parsed_data = JSON.parse(profile_data)
    debugLog(parsed_data)
    parsed_data['id'] = userID
    const {error} = await supabase
    .from('profiles')
    .insert(parsed_data)
    const {data} = await supabase.auth.getSession()
        if (data.session?.provider_token && data.session?.provider_refresh_token && data.session?.user.user_metadata.picture ) {
        debugLog('Found tokens')
        const {error} = await supabase
        .from('profiles')
        .update({'profile_url': data.session.user.user_metadata.picture})
        .eq('id', userID);
        await supabase
        .from('profile_tokens')
        .upsert({'id': userID, 'provider_token': data.session.provider_token, 'provider_refresh_token': data.session.provider_refresh_token});
        if (error) {
            debugLog('token error:',error)
        } else {
            debugLog('Success')
        }
        } else {
          return redirect('/login/onboarding')
        }

    if (error) {
        debugLog(error)
        return redirect('/login/onboarding')
    } else {
        return redirect('/dashboard')
    }
  }



  export async function getResources() {
    const supabase = createClient();
  
    const { data, error } = await supabase
      .from('opportunities')
      .select(`
        opportunity_id,
        title,
        short_description,
        full_description,
        opportunity_type,
        time_required,
        weightage,
        image,
        subjects,
        year_groups,
        internal,
        online,
        cost,
        url,
        submission_date,
        contact_name,
        contact_email,
        advice,
        past_projects,
        one_off,
        custom_opportunity,
        status
      `);
  
    if (error) {
      console.error('Error fetching resources:', error);
      throw new Error('Failed to fetch resources');
    }
  
    return data;
  }

  export async function addToMyCourses(opportunityId: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
  
    if (!user) {
      return redirect('/login')
    }
  
    const { data, error } = await supabase
      .from('portfolios')
      .insert({
        user_id: user.id,
        opportunity_id: opportunityId,
        status: 'In Progress'
      });
  
    if (error) {
      console.error('Supabase error:', error);
      throw new Error('Failed to add course to portfolio');
    }
  
    return data;
  }

  export async function getUserActivities(): Promise<Opportunity[]> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
  
    if (!user) {
      return redirect('/login')
    }
  
    const { data, error } = await supabase
      .from('portfolios')
      .select(`
        *,
        opportunities (*)
      `)
      .eq('user_id', user.id);
  
    if (error) {
      console.error('Error fetching user activities:', error);
      throw new Error('Failed to fetch user activities');
    }
    debugLog(data)
    return data.map(item => ({
      id: item.id,
      opportunity_id: item.opportunity_id,
      title: item.opportunities.title,
      short_description: item.opportunities.short_description,
      full_description: item.opportunities.full_description,
      status: item.status,
      started_at: item.started_at,
      finished_at: item.finished_at,
      past_projects: item.opportunities.past_projects || [],
      project_files: item.project_files,
      opportunity_type: item.opportunities.opportunity_type as "Course" | "Competition" | "Club" | "Reading" | "Podcast" | "Project" | "Volunteering",
      subjects: item.opportunities.subjects,
      weightage: item.opportunities.weightage,
      time_required: item.opportunities.time_required,
      internal: item.opportunities.internal,
      year_groups: item.opportunities.year_groups,
      image: item.opportunities.image,
      url: item.opportunities.url,
      submission_date: item.opportunities.submission_date,
      advice: item.opportunities.advice,
      online: item.opportunities.online,
      cost: item.opportunities.cost,
      contact_name: item.opportunities.contact_name,
      contact_email: item.opportunities.contact_email,
      one_off: item.opportunities.one_off,
      custom_opportunity: item.opportunities.custom_opportunity,
      user_description: item.description

    }));
  }


  export async function getUserActivitiesIDs(): Promise<string[]> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const activities: string[] = []
  
    if (!user) {
      return redirect('/login')
    }
  
    const { data, error } = await supabase
      .from('portfolios')
      .select(`
        *,
        opportunities (*)
      `)
      .eq('user_id', user.id);
  
    if (error) {
      console.error('Error fetching user activities:', error);
      throw new Error('Failed to fetch user activities');
    }

    data.forEach(item => activities.push(item.opportunity_id))
    return activities
  }





  export async function addCustomActivity(activityData: Partial<Opportunity>) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
  
    if (!user) {
      return redirect('/login')
    }
  
    const newActivity = {
      opportunity_id: uuidv4(),
      title: activityData.title,
      full_description: activityData.full_description,
      opportunity_type: activityData.opportunity_type,
      custom_opportunity: true,
      subjects: activityData.subjects,
    };

    debugLog(newActivity)
  
    const { error: insertError } = await supabase
      .from('opportunities')
      .insert(newActivity);
  
    if (insertError) {
      console.error('Error adding custom activity:', insertError);
      throw new Error('Failed to add custom activity');
    }

    const addtoUserPortfolio = {
      user_id: user.id,
      opportunity_id: newActivity.opportunity_id,
      started_at: new Date(),
      status: "In Progress"
    }

    const {error: portfolioError} = await supabase
    .from('portfolios')
    .insert(addtoUserPortfolio)

    if (portfolioError) {
      console.error('Error updating portfolio:', portfolioError);
      throw new Error('Failed to add custom activity');
    }
  }


  
  export async function exportPortfolioPDF() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
  
    if (!user) {
      return redirect('/login')
    }
  
    let activities = await getUserActivities();

    let profile_data = await getProfileData();
  
    // Sort activities: completed ones by finish date, then ongoing ones
    activities.sort((a, b) => {
      if (a.status === 'Completed' && b.status === 'Completed') {
        return new Date(b.finished_at!).getTime() - new Date(a.finished_at!).getTime();
      }
      if (a.status === 'Completed') return -1;
      if (b.status === 'Completed') return 1;
      return 0;
    });
  
    // Create a new PDF document
    const doc = new jsPDF();
  
    // Add title
    doc.setFontSize(24);
    doc.setTextColor(44, 62, 80); // Dark blue color
    doc.text('Supercurricular Activities Portfolio', doc.internal.pageSize.width / 2, 20, { align: 'center' });
  
    // Add user info
    doc.setFontSize(12);
    doc.setTextColor(52, 73, 94); // Slightly lighter blue
    doc.text(`${profile_data.first_name} ${profile_data.last_name}`, doc.internal.pageSize.width / 2, 30, { align: 'center' });
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, doc.internal.pageSize.width / 2, 36, { align: 'center' });
  
    // Add a summary table
    const tableData = activities.map(activity => [
      activity.title,
      activity.status,
      activity.started_at ? new Date(activity.started_at).toLocaleDateString() : 'N/A',
      activity.finished_at ? new Date(activity.finished_at).toLocaleDateString() : 'Ongoing',
      activity.opportunity_type,
      activity.weightage.toString(),
    ]);
  
    (doc as any).autoTable({
      head: [['Title', 'Status', 'Started', 'Finished', 'Type', 'Stars']],
      body: tableData,
      startY: 45,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 }, // Blue header
      alternateRowStyles: { fillColor: [240, 248, 255] }, // Light blue alternate rows
    });
  
    // For each activity, add a new page with details
    activities.forEach((activity, index) => {
      doc.addPage();
      
      // Title
      doc.setFontSize(18);
      doc.setTextColor(44, 62, 80);
      doc.text(activity.title, 14, 20);
  
      // Status badge
      const completedColor = [46, 204, 113];  // Green for completed
      const ongoingColor = [241, 196, 15];    // Yellow for ongoing
      const statusColor = activity.status === 'Completed' ? completedColor : ongoingColor;

      doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.rect(14, 25, 30, 7, 'F');
      doc.setFontSize(10);
      doc.setTextColor(255);
      doc.text(activity.status || 'N/A', 16, 30);
  
      // Basic info
      doc.setFontSize(10);
      doc.setTextColor(52, 73, 94);
      doc.text(`Type: ${activity.opportunity_type}`, 14, 40);
      doc.text(`Stars: ${activity.weightage}`, 14, 46);
      doc.text(`Started: ${new Date(activity.started_at!).toLocaleDateString()}`, 14, 52);
      if (activity.finished_at) {
        doc.text(`Finished: ${new Date(activity.finished_at!).toLocaleDateString()}`, 14, 58);
      }
  
      // Subjects
      if (activity.subjects && activity.subjects.length > 0) {
        doc.text('Subjects:', 14, 66);
        activity.subjects.forEach((subject, i) => {
          doc.setFillColor(52, 152, 219);
          doc.rect(14, 68 + i * 6, doc.getTextWidth(subject) + 4, 5, 'F');
          doc.setTextColor(255);
          doc.text(subject, 16, 72 + i * 6);
        });
      }
  
      let yOffset = 80 + (activity.subjects ? activity.subjects.length * 6 : 0);
    
  
      // Activity description
      doc.setFontSize(12);
      doc.setTextColor(44, 62, 80);
      doc.text('Activity Description', 14, yOffset);
      doc.setFontSize(10);
      doc.setTextColor(52, 73, 94);
      const splitDescription = doc.splitTextToSize(activity.full_description, 180);
      doc.text(splitDescription, 14, yOffset + 6);
  
      yOffset += 10 + splitDescription.length * 5;
  
      // User description (if available)
      if (activity.user_description) {
        doc.setFontSize(12);
        doc.setTextColor(44, 62, 80);
        doc.text('Your Experience', 14, yOffset);
        doc.setFontSize(10);
        doc.setTextColor(52, 73, 94);
        const splitUserDescription = doc.splitTextToSize(activity.user_description, 180);
        doc.text(splitUserDescription, 14, yOffset + 6);
  
        yOffset += 10 + splitUserDescription.length * 5;
      }
  
      // Project files
      if (activity.project_files && activity.project_files.length > 0) {
        doc.setFontSize(12);
        doc.setTextColor(44, 62, 80);
        doc.text('Project Files', 14, yOffset);
        yOffset += 6;
  
        activity.project_files.forEach((file, i) => {
          doc.setFillColor(189, 195, 199);
          doc.rect(14, yOffset, 4, 4, 'F');
          doc.setTextColor(52, 73, 94);
          doc.textWithLink(file.split('/').pop() || 'File', 20, yOffset + 3, { url: file });
          yOffset += 6;
        });
      }
    });
  
    const pdfBase64 = doc.output('datauristring');
    return pdfBase64.split(',')[1];
  }


  export async function uploadPortfolioSubmission(formData: FormData) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
  
    if (!user) {
      return redirect('/login')
    }
  
    const opportunityId = formData.get('opportunity_id') as string;
    const description = formData.get('description') as string;

    // Upload files to Supabase storage (must await — forEach+async does not)
    const fileUrls: string[] = [];
    for (const [, value] of Array.from(formData.entries())) {
      if (!(value instanceof File)) continue;

      const file = value;
      const fileName = `${user.id}/${opportunityId}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('portfolio')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        throw new Error('Failed to upload file');
      }

      const { data: { publicUrl } } = supabase.storage
        .from('portfolio')
        .getPublicUrl(fileName);

      fileUrls.push(publicUrl);
    }

    // Update portfolio record in the database
    const { data, error } = await supabase
      .from('portfolios')
      .update({
        description: description,
        project_files: fileUrls,
        status: 'Completed',
        finished_at: new Date()

      })
      .eq('user_id', user.id)
      .eq('opportunity_id', opportunityId);
  
    if (error) {
      console.error('Supabase error:', error);
      throw new Error('Failed to update portfolio submission');
    }
  
    return data;
  }

  export async function updatePortfolioSubmission(data: {
    opportunity_id: string;
    description: string;
    project_files: string[];
  }) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
  
    if (!user) {
      return redirect('/login')
    }
  
    const { error } = await supabase
      .from('portfolios')
      .update({
        description: data.description,
        project_files: data.project_files,
      })
      .eq('user_id', user.id)
      .eq('opportunity_id', data.opportunity_id);
  
    if (error) {
      console.error('Supabase error:', error);
      throw new Error('Failed to update portfolio submission');
    }
  
    return { success: true };
  }

  export async function uploadFile(formData: FormData, location: string, type: string, editing: boolean): Promise<string | null> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
  
    if (!user) {
      return redirect('/login')
    }
  
    const file = formData.get('file') as File;
    const opportunityId = formData.get('opportunityId') as string;
  
    debugLog(file, opportunityId)
    if (!file || !opportunityId) {
      throw new Error('File or opportunityId missing');
    }
    let fileName = ''
    if (location === 'portfolio') {
       fileName = `${user.id}/${opportunityId}-${file.name}`;
    } else {
       fileName = `${type}/${opportunityId}/${new Date().toISOString()}-++-${file.name}`;
    }
    debugLog(fileName)
  
    const { data, error } = await supabase.storage
      .from(location)
      .upload(fileName, file, {
        upsert: true
      });
  
    if (error) {
      console.error('Error uploading file:', error);
      throw new Error('Failed to upload file', error);
    }
  
    const { data: { publicUrl } } = supabase.storage
      .from(location)
      .getPublicUrl(fileName);
  
    if (!publicUrl) {
      throw new Error('Failed to get public URL');
    }
    return publicUrl ;
  }


  export async function deleteFile(fileUrl: string, location: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login')
  }
  
  

  // Extract the file path from the public URL
  const filePath = fileUrl.split('/').slice(-3).join('/');
  debugLog("attempting to delete", filePath)

  const { data, error } = await supabase.storage
    .from(location)
    .remove([filePath]);

  if (error) {
    console.error('Error deleting file:', error);
    throw new Error('Failed to delete file');
  }
}

export async function addToMyEvents(event: any, type:string, subject: string) {
  debugLog(event)
  function formatDateTime(date: string, time: string): string {
    // Combine date and time strings
    const dateTimeString = `${date}T${time}:00`;
    debugLog(dateTimeString)
    // Create a date object. This will be in local time.
    const dateObj = new Date(dateTimeString);
    debugLog(dateObj)
    // Convert to ISO string. This will convert to UTC.
    return dateObj.toISOString();
  }

  async function makeGoogleCalendarRequest(token: string, eventDetails: any) {
    debugLog(JSON.stringify(eventDetails))
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventDetails)
    });
  
    if (response.status === 401) {
      throw new Error('Unauthorized');
    }
  
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to add event: ${errorData.error.message}`);
    }
  
    return response.json();
  }

  const supabase = createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return redirect('/login')
    }
    const {data: provider_data} = await supabase
    .from('profile_tokens')
    .select('provider_token, provider_refresh_token')
    .eq('id', user.id)
    if (!provider_data || provider_data == null) {
      throw new Error('no provider_data')
      }
      let {provider_token, provider_refresh_token} = provider_data[0]
      
      const startDateTime = formatDateTime(event.date, event.start_time)
      const endDateTime = formatDateTime(event.date, event.end_time)
      debugLog('Start:',startDateTime)
      debugLog('End:',endDateTime)

      var eventDetails = {}
    if (type === 'event') {
   eventDetails =  {
    'summary': event.title,
    'description': `${event.description}\n\nCategory: ${event.category}\nSub-category: ${event.sub_category}\nContact: ${event.contact_name} (${event.contact_email})`,
    'start': {
      'dateTime': startDateTime,
      'timeZone': 'UTC'
    },
    'end': {
      'dateTime': endDateTime,
      'timeZone': 'UTC'
    }  };

  } else if (type === 'group_session') {
     eventDetails =  {
      'summary': `Group Mentoring | ${event.title}`,
      'description': `${event.description}\n\nSubject: ${event.subjects.map(String).join(' | ')}\nContact: ${event.profiles.first_name} ${event.profiles.last_name} | (${event.mentors.email})`,
      'start': {
        'dateTime': startDateTime,
        'timeZone': 'UTC'
      },
      'end': {
        'dateTime': endDateTime,
        'timeZone': 'UTC'
      }  };
  } else {
    throw new Error ('Event type invalid')
  }
  let result 
  try {
    result = await makeGoogleCalendarRequest(provider_token, eventDetails)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized' && provider_refresh_token) {
      try {
      const new_token = await refreshToken(provider_refresh_token)

      await supabase
      .from('profile_tokens')
      .update({provider_token: new_token})
      .eq('id',user.id)

      result = await makeGoogleCalendarRequest(new_token, eventDetails)
    } catch (refreshError) {
      if (refreshError instanceof Error && refreshError.message === 'RE_AUTHENTICATION_REQUIRED') {
        return redirect('/login')
      }
      throw new Error('Failed to refresh token');
    }
    } else {
      throw error
    }
  }
  
  debugLog('Event added to calendar successfully:',result)
  const googleEventID = result.id
  if (type === 'event') {
  const { data, error } = await supabase
    .from('user_events')
    .insert({
      user_id: user.id,
      event_id: event.event_id,
      google_event_id: googleEventID
    });

  if (error) {
    console.error('Supabase error:', error);
    throw new Error('Failed to add event');
  }
  return data
} else if (type === 'group_session') {
  const { data, error } = await supabase
    .from('appointments')
    .insert({
      user_id: user.id,
      mentor_id: event.mentors.user_id,
      group_session_id: event.group_session_id,
      google_event_id: googleEventID,
      user_priority_subject: subject
    });

  if (error) {
    console.error('Supabase error:', error);
    throw new Error('Failed to add event');
  }
  return data
}



} catch (error) {
  console.error('Error adding event to Google Calendar:', error)
  throw error
}

}


export async function removeEvent(event: any , type: string) {
  async function makeGoogleCalendarRequest(token: string, eventId: any) {
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    if (response.status === 401) {
      throw new Error('Unauthorized');
    }
  
  
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  const supabase = createClient();
  try { 
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return redirect('/login')
    }
    const {data: provider_data} = await supabase
    .from('profile_tokens')
    .select('provider_token, provider_refresh_token')
    .eq('id', user.id)
    if (!provider_data || provider_data == null) {
      throw new Error('no provider_data')
      }
      let {provider_token, provider_refresh_token} = provider_data[0]
    
      let googleEventData: { google_event_id: string } | null = null
      if (type === 'event') {  
      const {data} = await supabase
      .from('user_events')
      .select('google_event_id')
      .eq('user_id', user.id)
      .eq('event_id', event.event_id)
      .single();
      googleEventData = data
    } else if (type === 'group_session') {
      const {data} = await supabase
      .from('appointments')
      .select('google_event_id')
      .eq('user_id', user.id)
      .eq('group_session_id', event.group_session_id)
      .single();
      googleEventData = data
    } else {
      throw new Error ('invalid type')
    }
      const googleEventID = googleEventData?.google_event_id
      debugLog('google id:',googleEventID)
      
  let result 
  try {
    result = await makeGoogleCalendarRequest(provider_token, googleEventID)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized' && provider_refresh_token) {
      const new_token = await refreshToken(provider_refresh_token)

      await supabase
      .from('profile_tokens')
      .update({provider_token: new_token})
      .eq('id',user.id)

      result = await makeGoogleCalendarRequest(new_token, googleEventID)
    } else {
      throw error
    }
  }
  
  debugLog('Event removed from calendar successfully:',result)
  if (type === 'event') {
    const { data, error } = await supabase
    .from('user_events')
    .delete()
    .eq("user_id", user.id)
    .eq("event_id", event.event_id);

  if (error) {
    console.error('Supabase error:', error);
    throw new Error('Failed to delete event');
  }
  return data

  } else {
    const { data, error } = await supabase
    .from('appointments')
    .delete()
    .eq("user_id", user.id)
    .eq("group_session_id", event.group_session_id);

  if (error) {
    console.error('Supabase error:', error);
    throw new Error('Failed to delete event');
  }
  return data
  }
  
} catch (error) {
  console.error('Error deleting event from Google Calendar:', error)
  throw error
}
}

















export async function getEvents() {
  const supabase = createClient();
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('events')
    .select(`
      event_id,
      title,
      category,
      sub_category,
      date,
      start_time,
      end_time,
      poster,
      description,
      contact_name,
      contact_email,
      year_groups
    `)
    .gte('date', today.toISOString()) ;
    
  if (error) {
    console.error('Error fetching events:', error);
    throw new Error('Failed to fetch events');
  }
  debugLog(data)
  return data;
}

export async function getUserEventsIDs(): Promise<number[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const events: number[] = []

  if (!user) {
    return redirect('/login')
  }

  const { data, error } = await supabase
    .from('user_events')
    .select(`
      *,
      events (*)
    `)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error fetching events:', error);
    throw new Error('Failed to fetch user events');
  }

  data.forEach(item => events.push(item.event_id))
  debugLog ('userEvents:',events)
  return events
}


export async function refreshToken(refresh_token: string) {
  const supabase = createClient();
  const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'
  const CLIENT_ID = process.env.GOOGLE_CLIENT_ID
  const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET

  try {
    const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: CLIENT_ID!,
        client_secret: CLIENT_SECRET!,
        refresh_token: refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      if(response.status === 400) {
        throw new Error('RE_AUTHENTICATION_REQUIRED')
      }
      const errorData = await response.json();
      debugLog('Response status:',response.status)
      throw new Error(`Failed to refresh token: ${errorData.error_description}`);
    }

    const data = await response.json();

    // Update the token in the database
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    const { error: updateError } = await supabase
      .from('profile_tokens')
      .upsert({ 
        id: userData.user!.id,
        provider_token: data.access_token,
        ...(data.refresh_token ? { provider_refresh_token: data.refresh_token } : {})
      });

    if (updateError) throw updateError;

    return data.access_token;
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw error;
  }
}

export async function updateGoogleTokens() { ///only used on sign-in
  try {
    const supabase = createClient()
    const user = await supabase.auth.getUser()
    const {data} = await supabase.auth.getSession()

    if (!user.data?.user?.id) return;

    if (data.session?.provider_token && data.session?.provider_refresh_token) {
      await supabase
        .from('profile_tokens')
        .upsert({'id': user.data.user.id, 'provider_token': data.session.provider_token, 'provider_refresh_token': data.session.provider_refresh_token});
    }
  } catch (e) {
    console.error('updateGoogleTokens failed silently:', e)
  }
}

export async function getMentors(subject: string) {

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser();
    

  if (!user) {
    return redirect('/login')
  }
  const { data, error } = await supabase
  .from('mentors')
  .select(`
    *,
    profiles!inner (first_name, last_name, current_year, subjects, profile_url)
  `)
  .contains('profiles.subjects', [subject]);

  if (error) {
    console.error('Error fetching mentors:', error);
    debugLog(error)
    throw new Error('Failed to fetch mentors');
  }

  return data

}

export async function getGroupSessions(subject: string) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser();
    

  if (!user) {
    return redirect('/login')
  }
  const { data, error } = await supabase
    .from('group_mentoring_events')
    .select(`
      *,
      mentors!inner (*),
      profiles!inner (first_name, last_name, current_year, subjects, profile_url)
    `)
    .gte('date', today.toISOString() )
    .contains('subjects',[subject]);

  if (error) {
    console.error('Error fetching group sessions:', error);
    throw new Error('Failed to fetch group sessions');
  }

  return data
}

export async function getUserGroupSessions() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser();
    

  if (!user) {
    return redirect('/login')
  }
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      group_session_id,
      group_mentoring_events!inner (
        date
      )
    `)
    .eq('user_id', user.id)
    .not('group_session_id', 'is', null)
    .gte('group_mentoring_events.date', today.toISOString())
    .order('group_mentoring_events(date)', { ascending: true });



  if (error) {
    console.error('Error fetching group sessions:', error);
    throw new Error('Failed to fetch group sessions');
  }

  return data.map (row => row.group_session_id)
}



export async function getUpcomingMentoringMeetings(): Promise<Meeting[]> {
  const supabase = createClient();

  interface MeetingDetails {
    bookedBy: string;
    email: string;
    subject: string;
    focus: string;
  }
  
  function extractMeetingDetails(description: string): MeetingDetails {
    const details: MeetingDetails = {
      bookedBy: '',
      email: '',
      subject: '',
      focus: ''
    };
  
    // Extract booked by
    const bookedByMatch = description.match(/<b>Booked by<\/b>\s*\n\s*([\s\S]*?)(?:\n|$)/);
    if (bookedByMatch) details.bookedBy = bookedByMatch[1].trim();
  
    // Extract email
    const emailMatch = description.match(/\n([\w.-]+@[\w.-]+\.\w+)\n/);
    if (emailMatch) details.email = emailMatch[1];
  
    // Extract subject
    const subjectMatch = description.match(/<b>Meeting Subject:<\/b>(?:\s|<br>|\n)+([\s\S]*?)(?:<br>|<b>|\n|$)/);
    if (subjectMatch) details.subject = subjectMatch[1].trim();
  
    // Extract focus
    const focusMatch = description.match(/<b>Focus:<\/b>(?:\s|<br>|\n)+([\s\S]*?)(?:<br>|<b>|\n|$)/);
    if (focusMatch) details.focus = focusMatch[1].trim();
    debugLog(details)
    return details;
  }
  

  async function makeGoogleCalendarRequest(token: string, params: any) {
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${new URLSearchParams(params).toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 401) {
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to fetch events: ${errorData.error.message}`);
    }

    return response.json();
  }

  async function getMentorDetails(email: string) {
    const { data, error } = await supabase
      .from('mentors')
      .select(`
        email,
        profiles!mentors_user_id_fkey1 (
          first_name,
          last_name,
          profile_url
        )
      `)
      .eq('email', email)
      .single();

    if (error) {
      console.error('Error fetching mentor details:', error);
      return null;
    }
    
    return data ? {
      first_name: data.profiles[0].first_name,
      last_name: data.profiles[0].last_name,
      profile_url: data.profiles[0].profile_url
    } : null;
  }

  async function getStudentDetails(email: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
          first_name,
          last_name,
          profile_url
      `)
      .eq('email', email)
      .single();

    if (error) {
      console.error('Error fetching student details:', error);
      return null;
    }
    
    return data ? {
      first_name: data.first_name,
      last_name: data.last_name,
      profile_url: data.profile_url
    } : null;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return redirect('/login')
    }

    const { data: provider_data } = await supabase
      .from('profile_tokens')
      .select('provider_token, provider_refresh_token')
      .eq('id', user.id)

    if (!provider_data || provider_data.length === 0) {
      throw new Error('No provider data found');
    }

    let { provider_token, provider_refresh_token } = provider_data[0];

    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const params = {
      timeMin: now.toISOString(),
      timeMax: thirtyDaysLater.toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
      q: 'Generated Mentoring Meeting Event'
    };

    let result;
    try {
      result = await makeGoogleCalendarRequest(provider_token, params);
    } catch (error) {
      if (error instanceof Error && error.message === 'Unauthorized' && provider_refresh_token) {
        try {
          const new_token = await refreshToken(provider_refresh_token);

          await supabase
            .from('profile_tokens')
            .update({ provider_token: new_token })
            .eq('id', user.id);

          result = await makeGoogleCalendarRequest(new_token, params);
        } catch (refreshError) {
          if (refreshError instanceof Error && refreshError.message === 'RE_AUTHENTICATION_REQUIRED') {
            return redirect('/login')
          }
          throw new Error('Failed to refresh token');
        }
      } else {
        throw error;
      }
    }
    // Classify events and collect unique emails for batch fetching
    const eventDetails = result.items.map((event: GoogleCalendarEvent) => ({
      event,
      details: extractMeetingDetails(event.description),
    }));

    const teachingEmails = new Set<string>();
    const mentoringEmails = new Set<string>();
    eventDetails.forEach(({ event, details }: { event: GoogleCalendarEvent; details: ReturnType<typeof extractMeetingDetails> }) => {
      if (!event.organizer?.email) return;
      if (event.organizer.email === user.email) {
        teachingEmails.add(event.organizer.email);
      } else if (details.email === user.email) {
        mentoringEmails.add(event.organizer.email);
      }
    });

    const teachingEmailList = Array.from(teachingEmails);
    const mentoringEmailList = Array.from(mentoringEmails);

    // Two batch queries instead of N individual queries
    const [{ data: studentRows }, { data: mentorRows }] = await Promise.all([
      teachingEmailList.length > 0
        ? supabase.from('profiles').select('email, first_name, last_name, profile_url').in('email', teachingEmailList)
        : Promise.resolve({ data: [] as any[] }),
      mentoringEmailList.length > 0
        ? supabase.from('mentors').select('email, profiles!mentors_user_id_fkey1(first_name, last_name, profile_url)').in('email', mentoringEmailList)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const studentMap = new Map((studentRows ?? []).map((p: any) => [p.email, p]));
    const mentorMap = new Map((mentorRows ?? []).map((m: any) => [m.email, m]));

    const meetings: Meeting[] = eventDetails.map(({ event, details }: { event: GoogleCalendarEvent; details: ReturnType<typeof extractMeetingDetails> }) => {
      const subject = details.subject || 'Unknown';
      let meetName = 'Unknown';
      let meetPhoto = '';
      let type = '';

      if (event.organizer?.email) {
        if (event.organizer.email === user.email) {
          type = 'teaching';
          const student = studentMap.get(event.organizer.email);
          if (student) {
            meetName = `${student.first_name} ${student.last_name}`;
            meetPhoto = student.profile_url || '';
          }
        } else if (details.email === user.email) {
          type = 'mentoring';
          const mentor = mentorMap.get(event.organizer.email);
          if (mentor) {
            const profile = Array.isArray(mentor.profiles) ? mentor.profiles[0] : mentor.profiles;
            if (profile) {
              meetName = `${profile.first_name} ${profile.last_name}`;
              meetPhoto = profile.profile_url || '';
            }
          }
        }
      }

      return {
        meetName,
        meetPhoto,
        date: event.start.dateTime.split('T')[0],
        startTime: event.start.dateTime.split('T')[1].slice(0, 5),
        endTime: event.end.dateTime.split('T')[1].slice(0, 5),
        subject,
        description: details.focus,
        email: event.organizer.email,
        type,
      };
    });

    return meetings;

  } catch (error) {
    console.error('Error fetching mentoring meetings:', error);
    throw error;
  }
}
export async function getUserEvents(): Promise<Event[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login')
  }

  interface UserEventWithDetails {
    event_id: number;
    google_event_id: string;
    events: Event;
  }

  const { data, error } = await supabase
    .from('user_events')
    .select(`
      event_id,
      google_event_id,
      events (*)
    `)
    .eq('user_id', user.id)
    .returns<UserEventWithDetails[]>();
    

  if (error) {
    console.error('Error fetching events:', error);
    throw new Error('Failed to fetch user events');
  }

  // Flatten and restructure the data
  const flattenedEvents: Event[] = data.map(item => ({
    ...item.events,
    google_event_id: item.google_event_id
  }));
  return flattenedEvents;
}

export async function getIsMentor() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login')
  }
  
  const {count, error} = await supabase
  .from('mentors')
  .select('*', { count: 'exact', head: true })
  .eq('user_id',user.id)

  if (error) {
    console.error('Error verifying mentor:', error);
    throw new Error('Failed to verify mentor');
  }
  debugLog('Returned data',count)
  if (count === 0 ) {
    return false
  } else {
    return true
  }

}

export async function getMentoringData() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login')
  }
  
  const {data, error} = await supabase
  .from('mentors')
  .select('*')
  .eq('user_id',user.id)
  .single()

  if (error) {
    console.error('Error fetching mentor data:', error);
    throw new Error('Failed to fetch mentor data');
  }
  debugLog(data)
  return data
  

}

export async function updateMentoringProfile(changes: any) {

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login')
  }
  
  const {data, error} = await supabase
  .from('mentors')
  .update(changes)
  .eq('user_id',user.id)
  .single()

  if (error) {
    console.error('Error fetching mentor data:', error);
    throw new Error('Failed to fetch mentor data');
  }
  revalidatePath('/my-mentoring');

    return { success: true, data };
  }




// Function to simulate getting all group sessions
export async function getMentoringGroupSessions() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser();
    

  if (!user) {
    return redirect('/login')
  }
  const { data, error } = await supabase
    .from('group_mentoring_events')
    .select(`
      *`)
    .gte('date', today.toISOString() )
    .eq('mentor_id', user.id);

  if (error) {
    console.error('Error fetching group sessions:', error);
    throw new Error('Failed to fetch group sessions');
  }
  debugLog('Mentoring Group Sessions:',data)
  return data
}


async function createGoogleCalendarEvent(session: any) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: providerData } = await supabase
    .from('profile_tokens')
    .select('provider_token, provider_refresh_token')
    .eq('id', user?.id)
    .single();

  if (!providerData) {
    throw new Error('No provider data found');
  }

  let { provider_token } = providerData;

  const eventDetails = {
    summary: `Group Mentoring: ${session.title}`,
    description: session.description,
    start: {
      dateTime: `${session.date}T${session.start_time}:00`,
      timeZone: 'UTC'
    },
    end: {
      dateTime: `${session.date}T${session.end_time}:00`,
      timeZone: 'UTC'
    },
    attendees: []
  };

  try {
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventDetails)
    });

    if (!response.ok) {
      throw new Error('Failed to create Google Calendar event');
    }

    return response.json();
  } catch (error) {
    console.error('Error creating Google Calendar event:', error);
    throw error;
  }
}

// Function to simulate editing an existing group session
export async function editGroupSession(group_session: any) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser();
    
  debugLog('Changing details of:',group_session)
  if (!user) {
    return redirect('/login')
  }
  const { data, error } = await supabase
    .from('group_mentoring_events')
    .update(group_session)
    .eq('group_session_id', group_session.group_session_id)
    .single();

  if (error) {
    console.error('Error editing group sessions:', error);
    throw new Error('Failed to edit group sessions');
  }
  debugLog('Mentoring Group Sessions:',data)
  return data
}

// Function to simulate deleting a group session


export async function addStudentToGroupSession(sessionId: string, studentId: string) {
  const supabase = createClient();

  // Add student to the session in Supabase
  const { data: appointment, error } = await supabase
    .from('appointments')
    .insert({
      user_id: studentId,
      group_session_id: sessionId
    })
    .single();

  if (error) {
    throw new Error('Failed to add student to session');
  }

  // Get the Google Calendar event ID
  const { data: session } = await supabase
    .from('group_mentoring_events')
    .select('google_event_id')
    .eq('group_session_id', sessionId)
    .single();

  if (!session?.google_event_id) {
    throw new Error('Google Calendar event ID not found');
  }

  // Get the student's email
  const { data: student } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', studentId)
    .single();

  if (!student?.email) {
    throw new Error('Student email not found');
  }

  // Add student to Google Calendar event
  await updateGoogleCalendarEvent(session.google_event_id, student.email);

  return appointment;
}

async function updateGoogleCalendarEvent(eventId: string, studentEmail: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login')
  }

  const { data: providerData } = await supabase
    .from('profile_tokens')
    .select('provider_token, provider_refresh_token')
    .eq('id', user.id)
    .single();

  if (!providerData) {
    throw new Error('No provider data found');
  }

  let { provider_token } = providerData;

  try {
    // First, get the current event details
    const getResponse = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
      headers: {
        'Authorization': `Bearer ${provider_token}`
      }
    });

    if (!getResponse.ok) {
      throw new Error('Failed to get Google Calendar event');
    }

    const event = await getResponse.json();

    // Add the new student to the attendees list
    event.attendees = [...(event.attendees || []), { email: studentEmail }];

    // Update the event
    const updateResponse = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${provider_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    });

    if (!updateResponse.ok) {
      throw new Error('Failed to update Google Calendar event');
    }

    return updateResponse.json();
  } catch (error) {
    console.error('Error updating Google Calendar event:', error);
    throw error;
  }
}

async function deleteGoogleCalendarEvent(eventId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login')
  }

  const { data: providerData } = await supabase
    .from('profile_tokens')
    .select('provider_token, provider_refresh_token')
    .eq('id', user.id)
    .single();

  if (!providerData) {
    throw new Error('No provider data found');
  }

  let { provider_token } = providerData;

  try {
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${provider_token}`,
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token might be expired, try to refresh it
        provider_token = await refreshToken(providerData.provider_refresh_token);
        // Retry the delete operation with the new token
        const retryResponse = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${provider_token}`,
          }
        });

        if (!retryResponse.ok) {
          throw new Error(`Failed to delete Google Calendar event: ${retryResponse.statusText}`);
        }
      } else {
        throw new Error(`Failed to delete Google Calendar event: ${response.statusText}`);
      }
    }

    debugLog(`Successfully deleted Google Calendar event: ${eventId}`);
  } catch (error) {
    console.error('Error deleting Google Calendar event:', error);
    throw error;
  }
}

export async function createGroupSession(eventData: any) {
  function formatDateTime(date: string, time: string): string {
    // Ensure the date is in YYYY-MM-DD format and time is in HH:MM:SS format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
    
    if (!dateRegex.test(date) || !timeRegex.test(time)) {
      throw new Error(`Invalid date or time format. Date: ${date}, Time: ${time}`);
    }
    
    // Combine date and time strings
    const dateTimeString = `${date}T${time}Z`;
    return dateTimeString;
  }

  async function makeGoogleCalendarRequest(token: string, eventDetails: any) {
    debugLog('Sending to Google Calendar:', JSON.stringify(eventDetails, null, 2));
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventDetails)
    });

    if (response.status === 401) {
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google Calendar API Error:', errorData);
      throw new Error(`Failed to add event: ${errorData.error.message}`);
    }

    return response.json();
  }

  const supabase = createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return redirect('/login')
    }

    const { data: provider_data } = await supabase
      .from('profile_tokens')
      .select('provider_token, provider_refresh_token')
      .eq('id', user.id)
      .single();

    if (!provider_data) {
      throw new Error('No provider data found');
    }

    let { provider_token, provider_refresh_token } = provider_data;

    debugLog('Event data received:', eventData);

    if (!eventData.date || !eventData.start_time || !eventData.end_time) {
      throw new Error('Missing date or time information');
    }

    const startDateTime = formatDateTime(eventData.date, eventData.start_time);
    const endDateTime = formatDateTime(eventData.date, eventData.end_time);

    const eventDetails = {
      'summary': `Group Mentoring | ${eventData.title}`,
      'description': `${eventData.description}\n\nSubject: ${eventData.subjects.map(String).join(' | ')}`,
      'start': {
        'dateTime': startDateTime,
        'timeZone': 'UTC'
      },
      'end': {
        'dateTime': endDateTime,
        'timeZone': 'UTC'
      }
    };

    debugLog('Formatted event details:', JSON.stringify(eventDetails, null, 2));
    
    let result;
    try {
      result = await makeGoogleCalendarRequest(provider_token, eventDetails);
    } catch (error: any) {
      console.error('Error making Google Calendar request:', error);
      if (error.message === 'Unauthorized' && provider_refresh_token) {
        try {
          const new_token = await refreshToken(provider_refresh_token);
          await supabase
            .from('profile_tokens')
            .update({ provider_token: new_token })
            .eq('id', user.id);
          result = await makeGoogleCalendarRequest(new_token, eventDetails);
        } catch (refreshError: any) {
          console.error('Error refreshing token:', refreshError);
          if (refreshError.message === 'RE_AUTHENTICATION_REQUIRED') {
            return redirect('/login')
          }
          throw new Error('Failed to refresh token');
        }
      } else {
        throw error;
      }
    }

    debugLog('Event added to calendar successfully:', result);

    const supabaseEventData = {
      ...eventData,
      mentor_id: user.id,
      google_event_id: result.id
    };

    // Create the group session in Supabase
    const { data: newSession, error } = await supabase
      .from('group_mentoring_events')
      .insert(supabaseEventData)
      .single();

    if (error) {
      // If Supabase insertion fails, delete the Google Calendar event
      await deleteGoogleCalendarEvent(result.id);
      throw new Error(`Failed to create group session: ${error.message}`);
    }

    return newSession;
  } catch (error: any) {
    console.error('Error in createGroupSession:', error);
    throw new Error(`Error in createGroupSession: ${error.message}`);
  }
}


export async function createSession(type: string, eventData: any) {
  function formatDate(date: any) {
    /// format date for supabase and gcal
    const formattedDate = "2024-10-17"
    return formattedDate
  }
  function formatTime(time: any) {
    // format time for supabase
    const formattedTime = "19:00:00"
    return formattedTime
  }
  function formatDateTime(date: any, time: any) {
    // format time for GCal
    const formattedTime = "2024-10-17T19:00:00+04:00"
    return formattedTime
  }

  function testDateTime() {
    return "2024-10-17T19:45:00+04:00"
  }




  //get user

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return redirect('/login')
    }
  //get the provider token for GCal Requests
    const { data: provider_data } = await supabase
      .from('profile_tokens')
      .select('provider_token, provider_refresh_token')
      .eq('id', user.id)
      .single();

    if (!provider_data) {
      throw new Error('No provider data found');
    }

    let { provider_token, provider_refresh_token } = provider_data;

    const startDateTime = formatDateTime(eventData.date, eventData.start_time);
    const endDateTime = testDateTime();
    let eventDetails;
    if (type === 'Group Mentoring') {
      eventDetails = {
        'summary': `Group Mentoring | ${eventData.title}`,
        'description': `${eventData.description}\n\nSubject: ${eventData.subjects.map(String).join(' | ')}`,
        'start': {
          'dateTime': startDateTime,
          'timeZone': 'UTC'
        },
        'end': {
          'dateTime': endDateTime,
          'timeZone': 'UTC'
        }
      };
    } else if (type === 'Event') {
      eventDetails = {
        'summary': `${eventData.title}`,
        'description': `${eventData.description}`,
        'start': {
          'dateTime': startDateTime,
          'timeZone': 'UTC'
        },
        'end': {
          'dateTime': endDateTime,
          'timeZone': 'UTC'
        }
      };
    }
     

    debugLog('Formatted event details:', JSON.stringify(eventDetails, null, 2));
    
    let result;
    //attempt to add event to GCal, or refresh token
    try {
      result = await makeGoogleCalendarRequest(provider_token, eventDetails);
    } catch (error: any) {
      console.error('Error making Google Calendar request:', error);
      if (error.message === 'Unauthorized' && provider_refresh_token) {
        try {
          const new_token = await refreshToken(provider_refresh_token);
          await supabase
            .from('profile_tokens')
            .update({ provider_token: new_token })
            .eq('id', user.id);
          result = await makeGoogleCalendarRequest(new_token, eventDetails);
        } catch (refreshError: any) {
          console.error('Error refreshing token:', refreshError);
          if (refreshError.message === 'RE_AUTHENTICATION_REQUIRED') {
            return redirect('/login')
          }
          throw new Error('Failed to refresh token');
        }
      } else {
        throw error;
      }
    }

    debugLog('Event added to calendar successfully:', result);

    //add details to supabase

    let supabaseEventData;
    let error;
    if (type === 'Group Mentoring') {
      supabaseEventData = {
        ...eventData,
        mentor_id: user.id,
        iCalUID: result.iCalUID,
        google_event_id: result.id,
        invite_link: result.htmlLink

      };
      const { data: newSession, error } = await supabase
      .from('group_mentoring_events')
      .insert(supabaseEventData)
      .single();
    } else if (type === 'Event') {
      supabaseEventData = {
        ...eventData,
        google_event_id: result.id,
        invite_link: result.htmlLink
      };
      const { data: newSession, error } = await supabase
      .from('events')
      .insert(supabaseEventData)
      .single();
    }

  

    // Create the group session in Supabase
    

    if (error) {
      // If Supabase insertion fails, delete the Google Calendar event
      await deleteGoogleCalendarEvent(result.id);
      throw new Error(`Failed to create group session: ${String(error)}`);
    }
  
}

async function makeGoogleCalendarRequest(token: string, eventDetails: any) {
  debugLog('Sending to Google Calendar:', JSON.stringify(eventDetails, null, 2));
  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(eventDetails)
  });

  if (response.status === 401) {
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Google Calendar API Error:', errorData);
    throw new Error(`Failed to add event: ${errorData.error.message}`);
  }

  return response.json();
}


export async function addCalendarEvent(eventData: any) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return redirect('/login')
    }
  //get the provider token for GCal Requests
    const { data: provider_data } = await supabase
      .from('profile_tokens')
      .select('provider_token, provider_refresh_token')
      .eq('id', user.id)
      .single();

    if (!provider_data) {
      throw new Error('No provider data found');
    }

    let { provider_token, provider_refresh_token } = provider_data;

    let result;
    try {
      debugLog('EVENT ID:',eventData)
      result = await handleGoogleCalendarAdd(provider_token, eventData);
    } catch (error: any) {
      console.error('Error making Google Calendar request:', error);
      if (error.message === 'Unauthorized' && provider_refresh_token) {
        try {
          const new_token = await refreshToken(provider_refresh_token);
          await supabase
            .from('profile_tokens')
            .update({ provider_token: new_token })
            .eq('id', user.id);
          result = await handleGoogleCalendarAdd(new_token, eventData);
        } catch (refreshError: any) {
          console.error('Error refreshing token:', refreshError);
          if (refreshError.message === 'RE_AUTHENTICATION_REQUIRED') {
            return redirect('/login')
          }
          throw new Error('Failed to refresh token');
        }
      } else {
        throw error;
      }
    }
    
    // Update your local database to reflect that this user has joined the event
    await supabase
      .from('appointments')
      .insert({
        group_session_id: eventData.group_session_id,
        user_id: user.id,
        mentor_id: eventData.mentor_id,
        event_id: eventData.google_event_id,
        local_event_id: result.id,
      });

}

async function handleGoogleCalendarAdd(token: any, eventDetails: any) {
  try {
    
    const times = {
      'start': {
        'dateTime': "2024-10-17T19:00:00+04:00",
        'timeZone': 'UTC'
      },
      'end': {
        'dateTime': "2024-10-17T19:40:00+04:00",
        'timeZone': 'UTC'
      }
    };
    // Prepare the event for import
    const importEvent = {
      iCalUID: eventDetails.iCalUID, // Use the same iCalUID as the original event
      start: times.start,
      end: times.end,
      organizer: eventDetails.mentors.email, // Specify the organizer in the attendee's copy
      status: 'confirmed'
    };

    // Import the event into the attendee's calendar
    const importResponse = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events/import', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(importEvent)
    });

    if (!importResponse.ok) {
      const errorData = await importResponse.json();
      throw new Error(`Failed to import event: ${errorData.error.message}`);
    }

    const importedEvent = await importResponse.json();

    return importedEvent;
  } catch (error) {
    console.error('Error importing event for attendee:', error);
    throw error;
  }
}


export async function AddNewActivity(formData: any, isTeacher?: boolean) {
  const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
  
    if (!user) {
      return redirect('/login')
    }

    
  
    const data = Object.fromEntries(formData);

    const newActivity = {
      ...data,
      submitted_by: user.id,
      image: null,
      past_projects: null,
      subjects: JSON.parse(data.subjects),
      year_groups: JSON.parse(data.year_groups),
      one_off: data.one_off === 'true',
      internal: data.internal === 'true',
      online: data.online === 'true',
      submission_date: data.submission_date && data.submission_date !== 'null' ? new Date(data.submission_date).toISOString() : null,
      status: isTeacher ? 'active' : 'pending',
      review_teacher: isTeacher ? user.email : data.review_teacher
      
    };

    debugLog(newActivity)
  
    const { data: result, error: insertError } = await supabase
      .from('opportunities')
      .insert(newActivity)
      .select('opportunity_id')
      .single();
  
    if (insertError) {
      console.error('Error adding activity:', insertError);
      throw new Error('Failed to add activity');
    }

    const opportunity_id = result.opportunity_id;
    let imagePath;
    let imageURL;
    let projectURL = [];
    debugLog(formData)
    for (let [key, value] of formData) {
      if (value instanceof File) {
        const file = value;
        const fileExt = file.name.split('.').pop();
        let type;
        if (key === 'image') {
          type = 'images'
        } else {
          type = 'past-projects'
        }
        const fileName = `${type}/${opportunity_id}/${new Date().toISOString()}-++-${file.name}`;
        debugLog("Attempting to upload:",fileName)
        const { data, error } = await supabase.storage
          .from('opportunities')
          .upload(fileName, file);
  
        if (error) {
          console.error('Error uploading file:', error);
          throw new Error('Failed to upload file');
        }
  
        const { data: { publicUrl } } = supabase.storage
          .from('opportunities')
          .getPublicUrl(fileName);
  
        if (type === 'images') {
          imageURL = publicUrl
          imagePath = fileName
        } else {
          projectURL.push(publicUrl)
        }
      }
    }

    const {  error: updateError } = await supabase
      .from('opportunities')
      .update({
        image: imageURL,
        past_projects: projectURL
      })
      .eq('opportunity_id', opportunity_id);
  
    if (updateError) {
      console.error('Error updating activity:', updateError);
      throw new Error('Failed to update activity');
    }


}


export async function getSubmittedOpportunities() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
    if (!user) {
      return redirect('/login')
    }

  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .eq('submitted_by', user.id);
  
  if (error) {
    console.error('Error fetching opportunities:', error);
    throw new Error('Failed to fetch opportunities');
  }

  return data;
}


export async function updateOpportunity(formData: any, opportunity_id?: string, isTeacher?: boolean) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return redirect('/login')
  }

  debugLog("formData", formData)
  debugLog("isTeacher", isTeacher)

  // Prepare the update data
  const updatedData = {
    ...formData,
    last_updated: new Date().toISOString(),
    status: isTeacher ? 'active' : 'pending',
    opportunity_id: opportunity_id
  };


  const { data, error } = await supabase
    .from('opportunities')
    .update(updatedData)
    .eq('opportunity_id', opportunity_id);

  if (error) {
    console.error('Error:', error);
    throw new Error('Failed to update opportunity');
  }

  return data;
}



export async function getTeachers(): Promise<Teacher[]> {
  const supabase = createClient();

// Then, let's see what profiles we have
const { data, error } = await supabase
  .from('profiles')
  .select('first_name, last_name, email, role')
  .eq('role','teacher');

  if (error) {
    throw new Error('Failed to fetch teachers');
  }

  if (!data) {
    return [];
  }
  debugLog('Teachers:', data)
  return data as Teacher[];
}

export async function deleteOpportunity(opportunity_id: string) {
  const supabase = createClient();


const {error} = await supabase
  .from('opportunities')
  .delete()
  .eq('opportunity_id', opportunity_id);

if (error) {
  console.error('Error deleting opportunity:', error);
  throw new Error('Failed to delete opportunity');
}
}


export async function getTeacherViewOpportunities() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return redirect('/login')
    }

    // Get all submitted opportunities
    let opportunities = await getSubmittedOpportunities();

    // Get opportunities where user is review teacher
    const { data: teacherOpportunities, error } = await supabase
      .from('opportunities')
      .select(`
        *,
        profiles!opportunities_submitted_by_fkey (
          first_name,
          last_name
        )
      `)
      .eq('review_teacher', user?.email);

    if (error) {
      throw error;
    }

    // Create a Set of opportunity IDs that are already in opportunities array
    const existingIds = new Set(opportunities.map(opp => opp.opportunity_id));

    // Only add teacher opportunities that aren't already in the array
    const uniqueTeacherOpportunities = (teacherOpportunities || []).filter(
      opp => !existingIds.has(opp.opportunity_id)
    );
    debugLog("Teacher Opportunities:",...opportunities, ...uniqueTeacherOpportunities)
    return [...opportunities, ...uniqueTeacherOpportunities];

  } catch (error) {
    console.error('Error fetching opportunities:', error);
    throw new Error('Failed to fetch opportunities');
  }
}


export async function updateOpportunityStatus(data: any, opportunity_id?: string) {
  const supabase = createClient();


  const { error } = await supabase
    .from('opportunities')
    .update(data)
    .eq('opportunity_id', opportunity_id);
  
  if (error) {
    console.error('Error updating opportunity status:', error);
    throw new Error('Failed to update opportunity status');
  }
}

export async function getStudentsOverview() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email, current_year, profile_url, subjects, can_add, can_add_approver')
    .eq('role', 'student')
    .gte("current_year", 12 );
    if (error) {
      console.error('Error fetching students:', error);
      throw new Error('Failed to fetch students');
    }

    return data;
}

/** Students this teacher has granted can_add to. */
export async function getMyAmbassadors(): Promise<AmbassadorStudent[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect('/login');

  const { data: caller, error: callerError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (callerError || caller?.role !== 'teacher') {
    throw new Error('Only teachers can view subject ambassadors');
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email, current_year, subjects, can_add, can_add_approver')
    .eq('role', 'student')
    .eq('can_add', true)
    .eq('can_add_approver', user.id)
    .order('last_name', { ascending: true });

  if (error) {
    console.error('Error fetching ambassadors:', error);
    throw new Error('Failed to fetch ambassadors');
  }

  return (data ?? []) as AmbassadorStudent[];
}

/** Y12+ students without can_add, optionally filtered by name/email. */
export async function searchAmbassadorCandidates(query: string): Promise<AmbassadorStudent[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect('/login');

  const { data: caller, error: callerError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (callerError || caller?.role !== 'teacher') {
    throw new Error('Only teachers can search ambassador candidates');
  }

  const trimmed = query.trim();
  let request = supabase
    .from('profiles')
    .select('id, first_name, last_name, email, current_year, subjects, can_add, can_add_approver')
    .eq('role', 'student')
    .eq('can_add', false)
    .gte('current_year', 12)
    .order('last_name', { ascending: true })
    .limit(25);

  if (trimmed) {
    request = request.or(
      `first_name.ilike.%${trimmed}%,last_name.ilike.%${trimmed}%,email.ilike.%${trimmed}%`
    );
  }

  const { data, error } = await request;
  if (error) {
    console.error('Error searching students:', error);
    throw new Error('Failed to search students');
  }

  return (data ?? []) as AmbassadorStudent[];
}

export async function grantAmbassadorAccess(studentId: string): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase.rpc('grant_can_add', { target_student_id: studentId });
  if (error) {
    console.error('grant_can_add failed:', error);
    return { error: error.message };
  }
  return { error: null };
}

export async function revokeAmbassadorAccess(studentId: string): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase.rpc('revoke_can_add', { target_student_id: studentId });
  if (error) {
    console.error('revoke_can_add failed:', error);
    return { error: error.message };
  }
  return { error: null };
}