export type Role = "ADMIN" | "INSTRUCTOR" | "STUDENT" | "PARENT" | "MODERATOR";
export type CourseLevel = "Beginner" | "Intermediate" | "Advanced";
export type CourseMode = "Online" | "Onsite" | "Hybrid";
export type AdmissionStatus = "Pending" | "Contacted" | "Approved" | "Rejected";
export type ContactStatus = "Unread" | "Read" | "Resolved";
export type EnrollmentStatus = "Active" | "Completed" | "Cancelled";
export type EventType = "Workshop" | "Seminar" | "Webinar" | "Orientation" | "Competition" | "Other";
export type AnnouncementType = "General" | "Admission" | "Course" | "Exam" | "Event" | "Important";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface SocialLinks {
  linkedin?: string;
  facebook?: string;
  twitter?: string;
  instagram?: string;
}
