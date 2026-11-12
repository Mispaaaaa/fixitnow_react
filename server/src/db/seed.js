import path from 'node:path';
import bcrypt from 'bcrypt';
import sequelize from '../config/db.js';
import { env } from '../config/env.js';
import {
  User,
  TechnicianProfile,
  TechnicianDocument,
  TechnicianSkill,
  TechnicianArea,
  TechnicianAvailability,
  ServiceCategory,
  ServiceRequest,
  RequestPhoto,
  RequestStatusHistory,
  Conversation,
  Message,
  LocationShare,
  Review,
  Notification,
  Announcement,
  SiteContent,
  AuditLog,
} from '../models/index.js';
import { recalculateTechnicianRating } from '../services/rating.service.js';
import { writePlaceholderPng } from '../utils/placeholderImage.js';
import { DEFAULT_CONTENT } from '../utils/defaultContent.js';

const PUBLIC = path.join(env.uploadsDir, 'public');
const PRIVATE = path.join(env.uploadsDir, 'private');

const NOW = Date.now();
const days = (n) => new Date(NOW + n * 24 * 60 * 60 * 1000);
const hours = (n) => new Date(NOW + n * 60 * 60 * 1000);
const minutes = (n) => new Date(NOW + n * 60 * 1000);
const isoDate = (n) => days(n).toISOString().slice(0, 10);

function image(relative, options) {
  const target = path.join(PUBLIC, relative);
  const size = writePlaceholderPng(target, options);
  return { url: `/uploads/${relative.split(path.sep).join('/')}`, size };
}

function docImage(filename, options) {
  const target = path.join(PRIVATE, 'documents', filename);
  const size = writePlaceholderPng(target, options);
  return { filePath: `documents/${filename}`, size };
}

async function createUser({ name, email, passwordHash, role, phone, avatar }) {
  return User.create({
    name,
    email,
    passwordHash,
    role,
    phone,
    avatarUrl: avatar,
    lastActiveAt: minutes(-3),
  });
}

async function main() {
  await sequelize.authenticate();
  await sequelize.sync();

  const existingAdmin = await User.unscoped().findOne({
    where: { email: 'admin@fixitnow.test', role: 'admin' },
  });
  if (existingAdmin) {
    console.log('Database is already seeded. Run `npm run db:reset` then `npm run seed` for a fresh demo.');
    return;
  }

  const [adminHash, customerHash, techHash] = await Promise.all([
    bcrypt.hash('Admin123!', 12),
    bcrypt.hash('Customer123!', 12),
    bcrypt.hash('Tech123!', 12),
  ]);

  // ---- Users and avatars --------------------------------------------------
  const avatar = (slug, colors) => image(`avatars/${slug}.png`, { width: 320, height: 320, ...colors }).url;

  const admin = await createUser({
    name: 'Alex Mercado',
    email: 'admin@fixitnow.test',
    passwordHash: adminHash,
    role: 'admin',
    phone: '+63 917 000 0100',
    avatar: avatar('admin', { from: '#0f172a', to: '#0e7490' }),
  });
  const maria = await createUser({
    name: 'Maria Santos',
    email: 'maria@example.com',
    passwordHash: customerHash,
    role: 'customer',
    phone: '+63 917 111 2233',
    avatar: avatar('maria', { from: '#be185d', to: '#f59e0b' }),
  });
  const juan = await createUser({
    name: 'Juan dela Pena',
    email: 'juan@example.com',
    passwordHash: customerHash,
    role: 'customer',
    phone: '+63 917 222 3344',
    avatar: avatar('juan', { from: '#1d4ed8', to: '#0f766e' }),
  });
  const ana = await createUser({
    name: 'Ana Villanueva',
    email: 'ana@example.com',
    passwordHash: customerHash,
    role: 'customer',
    phone: '+63 917 333 4455',
    avatar: avatar('ana', { from: '#7c3aed', to: '#db2777' }),
  });

  const carlos = await createUser({
    name: 'Carlos Reyes',
    email: 'carlos.tech@example.com',
    passwordHash: techHash,
    role: 'technician',
    phone: '+63 918 444 5566',
    avatar: avatar('carlos', { from: '#065f46', to: '#f59e0b' }),
  });
  const liza = await createUser({
    name: 'Liza Cruz',
    email: 'liza.tech@example.com',
    passwordHash: techHash,
    role: 'technician',
    phone: '+63 918 555 6677',
    avatar: avatar('liza', { from: '#0e7490', to: '#a21caf' }),
  });
  const ben = await createUser({
    name: 'Ben Dela Cruz',
    email: 'ben.tech@example.com',
    passwordHash: techHash,
    role: 'technician',
    phone: '+63 918 666 7788',
    avatar: avatar('ben', { from: '#92400e', to: '#0f766e' }),
  });
  const dave = await createUser({
    name: 'Dave Lim',
    email: 'dave.tech@example.com',
    passwordHash: techHash,
    role: 'technician',
    phone: '+63 918 777 8899',
    avatar: avatar('dave', { from: '#475569', to: '#0284c7' }),
  });
  const rico = await createUser({
    name: 'Rico Bautista',
    email: 'rico.tech@example.com',
    passwordHash: techHash,
    role: 'technician',
    phone: '+63 918 888 9900',
    avatar: avatar('rico', { from: '#7f1d1d', to: '#f97316' }),
  });

  // ---- Categories ---------------------------------------------------------
  const categoryDefs = [
    ['Air Conditioning', 'air-conditioning', 'Cleaning, repair and installation for split and window units.', '❄️', true],
    ['Refrigeration', 'refrigeration', 'Fridges, freezers, chillers and ice makers.', '🧊', true],
    ['Laundry & Washing', 'laundry-washing', 'Washing machines, dryers and laundry equipment.', '🧺', true],
    ['Kitchen Appliances', 'kitchen-appliances', 'Ovens, microwaves, ranges and dishwashers.', '🍳', true],
    ['Electrical & Lighting', 'electrical-lighting', 'Home electrical checks, outlets, fans and lighting.', '💡', true],
    ['Small Appliances', 'small-appliances', 'Vacuum cleaners, blenders, irons and more.', '🔌', false],
  ];
  const categories = await ServiceCategory.bulkCreate(
    categoryDefs.map(([name, slug, description, icon, isPopular], index) => ({
      name,
      slug,
      description,
      icon,
      isPopular,
      sortOrder: index,
      imageUrl: image(`categories/${slug}.png`, {
        width: 480,
        height: 320,
        from: ['#0f766e', '#1d4ed8', '#7c3aed', '#b45309', '#be123c', '#334155'][index],
        to: '#fde68a',
        seed: index + 1,
      }).url,
    }))
  );
  const cat = Object.fromEntries(categories.map((item) => [item.slug, item.id]));

  // ---- Technician profiles ------------------------------------------------
  async function createTechProfile(user, data) {
    const profile = await TechnicianProfile.create({
      userId: user.id,
      bio: data.bio,
      experienceYears: data.experienceYears,
      hourlyRate: data.hourlyRate,
      verificationStatus: data.verificationStatus,
      verificationNote: data.verificationNote || null,
      submittedAt: days(-(data.submittedDaysAgo || 10)),
      verifiedAt: data.verificationStatus === 'verified' ? days(-9) : null,
      verifiedBy: data.verificationStatus === 'verified' ? admin.id : null,
      featured: Boolean(data.featured),
      isAvailable: true,
    });
    await TechnicianSkill.bulkCreate(
      data.skills.map((categoryId) => ({ technicianProfileId: profile.id, categoryId }))
    );
    await TechnicianArea.bulkCreate(
      data.cities.map((city) => ({ technicianProfileId: profile.id, city }))
    );
    await TechnicianAvailability.bulkCreate(
      [1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
        technicianProfileId: profile.id,
        dayOfWeek,
        startTime: '08:00:00',
        endTime: '19:00:00',
        isActive: true,
      }))
    );

    const docTypes = [
      ['government_id', 'government-id.png', '#1e3a8a'],
      ['selfie_id', 'selfie-with-id.png', '#065f46'],
      ['certificate', 'tesda-certificate.png', '#9a3412'],
      ['clearance', 'nbi-clearance.png', '#581c87'],
    ];
    for (const [type, suffix, from] of docTypes) {
      const filename = `${user.id}-${suffix}`;
      const stored = docImage(filename, {
        width: 900,
        height: 620,
        from,
        to: '#f8fafc',
        seed: user.id + type.length,
      });
      await TechnicianDocument.create({
        technicianProfileId: profile.id,
        type,
        filePath: stored.filePath,
        originalName: suffix,
        mimeType: 'image/png',
        sizeBytes: stored.size,
      });
    }
    return profile;
  }

  const carlosProfile = await createTechProfile(carlos, {
    bio: 'Licensed aircon and refrigeration specialist. I handle split-type cleaning, Freon charging and electrical faults with same-day diagnostics.',
    experienceYears: 8,
    hourlyRate: 550,
    verificationStatus: 'verified',
    featured: true,
    skills: [cat['air-conditioning'], cat['electrical-lighting'], cat['refrigeration']],
    cities: ['Manila', 'Quezon City', 'Caloocan'],
  });
  const lizaProfile = await createTechProfile(liza, {
    bio: 'Appliance care specialist focused on laundry and kitchen equipment. Friendly, tidy and happy to explain what went wrong.',
    experienceYears: 6,
    hourlyRate: 480,
    verificationStatus: 'verified',
    featured: true,
    skills: [cat['laundry-washing'], cat['kitchen-appliances'], cat['small-appliances']],
    cities: ['Makati', 'Pasig', 'Taguig'],
  });
  const benProfile = await createTechProfile(ben, {
    bio: 'Ten years in commercial and home refrigeration. Quick with compressor diagnostics, gaskets and control boards.',
    experienceYears: 10,
    hourlyRate: 500,
    verificationStatus: 'verified',
    featured: false,
    skills: [cat['refrigeration'], cat['air-conditioning']],
    cities: ['Manila', 'Pasig', 'Quezon City'],
  });
  await createTechProfile(dave, {
    bio: 'Small appliance and electrical technician building my client base in Taguig.',
    experienceYears: 3,
    hourlyRate: 400,
    verificationStatus: 'pending',
    skills: [cat['small-appliances'], cat['electrical-lighting']],
    cities: ['Taguig'],
    submittedDaysAgo: 1,
  });
  await createTechProfile(rico, {
    bio: 'Aircon technician serving Quezon City and nearby areas.',
    experienceYears: 2,
    hourlyRate: 450,
    verificationStatus: 'rejected',
    verificationNote: 'The government ID photo is too blurry to read. Please resubmit a clear photo plus your TESDA certificate.',
    skills: [cat['air-conditioning']],
    cities: ['Quezon City'],
    submittedDaysAgo: 4,
  });

  // ---- Saved addresses ----------------------------------------------------
  const { SavedAddress } = await import('../models/index.js');
  await SavedAddress.bulkCreate([
    { userId: maria.id, label: 'Home', address: '12 Mabini Street, Barangay 669', city: 'Manila', lat: 14.5995, lng: 120.9842, isDefault: true },
    { userId: juan.id, label: 'Condo', address: '45 Aguirre Avenue, BF Homes', city: 'Parañaque', lat: 14.4793, lng: 121.0198, isDefault: true },
    { userId: ana.id, label: 'House', address: '78 Shaw Boulevard, Kapitolyo', city: 'Pasig', lat: 14.5704, lng: 121.0633, isDefault: true },
  ]);

  // ---- Service requests ---------------------------------------------------
  const requestDefs = [
    {
      key: 'completedAC',
      customerId: maria.id,
      technicianId: carlos.id,
      categoryId: cat['air-conditioning'],
      applianceBrand: 'Daikin',
      applianceModel: 'FTKC35UV2M',
      issueDescription: 'Aircon is not cooling well and there is a rattling noise when the compressor starts.',
      urgency: 'normal',
      preferredDate: isoDate(-5),
      timeSlot: '10:00-12:00',
      address: '12 Mabini Street, Barangay 669',
      city: 'Manila',
      lat: 14.5995,
      lng: 120.9842,
      status: 'completed',
      diagnosisNotes: 'Condenser coils were heavily soiled and the run capacitor was failing. Cleaned the unit and replaced the capacitor.',
      partsUsed: [
        { name: 'Run capacitor 35uF', qty: 1, cost: 450 },
        { name: 'R410a refrigerant top-up', qty: 1, cost: 1200 },
      ],
      finalCost: 2550,
      acceptedAt: days(-6),
      completedAt: days(-5),
      photos: [['ac-unit', '#0e7490'], ['ac-filter', '#155e75']],
      history: [
        ['pending', null, -7, 'Request submitted'],
        ['accepted', null, -6, 'Carlos accepted the job'],
        ['on_the_way', null, -5, 'Technician is on the way'],
        ['arrived', null, -5, 'Technician arrived'],
        ['in_progress', null, -5, 'Diagnosis started'],
        ['completed', null, -5, 'Repair completed'],
      ],
    },
    {
      key: 'completedFridge',
      customerId: ana.id,
      technicianId: carlos.id,
      categoryId: cat['refrigeration'],
      applianceBrand: 'Panasonic',
      applianceModel: 'NR-BL320PS',
      issueDescription: 'Freezer works but the lower fridge compartment is warm. Possible door seal issue.',
      urgency: 'low',
      preferredDate: isoDate(-14),
      timeSlot: '13:00-15:00',
      address: '78 Shaw Boulevard, Kapitolyo',
      city: 'Pasig',
      lat: 14.5704,
      lng: 121.0633,
      status: 'completed',
      diagnosisNotes: 'Door gasket lost its seal. Replaced lower gasket and adjusted hinges.',
      partsUsed: [{ name: 'Lower door gasket', qty: 1, cost: 1100 }],
      finalCost: 1800,
      acceptedAt: days(-15),
      completedAt: days(-14),
      photos: [['fridge-door', '#1d4ed8']],
      history: [
        ['pending', null, -16, 'Request submitted'],
        ['accepted', null, -15, 'Carlos accepted the job'],
        ['on_the_way', null, -14, null],
        ['arrived', null, -14, null],
        ['in_progress', null, -14, null],
        ['completed', null, -14, 'Gasket replaced'],
      ],
    },
    {
      key: 'acceptedKitchen',
      customerId: maria.id,
      technicianId: liza.id,
      categoryId: cat['kitchen-appliances'],
      applianceBrand: 'Fujidenzo',
      applianceModel: 'MO-20GS',
      issueDescription: 'Microwave stops heating after 20 seconds and the turntable does not rotate.',
      urgency: 'normal',
      preferredDate: isoDate(1),
      timeSlot: '10:00-12:00',
      address: '12 Mabini Street, Barangay 669',
      city: 'Manila',
      lat: 14.5995,
      lng: 120.9842,
      status: 'accepted',
      acceptedAt: hours(-2),
      photos: [['microwave', '#b45309']],
      history: [
        ['pending', null, -1, 'Request submitted'],
        ['accepted', null, 0, 'Liza accepted the job'],
      ],
    },
    {
      key: 'inProgressLaundry',
      customerId: juan.id,
      technicianId: liza.id,
      categoryId: cat['laundry-washing'],
      applianceBrand: 'LG',
      applianceModel: 'FC1200S4W',
      issueDescription: 'Front-load washing machine shakes violently during spin and leaks from the bottom.',
      urgency: 'high',
      preferredDate: isoDate(0),
      timeSlot: '15:00-17:00',
      address: '45 Aguirre Avenue, BF Homes',
      city: 'Parañaque',
      lat: 14.4793,
      lng: 121.0198,
      status: 'in_progress',
      diagnosisNotes: 'Shock absorbers are worn and the door boot has a small tear.',
      acceptedAt: days(-2),
      photos: [['washer', '#7c3aed']],
      history: [
        ['pending', null, -3, 'Request submitted'],
        ['accepted', null, -2, 'Liza accepted the job'],
        ['on_the_way', null, 0, null],
        ['arrived', null, 0, 'Arrived at the unit'],
        ['in_progress', null, 0, 'Testing the spin cycle'],
      ],
    },
    {
      key: 'onTheWayFridge',
      customerId: juan.id,
      technicianId: ben.id,
      categoryId: cat['refrigeration'],
      applianceBrand: 'Samsung',
      applianceModel: 'RT28K3082S8',
      issueDescription: 'Fridge is making a loud clicking sound and does not get cold. Need urgent help before groceries spoil.',
      urgency: 'emergency',
      preferredDate: isoDate(0),
      timeSlot: '13:00-15:00',
      address: '45 Aguirre Avenue, BF Homes',
      city: 'Parañaque',
      lat: 14.4793,
      lng: 121.0198,
      status: 'on_the_way',
      acceptedAt: hours(-4),
      photos: [['fridge', '#0f766e']],
      history: [
        ['pending', null, -1, 'Request submitted'],
        ['accepted', null, 0, 'Ben accepted the job'],
        ['on_the_way', null, 0, 'Ben is on the way with a replacement relay'],
      ],
    },
    {
      key: 'pendingOpen',
      customerId: ana.id,
      technicianId: null,
      categoryId: cat['air-conditioning'],
      applianceBrand: 'Carrier',
      applianceModel: 'Window 1.5HP',
      issueDescription: 'Window aircon trips the breaker every time it is switched on.',
      urgency: 'high',
      preferredDate: isoDate(2),
      timeSlot: '08:00-10:00',
      address: '78 Shaw Boulevard, Kapitolyo',
      city: 'Pasig',
      lat: 14.5704,
      lng: 121.0633,
      status: 'pending',
      photos: [['window-ac', '#0369a1']],
      history: [['pending', null, -1, 'Request submitted and open to verified technicians']],
    },
    {
      key: 'cancelledElectrical',
      customerId: juan.id,
      technicianId: ben.id,
      categoryId: cat['electrical-lighting'],
      applianceBrand: null,
      applianceModel: null,
      issueDescription: 'Two outlets in the living room spark when a plug is inserted.',
      urgency: 'high',
      preferredDate: isoDate(-3),
      timeSlot: '17:00-19:00',
      address: '45 Aguirre Avenue, BF Homes',
      city: 'Parañaque',
      lat: 14.4793,
      lng: 121.0198,
      status: 'cancelled',
      cancellationReason: 'A family friend fixed the outlet before the visit.',
      cancelledBy: juan.id,
      acceptedAt: days(-4),
      history: [
        ['pending', null, -5, 'Request submitted'],
        ['accepted', null, -4, 'Ben accepted the job'],
        ['cancelled', null, -3, 'Customer cancelled before work started'],
      ],
    },
    {
      key: 'completedElectrical',
      customerId: juan.id,
      technicianId: ben.id,
      categoryId: cat['electrical-lighting'],
      applianceBrand: null,
      applianceModel: null,
      issueDescription: 'Kitchen outlet stopped working and the breaker keeps tripping.',
      urgency: 'normal',
      preferredDate: isoDate(-20),
      timeSlot: '13:00-15:00',
      address: '45 Aguirre Avenue, BF Homes',
      city: 'Parañaque',
      lat: 14.4793,
      lng: 121.0198,
      status: 'completed',
      diagnosisNotes: 'Loose neutral connection in the outlet and a weak breaker. Replaced both.',
      partsUsed: [{ name: '20A breaker', qty: 1, cost: 380 }],
      finalCost: 950,
      acceptedAt: days(-21),
      completedAt: days(-20),
      history: [
        ['pending', null, -22, 'Request submitted'],
        ['accepted', null, -21, 'Ben accepted the job'],
        ['on_the_way', null, -20, null],
        ['arrived', null, -20, null],
        ['in_progress', null, -20, null],
        ['completed', null, -20, 'Outlet and breaker replaced'],
      ],
    },
    {
      key: 'pendingSmall',
      customerId: maria.id,
      technicianId: null,
      categoryId: cat['small-appliances'],
      applianceBrand: 'Philips',
      applianceModel: 'HD9252',
      issueDescription: 'Air fryer powers on but the fan does not spin and it smells like burning plastic.',
      urgency: 'low',
      preferredDate: isoDate(3),
      timeSlot: '13:00-15:00',
      address: '12 Mabini Street, Barangay 669',
      city: 'Manila',
      lat: 14.5995,
      lng: 120.9842,
      status: 'pending',
      history: [['pending', null, 0, 'Request submitted']],
    },
  ];

  const requests = {};
  let photoCounter = 0;
  for (const def of requestDefs) {
    const request = await ServiceRequest.create({
      customerId: def.customerId,
      technicianId: def.technicianId,
      categoryId: def.categoryId,
      applianceBrand: def.applianceBrand,
      applianceModel: def.applianceModel,
      issueDescription: def.issueDescription,
      urgency: def.urgency,
      preferredDate: def.preferredDate,
      timeSlot: def.timeSlot,
      address: def.address,
      city: def.city,
      lat: def.lat,
      lng: def.lng,
      status: def.status,
      diagnosisNotes: def.diagnosisNotes || null,
      partsUsed: def.partsUsed || [],
      finalCost: def.finalCost || null,
      cancellationReason: def.cancellationReason || null,
      cancelledBy: def.cancelledBy || null,
      acceptedAt: def.acceptedAt || null,
      completedAt: def.completedAt || null,
    });
    requests[def.key] = request;

    if (def.photos) {
      for (const [name, from] of def.photos) {
        photoCounter += 1;
        const stored = image(`requests/seed-request-${photoCounter}.png`, {
          width: 900,
          height: 640,
          from,
          to: '#f8fafc',
          seed: photoCounter,
        });
        await RequestPhoto.create({
          requestId: request.id,
          filePath: stored.url.replace('/uploads/', ''),
          originalName: `${name}.png`,
          sortOrder: photoCounter,
        });
      }
    }

    const actorFor = (status) => {
      if (status === 'pending') return def.customerId;
      if (status === 'cancelled') return def.cancelledBy || def.customerId;
      return def.technicianId;
    };
    for (const [status, , offset, note] of def.history) {
      await RequestStatusHistory.create({
        requestId: request.id,
        status,
        note,
        changedBy: actorFor(status),
        createdAt: days(offset),
        updatedAt: days(offset),
      });
    }
  }

  // ---- Conversations, messages and live location --------------------------
  async function createConversation({ request = null, customerId, technicianId, entries, location }) {
    const conversation = await Conversation.create({
      requestId: request?.id || null,
      customerId,
      technicianId,
      lastMessageAt: entries.length ? entries[entries.length - 1].at : null,
    });

    let share = null;
    if (location) {
      share = await LocationShare.create({
        conversationId: conversation.id,
        requestId: request?.id || null,
        userId: technicianId,
        lat: location.lat,
        lng: location.lng,
        mode: 'live',
        expiresAt: hours(1),
      });
    }

    let lastMessage = null;
    for (const entry of entries) {
      const isLocation = entry.type === 'location';
      lastMessage = await Message.create({
        conversationId: conversation.id,
        senderId: entry.from === 'customer' ? customerId : technicianId,
        type: isLocation ? 'location' : 'text',
        body: isLocation ? null : entry.body,
        locationShareId: isLocation ? share?.id : null,
        deliveredAt: entry.at,
        seenAt: entry.seen ? entry.at : null,
        createdAt: entry.at,
        updatedAt: entry.at,
      });
    }
    if (lastMessage) {
      await conversation.update({ lastMessageAt: lastMessage.createdAt });
    }
    return { conversation, share };
  }

  const acConversation = await createConversation({
    request: requests.completedAC,
    customerId: maria.id,
    technicianId: carlos.id,
    entries: [
      { from: 'customer', body: 'Hi Carlos, the aircon rattles mostly at night. Is that urgent?', at: days(-6), seen: true },
      { from: 'technician', body: 'Not dangerous, but let us check it before it damages the compressor. I am free tomorrow morning.', at: days(-6), seen: true },
      { from: 'customer', body: 'Tomorrow 10 AM works, thank you!', at: days(-6), seen: true },
      { from: 'technician', body: 'Job done! I replaced the capacitor and cleaned the coils. Please keep the remote in cool mode for 24 hours.', at: days(-5), seen: true },
      { from: 'customer', body: 'It is freezing again. Thank you so much!', at: days(-5), seen: true },
    ],
  });

  const fridgeConversation = await createConversation({
    request: requests.completedFridge,
    customerId: ana.id,
    technicianId: carlos.id,
    entries: [
      { from: 'customer', body: 'The lower shelf is warm but the freezer is fine. Does it need a new fridge?', at: days(-15), seen: true },
      { from: 'technician', body: 'Probably just the gasket. I can drop by tomorrow afternoon.', at: days(-15), seen: true },
      { from: 'technician', body: 'Replaced the gasket and adjusted the hinges. It should hold temperature now.', at: days(-14), seen: true },
      { from: 'customer', body: 'Working great, thank you!', at: days(-14), seen: true },
    ],
  });

  await createConversation({
    request: requests.acceptedKitchen,
    customerId: maria.id,
    technicianId: liza.id,
    entries: [
      { from: 'customer', body: 'Hello Liza! The microwave is the Fujidenzo one from the request photos.', at: hours(-3), seen: true },
      { from: 'technician', body: 'Got it. Sounds like the turntable motor or a door switch. I will bring both just in case.', at: hours(-2.5), seen: true },
      { from: 'customer', body: 'Perfect, see you tomorrow.', at: hours(-2), seen: false },
    ],
  });

  await createConversation({
    request: requests.inProgressLaundry,
    customerId: juan.id,
    technicianId: liza.id,
    entries: [
      { from: 'technician', body: 'Hi Juan, I am at the lobby. Is the unit on the 6th floor?', at: minutes(-70), seen: true },
      { from: 'customer', body: 'Yes, unit 6B. I will leave the door open.', at: minutes(-65), seen: true },
      { from: 'technician', body: 'Found the problem - worn shock absorbers and a torn door boot. I have replacements in the van.', at: minutes(-25), seen: false },
    ],
  });

  const liveConversation = await createConversation({
    request: requests.onTheWayFridge,
    customerId: juan.id,
    technicianId: ben.id,
    entries: [
      { from: 'customer', body: 'Ben, the clicking is getting louder. Please hurry.', at: minutes(-40), seen: true },
      { from: 'technician', body: 'I am 15 minutes away. Bringing a start relay and capacitor.', at: minutes(-30), seen: true },
      { from: 'technician', type: 'location', at: minutes(-4), seen: false },
    ],
    location: { lat: 14.4928, lng: 121.0321 },
  });

  await createConversation({
    request: null,
    customerId: ana.id,
    technicianId: carlos.id,
    entries: [
      { from: 'customer', body: 'Hi Carlos, do you service commercial chiller units in Pasig?', at: days(-2.2), seen: true },
      { from: 'technician', body: 'Yes, small to medium chillers. Send the model plate photo and I can estimate.', at: days(-2.1), seen: true },
      { from: 'customer', body: 'Will do, thanks!', at: days(-2), seen: true },
    ],
  });

  // ---- Reviews ------------------------------------------------------------
  const review1 = await Review.create({
    requestId: requests.completedAC.id,
    customerId: maria.id,
    technicianId: carlos.id,
    rating: 5,
    comment: 'Carlos arrived on time, explained the issue clearly and left the area spotless. The aircon is colder than ever.',
    tags: ['On time', 'Professional', 'Clean work'],
    repliedAt: days(-4),
    reply: 'Thank you Maria! Glad the unit is running well again.',
  });
  const review2 = await Review.create({
    requestId: requests.completedFridge.id,
    customerId: ana.id,
    technicianId: carlos.id,
    rating: 4,
    comment: 'Good work and fair price. Took a little longer than expected but the fridge is fixed.',
    tags: ['Fair price', 'On time'],
    repliedAt: days(-13),
    reply: 'Appreciate the feedback Ana. The gasket replacement needed extra drying time.',
  });
  const hiddenReview = await Review.create({
    requestId: requests.completedElectrical.id,
    customerId: juan.id,
    technicianId: ben.id,
    rating: 4,
    comment: 'Fixed the outlet but left some packaging behind.',
    tags: ['Professional'],
    isHidden: true,
    hiddenNote: 'Seeded example: hidden after a moderation review.',
    hiddenBy: admin.id,
    hiddenAt: days(-19),
  });
  await recalculateTechnicianRating(carlos.id);
  await recalculateTechnicianRating(ben.id);

  // ---- Notifications ------------------------------------------------------
  await Notification.bulkCreate([
    { userId: admin.id, type: 'verification_submitted', title: 'New verification request', body: 'Dave Lim submitted documents for review.', data: { url: '/admin/verification' }, createdAt: days(-1), updatedAt: days(-1) },
    { userId: admin.id, type: 'system', title: 'Welcome to FixitNow admin', body: 'Use the dashboard to monitor requests and verify technicians.', readAt: days(-9), data: { url: '/admin' }, createdAt: days(-10), updatedAt: days(-10) },
    { userId: maria.id, type: 'request_accepted', title: 'Carlos accepted your request', body: 'Your aircon repair is scheduled for tomorrow.', data: { requestId: requests.completedAC.id, url: `/requests/${requests.completedAC.id}` }, readAt: days(-5), createdAt: days(-6), updatedAt: days(-6) },
    { userId: maria.id, type: 'chat_message', title: 'New message from Liza Cruz', body: 'Got it. Sounds like the turntable motor or a door switch.', data: { conversationId: 2, url: '/messages' }, createdAt: hours(-2.5), updatedAt: hours(-2.5) },
    { userId: juan.id, type: 'status_changed', title: 'Your fridge technician is on the way', body: 'Ben is heading to your address now.', data: { requestId: requests.onTheWayFridge.id, url: `/requests/${requests.onTheWayFridge.id}` }, createdAt: minutes(-20), updatedAt: minutes(-20) },
    { userId: carlos.id, type: 'new_review', title: 'Maria left you a 5-star review', body: '"Carlos arrived on time and left the area spotless."', data: { reviewId: review1.id, url: '/technician/reviews' }, createdAt: days(-5), updatedAt: days(-5) },
    { userId: carlos.id, type: 'new_review', title: 'Ana left you a review', body: 'You received 4 stars for a completed job.', data: { reviewId: review2.id, url: '/technician/reviews' }, readAt: days(-14), createdAt: days(-14), updatedAt: days(-14) },
    { userId: liza.id, type: 'job_reminder', title: 'Job starts in about an hour', body: 'Washing machine repair at BF Homes today.', data: { requestId: requests.inProgressLaundry.id, url: '/technician' }, createdAt: minutes(-70), updatedAt: minutes(-70) },
  ]);

  // ---- Announcements and editable content --------------------------------
  await Announcement.bulkCreate([
    {
      role: 'customer',
      title: 'Track your repair live',
      text: 'While your technician is on the way, open the request page to see the live map and share your exact pin.',
      style: 'info',
      startsAt: days(-2),
      endsAt: days(20),
      isActive: true,
      createdBy: admin.id,
    },
    {
      role: 'technician',
      title: 'Keep your availability fresh',
      text: 'Update your weekly availability before accepting weekend jobs so customers see accurate slots.',
      style: 'warning',
      startsAt: days(-1),
      isActive: true,
      createdBy: admin.id,
    },
    {
      role: 'all',
      title: 'Verified-only directory',
      text: 'Every technician in the public directory has passed identity and skills verification.',
      style: 'success',
      startsAt: days(-9),
      isActive: true,
      createdBy: admin.id,
    },
  ]);

  await SiteContent.bulkCreate(
    Object.entries(DEFAULT_CONTENT).map(([key, blocks]) => ({
      key,
      blocks,
      updatedBy: admin.id,
    }))
  );

  // ---- Audit trail --------------------------------------------------------
  await AuditLog.bulkCreate([
    { actorId: admin.id, action: 'technician.verification.approved', entityType: 'TechnicianProfile', entityId: carlosProfile.id, before: { verificationStatus: 'pending' }, after: { verificationStatus: 'verified' }, ip: '127.0.0.1', createdAt: days(-9), updatedAt: days(-9) },
    { actorId: admin.id, action: 'technician.verification.approved', entityType: 'TechnicianProfile', entityId: lizaProfile.id, before: { verificationStatus: 'pending' }, after: { verificationStatus: 'verified' }, ip: '127.0.0.1', createdAt: days(-9), updatedAt: days(-9) },
    { actorId: admin.id, action: 'technician.verification.approved', entityType: 'TechnicianProfile', entityId: benProfile.id, before: { verificationStatus: 'pending' }, after: { verificationStatus: 'verified' }, ip: '127.0.0.1', createdAt: days(-8), updatedAt: days(-8) },
    { actorId: admin.id, action: 'review.hidden', entityType: 'Review', entityId: hiddenReview.id, before: { isHidden: false }, after: { isHidden: true, hiddenNote: 'Seeded example: hidden after a moderation review.' }, ip: '127.0.0.1', createdAt: days(-19), updatedAt: days(-19) },
    { actorId: admin.id, action: 'site_content.updated', entityType: 'SiteContent', entityId: null, before: null, after: { key: 'landing' }, ip: '127.0.0.1', createdAt: days(-9), updatedAt: days(-9) },
  ]);

  void acConversation;
  void fridgeConversation;
  void liveConversation;

  console.log('\nSeed complete. Demo accounts:');
  console.table([
    { role: 'admin', email: 'admin@fixitnow.test', password: 'Admin123!' },
    { role: 'customer', email: 'maria@example.com', password: 'Customer123!' },
    { role: 'customer', email: 'juan@example.com', password: 'Customer123!' },
    { role: 'customer', email: 'ana@example.com', password: 'Customer123!' },
    { role: 'technician (verified)', email: 'carlos.tech@example.com', password: 'Tech123!' },
    { role: 'technician (verified)', email: 'liza.tech@example.com', password: 'Tech123!' },
    { role: 'technician (verified)', email: 'ben.tech@example.com', password: 'Tech123!' },
    { role: 'technician (pending)', email: 'dave.tech@example.com', password: 'Tech123!' },
    { role: 'technician (rejected)', email: 'rico.tech@example.com', password: 'Tech123!' },
  ]);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });