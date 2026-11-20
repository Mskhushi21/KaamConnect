export type Language = 'en' | 'kn' | 'hi';

export type UserRole = 'worker' | 'employer' | 'admin';

export const JOB_CATEGORIES = [
  'Construction',
  'Domestic and Household Work',
  'Delivery and Transportation',
  'Hotel and Restaurant',
  'Retail and Shop Assistant',
  'Tailoring and Handicrafts',
  'Repair and Maintenance',
  'Cleaning and Sanitation',
  'Factory and Warehouse',
  'Gardening and Agriculture',
  'Security and Maintenance',
  'Office Assistant and Data Entry',
  'Event Workers',
  'Drivers',
  'General Helpers',
] as const;

export type JobCategory = (typeof JOB_CATEGORIES)[number];

export const WORK_TYPES = [
  'Full-time',
  'Part-time',
  'Daily wage',
  'Temporary',
  'Contract-based',
] as const;

export type WorkType = (typeof WORK_TYPES)[number];

export const EMPLOYER_TYPES = [
  'Individual / Household',
  'Shop / Retail Store',
  'Restaurant / Hotel',
  'Contractor / Construction',
  'Factory / Warehouse',
  'Office / Commercial Business',
  'Event / Hospitality Organizer',
  'Agriculture / Farm',
] as const;

export type EmployerType = (typeof EMPLOYER_TYPES)[number];

export const EXPERIENCE_LEVELS = [
  'Fresher',
  '1-2 years',
  '2-5 years',
  '5+ years',
] as const;

export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export const APPLICATION_STATUSES = [
  'Pending',
  'Under Review',
  'Accepted',
  'Rejected',
  'Withdrawn',
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const JOB_STATUSES = [
  'Active',
  'Closed',
  'Filled',
  'Pending Review',
  'Removed',
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

export const REPORT_REASONS = [
  'Asking for registration or hiring fee',
  'Misleading salary or false wage promise',
  'Fake or non-existent workplace',
  'Unsafe working conditions',
  'Abusive or inappropriate behaviour',
  'Duplicate or spam listing',
] as const;

export interface LocationDistrict {
  district: string;
  cities: {
    city: string;
    areas: string[];
  }[];
}

export interface LocationState {
  state: string;
  districts: LocationDistrict[];
}

export const INDIA_LOCATIONS: LocationState[] = [
  {
    state: 'Karnataka',
    districts: [
      {
        district: 'Bengaluru Urban',
        cities: [
          {
            city: 'Bengaluru',
            areas: [
              'Koramangala',
              'Indiranagar',
              'Whitefield',
              'Jayanagar',
              'Malleswaram',
              'Rajajinagar',
              'Electronic City',
              'Yelahanka',
              'HSR Layout',
              'BTM Layout',
              'Hebbal',
              'Vijayanagar',
              'Peenya Industrial Area',
              'Banashankari',
            ],
          },
        ],
      },
      {
        district: 'Mysuru',
        cities: [
          {
            city: 'Mysuru',
            areas: [
              'Vijayanagar',
              'Kuvempunagar',
              'Saraswathipuram',
              'Gokulam',
              'Nazarbad',
              'Jayalakshmipuram',
              'Hebbal Industrial Area',
            ],
          },
        ],
      },
      {
        district: 'Dakshina Kannada',
        cities: [
          {
            city: 'Mangaluru',
            areas: [
              'Hampankatta',
              'Kadri',
              'Bejai',
              'Surathkal',
              'Kankanady',
              'Ullal',
              'Baikampady',
            ],
          },
        ],
      },
      {
        district: 'Dharwad',
        cities: [
          {
            city: 'Hubballi',
            areas: ['Vidyanagar', 'Keshwapur', 'Gokul Road', 'Unkal', 'Old Hubballi'],
          },
          {
            city: 'Dharwad',
            areas: ['Saptapur', 'Navanagar', 'KCD Circle', 'Malamaddi'],
          },
        ],
      },
      {
        district: 'Belagavi',
        cities: [
          {
            city: 'Belagavi',
            areas: ['Tilakwadi', 'Shahapur', 'Camp', 'Vadgaon', 'Sadashiv Nagar', 'Udyambag'],
          },
        ],
      },
      {
        district: 'Udupi',
        cities: [
          {
            city: 'Udupi',
            areas: ['Car Street', 'Brahmagiri', 'Malpe', 'Kadiyali'],
          },
          {
            city: 'Manipal',
            areas: ['Tiger Circle', 'End Point Road', 'Vidyarathna Nagar'],
          },
        ],
      },
      {
        district: 'Shivamogga',
        cities: [
          {
            city: 'Shivamogga',
            areas: ['Vinoba Nagar', 'Gopala', 'Tilak Nagar', 'Durgigudi'],
          },
        ],
      },
      {
        district: 'Tumakuru',
        cities: [
          {
            city: 'Tumakuru',
            areas: ['Batawadi', 'Sitapura', 'Sira Gate', 'Kyathasandra'],
          },
        ],
      },
      {
        district: 'Kalaburagi',
        cities: [
          {
            city: 'Kalaburagi',
            areas: ['Sedam Road', 'Super Market', 'Jewargi Road', 'Station Area'],
          },
        ],
      },
      {
        district: 'Ballari',
        cities: [
          {
            city: 'Ballari',
            areas: ['Gandhi Nagar', 'Parvathi Nagar', 'Patel Nagar', 'Cantonment'],
          },
        ],
      },
    ],
  },
  {
    state: 'Maharashtra',
    districts: [
      {
        district: 'Mumbai',
        cities: [
          {
            city: 'Mumbai',
            areas: ['Andheri', 'Dadar', 'Bandra', 'Kurla', 'Borivali'],
          },
        ],
      },
      {
        district: 'Pune',
        cities: [
          {
            city: 'Pune',
            areas: ['Kothrud', 'Hinjewadi', 'Hadapsar', 'Shivajinagar', 'Pimpri'],
          },
        ],
      },
    ],
  },
  {
    state: 'Tamil Nadu',
    districts: [
      {
        district: 'Chennai',
        cities: [
          {
            city: 'Chennai',
            areas: ['T. Nagar', 'Velachery', 'Anna Nagar', 'Adyar', 'Ambattur'],
          },
        ],
      },
      {
        district: 'Coimbatore',
        cities: [
          {
            city: 'Coimbatore',
            areas: ['RS Puram', 'Gandhipuram', 'Peelamedu', 'Singanallur'],
          },
        ],
      },
    ],
  },
  {
    state: 'Telangana',
    districts: [
      {
        district: 'Hyderabad',
        cities: [
          {
            city: 'Hyderabad',
            areas: ['Madhapur', 'Secunderabad', 'Banjara Hills', 'Kukatpally', 'LB Nagar'],
          },
        ],
      },
    ],
  },
  {
    state: 'Kerala',
    districts: [
      {
        district: 'Ernakulam',
        cities: [
          {
            city: 'Kochi',
            areas: ['Edappally', 'Kakkanad', 'Fort Kochi', 'Aluva', 'Vyttila'],
          },
        ],
      },
    ],
  },
  {
    state: 'Delhi NCR',
    districts: [
      {
        district: 'New Delhi',
        cities: [
          {
            city: 'New Delhi',
            areas: ['Connaught Place', 'Lajpat Nagar', 'Rohini', 'Dwarka', 'Okhla'],
          },
        ],
      },
    ],
  },
];

export function getDistrictsForState(state: string): LocationDistrict[] {
  return INDIA_LOCATIONS.find((s) => s.state === state)?.districts || [];
}

export function getCitiesForDistrict(state: string, district: string) {
  const districts = getDistrictsForState(state);
  return districts.find((d) => d.district === district)?.cities || [];
}

export function getAreasForCity(state: string, district: string, city: string): string[] {
  const cities = getCitiesForDistrict(state, district);
  return cities.find((c) => c.city === city)?.areas || [];
}

export function getAllCities(): string[] {
  const result: string[] = [];
  for (const s of INDIA_LOCATIONS) {
    for (const d of s.districts) {
      for (const c of d.cities) {
        if (!result.includes(c.city)) {
          result.push(c.city);
        }
      }
    }
  }
  return result;
}
