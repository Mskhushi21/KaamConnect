import { db } from './db.ts';
import { hashPassword } from './auth.ts';

export function ensureAdminUser(): void {
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@kaamconnect.in').trim().toLowerCase();
  const adminPass = process.env.ADMIN_PASSWORD || 'Admin@KaamConnect2026';

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail) as { id: number } | undefined;
  if (!existing) {
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO users (email, mobile, password_hash, role, full_name, language, is_suspended, is_sample, created_at, updated_at)
       VALUES (?, ?, ?, 'admin', ?, 'en', 0, 0, ?, ?)`
    ).run(adminEmail, '9900000001', hashPassword(adminPass), 'KaamConnect Administrator', now, now);
  }
}

export function seedSampleData(force = false): { inserted: boolean; counts: { jobs: number; users: number } } {
  ensureAdminUser();

  const existingJobs = (db.prepare('SELECT COUNT(*) as cnt FROM jobs').get() as { cnt: number }).cnt;
  const existingUsers = (db.prepare("SELECT COUNT(*) as cnt FROM users WHERE role != 'admin'").get() as { cnt: number }).cnt;

  if (!force && (existingJobs > 0 || existingUsers > 0)) {
    return { inserted: false, counts: { jobs: existingJobs, users: existingUsers } };
  }

  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000).toISOString();
  const daysAhead = (d: number) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const samplePasswordHash = hashPassword('Sample@123');

  const insertEmployer = (
    email: string,
    mobile: string,
    fullName: string,
    businessName: string,
    employerType: string,
    state: string,
    district: string,
    city: string,
    area: string,
    description: string
  ): number => {
    const found = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: number } | undefined;
    if (found) return found.id;
    const ts = daysAgo(15);
    const res = db
      .prepare(
        `INSERT INTO users (email, mobile, password_hash, role, full_name, language, is_suspended, is_sample, created_at, updated_at)
         VALUES (?, ?, ?, 'employer', ?, 'en', 0, 1, ?, ?)`
      )
      .run(email, mobile, samplePasswordHash, fullName, ts, ts);
    const userId = Number(res.lastInsertRowid);
    db.prepare(
      `INSERT INTO employer_profiles (user_id, business_name, employer_type, state, district, city, area, description, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(userId, businessName, employerType, state, district, city, area, description, ts);
    return userId;
  };

  const insertWorker = (
    email: string,
    mobile: string,
    fullName: string,
    state: string,
    district: string,
    city: string,
    area: string,
    skills: string,
    expYears: number,
    expLabel: string,
    prefCategory: string,
    prefWorkType: string,
    bio: string
  ): number => {
    const found = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: number } | undefined;
    if (found) return found.id;
    const ts = daysAgo(12);
    const res = db
      .prepare(
        `INSERT INTO users (email, mobile, password_hash, role, full_name, language, is_suspended, is_sample, created_at, updated_at)
         VALUES (?, ?, ?, 'worker', ?, 'en', 0, 1, ?, ?)`
      )
      .run(email, mobile, samplePasswordHash, fullName, ts, ts);
    const userId = Number(res.lastInsertRowid);
    db.prepare(
      `INSERT INTO worker_profiles (user_id, state, district, city, area, skills, experience_years, experience_label, preferred_category, preferred_work_type, bio, availability_status, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Available', ?)`
    ).run(userId, state, district, city, area, skills, expYears, expLabel, prefCategory, prefWorkType, bio, ts);
    return userId;
  };

  const emp1 = insertEmployer(
    'ramesh.hardware@sample.kaamconnect.in',
    '9845011223',
    'Ramesh Gowda',
    'Nandi Electricals & Hardware',
    'Shop / Retail Store',
    'Karnataka',
    'Bengaluru Urban',
    'Bengaluru',
    'Jayanagar',
    'Neighborhood electrical, plumbing, and hardware supply store serving South Bengaluru.'
  );

  const emp2 = insertEmployer(
    'kavitha.hotel@sample.kaamconnect.in',
    '9844022334',
    'Kavitha Rao',
    'Malnad Spice Kitchen',
    'Restaurant / Hotel',
    'Karnataka',
    'Mysuru',
    'Mysuru',
    'Saraswathipuram',
    'Family dining restaurant serving authentic South Indian and Malnad meals.'
  );

  const emp3 = insertEmployer(
    'suresh.logistics@sample.kaamconnect.in',
    '9880033445',
    'Suresh Shetty',
    'Coastal Goods & Logistics',
    'Factory / Warehouse',
    'Karnataka',
    'Dakshina Kannada',
    'Mangaluru',
    'Baikampady',
    'Regional warehouse and distribution partner for groceries and hardware.'
  );

  const emp4 = insertEmployer(
    'anita.boutique@sample.kaamconnect.in',
    '9740044556',
    'Anita Kulkarni',
    'Kaveri Tailors & Craft Studio',
    'Shop / Retail Store',
    'Karnataka',
    'Dharwad',
    'Hubballi',
    'Vidyanagar',
    'Custom tailoring unit for ladies blouses, uniforms, and handloom alterations.'
  );

  const emp5 = insertEmployer(
    'prakash.builders@sample.kaamconnect.in',
    '9901055667',
    'Prakash Patil',
    'Sahyadri Civil Works',
    'Contractor / Construction',
    'Karnataka',
    'Belagavi',
    'Belagavi',
    'Tilakwadi',
    'Residential renovation, tiling, and civil contracting firm.'
  );

  const w1 = insertWorker(
    'mahesh.worker@sample.kaamconnect.in',
    '9611100112',
    'Mahesh Kumar',
    'Karnataka',
    'Bengaluru Urban',
    'Bengaluru',
    'Jayanagar',
    'Wiring, MCB repair, Ceiling fan installation, Plumbing',
    4,
    '2-5 years',
    'Repair and Maintenance',
    'Full-time',
    'Experienced residential electrician and maintenance technician.'
  );

  const w2 = insertWorker(
    'lakshmi.worker@sample.kaamconnect.in',
    '9622200223',
    'Lakshmi Devi',
    'Karnataka',
    'Mysuru',
    'Mysuru',
    'Kuvempunagar',
    'South Indian cooking, Kitchen prep, Hygiene maintenance',
    3,
    '2-5 years',
    'Hotel and Restaurant',
    'Full-time',
    'Skilled kitchen helper and breakfast cook with 3 years experience.'
  );

  const sampleJobs = [
    {
      employer_id: emp1,
      title: 'Shop Assistant & Billing Counter Helper',
      category: 'Retail and Shop Assistant',
      description: 'Looking for a reliable local shop assistant to help customers with hardware items, stock arrangement, and basic counter billing. Kannada and basic English preferred.',
      required_skills: 'Customer handling, Basic counting, Stock arrangement',
      workers_required: 2,
      state: 'Karnataka',
      district: 'Bengaluru Urban',
      city: 'Bengaluru',
      area: 'Jayanagar',
      pay_type: 'monthly',
      salary_min: 15000,
      salary_max: 18000,
      salary_display: '₹15,000 - ₹18,000 / month',
      work_type: 'Full-time',
      working_hours: '9:00 AM - 7:30 PM (1 hour lunch break)',
      experience_required: '1-2 years',
      contact_name: 'Ramesh Gowda',
      contact_phone: '9845011223',
      hide_phone_until_accepted: 0,
      deadline: daysAhead(20),
      created: daysAgo(1),
    },
    {
      employer_id: emp1,
      title: 'Residential Electrician for Daily Service Visits',
      category: 'Repair and Maintenance',
      description: 'Need an experienced electrician for household wiring repairs, switchboard installation, and inverter connections across Jayanagar and JP Nagar.',
      required_skills: 'House wiring, Switchboard repair, Inverter fitting',
      workers_required: 2,
      state: 'Karnataka',
      district: 'Bengaluru Urban',
      city: 'Bengaluru',
      area: 'Jayanagar',
      pay_type: 'daily',
      salary_min: 800,
      salary_max: 1100,
      salary_display: '₹800 - ₹1,100 / day',
      work_type: 'Daily wage',
      working_hours: '9:30 AM - 6:00 PM',
      experience_required: '2-5 years',
      contact_name: 'Ramesh Gowda',
      contact_phone: '9845011223',
      hide_phone_until_accepted: 0,
      deadline: daysAhead(14),
      created: daysAgo(0),
    },
    {
      employer_id: emp2,
      title: 'Kitchen Helper & Tiffin Prep Assistant',
      category: 'Hotel and Restaurant',
      description: 'Assisting head cook with morning dosa/idli batter prep, vegetable cutting, and keeping kitchen stations clean. Morning breakfast and afternoon meal provided.',
      required_skills: 'Vegetable prep, Kitchen hygiene, Fast teamwork',
      workers_required: 3,
      state: 'Karnataka',
      district: 'Mysuru',
      city: 'Mysuru',
      area: 'Saraswathipuram',
      pay_type: 'monthly',
      salary_min: 13500,
      salary_max: 16000,
      salary_display: '₹13,500 - ₹16,000 / month',
      work_type: 'Full-time',
      working_hours: '7:00 AM - 3:30 PM',
      experience_required: 'Fresher',
      contact_name: 'Kavitha Rao',
      contact_phone: '9844022334',
      hide_phone_until_accepted: 0,
      deadline: daysAhead(25),
      created: daysAgo(2),
    },
    {
      employer_id: emp3,
      title: 'Warehouse Loader & Packing Staff',
      category: 'Factory and Warehouse',
      description: 'Loading, unloading, and sorting packed grocery cartons at Baikampady warehouse. Safety shoes provided by company. Overtime paid separately.',
      required_skills: 'Carton sorting, Physical fitness, Inventory tally',
      workers_required: 5,
      state: 'Karnataka',
      district: 'Dakshina Kannada',
      city: 'Mangaluru',
      area: 'Baikampady',
      pay_type: 'daily',
      salary_min: 650,
      salary_max: 750,
      salary_display: '₹650 - ₹750 / day',
      work_type: 'Full-time',
      working_hours: '8:30 AM - 5:30 PM',
      experience_required: 'Fresher',
      contact_name: 'Suresh Shetty',
      contact_phone: '9880033445',
      hide_phone_until_accepted: 0,
      deadline: daysAhead(18),
      created: daysAgo(1),
    },
    {
      employer_id: emp3,
      title: 'Light Commercial Vehicle Delivery Driver',
      category: 'Drivers',
      description: 'Local goods delivery across Mangaluru and Udupi routes using Tata Ace / Dost vehicle. Valid LMV commercial driving licence required.',
      required_skills: 'LMV Driving Licence, Route knowledge, Safe loading',
      workers_required: 2,
      state: 'Karnataka',
      district: 'Dakshina Kannada',
      city: 'Mangaluru',
      area: 'Hampankatta',
      pay_type: 'monthly',
      salary_min: 19000,
      salary_max: 23000,
      salary_display: '₹19,000 - ₹23,000 / month',
      work_type: 'Full-time',
      working_hours: '8:00 AM - 6:30 PM',
      experience_required: '2-5 years',
      contact_name: 'Suresh Shetty',
      contact_phone: '9880033445',
      hide_phone_until_accepted: 0,
      deadline: daysAhead(22),
      created: daysAgo(3),
    },
    {
      employer_id: emp4,
      title: 'Experienced Tailor (Ladies & Uniform Stitching)',
      category: 'Tailoring and Handicrafts',
      description: 'Looking for an experienced sewing machine operator for neat stitching of salwar suits, school uniforms, and blouse alterations. Sewing machines provided.',
      required_skills: 'Juki machine stitching, Cutting measurement, Finishing',
      workers_required: 2,
      state: 'Karnataka',
      district: 'Dharwad',
      city: 'Hubballi',
      area: 'Vidyanagar',
      pay_type: 'monthly',
      salary_min: 14000,
      salary_max: 19000,
      salary_display: '₹14,000 - ₹19,000 / month',
      work_type: 'Full-time',
      working_hours: '10:00 AM - 7:00 PM',
      experience_required: '1-2 years',
      contact_name: 'Anita Kulkarni',
      contact_phone: '9740044556',
      hide_phone_until_accepted: 0,
      deadline: daysAhead(30),
      created: daysAgo(2),
    },
    {
      employer_id: emp5,
      title: 'Mason & Tile Fitting Helper',
      category: 'Construction',
      description: 'Helper and skilled mason needed for ongoing residential flooring and plastering project in Tilakwadi. Weekly wage settlement every Saturday.',
      required_skills: 'Cement mixing, Tile spacing, Level checking',
      workers_required: 4,
      state: 'Karnataka',
      district: 'Belagavi',
      city: 'Belagavi',
      area: 'Tilakwadi',
      pay_type: 'daily',
      salary_min: 700,
      salary_max: 950,
      salary_display: '₹700 - ₹950 / day',
      work_type: 'Contract-based',
      working_hours: '8:30 AM - 5:30 PM',
      experience_required: '1-2 years',
      contact_name: 'Prakash Patil',
      contact_phone: '9901055667',
      hide_phone_until_accepted: 0,
      deadline: daysAhead(12),
      created: daysAgo(4),
    },
    {
      employer_id: emp1,
      title: 'Two-Wheeler Local Parcel Delivery Rider',
      category: 'Delivery and Transportation',
      description: 'Deliver small electrical spare parts to local contractors within 8 km radius of Koramangala and HSR Layout. Fuel allowance provided separately.',
      required_skills: 'Two-wheeler licence, Smartphone maps, Polite communication',
      workers_required: 2,
      state: 'Karnataka',
      district: 'Bengaluru Urban',
      city: 'Bengaluru',
      area: 'Koramangala',
      pay_type: 'monthly',
      salary_min: 16000,
      salary_max: 20000,
      salary_display: '₹16,000 - ₹20,000 / month',
      work_type: 'Full-time',
      working_hours: '9:30 AM - 6:30 PM',
      experience_required: 'Fresher',
      contact_name: 'Ramesh Gowda',
      contact_phone: '9845011223',
      hide_phone_until_accepted: 1,
      deadline: daysAhead(19),
      created: daysAgo(1),
    },
    {
      employer_id: emp2,
      title: 'Part-Time Household Cook & Kitchen Caretaker',
      category: 'Domestic and Household Work',
      description: 'Morning cooking (breakfast and lunch box) for a family of four in Gokulam, Mysuru. Clean kitchen maintenance required.',
      required_skills: 'Vegetarian cooking, Chapati & South Indian meals, Punctuality',
      workers_required: 1,
      state: 'Karnataka',
      district: 'Mysuru',
      city: 'Mysuru',
      area: 'Gokulam',
      pay_type: 'monthly',
      salary_min: 9000,
      salary_max: 11000,
      salary_display: '₹9,000 - ₹11,000 / month',
      work_type: 'Part-time',
      working_hours: '7:00 AM - 10:30 AM',
      experience_required: '1-2 years',
      contact_name: 'Kavitha Rao',
      contact_phone: '9844022334',
      hide_phone_until_accepted: 1,
      deadline: daysAhead(15),
      created: daysAgo(5),
    },
    {
      employer_id: emp5,
      title: 'Apartment Security Guard (Day Shift)',
      category: 'Security and Maintenance',
      description: 'Gate entry log maintenance, visitor verification, and parking supervision for a 32-flat residential apartment block.',
      required_skills: 'Visitor register entry, Alertness, Basic Kannada or Hindi',
      workers_required: 2,
      state: 'Karnataka',
      district: 'Udupi',
      city: 'Udupi',
      area: 'Brahmagiri',
      pay_type: 'monthly',
      salary_min: 14500,
      salary_max: 16500,
      salary_display: '₹14,500 - ₹16,500 / month',
      work_type: 'Full-time',
      working_hours: '8:00 AM - 6:00 PM',
      experience_required: '1-2 years',
      contact_name: 'Prakash Patil',
      contact_phone: '9901055667',
      hide_phone_until_accepted: 0,
      deadline: daysAhead(24),
      created: daysAgo(3),
    },
    {
      employer_id: emp4,
      title: 'Office Assistant & Basic Computer Data Entry',
      category: 'Office Assistant and Data Entry',
      description: 'Maintain daily dispatch bills in Excel, answer customer phone inquiries, and organize paper invoices at our Vidyanagar studio office.',
      required_skills: 'Basic Excel, Typing, Filing & Billing',
      workers_required: 1,
      state: 'Karnataka',
      district: 'Dharwad',
      city: 'Hubballi',
      area: 'Vidyanagar',
      pay_type: 'monthly',
      salary_min: 12500,
      salary_max: 15000,
      salary_display: '₹12,500 - ₹15,000 / month',
      work_type: 'Full-time',
      working_hours: '10:00 AM - 6:30 PM',
      experience_required: 'Fresher',
      contact_name: 'Anita Kulkarni',
      contact_phone: '9740044556',
      hide_phone_until_accepted: 0,
      deadline: daysAhead(21),
      created: daysAgo(2),
    },
    {
      employer_id: emp2,
      title: 'Weekend Catering & Event Setup Crew',
      category: 'Event Workers',
      description: 'Temporary event support staff for weekend wedding and community hall functions—table setup, buffet serving, and post-event clearing.',
      required_skills: 'Serving etiquette, Teamwork, Evening availability',
      workers_required: 6,
      state: 'Karnataka',
      district: 'Shivamogga',
      city: 'Shivamogga',
      area: 'Vinoba Nagar',
      pay_type: 'daily',
      salary_min: 750,
      salary_max: 900,
      salary_display: '₹750 - ₹900 / day',
      work_type: 'Temporary',
      working_hours: '10:00 AM - 8:00 PM (Sat/Sun)',
      experience_required: 'Fresher',
      contact_name: 'Kavitha Rao',
      contact_phone: '9844022334',
      hide_phone_until_accepted: 0,
      deadline: daysAhead(16),
      created: daysAgo(4),
    },
  ];

  const insertJobStmt = db.prepare(`
    INSERT INTO jobs (
      employer_id, title, category, description, required_skills, workers_required,
      state, district, city, area, pay_type, salary_min, salary_max, salary_display,
      work_type, working_hours, experience_required, contact_name, contact_phone,
      hide_phone_until_accepted, application_deadline, status, is_sample, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', 1, ?, ?)
  `);

  const insertedJobIds: number[] = [];
  for (const j of sampleJobs) {
    const r = insertJobStmt.run(
      j.employer_id,
      j.title,
      j.category,
      j.description,
      j.required_skills,
      j.workers_required,
      j.state,
      j.district,
      j.city,
      j.area,
      j.pay_type,
      j.salary_min,
      j.salary_max,
      j.salary_display,
      j.work_type,
      j.working_hours,
      j.experience_required,
      j.contact_name,
      j.contact_phone,
      j.hide_phone_until_accepted,
      j.deadline,
      j.created,
      j.created
    );
    insertedJobIds.push(Number(r.lastInsertRowid));
  }

  // Create 2 sample applications & notifications
  if (insertedJobIds[1] && insertedJobIds[2]) {
    db.prepare(
      `INSERT OR IGNORE INTO applications (job_id, worker_id, cover_note, status, employer_note, created_at, updated_at)
       VALUES (?, ?, ?, 'Pending', '', ?, ?)`
    ).run(
      insertedJobIds[1],
      w1,
      'I live in Jayanagar 4th Block and have 4 years experience in residential wiring and MCB repair.',
      daysAgo(0),
      daysAgo(0)
    );

    db.prepare(
      `INSERT OR IGNORE INTO applications (job_id, worker_id, cover_note, status, employer_note, created_at, updated_at)
       VALUES (?, ?, ?, 'Accepted', 'Please visit our restaurant tomorrow at 8:00 AM.', ?, ?)`
    ).run(
      insertedJobIds[2],
      w2,
      'I have 3 years of South Indian breakfast kitchen experience in Mysuru.',
      daysAgo(1),
      daysAgo(0)
    );

    db.prepare(
      `INSERT INTO notifications (user_id, title, message, link, is_read, created_at)
       VALUES (?, ?, ?, ?, 0, ?)`
    ).run(
      w2,
      'Application Accepted',
      'Your application for "Kitchen Helper & Tiffin Prep Assistant" was accepted by Malnad Spice Kitchen.',
      '/worker/dashboard',
      daysAgo(0)
    );

    db.prepare(
      `INSERT INTO notifications (user_id, title, message, link, is_read, created_at)
       VALUES (?, ?, ?, ?, 0, ?)`
    ).run(
      emp1,
      'New Job Application',
      'Mahesh Kumar applied for "Residential Electrician for Daily Service Visits".',
      '/employer/dashboard',
      daysAgo(0)
    );
  }

  return { inserted: true, counts: { jobs: insertedJobIds.length, users: 7 } };
}

export function clearSampleData(): { deletedJobs: number; deletedUsers: number } {
  const tx = db.transaction(() => {
    const delJobs = db.prepare('DELETE FROM jobs WHERE is_sample = 1').run().changes;
    const delUsers = db.prepare("DELETE FROM users WHERE is_sample = 1 AND role != 'admin'").run().changes;
    return { deletedJobs: delJobs, deletedUsers: delUsers };
  });
  return tx();
}
