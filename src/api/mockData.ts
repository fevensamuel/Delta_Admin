import {
  Package,
  GalleryItem,
  Subscriber,
  SmsCampaign,
  Inquiry,
  User,
  LeadAnalytics
} from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-1',
    username: 'superadmin',
    email: 'superadmin@deltatravel.com',
    role: 'SuperAdmin',
    status: 'Active',
    lastLogin: '2026-07-26 04:15 AM',
    createdAt: '2025-01-10'
  },
  {
    id: 'usr-2',
    username: 'admin',
    email: 'admin@deltatravel.com',
    role: 'Admin',
    status: 'Active',
    lastLogin: '2026-07-25 08:30 PM',
    createdAt: '2025-02-01'
  },
  {
    id: 'usr-3',
    username: 'editor_sam',
    email: 'editor@deltatravel.com',
    role: 'Editor',
    status: 'Active',
    lastLogin: '2026-07-24 02:10 PM',
    createdAt: '2025-03-15'
  }
];

export const INITIAL_PACKAGES: Package[] = [
  {
    id: 'pkg-101',
    titleEn: '14 Days Premium Ramadan Umrah Package',
    titleAr: 'برنامج العمرة الرمضانية المتميز ١٤ يومًا',
    titleAm: 'የ14 ቀን ፕሪሚየም የረመዳን ኡምራ ፓኬጅ',
    category: 'Premium',
    price: 2450,
    durationDays: 14,
    imageUrl: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?auto=format&fit=crop&q=80&w=800',
    inclusions: [
      '5-Star Luxury Accommodation (FB)',
      'Saudi Tourist E-Visa Processing',
      'Direct Flights via Saudia Airlines',
      'Private GMC VIP Airport Transfers',
      'Guided Ziyarat in Makkah & Madinah',
      '24/7 Dedicated Multilingual Guide'
    ],
    availableDates: ['2026-08-15', '2026-09-01', '2026-10-10'],
    itinerary: [
      { dayNumber: 1, title: 'Arrival in Jeddah & Transfer to Makkah', description: 'Meet & greet at VIP Lounge Jeddah Airport. GMC transfer to Swissôtel Makkah. Perform Umrah.' },
      { dayNumber: 2, title: 'Ibadah & Reflection in Makkah', description: 'Free day for prayers at Masjid al-Haram. Evening religious lecture.' },
      { dayNumber: 3, title: 'Historical Ziyarat Makkah', description: 'Visit Jabal al-Nour (Cave Hira), Jabal Thawr, Mina, Arafat, and Muzdalifah.' },
      { dayNumber: 4, title: 'Travel to Madinah Al-Munawwarah', description: 'Bullet train (Haramain Express) first class to Madinah. Check-in at Pullman Zamzam.' },
      { dayNumber: 5, title: 'Salat at Rawdah Al-Sharifa', description: 'Scheduled entrance to Al-Rawdah Al-Sharifa and greetings to Prophet Muhammad (PBUH).' }
    ],
    whatsappClicks: 342,
    status: 'Active',
    createdAt: '2026-05-10',
    updatedAt: '2026-07-20'
  },
  {
    id: 'pkg-102',
    titleEn: '10 Days Deluxe Standard Umrah Package',
    titleAr: 'برنامج العمرة القياسية ١٠ أيام',
    titleAm: 'የ10 ቀን ስታንዳርድ ኡምራ ፓኬጅ',
    category: 'Standard',
    price: 1650,
    durationDays: 10,
    imageUrl: 'https://images.unsplash.com/photo-1565552645632-d725f8bfc19a?auto=format&fit=crop&q=80&w=800',
    inclusions: [
      '4★/5★ Star Hotel Accommodation',
      'Umrah E-Visa Assistance',
      'Return Flight Ticket (Ethiopian Airlines)',
      'AC Bus Transfers',
      'Ziyarat Tours Included'
    ],
    availableDates: ['2026-08-20', '2026-09-15', '2026-11-05'],
    itinerary: [
      { dayNumber: 1, title: 'Departure & Makkah Arrival', description: 'Fly to Jeddah, transfer by AC Deluxe Coach to Anjum Hotel. Complete Umrah rites.' },
      { dayNumber: 2, title: 'Makkah Holy Sites Visit', description: 'Morning Ziyarat including Cave Hira and Mount Arafat.' }
    ],
    whatsappClicks: 218,
    status: 'Active',
    createdAt: '2026-06-01',
    updatedAt: '2026-07-22'
  },
  {
    id: 'pkg-103',
    titleEn: '15 Days Budget Saver Economy Umrah',
    titleAr: 'برنامج العمرة الاقتصادية الموفرة ١٥ يومًا',
    titleAm: 'የ15 ቀን ኢኮኖሚ ኡምራ ፓኬጅ',
    category: 'Economy',
    price: 1150,
    durationDays: 15,
    imageUrl: 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&q=80&w=800',
    inclusions: [
      'Clean 3-Star Hotel Accommodation',
      'Visa Processing Included',
      'Roundtrip Flights',
      'Group Transfers & Ziyarat'
    ],
    availableDates: ['2026-08-10', '2026-09-20', '2026-10-25'],
    itinerary: [
      { dayNumber: 1, title: 'Arrival & Umrah Entry', description: 'Arrival in Makkah, orientation by Delta tour leader, group Tawaf.' }
    ],
    whatsappClicks: 489,
    status: 'Active',
    createdAt: '2026-04-12',
    updatedAt: '2026-07-15'
  },
  {
    id: 'pkg-104',
    titleEn: 'VIP Royal Executive Umrah Package',
    titleAr: 'برنامج عمرة التنفيذي الملكي',
    titleAm: 'የቪ.አይ.ፒ ሮያል ኤክስኪዩቲቭ ኡምራ ፓኬጅ',
    category: 'VIP',
    price: 3800,
    priceUsd: 3800,
    durationDays: 21,
    imageUrl: 'https://images.unsplash.com/photo-1580418827493-f2b22c0a76cb?auto=format&fit=crop&q=80&w=800',
    inclusions: [
      'Air-conditioned VIP Suites in Makkah & Madinah',
      'Buffet Dining & Private Chefs',
      'Private GMC transfers throughout',
      'Senior Islamic Scholar Guidance',
      'Complete Visa Clearance'
    ],
    availableDates: ['2026-09-15'],
    itinerary: [
      { dayNumber: 1, title: 'Arrival & VIP Welcome', description: 'Private welcome at Royal Terminal Jeddah, transfer to Raffles Makkah.' }
    ],
    whatsappClicks: 156,
    status: 'Active',
    createdAt: '2026-02-01',
    updatedAt: '2026-07-24'
  }
];

export const INITIAL_GALLERY: GalleryItem[] = [
  {
    id: 'gal-1',
    type: 'Photo',
    titleEn: 'Masjid al-Haram Golden Hour',
    titleAr: 'المسجد الحرام في الساعة الذهبية',
    imageUrl: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?auto=format&fit=crop&q=80&w=800',
    location: 'Makkah, Saudi Arabia',
    description: 'Breathtaking sunset view over the Holy Kaaba during Tawaf.',
    isActive: true,
    sortOrder: 1,
    uploadDate: '2026-07-20'
  },
  {
    id: 'gal-2',
    type: 'Photo',
    titleEn: 'Prophet\'s Mosque Green Dome',
    titleAr: 'القبة الخضراء بالمسجد النبوي',
    imageUrl: 'https://images.unsplash.com/photo-1565552645632-d725f8bfc19a?auto=format&fit=crop&q=80&w=800',
    location: 'Madinah, Saudi Arabia',
    description: 'Serene view of Al-Masjid An-Nabawi umbrellas and green dome.',
    isActive: true,
    sortOrder: 2,
    uploadDate: '2026-07-22'
  },
  {
    id: 'gal-3',
    type: 'Video',
    titleEn: 'Delta Pilgrims Welcome at Jeddah Airport',
    titleAr: 'استقبال حجاج شركة الدلتا بمطار جدة',
    imageUrl: 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&q=80&w=800',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    duration: '02:45',
    location: 'Jeddah International Airport',
    description: 'Highlight clip of Delta Travel team welcoming June 2026 pilgrims.',
    isActive: true,
    sortOrder: 3,
    uploadDate: '2026-07-24'
  },
  {
    id: 'gal-4',
    type: 'Photo',
    titleEn: 'Abraj Al Bait Clock Tower Night View',
    titleAr: 'برج الساعة في مكة ليلاً',
    imageUrl: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=800',
    location: 'Makkah, Saudi Arabia',
    description: 'Illuminated Makkah Clock Tower viewed from Haram courtyard.',
    isActive: true,
    sortOrder: 4,
    uploadDate: '2026-07-15'
  },
  {
    id: 'gal-5',
    type: 'Video',
    titleEn: 'Virtual Tour of Swissôtel Makkah Suite',
    titleAr: 'جولة افتراضية في جناح سويس أوتيل مكة',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    duration: '03:12',
    location: 'Swissôtel Makkah Clock Tower',
    description: 'A 3-minute walk through our 5-star Kaaba view executive suite.',
    isActive: true,
    sortOrder: 5,
    uploadDate: '2026-07-18'
  },
  {
    id: 'gal-6',
    type: 'Photo',
    titleEn: 'Mount Arafat Pilgrims Gathering',
    titleAr: 'وقفة عرفات حجاج بيت الله الحرام',
    imageUrl: 'https://images.unsplash.com/photo-1580418827493-f2b22c0a76cb?auto=format&fit=crop&q=80&w=800',
    location: 'Jabal al-Rahmah, Arafat',
    description: 'Spiritual gathering at Mount Arafat during Hajj season.',
    isActive: true,
    sortOrder: 6,
    uploadDate: '2026-07-10'
  }
];

export const INITIAL_SUBSCRIBERS: Subscriber[] = [
  {
    id: 'sub-1',
    phone: '+251911223344',
    email: 'khalid.a@gmail.com',
    channel: 'WhatsApp',
    packageInterest: '14 Days Premium Ramadan Umrah Package',
    optInStatus: 'Active',
    dateSubscribed: '2026-07-24'
  },
  {
    id: 'sub-2',
    phone: '+251922334455',
    email: 'fatima.o@yahoo.com',
    channel: 'Web Banner',
    packageInterest: '10 Days Deluxe Standard Umrah Package',
    optInStatus: 'Active',
    dateSubscribed: '2026-07-22'
  },
  {
    id: 'sub-3',
    phone: '+251933445566',
    email: 'bilal.m@hotmail.com',
    channel: 'Footer',
    packageInterest: 'General Umrah Offers',
    optInStatus: 'Active',
    dateSubscribed: '2026-07-20'
  },
  {
    id: 'sub-4',
    phone: '+971501234567',
    email: 'tariq.gcc@outlook.com',
    channel: 'WhatsApp',
    packageInterest: 'VIP Royal Executive Hajj Package 2027',
    optInStatus: 'Active',
    dateSubscribed: '2026-07-18'
  },
  {
    id: 'sub-5',
    phone: '+251944556677',
    email: 'aisha.t@gmail.com',
    channel: 'Direct',
    packageInterest: '15 Days Budget Saver Economy Umrah',
    optInStatus: 'Opt-out',
    dateSubscribed: '2026-06-11'
  }
];

export const INITIAL_CAMPAIGNS: SmsCampaign[] = [
  {
    id: 'cmp-1',
    name: 'Ramadan Early Bird Discount 2026',
    targetFilter: 'All Active Subscribers',
    message: 'Delta Travel Special: Book Ramadan Umrah before Aug 30 and get $150 off per person! Reply YES to lock your seat via WhatsApp.',
    recipientsCount: 420,
    sentDate: '2026-07-15 10:30 AM',
    status: 'Delivered',
    recipients: [
      { phone: '+251911223344', name: 'Khalid A.', status: 'Delivered' },
      { phone: '+251922334455', name: 'Fatima O.', status: 'Delivered' },
      { phone: '+251933445566', name: 'Bilal M.', status: 'Delivered' }
    ]
  },
  {
    id: 'cmp-2',
    name: 'Hajj 2027 VIP Seat Reservation Notice',
    targetFilter: 'WhatsApp Channel Subscribers',
    message: 'Hajj 2027 Registration is NOW open at Delta Travel. VIP Mina Zone A seats limited. Call us or visit our office today!',
    recipientsCount: 185,
    sentDate: '2026-06-01 02:00 PM',
    status: 'Delivered'
  }
];

export const INITIAL_INQUIRIES: Inquiry[] = [
  {
    id: 'inq-101',
    fullName: 'Mohammed Ibrahim',
    phone: '+251911998877',
    email: 'mohammed.ibrahim@gmail.com',
    subject: 'Family Umrah Package Inquiry for 5 People',
    message: 'Assalamu Alaikum, we are a family of 5 planning Umrah in September 2026. Can you provide custom pricing for 5-star hotels in Makkah with Kaaba view?',
    status: 'New',
    dateReceived: '2026-07-26 03:15 AM',
    adminNotes: ''
  },
  {
    id: 'inq-102',
    fullName: 'Zainab Ahmed',
    phone: '+251922114477',
    email: 'zainab.ahmed@gmail.com',
    subject: 'Ethiopian Passport E-Visa Requirement Query',
    message: 'Hello Delta Travel team, do I need a yellow fever card if I am traveling directly from Addis Ababa to Jeddah on Saudia Airlines?',
    status: 'Contacted',
    dateReceived: '2026-07-25 11:40 AM',
    adminNotes: 'Called customer on WhatsApp, explained yellow fever card requirement.'
  },
  {
    id: 'inq-103',
    fullName: 'Omar Hassan',
    phone: '+971529876543',
    email: 'omar.hassan@dubai.com',
    subject: 'VIP Hajj 2027 Reservation Terms',
    message: 'Interested in reserving 2 VIP Hajj packages for 2027. Please email me the payment schedule and tent details in Mina.',
    status: 'Resolved',
    dateReceived: '2026-07-20 09:20 AM',
    adminNotes: 'Sent official PDF brochure via WhatsApp and confirmed receipt.'
  }
];

export const INITIAL_LEAD_STATS: LeadAnalytics = {
  totalClicks: 1205,
  todayClicks: 48,
  thisWeekClicks: 230,
  thisMonthClicks: 890,
  packageStats: [
    { packageId: 'pkg-103', packageTitle: '15 Days Budget Saver Economy Umrah', category: 'Economy', price: 1150, clickCount: 489, latestClickDate: '2026-07-26 04:50 AM', percentageOfTotal: 40.5 },
    { packageId: 'pkg-101', packageTitle: '14 Days Premium Ramadan Umrah Package', category: 'Premium', price: 2450, clickCount: 342, latestClickDate: '2026-07-26 03:10 AM', percentageOfTotal: 28.3 },
    { packageId: 'pkg-102', packageTitle: '10 Days Deluxe Standard Umrah Package', category: 'Standard', price: 1650, clickCount: 218, latestClickDate: '2026-07-25 08:20 PM', percentageOfTotal: 18.1 },
    { packageId: 'pkg-104', packageTitle: 'VIP Royal Executive Umrah Package', category: 'VIP', price: 3800, clickCount: 156, latestClickDate: '2026-07-24 01:15 PM', percentageOfTotal: 12.9 }
  ],
  categoryDistribution: [
    { category: 'Economy', clicks: 489 },
    { category: 'Premium', clicks: 342 },
    { category: 'Standard', clicks: 218 },
    { category: 'VIP', clicks: 156 }
  ]
};
