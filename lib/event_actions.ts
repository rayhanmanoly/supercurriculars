'use server'

import { createClient } from '../utils/supabase/server';
import { refreshToken } from './actions';
import { redirect } from 'next/navigation';
import { debugLog } from './debug';

async function makeGoogleCalendarAddRequest(provider_token: string, eventDetails: any) {
    debugLog('Sending to Google Calendar:', JSON.stringify(eventDetails, null, 2));
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider_token}`,
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




  function formatTime(dateString: string, timeString: string) {
    // Extract time and timezone offset
    const [time, timezone] = timeString.split(' ');
    const [hours, minutes, seconds] = time.split(':')
    debugLog(timeString)
  
    // Parse the timezone offset
    const offsetMatch = timezone.match(/([+-])(\d{1,2})/); ///doesn't work for all timezones
    if (!offsetMatch) {
      throw new Error('Invalid timezone format');
    }
    debugLog(offsetMatch)
    const offsetSign = offsetMatch[1] === '-' ? -1 : 1;
    const offsetHours = parseInt(offsetMatch[2], 10) * offsetSign;
  
    // Create a Date object in UTC
    const date = new Date(`${dateString}T${time}Z`);
    debugLog(dateString, time)
    // Adjust for the timezone offset
    date.setUTCHours(date.getUTCHours() - offsetHours);
    debugLog("Date:",date)
    // Format for Supabase timetz
    const supabaseTime = `${hours}:${minutes}:${seconds}${offsetMatch[1]}0${offsetMatch[2]}`;
    debugLog(supabaseTime)
    // Format for Google Calendar
    
    const gcalDateTime = date.toISOString();
    return { supabaseTime, gcalDateTime };
  }

  function formatTimeB(dateString: string, timeString: string) {
    // Regular expression to match the time format HH:MM:SS+ZZ
    const regex = /^(\d{2}):(\d{2}):(\d{2})([+-])(\d{2})$/;
    const match = timeString.match(regex);
  
    if (!match) {
      throw new Error('Invalid time format. Expected HH:MM:SS+ZZ');
    }
  
    const [, hours, minutes, seconds, offsetSign, offsetHours] = match;
  
    // Create a Date object in UTC
    const date = new Date(`${dateString}T${hours}:${minutes}:${seconds}Z`);
  
    // Adjust for the timezone offset
    const offsetMinutes = parseInt(offsetHours, 10) * 60;
    if (offsetSign === '+') {
      date.setUTCMinutes(date.getUTCMinutes() - offsetMinutes);
    } else {
      date.setUTCMinutes(date.getUTCMinutes() + offsetMinutes);
    }
  
    // Format for Supabase timetz
    const supabaseTime = `${hours}:${minutes}:${seconds}${offsetSign}${offsetHours}:00`;
  
    // Format for Google Calendar
    const gcalDateTime = date.toISOString();
  
    return { supabaseTime, gcalDateTime };
  }

  



export async function createGroupSession(eventData: any) {
    
    
    const supabase = createClient();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No authenticated user found');
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
  
      const startDateTime = formatTime(eventData.date, eventData.start_time);
      const endDateTime = formatTime(eventData.date, eventData.end_time);

      eventData = {
        ...eventData,
        start_time: startDateTime.supabaseTime,
        end_time: endDateTime.supabaseTime
      }
  
      debugLog('New eventData:',eventData)
      const eventDetails = {
        'summary': `Group Mentoring | ${eventData.title}`,
        'description': `${eventData.description}\n\nSubject: ${eventData.subjects.map(String).join(' | ')}`,
        'start': {
          'dateTime': startDateTime.gcalDateTime,
          'timeZone': 'UTC'
        },
        'end': {
          'dateTime': endDateTime.gcalDateTime,
          'timeZone': 'UTC'
        }
      };
  
      debugLog('Formatted event details:', JSON.stringify(eventDetails, null, 2));
      
      let result;
      try {
        result = await makeGoogleCalendarAddRequest(provider_token, eventDetails);
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
        google_event_id: result.id,
        iCalUID: result.iCalUID
      };
  
      // Create the group session in Supabase
      const { data: newSession, error } = await supabase
        .from('group_mentoring_events')
        .insert(supabaseEventData)
        .single();
    
        const { data: group_session_id, error: idError } = await supabase
        .from('group_mentoring_events')
        .select('group_session_id')
        .eq("google_event_id", result.id)
        .single();
  
      if (error) {
        // If Supabase insertion fails, delete the Google Calendar event
        throw new Error(`Failed to create group session: ${error.message}`);
      }

      debugLog(group_session_id)
      const returnedData = {
        ...supabaseEventData,
        group_session_id: group_session_id?.group_session_id
      }
      debugLog('New Session:',returnedData)
      return returnedData;
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
        throw new Error('No authenticated user found');
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
              throw new Error('RE_AUTHENTICATION_REQUIRED');
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
        await deleteGoogleCalendarEvent(provider_token, { google_event_id: result.id });
        throw new Error(`Failed to create group session: ${(error as any)?.message}`);
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
        throw new Error('No authenticated user found');
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
      debugLog(provider_data)
  
      let result;
      try {
        debugLog('EVENT ID:',eventData)
        result = await handleGoogleCalendarAdd(provider_token, eventData, user.email);
      } catch (error: any) {
        console.error('Error making Google Calendar request:', error);
        if (error.message === 'Unauthorized' && provider_refresh_token) {
          try {
            const new_token = await refreshToken(provider_refresh_token);
            await supabase
              .from('profile_tokens')
              .update({ provider_token: new_token })
              .eq('id', user.id);
            debugLog('email:', user.email)
            result = await handleGoogleCalendarAdd(new_token, eventData, user.email);
          } catch (refreshError: any) {
            console.error('Error refreshing token:', refreshError);
            if (refreshError.message === 'RE_AUTHENTICATION_REQUIRED') {
              throw new Error('RE_AUTHENTICATION_REQUIRED');
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
          google_event_id: eventData.google_event_id,
          local_event_id: result.id,
        });
  
  }
  
  async function handleGoogleCalendarAdd(provider_token: any, eventDetails: any, email: any) { ///for student-side

    debugLog(eventDetails.start_time)
    try {
      const start = formatTimeB(eventDetails.date, eventDetails.start_time).gcalDateTime
      const end = formatTimeB(eventDetails.date, eventDetails.end_time).gcalDateTime
      // Prepare the event for import
      const importEvent = {
        iCalUID: eventDetails.iCalUID, // Use the same iCalUID as the original event
        summary: `Group Mentoring | ${eventDetails.title}`,
        description: `${eventDetails.description}\n\nSubject: ${eventDetails.subjects.map(String).join(' | ')}`,
        start: {
            'dateTime': start,
            'timeZone': 'UTC'
          },
        end: {
            'dateTime': end,
            'timeZone': 'UTC'
          },
          
        status: 'confirmed',
        organizer: {email: eventDetails.mentors.email},
        attendees: [{email: email, responseStatus: 'accepted'}, {email: eventDetails.mentors.email, responseStatus: 'accepted'}]
      };

      debugLog(importEvent)
      // Import the event into the attendee's calendar
      const importResponse = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${provider_token}`,
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


  export async function editGroupSession(eventData: any) {
  
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser();
      
    debugLog('Changing details of:',eventData)
    if (!user) {
      throw new Error('No authenticated user found');
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

      const startDateTime = formatTime(eventData.date, eventData.start_time).supabaseTime;
      const endDateTime = formatTime(eventData.date, eventData.end_time).supabaseTime;

      eventData = {
        ...eventData,
        start_time: startDateTime,
        end_time: endDateTime
      }
    
      debugLog('Final eventData:',eventData)
    const { data, error } = await supabase
      .from('group_mentoring_events')
      .update(eventData)
      .eq('group_session_id', eventData.group_session_id)
      .single();
  
    if (error) {
      console.error('Error editing group session:', error);
      throw new Error('Failed to edit group session');
    }

    let result;
      try {
        debugLog('EVENT ID:', eventData)
        result = await editGoogleCalendarEvent(provider_token, eventData);
      } catch (error: any) {
        console.error('Error making Google Calendar request:', error);
        if (error.message === 'Unauthorized' && provider_refresh_token) {
          try {
            const new_token = await refreshToken(provider_refresh_token);
            await supabase
              .from('profile_tokens')
              .update({ provider_token: new_token })
              .eq('id', user.id);
            debugLog('email:', user.email)
            result = await editGoogleCalendarEvent(new_token, eventData);
          } catch (refreshError: any) {
            console.error('Error refreshing token:', refreshError);
            if (refreshError.message === 'RE_AUTHENTICATION_REQUIRED') {
              throw new Error('RE_AUTHENTICATION_REQUIRED');
            }
            throw new Error('Failed to refresh token');
          }
        } else {
          throw error;
        }
      }


    debugLog('Mentoring Group Sessions:',data)
    return data
  }

  async function editGoogleCalendarEvent(token: string, eventDetails: any) {
    debugLog('Sending to Google Calendar:', JSON.stringify(eventDetails, null, 2));
    const start = formatTimeB(eventDetails.date, eventDetails.start_time).gcalDateTime
    const end = formatTimeB(eventDetails.date, eventDetails.end_time).gcalDateTime
    const editedEvent = {
        summary: `Group Mentoring | ${eventDetails.title}`,
        description: `${eventDetails.description}\n\nSubject: ${eventDetails.subjects.map(String).join(' | ')}`,
        start: {
            'dateTime': start,
            'timeZone': 'UTC'
          },
        end: {
            'dateTime': end,
            'timeZone': 'UTC'
          },
          };
        debugLog(editedEvent)
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventDetails.google_event_id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(editedEvent)
    });
  
    if (response.status === 401) {
      throw new Error('Unauthorized');
    }
  
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google Calendar API Error:', errorData);
      throw new Error(`Failed to edit event: ${errorData.error.message}`);
    }
  
    return response.json();
  }

  export async function deleteGroupSession(eventData: any) {
  
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser();
      
    debugLog('Deleting:',eventData)
    if (!user) {
      throw new Error('No authenticated user found');
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

     
    const { data, error } = await supabase
      .from('group_mentoring_events')
      .delete()
      .eq('group_session_id', eventData.group_session_id);
  
    if (error) {
      console.error('Error deleting group session:', error);
      throw new Error('Failed to delete group session');
    }

    let result;
      try {
        debugLog('EVENT ID:', eventData)
        result = await deleteGoogleCalendarEvent(provider_token, eventData);
      } catch (error: any) {
        console.error('Error making Google Calendar request:', error);
        if (error.message === 'Unauthorized' && provider_refresh_token) {
          try {
            const new_token = await refreshToken(provider_refresh_token);
            await supabase
              .from('profile_tokens')
              .update({ provider_token: new_token })
              .eq('id', user.id);
            debugLog('email:', user.email)
            result = await editGoogleCalendarEvent(new_token, eventData);
          } catch (refreshError: any) {
            console.error('Error refreshing token:', refreshError);
            if (refreshError.message === 'RE_AUTHENTICATION_REQUIRED') {
              throw new Error('RE_AUTHENTICATION_REQUIRED');
            }
            throw new Error('Failed to refresh token');
          }
        } else {
          throw error;
        }
      }


    debugLog('Deleted session:',data)
    return data
  }


  async function deleteGoogleCalendarEvent(token: string, eventDetails: any) {
    debugLog('Sending request to Google Calendar:', JSON.stringify(eventDetails, null, 2));
    
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventDetails.google_event_id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });
  
    if (response.status === 401) {
      throw new Error('Unauthorized');
    }
  
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google Calendar API Error:', errorData);
      throw new Error(`Failed to edit event: ${errorData.error.message}`);
    }
  
    return response;
  }
