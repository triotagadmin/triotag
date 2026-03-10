// Progressive location data: Country → Province/State → City → Postal Code

export interface LocationEntry {
  country: string;
  provinces: {
    name: string;
    cities: {
      name: string;
      postalCode: string;
    }[];
  }[];
}

export const locationData: LocationEntry[] = [
  {
    country: "Philippines",
    provinces: [
      {
        name: "Metro Manila",
        cities: [
          { name: "Quezon City", postalCode: "1100" },
          { name: "Makati", postalCode: "1200" },
          { name: "Taguig", postalCode: "1630" },
          { name: "Pasig", postalCode: "1600" },
          { name: "Manila", postalCode: "1000" },
          { name: "Mandaluyong", postalCode: "1550" },
          { name: "San Juan", postalCode: "1500" },
          { name: "Marikina", postalCode: "1800" },
          { name: "Parañaque", postalCode: "1700" },
          { name: "Las Piñas", postalCode: "1740" },
          { name: "Muntinlupa", postalCode: "1770" },
          { name: "Caloocan", postalCode: "1400" },
          { name: "Valenzuela", postalCode: "1440" },
          { name: "Navotas", postalCode: "1485" },
          { name: "Malabon", postalCode: "1470" },
          { name: "Pasay", postalCode: "1300" },
          { name: "Pateros", postalCode: "1620" },
        ],
      },
      {
        name: "Cebu",
        cities: [
          { name: "Cebu City", postalCode: "6000" },
          { name: "Mandaue", postalCode: "6014" },
          { name: "Lapu-Lapu", postalCode: "6015" },
          { name: "Talisay", postalCode: "6045" },
          { name: "Consolacion", postalCode: "6001" },
        ],
      },
      {
        name: "Davao del Sur",
        cities: [
          { name: "Davao City", postalCode: "8000" },
          { name: "Digos", postalCode: "8002" },
          { name: "Santa Cruz", postalCode: "8001" },
        ],
      },
      {
        name: "Laguna",
        cities: [
          { name: "Santa Rosa", postalCode: "4026" },
          { name: "Biñan", postalCode: "4024" },
          { name: "Calamba", postalCode: "4027" },
          { name: "San Pedro", postalCode: "4023" },
          { name: "Los Baños", postalCode: "4030" },
        ],
      },
      {
        name: "Batangas",
        cities: [
          { name: "Batangas City", postalCode: "4200" },
          { name: "Lipa", postalCode: "4217" },
          { name: "Tanauan", postalCode: "4232" },
        ],
      },
      {
        name: "Cavite",
        cities: [
          { name: "Dasmariñas", postalCode: "4114" },
          { name: "Bacoor", postalCode: "4102" },
          { name: "Imus", postalCode: "4103" },
          { name: "General Trias", postalCode: "4107" },
        ],
      },
      {
        name: "Pampanga",
        cities: [
          { name: "Angeles City", postalCode: "2009" },
          { name: "San Fernando", postalCode: "2000" },
          { name: "Clark", postalCode: "2023" },
        ],
      },
      {
        name: "Bulacan",
        cities: [
          { name: "Malolos", postalCode: "3000" },
          { name: "Meycauayan", postalCode: "3020" },
          { name: "San Jose del Monte", postalCode: "3023" },
        ],
      },
    ],
  },
  {
    country: "United States",
    provinces: [
      {
        name: "California",
        cities: [
          { name: "Los Angeles", postalCode: "90001" },
          { name: "San Francisco", postalCode: "94102" },
          { name: "San Diego", postalCode: "92101" },
          { name: "San Jose", postalCode: "95101" },
        ],
      },
      {
        name: "New York",
        cities: [
          { name: "New York City", postalCode: "10001" },
          { name: "Buffalo", postalCode: "14201" },
          { name: "Albany", postalCode: "12201" },
        ],
      },
      {
        name: "Texas",
        cities: [
          { name: "Houston", postalCode: "77001" },
          { name: "Dallas", postalCode: "75201" },
          { name: "Austin", postalCode: "73301" },
          { name: "San Antonio", postalCode: "78201" },
        ],
      },
      {
        name: "Florida",
        cities: [
          { name: "Miami", postalCode: "33101" },
          { name: "Orlando", postalCode: "32801" },
          { name: "Tampa", postalCode: "33601" },
        ],
      },
      {
        name: "Illinois",
        cities: [
          { name: "Chicago", postalCode: "60601" },
          { name: "Springfield", postalCode: "62701" },
        ],
      },
    ],
  },
  {
    country: "Singapore",
    provinces: [
      {
        name: "Central Region",
        cities: [
          { name: "Downtown Core", postalCode: "018956" },
          { name: "Orchard", postalCode: "238823" },
          { name: "Marina Bay", postalCode: "018960" },
        ],
      },
      {
        name: "East Region",
        cities: [
          { name: "Tampines", postalCode: "520201" },
          { name: "Bedok", postalCode: "460001" },
          { name: "Changi", postalCode: "486038" },
        ],
      },
      {
        name: "West Region",
        cities: [
          { name: "Jurong East", postalCode: "609731" },
          { name: "Clementi", postalCode: "120301" },
        ],
      },
    ],
  },
  {
    country: "Canada",
    provinces: [
      {
        name: "Ontario",
        cities: [
          { name: "Toronto", postalCode: "M5H" },
          { name: "Ottawa", postalCode: "K1A" },
          { name: "Mississauga", postalCode: "L5B" },
        ],
      },
      {
        name: "British Columbia",
        cities: [
          { name: "Vancouver", postalCode: "V5K" },
          { name: "Victoria", postalCode: "V8W" },
          { name: "Surrey", postalCode: "V3T" },
        ],
      },
      {
        name: "Quebec",
        cities: [
          { name: "Montreal", postalCode: "H2X" },
          { name: "Quebec City", postalCode: "G1R" },
        ],
      },
      {
        name: "Alberta",
        cities: [
          { name: "Calgary", postalCode: "T2P" },
          { name: "Edmonton", postalCode: "T5J" },
        ],
      },
    ],
  },
  {
    country: "United Kingdom",
    provinces: [
      {
        name: "England",
        cities: [
          { name: "London", postalCode: "EC1A" },
          { name: "Manchester", postalCode: "M1" },
          { name: "Birmingham", postalCode: "B1" },
          { name: "Liverpool", postalCode: "L1" },
        ],
      },
      {
        name: "Scotland",
        cities: [
          { name: "Edinburgh", postalCode: "EH1" },
          { name: "Glasgow", postalCode: "G1" },
        ],
      },
    ],
  },
  {
    country: "Australia",
    provinces: [
      {
        name: "New South Wales",
        cities: [
          { name: "Sydney", postalCode: "2000" },
          { name: "Newcastle", postalCode: "2300" },
        ],
      },
      {
        name: "Victoria",
        cities: [
          { name: "Melbourne", postalCode: "3000" },
          { name: "Geelong", postalCode: "3220" },
        ],
      },
      {
        name: "Queensland",
        cities: [
          { name: "Brisbane", postalCode: "4000" },
          { name: "Gold Coast", postalCode: "4217" },
        ],
      },
    ],
  },
  {
    country: "Japan",
    provinces: [
      {
        name: "Tokyo",
        cities: [
          { name: "Shibuya", postalCode: "150-0002" },
          { name: "Shinjuku", postalCode: "160-0022" },
          { name: "Minato", postalCode: "105-0001" },
        ],
      },
      {
        name: "Osaka",
        cities: [
          { name: "Osaka City", postalCode: "530-0001" },
          { name: "Sakai", postalCode: "590-0078" },
        ],
      },
    ],
  },
  {
    country: "South Korea",
    provinces: [
      {
        name: "Seoul",
        cities: [
          { name: "Gangnam", postalCode: "06000" },
          { name: "Mapo", postalCode: "04100" },
          { name: "Jongno", postalCode: "03150" },
        ],
      },
      {
        name: "Gyeonggi",
        cities: [
          { name: "Suwon", postalCode: "16400" },
          { name: "Seongnam", postalCode: "13590" },
        ],
      },
    ],
  },
];

export function getCountries(): string[] {
  return locationData.map(l => l.country);
}

export function getProvinces(country: string): string[] {
  const entry = locationData.find(l => l.country === country);
  return entry ? entry.provinces.map(p => p.name) : [];
}

export function getCities(country: string, province: string): string[] {
  const entry = locationData.find(l => l.country === country);
  if (!entry) return [];
  const prov = entry.provinces.find(p => p.name === province);
  return prov ? prov.cities.map(c => c.name) : [];
}

export function getPostalCode(country: string, province: string, city: string): string {
  const entry = locationData.find(l => l.country === country);
  if (!entry) return "";
  const prov = entry.provinces.find(p => p.name === province);
  if (!prov) return "";
  const c = prov.cities.find(ci => ci.name === city);
  return c ? c.postalCode : "";
}
