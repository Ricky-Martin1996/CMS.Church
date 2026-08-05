export type Person = {
  id: string;
  name: string;
  email: string;
  role: string;
  campus: string;
  status: "active" | "visitor" | "inactive";
  joined: string;
  avatar?: string;
};

export type ChurchEvent = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  attendees: number;
  capacity: number;
  type: "worship" | "small-group" | "outreach" | "youth";
};

export type GivingStat = {
  month: string;
  tithes: number;
  offerings: number;
  missions: number;
};

export type AttendancePoint = {
  week: string;
  inPerson: number;
  online: number;
};

export type ActivityItem = {
  id: string;
  title: string;
  description: string;
  time: string;
  type: "person" | "giving" | "event" | "message";
};

export const people: Person[] = [
  {
    id: "1",
    name: "Sarah Chen",
    email: "sarah.chen@email.com",
    role: "Worship Leader",
    campus: "Main Campus",
    status: "active",
    joined: "2022-03-14",
  },
  {
    id: "2",
    name: "Marcus Williams",
    email: "marcus.w@email.com",
    role: "Elder",
    campus: "Main Campus",
    status: "active",
    joined: "2019-08-02",
  },
  {
    id: "3",
    name: "Elena Rodriguez",
    email: "elena.r@email.com",
    role: "Kids Ministry",
    campus: "North Campus",
    status: "active",
    joined: "2021-11-20",
  },
  {
    id: "4",
    name: "James Okonkwo",
    email: "james.o@email.com",
    role: "Visitor",
    campus: "Main Campus",
    status: "visitor",
    joined: "2026-07-28",
  },
  {
    id: "5",
    name: "Priya Patel",
    email: "priya.p@email.com",
    role: "Small Group Host",
    campus: "East Campus",
    status: "active",
    joined: "2023-01-09",
  },
  {
    id: "6",
    name: "David Kim",
    email: "david.kim@email.com",
    role: "Tech Volunteer",
    campus: "Main Campus",
    status: "active",
    joined: "2024-05-16",
  },
  {
    id: "7",
    name: "Amelia Foster",
    email: "amelia.f@email.com",
    role: "Youth Pastor",
    campus: "North Campus",
    status: "active",
    joined: "2020-09-01",
  },
  {
    id: "8",
    name: "Noah Bennett",
    email: "noah.b@email.com",
    role: "Member",
    campus: "East Campus",
    status: "inactive",
    joined: "2018-04-22",
  },
];

export const events: ChurchEvent[] = [
  {
    id: "1",
    title: "Sunday Worship",
    date: "2026-08-09",
    time: "10:00 AM",
    location: "Main Sanctuary",
    attendees: 842,
    capacity: 1000,
    type: "worship",
  },
  {
    id: "2",
    title: "Young Adults Night",
    date: "2026-08-12",
    time: "7:00 PM",
    location: "Community Hall",
    attendees: 96,
    capacity: 120,
    type: "youth",
  },
  {
    id: "3",
    title: "Neighborhood Outreach",
    date: "2026-08-15",
    time: "9:00 AM",
    location: "Riverside Park",
    attendees: 64,
    capacity: 80,
    type: "outreach",
  },
  {
    id: "4",
    title: "Life Groups Kickoff",
    date: "2026-08-18",
    time: "6:30 PM",
    location: "Campus Wide",
    attendees: 210,
    capacity: 250,
    type: "small-group",
  },
];

export const givingData: GivingStat[] = [
  { month: "Feb", tithes: 42000, offerings: 8600, missions: 4200 },
  { month: "Mar", tithes: 44500, offerings: 9100, missions: 4800 },
  { month: "Apr", tithes: 43800, offerings: 8800, missions: 5100 },
  { month: "May", tithes: 47200, offerings: 10200, missions: 5600 },
  { month: "Jun", tithes: 49100, offerings: 9800, missions: 6200 },
  { month: "Jul", tithes: 51200, offerings: 11400, missions: 6800 },
];

export const attendanceData: AttendancePoint[] = [
  { week: "W1", inPerson: 780, online: 214 },
  { week: "W2", inPerson: 812, online: 198 },
  { week: "W3", inPerson: 796, online: 231 },
  { week: "W4", inPerson: 854, online: 246 },
  { week: "W5", inPerson: 838, online: 220 },
  { week: "W6", inPerson: 872, online: 258 },
];

export const activities: ActivityItem[] = [
  {
    id: "1",
    title: "New visitor checked in",
    description: "James Okonkwo joined Sunday service",
    time: "12 min ago",
    type: "person",
  },
  {
    id: "2",
    title: "Recurring gift received",
    description: "$250 monthly tithe from the Chen family",
    time: "38 min ago",
    type: "giving",
  },
  {
    id: "3",
    title: "Event capacity alert",
    description: "Young Adults Night is 80% full",
    time: "1 hr ago",
    type: "event",
  },
  {
    id: "4",
    title: "Pastoral care follow-up",
    description: "Message thread opened with Amelia Foster",
    time: "2 hr ago",
    type: "message",
  },
  {
    id: "5",
    title: "Baptism class registered",
    description: "4 new registrations this week",
    time: "Yesterday",
    type: "person",
  },
];

export const groups = [
  {
    id: "1",
    name: "Riverside Life Group",
    members: 14,
    leader: "Priya Patel",
    day: "Tuesday",
    campus: "East Campus",
  },
  {
    id: "2",
    name: "Young Professionals",
    members: 22,
    leader: "David Kim",
    day: "Thursday",
    campus: "Main Campus",
  },
  {
    id: "3",
    name: "Parents of Littles",
    members: 18,
    leader: "Elena Rodriguez",
    day: "Wednesday",
    campus: "North Campus",
  },
  {
    id: "4",
    name: "Senior Fellowship",
    members: 31,
    leader: "Marcus Williams",
    day: "Friday",
    campus: "Main Campus",
  },
];

export const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/people", label: "People", icon: "Users" },
  { href: "/events", label: "Events", icon: "CalendarDays" },
  { href: "/giving", label: "Giving", icon: "HeartHandshake" },
  { href: "/groups", label: "Groups", icon: "UsersRound" },
  { href: "/settings", label: "Settings", icon: "Settings" },
] as const;
