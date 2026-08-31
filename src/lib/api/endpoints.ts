import { apiClient } from "../api-client";
import type {
    AttendanceLiveStats,
    AttendanceRecord,
    AttendanceSession,
    BasicPerson,
    ContentItem,
    CurrentUser,
    DashboardData,
    Decision,
    EventItem,
    FollowUp,
    FormAssignment,
    FormDefinition,
    Group,
    InboxMessage,
    NavigationItem,
    NotificationItem,
    Paginated,
    PrayerRequest,
    RideRequest,
    SignInResult,
    SignOutResult,
    VolunteerAssignment,
    VolunteerPosition,
} from "./types";

// Users
export const usersApi = {
  me: () => apiClient.get<CurrentUser>("/api/users/me/").then((r) => r.data),
  search: (query: string) =>
    apiClient
      .get<
        Paginated<BasicPerson>
      >("/api/users/search/", { params: { q: query } })
      .then((r) => r.data),
};

// Groups
export const groupsApi = {
  mine: () => apiClient.get<Group[]>("/api/groups/mine/").then((r) => r.data),
  list: () =>
    apiClient.get<Paginated<Group>>("/api/groups/").then((r) => r.data),
};

// Events
export const eventsApi = {
  list: () =>
    apiClient.get<Paginated<EventItem>>("/api/events/").then((r) => r.data),
  create: (payload: {
    name: string;
    starts_at: string;
    ends_at?: string;
    location?: string;
    description?: string;
  }) => apiClient.post<EventItem>("/api/events/", payload).then((r) => r.data),
  publish: (id: number, notify = false) =>
    apiClient
      .post<EventItem>(`/api/events/${id}/publish/`, { notify })
      .then((r) => r.data),
};

// Attendance
type SignPayload = {
  qr_token?: string;
  person_id?: number;
  source?: "QR" | "MANUAL";
};

export const attendanceApi = {
  sessions: () =>
    apiClient
      .get<Paginated<AttendanceSession>>("/api/attendance/sessions/")
      .then((r) => r.data),
  session: (sessionId: number) =>
    apiClient
      .get<AttendanceSession>(`/api/attendance/sessions/${sessionId}/`)
      .then((r) => r.data),
  openSession: (eventId: number) =>
    apiClient
      .post<AttendanceSession>("/api/attendance/sessions/", { event: eventId })
      .then((r) => r.data),
  live: (sessionId: number) =>
    apiClient
      .get<AttendanceLiveStats>(`/api/attendance/sessions/${sessionId}/live/`)
      .then((r) => r.data),
  onSite: (sessionId: number) =>
    apiClient
      .get<AttendanceRecord[]>(`/api/attendance/sessions/${sessionId}/on-site/`)
      .then((r) => r.data),
  signIn: (sessionId: number, payload: SignPayload) =>
    apiClient
      .post<SignInResult>(
        `/api/attendance/sessions/${sessionId}/sign-in/`,
        payload,
      )
      .then((r) => r.data),
  signOut: (sessionId: number, payload: SignPayload) =>
    apiClient
      .post<SignOutResult>(
        `/api/attendance/sessions/${sessionId}/sign-out/`,
        payload,
      )
      .then((r) => r.data),
  close: (sessionId: number, force = false, reason = "") =>
    apiClient
      .post<AttendanceSession>(`/api/attendance/sessions/${sessionId}/close/`, {
        force,
        reason,
      })
      .then((r) => r.data),
};

// Notifications / Inbox (in-app notification feed)
export const notificationsApi = {
  list: () =>
    apiClient
      .get<Paginated<NotificationItem>>("/api/notifications/")
      .then((r) => r.data),
  markRead: (id: number) =>
    apiClient.post(`/api/notifications/${id}/read/`).then((r) => r.data),
};

// Direct messages (Leader -> youth)
export const inboxApi = {
  list: () =>
    apiClient
      .get<Paginated<InboxMessage>>("/api/inbox/messages/")
      .then((r) => r.data),
  markRead: (id: number) =>
    apiClient.post(`/api/inbox/messages/${id}/read/`).then((r) => r.data),
};

// Prayer
export const prayerApi = {
  wall: () =>
    apiClient
      .get<
        Paginated<PrayerRequest>
      >("/api/prayer/requests/", { params: { wall: true } })
      .then((r) => r.data),
  mine: () =>
    apiClient
      .get<Paginated<PrayerRequest>>("/api/prayer/requests/")
      .then((r) => r.data),
  create: (payload: {
    body: string;
    visibility: "PUBLIC" | "LEADERS_ONLY";
    is_anonymous?: boolean;
    category?: string;
    location?: string;
  }) =>
    apiClient
      .post<PrayerRequest>("/api/prayer/requests/", payload)
      .then((r) => r.data),
  pray: (id: number) =>
    apiClient.post(`/api/prayer/requests/${id}/pray/`).then((r) => r.data),
};

// Rides
export const ridesApi = {
  list: () =>
    apiClient
      .get<Paginated<RideRequest>>("/api/rides/requests/")
      .then((r) => r.data),
  create: (payload: {
    direction: "TO_CHURCH" | "HOME" | "BOTH";
    area: string;
    requested_date?: string;
    notes?: string;
  }) =>
    apiClient
      .post<RideRequest>("/api/rides/requests/", payload)
      .then((r) => r.data),
  updateStatus: (id: number, status: RideRequest["status"]) =>
    apiClient
      .patch<RideRequest>(`/api/rides/requests/${id}/`, { status })
      .then((r) => r.data),
};

// Forms
export const formsApi = {
  myAssignments: () =>
    apiClient
      .get<Paginated<FormAssignment>>("/api/forms/assignments/")
      .then((r) => r.data),
  definitions: () =>
    apiClient
      .get<Paginated<FormDefinition>>("/api/forms/definitions/")
      .then((r) => r.data),
  createDefinition: (payload: { title: string; description?: string }) =>
    apiClient
      .post<FormDefinition>("/api/forms/definitions/", payload)
      .then((r) => r.data),
  assign: (formId: number, personIds: number[], dueAt?: string) =>
    apiClient
      .post<
        FormAssignment[]
      >(`/api/forms/definitions/${formId}/assign/`, { person_ids: personIds, due_at: dueAt })
      .then((r) => r.data),
};

// Decisions & follow-up
export const decisionsApi = {
  list: () =>
    apiClient.get<Paginated<Decision>>("/api/decisions/").then((r) => r.data),
  followUps: () =>
    apiClient
      .get<Paginated<FollowUp>>("/api/decisions/follow-ups/")
      .then((r) => r.data),
  create: (payload: {
    person: number;
    decision_type: string;
    occurred_at: string;
    notes?: string;
  }) =>
    apiClient.post<Decision>("/api/decisions/", payload).then((r) => r.data),
  updateFollowUpStatus: (followUpId: number, status: FollowUp["status"]) =>
    apiClient
      .post<FollowUp>(`/api/decisions/follow-ups/${followUpId}/status/`, {
        status,
      })
      .then((r) => r.data),
};

// Reporting
export const reportingApi = {
  dashboard: () =>
    apiClient
      .get<DashboardData>("/api/reporting/dashboard/")
      .then((r) => r.data),
};

// Content (newsfeed)
export const contentApi = {
  list: () =>
    apiClient.get<Paginated<ContentItem>>("/api/content/").then((r) => r.data),
  create: (payload: { title: string; body: string; image?: string }) =>
    apiClient.post<ContentItem>("/api/content/", payload).then((r) => r.data),
  publish: (id: number) =>
    apiClient
      .post<ContentItem>(`/api/content/${id}/publish/`)
      .then((r) => r.data),
};

// Dynamic navigation (CMS)
export const navigationApi = {
  list: () =>
    apiClient
      .get<Paginated<NavigationItem>>("/api/navigation/")
      .then((r) => r.data),
  create: (payload: {
    label: string;
    destination_type: string;
    destination_value: string;
  }) =>
    apiClient
      .post<NavigationItem>("/api/navigation/", payload)
      .then((r) => r.data),
  publish: (id: number) =>
    apiClient
      .post<NavigationItem>(`/api/navigation/${id}/publish/`)
      .then((r) => r.data),
  reorder: (orderedIds: number[]) =>
    apiClient
      .patch<
        NavigationItem[]
      >("/api/navigation/reorder/", { ordered_ids: orderedIds })
      .then((r) => r.data),
};

// Volunteers
export const volunteersApi = {
  assignments: () =>
    apiClient
      .get<Paginated<VolunteerAssignment>>("/api/volunteers/assignments/")
      .then((r) => r.data),
  positions: (groupId?: number) =>
    apiClient
      .get<
        Paginated<VolunteerPosition>
      >("/api/volunteers/positions/", { params: groupId ? { group: groupId } : undefined })
      .then((r) => r.data),
  createPosition: (payload: { group: number; name: string }) =>
    apiClient
      .post<VolunteerPosition>("/api/volunteers/positions/", payload)
      .then((r) => r.data),
  respond: (
    id: number,
    accept: boolean,
    declineReason = "",
    declineNote = "",
  ) =>
    apiClient
      .post<VolunteerAssignment>(`/api/volunteers/assignments/${id}/respond/`, {
        accept,
        decline_reason: declineReason,
        decline_note: declineNote,
      })
      .then((r) => r.data),
  cancel: (id: number, reason = "") =>
    apiClient
      .post<VolunteerAssignment>(`/api/volunteers/assignments/${id}/cancel/`, {
        reason,
      })
      .then((r) => r.data),
  availability: () =>
    apiClient.get("/api/volunteers/availability/").then((r) => r.data),
};
