import { apiFetch } from "@/lib/api";

export type ChannelBoundary = {
  key: string;
  label: string;
  enabled: boolean;
  available: boolean;
  status: "active" | "deferred";
};

export type StudentNotificationPreference = {
  id: string;
  student_id: string;
  in_app_reminders_enabled: boolean;
  mood_checkin_reminders_enabled: boolean;
  reminder_cadence: "none" | "daily" | "weekly";
  allowed_channels: string[];
  consent_version: string | null;
  consented_at: string | null;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  timezone: string;
  paused_until: string | null;
  pause_reason_code: string | null;
  channel_boundaries: ChannelBoundary[];
  updated_at: string;
  is_demo: boolean;
};

export type StudentNotificationPreferenceUpdate = {
  in_app_reminders_enabled: boolean;
  mood_checkin_reminders_enabled: boolean;
  reminder_cadence: "none" | "daily" | "weekly";
  allowed_channels: string[];
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  timezone: string;
  paused_until: string | null;
  pause_reason_code: string | null;
};

export type MoodCheckInReminder = {
  due: boolean;
  status_reason: string;
  title: string;
  body: string;
  href: string;
  generated_at: string;
  last_checkin_at: string | null;
  next_due_at: string | null;
  snoozed_until: string | null;
  preference: StudentNotificationPreference;
};

export type MoodReminderAction = {
  status: string;
  reminder: MoodCheckInReminder;
};

export function getNotificationPreferences() {
  return apiFetch<StudentNotificationPreference>("/api/student/notification-preferences");
}

export function updateNotificationPreferences(payload: StudentNotificationPreferenceUpdate) {
  return apiFetch<StudentNotificationPreference>("/api/student/notification-preferences", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function getMoodCheckInReminder() {
  return apiFetch<MoodCheckInReminder>("/api/student/reminders/mood-check-in");
}

export function dismissMoodCheckInReminder() {
  return apiFetch<MoodReminderAction>("/api/student/reminders/mood-check-in/dismiss", {
    method: "POST",
  });
}

export function snoozeMoodCheckInReminder(minutes = 240) {
  return apiFetch<MoodReminderAction>("/api/student/reminders/mood-check-in/snooze", {
    method: "POST",
    body: JSON.stringify({ minutes }),
  });
}

export function openMoodCheckInReminder() {
  return apiFetch<MoodReminderAction>("/api/student/reminders/mood-check-in/open", {
    method: "POST",
  });
}
