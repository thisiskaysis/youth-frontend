export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type Role = "YOUTH" | "LEADER" | "ADMIN";

export type CurrentUser = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string | null;
  profile_image: string | null;
  phone_number: string;
  role: Role;
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
  date_of_birth: string | null;
  school_year: number | null;
  is_provisional: boolean;
  qr_token: string;
};

export type BasicPerson = {
  id: number;
  first_name: string;
  last_name: string;
  display_name: string;
  profile_image: string | null;
};

export type Group = {
  id: number;
  name: string;
  group_type: "CONNECT" | "VOLUNTEER" | "MINISTRY";
  description?: string;
};

export type AttendanceSession = {
  id: number;
  event: number;
  status: "OPEN" | "CLOSED";
  opened_at: string;
  closed_at: string | null;
};

export type AttendanceRecord = {
  id: number;
  session: number;
  person: BasicPerson;
  signed_in_at: string | null;
  sign_in_source: "QR" | "MANUAL" | "";
  signed_out_at: string | null;
  sign_out_source: "QR" | "MANUAL" | "";
};

export type AttendanceLiveStats = {
  session_id: number;
  status: "OPEN" | "CLOSED";
  currently_on_site: number;
  total_signed_in: number;
  signed_out: number;
  first_time_visitors: number;
};

export type SignInResult = {
  result: "SIGNED_IN" | "ALREADY_SIGNED_IN";
  person: BasicPerson;
  record: AttendanceRecord;
};

export type SignOutResult = {
  result: "SIGNED_OUT";
  person: BasicPerson;
  record: AttendanceRecord;
};

export type AttendanceApiError = {
  code: string;
  detail: string;
  people?: BasicPerson[];
};

export type EventItem = {
  id: number;
  name: string;
  starts_at: string;
  ends_at: string | null;
  location?: string;
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "EXPIRED" | "ARCHIVED";
};

export type PrayerRequest = {
  id: number;
  author: BasicPerson | null;
  body: string;
  category: string;
  location: string;
  visibility: "PUBLIC" | "LEADERS_ONLY";
  is_anonymous: boolean;
  status: "PENDING" | "APPROVED" | "HIDDEN" | "ESCALATED";
  prayed_count?: number;
  created_at: string;
};

export type NotificationItem = {
  id: number;
  title: string;
  body: string;
  notification_type: string;
  read_at: string | null;
  created_at: string;
  deep_link_type?: string | null;
  deep_link_id?: number | null;
};

export type InboxMessage = {
  id: number;
  sender: BasicPerson;
  recipient: BasicPerson;
  body: string;
  read_at: string | null;
  created_at: string;
};

export type RideRequest = {
  id: number;
  person: BasicPerson;
  direction: "TO_CHURCH" | "HOME" | "BOTH";
  area: string;
  status: "REQUESTED" | "ARRANGING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  requested_date: string | null;
  notes: string;
};

export type FormDefinition = {
  id: number;
  title: string;
  description: string;
  status: string;
};

export type FormAssignment = {
  id: number;
  form: number;
  form_title: string;
  person: BasicPerson;
  due_at: string | null;
  status: "OUTSTANDING" | "SUBMITTED";
  submission: unknown | null;
};

export type ContentItem = {
  id: number;
  title: string;
  body: string;
  image?: string | null;
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "EXPIRED" | "ARCHIVED";
  publish_at: string | null;
};

export type NavigationItem = {
  id: number;
  label: string;
  destination_type: string;
  destination_value: string;
  status: string;
  sort_order: number;
  is_protected: boolean;
};

export type Decision = {
  id: number;
  person: BasicPerson;
  decision_type: string;
  occurred_at: string;
  follow_up: FollowUp | null;
};

export type FollowUp = {
  id: number;
  assignee: BasicPerson;
  status: "OUTSTANDING" | "IN_PROGRESS" | "COMPLETED";
  due_at: string | null;
};

export type VolunteerPosition = {
  id: number;
  group: number;
  name: string;
  is_active: boolean;
  sort_order: number;
};

export type VolunteerAssignment = {
  id: number;
  roster: number;
  group: number;
  position: number;
  position_name: string;
  person: BasicPerson;
  status:
    | "DRAFT"
    | "PENDING"
    | "ACCEPTED"
    | "DECLINED"
    | "CANCELLED"
    | "COMPLETED";
  call_start: string | null;
  call_end: string | null;
  notes: string;
};

export type DashboardData = {
  attendance: {
    total_attended: number;
    unique_youth: number;
    first_time_visitors: number;
  };
  school_year_breakdown: {
    person__school_year: number | null;
    count: number;
  }[];
  group_participation: { unassigned_youth: number };
  decisions: { total: number; outstanding_follow_ups: number };
  prayer: { total: number };
  rides: { total: number; by_status: { status: string; count: number }[] };
  outstanding_consent: number;
};
