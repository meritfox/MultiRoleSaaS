export interface StateCitiesSchools {
  state: string;
  cities: {
    city: string;
    schools: string[];
  }[];
}

export const INDIAN_STATES_AND_CITIES: StateCitiesSchools[] = [
  {
    state: "Jharkhand",
    cities: [
      {
        city: "Jamshedpur",
        schools: [
          "DAV Public School, Bistupur",
          "Loyola School, Beldih",
          "Delhi Public School, Mango",
          "Little Flower School, Telco",
          "Carmel Junior College, Sonari",
          "Sacred Heart Convent School",
          "Hill Top School, Telco",
          "Other School (Specify)",
        ],
      },
      {
        city: "Ranchi",
        schools: [
          "Delhi Public School, SAIL Township",
          "JVM Shyamali, Doranda",
          "St. Xavier's School, Doranda",
          "Surendranath Centenary School",
          "DAV Public School, Hehal",
          "Other School (Specify)",
        ],
      },
      {
        city: "Dhanbad",
        schools: [
          "Delhi Public School, Dhanbad",
          "De Nobili School, FRI",
          "DAV Public School, Koyla Nagar",
          "Other School (Specify)",
        ],
      },
      {
        city: "Bokaro Steel City",
        schools: [
          "Delhi Public School, Sector 4",
          "Chinmaya Vidyalaya, Sector 5",
          "St. Xavier's School, Sector 1",
          "Other School (Specify)",
        ],
      },
    ],
  },
  {
    state: "Assam",
    cities: [
      {
        city: "Guwahati",
        schools: [
          "Delhi Public School, Guwahati",
          "Don Bosco High School, Panbazar",
          "Sanskriti The Gurukul",
          "Guwahati Prep School",
          "Maharishi Vidya Mandir, Silpukhuri",
          "Royal Global School, Betkuchi",
          "Other School (Specify)",
        ],
      },
      {
        city: "Silchar",
        schools: [
          "Don Bosco School, Silchar",
          "Pranabananda Vidyamandir",
          "Kendriya Vidyalaya, Silchar",
          "Other School (Specify)",
        ],
      },
    ],
  },
  {
    state: "West Bengal",
    cities: [
      {
        city: "Kolkata",
        schools: [
          "La Martiniere for Boys",
          "La Martiniere for Girls",
          "South Point High School",
          "Delhi Public School, Ruby Park",
          "Other School (Specify)",
        ],
      },
      {
        city: "Siliguri",
        schools: [
          "Delhi Public School, Siliguri",
          "Don Bosco School, Siliguri",
          "Other School (Specify)",
        ],
      },
    ],
  },
  {
    state: "Delhi NCR",
    cities: [
      {
        city: "New Delhi",
        schools: [
          "Delhi Public School, R.K. Puram",
          "Modern School, Barakhamba Road",
          "Springdales School, Dhaula Kuan",
          "Other School (Specify)",
        ],
      },
      {
        city: "Noida",
        schools: [
          "Delhi Public School, Noida Sector 30",
          "Step by Step School, Sector 132",
          "Other School (Specify)",
        ],
      },
    ],
  },
  {
    state: "Maharashtra",
    cities: [
      {
        city: "Mumbai",
        schools: [
          "Dhirubhai Ambani International School",
          "Bombay Scottish School, Mahim",
          "Delhi Public School, Nerul",
          "Other School (Specify)",
        ],
      },
      {
        city: "Pune",
        schools: [
          "The Bishop's School, Camp",
          "Delhi Public School, Pune",
          "Other School (Specify)",
        ],
      },
    ],
  },
  {
    state: "Karnataka",
    cities: [
      {
        city: "Bengaluru",
        schools: [
          "The International School Bangalore",
          "National Public School, Indiranagar",
          "Delhi Public School, Bangalore South",
          "Other School (Specify)",
        ],
      },
    ],
  },
  {
    state: "Bihar",
    cities: [
      {
        city: "Patna",
        schools: [
          "St. Michael's High School, Digha",
          "Delhi Public School, Danapur",
          "Loyola High School, Kurji",
          "Other School (Specify)",
        ],
      },
    ],
  },
];


export const EDUCATION_BOARDS = [
  "CBSE",
  "ICSE",
  "State Board",
  "IB (International Baccalaureate)",
  "Cambridge (IGCSE)",
  "Other",
];

export const GRADES_LIST = [
  "Nursery / Pre-KG",
  "LKG",
  "UKG",
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11",
  "Class 12",
];

export const PARENT_TITLES = ["Mr", "Mrs", "Miss", "Ms", "Dr"];

export const PARENT_RELATIONSHIPS = [
  "Father",
  "Mother",
  "Guardian",
  "Grandparent",
  "Other",
];

export const PROFESSIONS_LIST = [
  "Salaried / Corporate Professional",
  "Business / Self-Employed",
  "Government Service / PSU",
  "Doctor / Healthcare",
  "Engineer / Tech Professional",
  "Teacher / Professor / Educator",
  "Lawyer / Legal Professional",
  "Homemaker",
  "Defense / Police",
  "Other",
];

export const QUALIFICATIONS_LIST = [
  "High School / 10th",
  "Higher Secondary / 12th",
  "Diploma",
  "Graduate / Bachelor's (B.Tech, B.Sc, B.Com, B.A, etc.)",
  "Post-Graduate / Master's (M.Tech, MBA, M.Sc, etc.)",
  "Doctorate / Ph.D.",
  "Other",
];

export const GENDERS = ["Male", "Female", "Other", "Prefer not to say"];

export const HOBBIES_LIST = [
  "Cricket / Football / Outdoor Sports",
  "Chess / Indoor Games",
  "Music / Singing / Instruments",
  "Drawing / Painting / Arts",
  "Dancing",
  "Reading & Creative Writing",
  "Coding & Robotics",
  "Martial Arts / Swimming",
  "Yoga & Fitness",
  "Other",
];

export function getCitiesForState(stateName: string): string[] {
  const item = INDIAN_STATES_AND_CITIES.find(
    (s) => s.state.toLowerCase() === stateName.trim().toLowerCase()
  );
  return item ? item.cities.map((c) => c.city) : [];
}

export function getSchoolsForCity(cityName: string): string[] {
  for (const s of INDIAN_STATES_AND_CITIES) {
    const found = s.cities.find(
      (c) => c.city.toLowerCase() === cityName.trim().toLowerCase()
    );
    if (found) return found.schools;
  }
  return ["Other School (Specify)"];
}
