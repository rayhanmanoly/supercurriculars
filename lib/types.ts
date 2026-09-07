
//definitions for dashboard data
export interface Opportunity {
    opportunity_id: string;
    title: string;
    short_description: string;
    full_description: string;
    url: string;
    submission_date?: Date | string | undefined;
    advice: string;
    past_projects: [];
    one_off: boolean;
    custom_opportunity: boolean;
    opportunity_type: "Course"| "Competition" | "Club" | "Reading" | "Podcast" | "Project" | "Volunteering";
    time_required: number;
    weightage: number;
    image: string;
    subjects: string[];
    year_groups: number[];
    internal: boolean;
    online: boolean;
    cost: number;
    contact_name: string;
    contact_email: string;
    status : string
    project_files?: string[];
    started_at? : Date
    finished_at? : Date
    user_description? : string
    review_teacher?:string
    review_text?: string
    last_updated?: string
    submitted_by?: string
    profiles?: {
        first_name: string;
        last_name: string;
    }
    
  }
  

export interface Meeting {
    date: string;
    description?: string;
    email: string;
    endTime: string;
    meetName?: string;
    meetPhoto?: string;
    startTime?: string;
    subject?: string;
    type: string;
}

export interface Event {
    category: string;
    contact_email: string;
    contact_name: string;
    created_at?: string;
    date: string;
    description: string;
    end_time: string;
    event_id: number;
    google_event_id?: string;
    invite_link?: string | null;
    poster: string;
    start_time: string;
    sub_category: string;
    title: string;
    year_groups: number[];
}


export interface ProfileData {
    id?: string;
    first_name: string;
    last_name: string;
    profile_url?: string;
    current_year?: number;
    subjects?: string[];
    can_add?: boolean;
    can_add_approver?: string | null;
    email?: string;
    role?: string;
  }

  export interface AmbassadorStudent {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    current_year: number | null;
    subjects: string[] | null;
    can_add: boolean;
    can_add_approver: string | null;
  }

  export interface Teacher {
    first_name: string;
    last_name: string;
    email: string;
  }

  export interface GoogleCalendarEvent {
    description: string;
    start: {
      dateTime: string;
    };
    end: {
      dateTime: string;
    };
    organizer: {
      email: string;
    };
  }