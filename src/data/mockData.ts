import type { Child, UserWithRoles, Sponsorship, ProgressReport, ReportMedia, Newsletter, SchoolEvent, EventMedia } from '@/types';

// Demo Children
export const mockChildren: Child[] = [
  {
    id: 'child-1',
    first_name: 'Aarav',
    last_name: 'Sharma',
    date_of_birth: '2016-03-15',
    grade: '3rd Grade',
    photo_url: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=200&h=200&fit=crop&crop=face',
    enrollment_date: '2022-06-01',
    status: 'active',
    created_at: '2022-06-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  },
  {
    id: 'child-2',
    first_name: 'Priya',
    last_name: 'Patel',
    date_of_birth: '2015-08-22',
    grade: '4th Grade',
    photo_url: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=200&h=200&fit=crop&crop=face',
    enrollment_date: '2021-06-01',
    status: 'active',
    created_at: '2021-06-01T00:00:00Z',
    updated_at: '2024-01-10T00:00:00Z',
  },
  {
    id: 'child-3',
    first_name: 'Rohan',
    last_name: 'Kumar',
    date_of_birth: '2017-01-10',
    grade: '2nd Grade',
    photo_url: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=200&h=200&fit=crop&crop=face',
    enrollment_date: '2023-06-01',
    status: 'active',
    created_at: '2023-06-01T00:00:00Z',
    updated_at: '2024-01-12T00:00:00Z',
  },
  {
    id: 'child-4',
    first_name: 'Ananya',
    last_name: 'Reddy',
    date_of_birth: '2016-11-05',
    grade: '3rd Grade',
    photo_url: 'https://images.unsplash.com/photo-1595454223600-91fa9d24b498?w=200&h=200&fit=crop&crop=face',
    enrollment_date: '2022-06-01',
    status: 'active',
    created_at: '2022-06-01T00:00:00Z',
    updated_at: '2024-01-14T00:00:00Z',
  },
  {
    id: 'child-5',
    first_name: 'Vikram',
    last_name: 'Singh',
    date_of_birth: '2014-05-20',
    grade: '5th Grade',
    photo_url: 'https://images.unsplash.com/photo-1555009393-f20bdb245c4d?w=200&h=200&fit=crop&crop=face',
    enrollment_date: '2020-06-01',
    status: 'active',
    created_at: '2020-06-01T00:00:00Z',
    updated_at: '2024-01-11T00:00:00Z',
  },
];

// Demo Sponsorships
export const mockSponsorships: Sponsorship[] = [
  { id: 'sp-1', sponsor_id: 'sponsor-1', child_id: 'child-1', start_date: '2022-06-01', status: 'active', created_at: '2022-06-01T00:00:00Z' },
  { id: 'sp-2', sponsor_id: 'sponsor-1', child_id: 'child-2', start_date: '2021-06-01', status: 'active', created_at: '2021-06-01T00:00:00Z' },
  { id: 'sp-3', sponsor_id: 'sponsor-1', child_id: 'child-3', start_date: '2023-06-01', status: 'active', created_at: '2023-06-01T00:00:00Z' },
];

// Demo Progress Reports
export const mockProgressReports: ProgressReport[] = [
  {
    id: 'report-1',
    child_id: 'child-1',
    teacher_id: 'teacher-1',
    quarter: 'Q4',
    year: 2024,
    growth_narrative: 'Aarav has shown remarkable progress this quarter. His reading skills have improved significantly, and he now reads at grade level. He has become more confident in participating in class discussions and shows great enthusiasm for learning.',
    activities: 'Participated in the school science fair with a project on plant growth. Joined the art club and created beautiful paintings. Performed in the annual day cultural program.',
    teacher_observations: 'Aarav is a kind and helpful student who always assists his classmates. He has developed strong problem-solving skills and shows leadership qualities during group activities.',
    status: 'published',
    published_at: '2024-12-20T00:00:00Z',
    created_at: '2024-12-15T00:00:00Z',
    updated_at: '2024-12-20T00:00:00Z',
  },
  {
    id: 'report-2',
    child_id: 'child-1',
    teacher_id: 'teacher-1',
    quarter: 'Q3',
    year: 2024,
    growth_narrative: 'Aarav continued to excel in mathematics this quarter. He mastered multiplication tables and began learning division concepts. His handwriting has improved considerably.',
    activities: 'Won second place in the inter-class quiz competition. Participated in the sports day events. Helped organize the classroom library.',
    teacher_observations: 'Shows great initiative in completing tasks. Needs to work on time management during tests but overall performance is excellent.',
    status: 'published',
    published_at: '2024-09-20T00:00:00Z',
    created_at: '2024-09-15T00:00:00Z',
    updated_at: '2024-09-20T00:00:00Z',
  },
  {
    id: 'report-3',
    child_id: 'child-2',
    teacher_id: 'teacher-1',
    quarter: 'Q4',
    year: 2024,
    growth_narrative: 'Priya has blossomed into a confident learner. Her English composition skills are exceptional, and she writes creative stories that captivate her classmates. She has shown great improvement in mathematics as well.',
    activities: 'Led the school choir in the winter concert. Completed a reading challenge of 20 books. Created artwork displayed in the school gallery.',
    teacher_observations: 'Priya is a natural leader who inspires others. She is compassionate and always ready to help struggling classmates. Her organizational skills are outstanding.',
    status: 'published',
    published_at: '2024-12-18T00:00:00Z',
    created_at: '2024-12-10T00:00:00Z',
    updated_at: '2024-12-18T00:00:00Z',
  },
  {
    id: 'report-4',
    child_id: 'child-3',
    teacher_id: 'teacher-1',
    quarter: 'Q4',
    year: 2024,
    growth_narrative: 'Rohan is adjusting well to his second year. He has made significant progress in reading and can now read simple sentences independently. His social skills have improved, and he has made many friends.',
    activities: 'Participated in the clay modeling workshop. Learned to tie his shoelaces independently. Performed a dance in the annual day celebration.',
    teacher_observations: 'Rohan is curious and asks thoughtful questions. He needs some encouragement during challenging tasks but shows great perseverance when motivated.',
    status: 'published',
    published_at: '2024-12-22T00:00:00Z',
    created_at: '2024-12-18T00:00:00Z',
    updated_at: '2024-12-22T00:00:00Z',
  },
];

// Demo Report Media
export const mockReportMedia: ReportMedia[] = [
  { id: 'media-1', report_id: 'report-1', type: 'image', url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400', caption: 'Aarav presenting his science fair project', order: 1, created_at: '2024-12-15T00:00:00Z' },
  { id: 'media-2', report_id: 'report-1', type: 'image', url: 'https://images.unsplash.com/photo-1588072432836-e10032774350?w=400', caption: 'Art club painting session', order: 2, created_at: '2024-12-15T00:00:00Z' },
  { id: 'media-3', report_id: 'report-3', type: 'image', url: 'https://images.unsplash.com/photo-1571210862729-78a52d3779a2?w=400', caption: 'Priya leading the choir', order: 1, created_at: '2024-12-10T00:00:00Z' },
  { id: 'media-4', report_id: 'report-4', type: 'image', url: 'https://images.unsplash.com/photo-1560785496-3c9d27877182?w=400', caption: 'Rohan during dance practice', order: 1, created_at: '2024-12-18T00:00:00Z' },
];

// Demo Newsletters
export const mockNewsletters: Newsletter[] = [
  {
    id: 'news-1',
    title: 'Winter Newsletter 2024',
    description: 'Highlights from the winter term including annual day celebrations, exam results, and upcoming events.',
    file_url: '/newsletters/winter-2024.pdf',
    thumbnail_url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=300',
    published_date: '2024-12-15',
    created_at: '2024-12-15T00:00:00Z',
  },
  {
    id: 'news-2',
    title: 'Autumn Newsletter 2024',
    description: 'Updates on Diwali celebrations, sports day, and new initiatives at the school.',
    file_url: '/newsletters/autumn-2024.pdf',
    thumbnail_url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=300',
    published_date: '2024-10-20',
    created_at: '2024-10-20T00:00:00Z',
  },
  {
    id: 'news-3',
    title: 'Summer Newsletter 2024',
    description: 'End of year celebrations, graduation ceremony, and summer camp information.',
    file_url: '/newsletters/summer-2024.pdf',
    thumbnail_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=300',
    published_date: '2024-06-30',
    created_at: '2024-06-30T00:00:00Z',
  },
];

// Demo Events
export const mockEvents: SchoolEvent[] = [
  {
    id: 'event-1',
    title: 'Annual Day Celebration 2024',
    description: 'A wonderful evening filled with cultural performances, dance, music, and drama by our talented students. Parents and sponsors joined us in celebrating the achievements of our children.',
    event_date: '2024-12-20',
    created_by: 'admin-1',
    created_at: '2024-12-21T00:00:00Z',
  },
  {
    id: 'event-2',
    title: 'Diwali Celebration',
    description: 'Students celebrated the festival of lights with rangoli making, lamp decoration, and traditional sweets. The school was beautifully decorated with diyas and flowers.',
    event_date: '2024-11-01',
    created_by: 'admin-1',
    created_at: '2024-11-02T00:00:00Z',
  },
  {
    id: 'event-3',
    title: 'Sports Day 2024',
    description: 'An exciting day of athletic competitions including races, relay, long jump, and team sports. Congratulations to all winners and participants!',
    event_date: '2024-10-15',
    created_by: 'admin-1',
    created_at: '2024-10-16T00:00:00Z',
  },
  {
    id: 'event-4',
    title: 'Science Fair',
    description: 'Students showcased their innovative projects on topics ranging from renewable energy to plant biology. The creativity and scientific thinking displayed was impressive!',
    event_date: '2024-09-25',
    created_by: 'admin-1',
    created_at: '2024-09-26T00:00:00Z',
  },
];

// Demo Event Media
export const mockEventMedia: EventMedia[] = [
  { id: 'em-1', event_id: 'event-1', type: 'image', url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600', caption: 'Annual day stage performance', order: 1 },
  { id: 'em-2', event_id: 'event-1', type: 'image', url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=600', caption: 'Students in traditional costumes', order: 2 },
  { id: 'em-3', event_id: 'event-2', type: 'image', url: 'https://images.unsplash.com/photo-1605196560547-b60f7e87d4e4?w=600', caption: 'Rangoli made by students', order: 1 },
  { id: 'em-4', event_id: 'event-3', type: 'image', url: 'https://images.unsplash.com/photo-1461896836934- voices01bbd81?w=600', caption: 'Racing competition', order: 1 },
  { id: 'em-5', event_id: 'event-4', type: 'image', url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600', caption: 'Science project display', order: 1 },
];

// Demo Sponsors
export const mockSponsors: UserWithRoles[] = [
  {
    id: 'sponsor-1',
    email: 'sponsor@school.org',
    full_name: 'James Wilson',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
    phone: '+1-555-0123',
    roles: ['sponsor'],
    created_at: '2021-06-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'sponsor-2',
    email: 'mary.johnson@example.com',
    full_name: 'Mary Johnson',
    avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
    phone: '+1-555-0456',
    roles: ['sponsor'],
    created_at: '2022-03-15T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

// Helper functions
export function getChildById(id: string): Child | undefined {
  return mockChildren.find(c => c.id === id);
}

export function getChildrenBySponsorship(sponsorId: string): Child[] {
  const sponsoredChildIds = mockSponsorships
    .filter(s => s.sponsor_id === sponsorId && s.status === 'active')
    .map(s => s.child_id);
  return mockChildren.filter(c => sponsoredChildIds.includes(c.id));
}

export function getReportsForChild(childId: string): ProgressReport[] {
  return mockProgressReports
    .filter(r => r.child_id === childId && r.status === 'published')
    .sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      const quarterOrder = { Q4: 4, Q3: 3, Q2: 2, Q1: 1 };
      return quarterOrder[b.quarter] - quarterOrder[a.quarter];
    });
}

export function getReportMedia(reportId: string): ReportMedia[] {
  return mockReportMedia.filter(m => m.report_id === reportId).sort((a, b) => a.order - b.order);
}

export function getEventMedia(eventId: string): EventMedia[] {
  return mockEventMedia.filter(m => m.event_id === eventId).sort((a, b) => a.order - b.order);
}

export function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}
