// server.js - Full Backend API for Raasta Road Alert Platform
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { connectDB, getDB } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'raasta_belagavi_secret_key_2026';
const DATA_FILE = path.join(__dirname, 'data', 'raasta_db.json');

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Default Initial Seed Data for Belagavi (Belgaum), Karnataka, India
const DEFAULT_CITY = {
  id: 'belagavi',
  name: 'Belagavi (Belgaum)',
  state: 'Karnataka',
  country: 'India',
  lat: 15.8497,
  lng: 74.4977,
  zoom: 13,
  boundaryName: 'Belagavi City Corporation (BCC)'
};

const SEED_INCIDENTS = [
  {
    id: 'inc-bgm-001',
    title: 'Bridge Repair & Resurfacing',
    category: 'roadblock',
    categoryLabel: 'Roadblock & Closure',
    roadName: 'Congress Road Railway Overbridge',
    landmark: 'Near 3rd Railway Gate, Tilakwadi',
    description: 'Complete closure of northbound carriageway due to joint slab replacement and resurfacing by BCC & Railways. Heavy vehicles diverted via 2nd Gate.',
    severity: 'critical', // critical, moderate, minor
    verificationStatus: 'Officially Confirmed', // Pending Review, Community Reported, Under Review, Verified, Officially Confirmed, Resolved, Rejected
    lat: 15.8365,
    lng: 74.5082,
    reportedBy: 'Belagavi Traffic Police Notice #2026/04',
    reportedRole: 'official',
    reportedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    expectedEndTime: 'Tomorrow, 08:00 PM',
    confirmations: {
      confirm: 48,
      stillHappening: 35,
      resolved: 2,
      inaccurate: 0
    },
    voters: ['user_demo_1', 'user_demo_2'],
    isDemo: true,
    officialSource: 'Belagavi Traffic Police Advisory Dept',
    status: 'active',
    history: [
      { timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), action: 'Reported by Belagavi Traffic Police', note: 'Notice issued for bridge expansion joint fix' },
      { timestamp: new Date(Date.now() - 3600000 * 1).toISOString(), action: 'Verified & Confirmed', note: 'Barricades deployed and signages active' }
    ]
  },
  {
    id: 'inc-bgm-002',
    title: 'Water Pipeline Trenching & Road Dug Up',
    category: 'maintenance',
    categoryLabel: 'Maintenance & Work',
    roadName: 'Khanapur Road (Near RPD Cross)',
    landmark: 'Between RPD College & Goaves circle',
    description: 'KUWSDB 24x7 drinking water supply pipeline replacement work underway. Single-lane slow movement, loose gravel and dust present.',
    severity: 'moderate',
    verificationStatus: 'Verified',
    lat: 15.8398,
    lng: 74.5021,
    reportedBy: 'Kiran Patil (Local Resident)',
    reportedRole: 'citizen',
    reportedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    expectedEndTime: 'In 3 days',
    confirmations: {
      confirm: 32,
      stillHappening: 29,
      resolved: 1,
      inaccurate: 1
    },
    voters: ['user_demo_3'],
    isDemo: true,
    officialSource: 'KUWSDB Project Engineer Notification',
    status: 'active',
    history: [
      { timestamp: new Date(Date.now() - 3600000 * 12).toISOString(), action: 'Submitted by Community', note: 'Citizen reported deep trenching' },
      { timestamp: new Date(Date.now() - 3600000 * 6).toISOString(), action: 'Moderator Approved', note: 'Site inspection confirmed by community ward monitor' }
    ]
  },
  {
    id: 'inc-bgm-003',
    title: 'Severe Deep Pothole Cluster after Rain',
    category: 'pothole',
    categoryLabel: 'Pothole & Damaged Road',
    roadName: 'Mandoli Road',
    landmark: 'Ahead of Peeranwadi cross, near bridge',
    description: 'Cluster of deep crater-like potholes across both lanes. Risk of bike slippage and axle damage. Two-wheelers advised to take extreme caution.',
    severity: 'moderate',
    verificationStatus: 'Community Reported',
    lat: 15.8285,
    lng: 74.4754,
    reportedBy: 'Ramesh K. (Delivery Partner)',
    reportedRole: 'commuter',
    reportedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    expectedEndTime: 'Awaiting repair team',
    confirmations: {
      confirm: 19,
      stillHappening: 17,
      resolved: 0,
      inaccurate: 0
    },
    voters: [],
    isDemo: true,
    status: 'active',
    history: [
      { timestamp: new Date(Date.now() - 3600000 * 6).toISOString(), action: 'Community Report logged', note: 'Multiple riders flagged suspension damage risk' }
    ]
  },
  {
    id: 'inc-bgm-004',
    title: 'One-Way Traffic Diversion (Flyover Beam Work)',
    category: 'diversion',
    categoryLabel: 'Diversion & Traffic Change',
    roadName: 'College Road to Rani Chennamma Circle',
    landmark: 'Chennamma Circle junction approach',
    description: 'Southbound traffic towards Bogarves diverted via Club Road and Ramdev Galli due to crane positioning for overhead illumination maintenance.',
    severity: 'moderate',
    verificationStatus: 'Verified',
    lat: 15.8596,
    lng: 74.5098,
    reportedBy: 'North Zone Traffic Cell',
    reportedRole: 'official',
    reportedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
    expectedEndTime: 'Tonight 11:30 PM',
    confirmations: {
      confirm: 24,
      stillHappening: 20,
      resolved: 3,
      inaccurate: 0
    },
    voters: [],
    isDemo: true,
    officialSource: 'BCC Road Maintenance Wing',
    status: 'active',
    history: [
      { timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), action: 'Diversion active', note: 'Signboards placed at Bogarves cross' }
    ]
  },
  {
    id: 'inc-bgm-005',
    title: 'Stormwater Drain Overflow & Waterlogging',
    category: 'flooding',
    categoryLabel: 'Flooding & Waterlogging',
    roadName: 'Sambra Airport Road (Old PB Road Cross)',
    landmark: 'Near Gandhi Nagar underpass',
    description: 'Underpass flooded with 1.5 ft water after thunderstorm. Sedans and compact cars stalled. Traffic diverted via Kanbargi bypass.',
    severity: 'critical',
    verificationStatus: 'Officially Confirmed',
    lat: 15.8712,
    lng: 74.5421,
    reportedBy: 'Disaster Management Cell Belagavi',
    reportedRole: 'official',
    reportedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    expectedEndTime: 'Pumps active; water receding',
    confirmations: {
      confirm: 41,
      stillHappening: 38,
      resolved: 5,
      inaccurate: 0
    },
    voters: [],
    isDemo: true,
    officialSource: 'Belagavi District Emergency Operations',
    status: 'active',
    history: [
      { timestamp: new Date(Date.now() - 3600000 * 3).toISOString(), action: 'Flooding recorded', note: 'Emergency pump dispatched' }
    ]
  },
  {
    id: 'inc-bgm-006',
    title: 'Tar Asphalt Resurfacing Completed',
    category: 'maintenance',
    categoryLabel: 'Maintenance & Work',
    roadName: 'Shukrawar Peth Road',
    landmark: 'Near Central Bus Stand (CBT)',
    description: 'Asphalt layering completed and lanes reopened to standard two-way traffic.',
    severity: 'minor',
    verificationStatus: 'Resolved',
    lat: 15.8542,
    lng: 74.5145,
    reportedBy: 'Belagavi Ward 14 Engineer',
    reportedRole: 'official',
    reportedAt: new Date(Date.now() - 3600000 * 28).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    expectedEndTime: 'Completed',
    confirmations: {
      confirm: 15,
      stillHappening: 1,
      resolved: 22,
      inaccurate: 0
    },
    voters: [],
    isDemo: true,
    status: 'resolved',
    history: [
      { timestamp: new Date(Date.now() - 3600000 * 28).toISOString(), action: 'Work started', note: 'Road resurfacing' },
      { timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), action: 'Marked Resolved', note: 'Lane reopened fully' }
    ]
  },
  {
    id: 'inc-bgm-007',
    title: 'Traffic Signal Re-synchronization Cleared',
    category: 'diversion',
    categoryLabel: 'Diversion & Traffic Change',
    roadName: 'Bogarves to Camp Road Junction',
    landmark: 'Near Kolhapur Circle',
    description: 'Temporary traffic diversion lifted following smart traffic signal controller installation.',
    severity: 'minor',
    verificationStatus: 'Resolved',
    lat: 15.8512,
    lng: 74.5020,
    reportedBy: 'Belagavi Smart City Traffic Wing',
    reportedRole: 'official',
    reportedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    expectedEndTime: 'Resolved & Active Flow',
    confirmations: {
      confirm: 12,
      stillHappening: 0,
      resolved: 19,
      inaccurate: 0
    },
    voters: [],
    isDemo: true,
    status: 'resolved',
    history: [
      { timestamp: new Date(Date.now() - 3600000 * 18).toISOString(), action: 'Controller update', note: 'Diversion initiated' },
      { timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), action: 'Resolved', note: 'Signals online' }
    ]
  }
];

// In-Memory Database with JSON File Persistence
function initDatabase() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const content = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(content);
    } catch (e) {
      console.error('Error reading DB, re-initializing:', e);
    }
  }

  const initialDB = {
    cityConfig: DEFAULT_CITY,
    users: [
      {
        id: 'user_admin_001',
        name: 'Chief Moderator',
        email: 'admin@raasta.in',
        passwordHash: bcrypt.hashSync('admin123', 8),
        role: 'admin',
        createdAt: new Date().toISOString(),
        settings: {
          emailAlerts: true,
          browserPush: true,
          categories: ['roadblock', 'maintenance', 'pothole', 'diversion', 'flooding'],
          minSeverity: 'all'
        },
        savedPlaces: [
          { id: 'sp-1', label: 'Office (BCC HQ)', address: 'Belagavi City Corporation, Subhash Nagar', lat: 15.8562, lng: 74.5091 },
          { id: 'sp-2', label: 'Home (Tilakwadi)', address: 'Tilakwadi 2nd Gate, Belagavi', lat: 15.8341, lng: 74.5056 }
        ],
        savedRoutes: [
          {
            id: 'rt-1',
            title: 'Daily Commute: Tilakwadi to Central Office',
            originLabel: 'Tilakwadi 2nd Gate',
            originCoords: [15.8341, 74.5056],
            destLabel: 'BCC HQ (Subhash Nagar)',
            destCoords: [15.8562, 74.5091],
            isFavorite: true,
            notify: true,
            typicalDuration: '14 mins',
            distanceKm: '4.2 km'
          }
        ]
      },
      {
        id: 'user_demo_101',
        name: 'Rahul Deshmukh',
        email: 'rahul@example.com',
        passwordHash: bcrypt.hashSync('raasta2026', 8),
        role: 'user',
        createdAt: new Date().toISOString(),
        settings: {
          emailAlerts: true,
          browserPush: true,
          categories: ['roadblock', 'maintenance', 'flooding'],
          minSeverity: 'moderate'
        },
        savedPlaces: [
          { id: 'sp-101', label: 'Home', address: 'Bhagya Nagar, Belagavi', lat: 15.8302, lng: 74.5123 },
          { id: 'sp-102', label: 'College', address: 'KLE Tech / VTU Campus, Belagavi', lat: 15.8891, lng: 74.5367 }
        ],
        savedRoutes: [
          {
            id: 'rt-101',
            title: 'College Route: Bhagya Nagar to VTU',
            originLabel: 'Bhagya Nagar',
            originCoords: [15.8302, 74.5123],
            destLabel: 'VTU Campus (Machhe/Santi Bastwad)',
            destCoords: [15.8891, 74.5367],
            isFavorite: true,
            notify: true,
            typicalDuration: '22 mins',
            distanceKm: '8.7 km'
          }
        ]
      }
    ],
    incidents: SEED_INCIDENTS,
    notifications: [
      {
        id: 'notif-1',
        userId: 'user_demo_101',
        title: 'Roadblock Alert on your saved route',
        message: 'Congress Road Railway Overbridge has closure on northbound lanes.',
        incidentId: 'inc-bgm-001',
        severity: 'critical',
        read: false,
        createdAt: new Date(Date.now() - 1800000).toISOString()
      },
      {
        id: 'notif-2',
        userId: 'user_demo_101',
        title: 'Waterlogging near Sambra Rd',
        message: 'Gandhi Nagar underpass reported 1.5 ft water.',
        incidentId: 'inc-bgm-005',
        severity: 'critical',
        read: true,
        createdAt: new Date(Date.now() - 7200000).toISOString()
      }
    ],
    moderationAudit: [
      {
        id: 'aud-1',
        incidentId: 'inc-bgm-001',
        moderatorName: 'Chief Moderator',
        action: 'Verified Official Notice',
        reason: 'Confirmed by Belagavi Traffic Police Gazette #2026/04',
        timestamp: new Date(Date.now() - 3600000 * 3).toISOString()
      }
    ],
    apiSettings: {
      googleMapsApiKey: '',
      demoMode: true,
      lastUpdated: new Date().toISOString()
    }
  };

  saveDatabase(initialDB);
  return initialDB;
}

function saveDatabase(db) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to write database file:', e);
  }

  // Also sync to MongoDB Atlas when connected
  const mongo = getDB();
  if (mongo) {
    (async () => {
      try {
        await mongo.collection('metadata').updateOne(
          { _id: 'state' },
          { $set: { cityConfig: db.cityConfig, apiSettings: db.apiSettings, updatedAt: new Date() } },
          { upsert: true }
        );
        // Persist snapshots to Atlas
        await mongo.collection('incidents_snapshot').replaceOne(
          { _id: 'current' },
          { _id: 'current', list: db.incidents, count: db.incidents.length, updatedAt: new Date() },
          { upsert: true }
        );
      } catch (err) {
        console.warn('MongoDB Atlas background sync notice:', err.message);
      }
    })();
  }
}

let db = initDatabase();

// --- Auth Middleware ---
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Authentication token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired session token' });
    req.user = user;
    next();
  });
}

function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Administrative clearance required for this operation.' });
  }
}

// ================= API ROUTES =================

// 1. City and Config Info
app.get('/api/config', (req, res) => {
  res.json({
    city: db.cityConfig,
    demoMode: db.apiSettings.demoMode,
    hasGoogleKey: Boolean(db.apiSettings.googleMapsApiKey)
  });
});

app.post('/api/config/update-city', authenticateToken, requireAdmin, (req, res) => {
  const { name, state, lat, lng, zoom, boundaryName } = req.body;
  if (!name || !lat || !lng) {
    return res.status(400).json({ error: 'City name and coordinates are required.' });
  }
  db.cityConfig = {
    ...db.cityConfig,
    name,
    state: state || db.cityConfig.state,
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    zoom: zoom || 13,
    boundaryName: boundaryName || name
  };
  saveDatabase(db);
  res.json({ success: true, city: db.cityConfig });
});

// Update Google Maps API Key or Demo Mode
app.post('/api/config/api-settings', (req, res) => {
  const { googleMapsApiKey, demoMode } = req.body;
  if (googleMapsApiKey !== undefined) db.apiSettings.googleMapsApiKey = googleMapsApiKey.trim();
  if (demoMode !== undefined) db.apiSettings.demoMode = Boolean(demoMode);
  db.apiSettings.lastUpdated = new Date().toISOString();
  saveDatabase(db);
  res.json({
    success: true,
    hasGoogleKey: Boolean(db.apiSettings.googleMapsApiKey),
    demoMode: db.apiSettings.demoMode
  });
});

// 2. Incident Feeds & Filtering
app.get('/api/incidents', (req, res) => {
  const { category, severity, status, search, onlyVerified } = req.query;
  let items = [...db.incidents];

  if (!db.apiSettings.demoMode) {
    items = items.filter(inc => !inc.isDemo);
  }

  if (category && category !== 'all') {
    items = items.filter(inc => inc.category === category);
  }
  if (severity && severity !== 'all') {
    items = items.filter(inc => inc.severity === severity);
  }
  if (status && status !== 'all') {
    items = items.filter(inc => inc.status === status);
  }
  if (onlyVerified === 'true') {
    items = items.filter(inc => ['Verified', 'Officially Confirmed'].includes(inc.verificationStatus));
  }
  if (search) {
    const q = search.toLowerCase();
    items = items.filter(inc =>
      inc.title.toLowerCase().includes(q) ||
      inc.roadName.toLowerCase().includes(q) ||
      inc.landmark.toLowerCase().includes(q) ||
      inc.description.toLowerCase().includes(q)
    );
  }

  res.json({
    total: items.length,
    city: db.cityConfig.name,
    incidents: items
  });
});

app.get('/api/incidents/:id', (req, res) => {
  const incident = db.incidents.find(i => i.id === req.params.id);
  if (!incident) return res.status(404).json({ error: 'Incident not found' });
  res.json(incident);
});

// 3. Community Reporting (Accessible to guests or logged-in users)
app.post('/api/incidents/report', (req, res) => {
  const {
    title,
    category,
    roadName,
    landmark,
    description,
    severity,
    lat,
    lng,
    photoData,
    reporterName,
    reporterContact
  } = req.body;

  if (!title || !category || !roadName || !lat || !lng) {
    return res.status(400).json({ error: 'Title, category, road name, and valid map coordinates are required.' });
  }

  const categoryMap = {
    roadblock: 'Roadblock & Closure',
    maintenance: 'Maintenance & Work',
    pothole: 'Pothole & Damaged Road',
    diversion: 'Diversion & Traffic Change',
    flooding: 'Flooding & Waterlogging'
  };

  const newId = 'inc-user-' + Date.now().toString(36);
  const now = new Date().toISOString();

  const newIncident = {
    id: newId,
    title: title.trim(),
    category,
    categoryLabel: categoryMap[category] || 'Road Notice',
    roadName: roadName.trim(),
    landmark: landmark ? landmark.trim() : 'Belagavi vicinity',
    description: description ? description.trim() : 'Observed disruption reported by commuter.',
    severity: severity || 'moderate',
    verificationStatus: 'Community Reported',
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    reportedBy: reporterName ? reporterName.trim() : 'Anonymous Commuter',
    reportedRole: 'citizen',
    reportedAt: now,
    updatedAt: now,
    expectedEndTime: 'Under Assessment',
    confirmations: {
      confirm: 1,
      stillHappening: 1,
      resolved: 0,
      inaccurate: 0
    },
    voters: [],
    photoUrl: photoData || null,
    isDemo: false,
    status: 'active',
    history: [
      { timestamp: now, action: 'Community Report Created', note: 'Received via Raasta Public Reporting Form' }
    ]
  };

  db.incidents.unshift(newIncident);
  saveDatabase(db);

  res.status(201).json({
    success: true,
    message: 'Report submitted successfully. Reference ID generated.',
    referenceId: newId,
    incident: newIncident
  });
});

// 4. Community Confirmations & Abuse Prevention
app.post('/api/incidents/:id/confirm', (req, res) => {
  const { action, voterId } = req.body; // action: 'confirm', 'stillHappening', 'resolved', 'inaccurate'
  const incident = db.incidents.find(i => i.id === req.params.id);
  if (!incident) return res.status(404).json({ error: 'Incident record not found' });

  const voter = voterId || (req.ip || 'anon-client');

  if (incident.voters.includes(voter)) {
    return res.status(429).json({ error: 'You have already submitted community feedback for this incident.' });
  }

  if (!incident.confirmations[action] && incident.confirmations[action] !== 0) {
    return res.status(400).json({ error: 'Invalid confirmation action.' });
  }

  incident.confirmations[action] += 1;
  incident.voters.push(voter);
  incident.updatedAt = new Date().toISOString();

  // If resolutions exceed 10 and outnumber active, suggest automated status update
  if (incident.confirmations.resolved >= 8 && incident.confirmations.resolved > incident.confirmations.stillHappening * 2) {
    incident.verificationStatus = 'Resolved';
    incident.status = 'resolved';
    incident.history.push({
      timestamp: new Date().toISOString(),
      action: 'Community Resolved Consensus',
      note: 'Multiple drivers confirmed road cleared and restored.'
    });
  }

  saveDatabase(db);
  res.json({
    success: true,
    confirmations: incident.confirmations,
    status: incident.status,
    verificationStatus: incident.verificationStatus
  });
});

// 5. Auth: Register & Login
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Full name, email, and password are required.' });
  }

  const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'An account with this email address already exists.' });
  }

  const userId = 'user_' + Date.now().toString(36);
  const passwordHash = bcrypt.hashSync(password, 8);

  const newUser = {
    id: userId,
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash,
    role: 'user',
    createdAt: new Date().toISOString(),
    settings: {
      emailAlerts: true,
      browserPush: false,
      categories: ['roadblock', 'maintenance', 'pothole', 'diversion', 'flooding'],
      minSeverity: 'all'
    },
    savedPlaces: [
      { id: 'sp-' + Date.now(), label: 'Home', address: 'Belagavi, Karnataka', lat: 15.8497, lng: 74.4977 }
    ],
    savedRoutes: []
  };

  db.users.push(newUser);
  saveDatabase(db);

  const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name }, JWT_SECRET, { expiresIn: '7d' });

  res.status(201).json({
    success: true,
    token,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      settings: newUser.settings,
      savedPlaces: newUser.savedPlaces,
      savedRoutes: newUser.savedRoutes
    }
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required.' });
  }

  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid email or password credentials.' });
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      settings: user.settings,
      savedPlaces: user.savedPlaces,
      savedRoutes: user.savedRoutes
    }
  });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User profile not found.' });

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    settings: user.settings,
    savedPlaces: user.savedPlaces,
    savedRoutes: user.savedRoutes
  });
});

// 6. User Saved Places & Routes
app.post('/api/user/places', authenticateToken, (req, res) => {
  const { label, address, lat, lng } = req.body;
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const newPlace = {
    id: 'sp-' + Date.now().toString(36),
    label: label || 'Saved Place',
    address: address || 'Belagavi, Karnataka',
    lat: parseFloat(lat),
    lng: parseFloat(lng)
  };

  user.savedPlaces.push(newPlace);
  saveDatabase(db);
  res.status(201).json({ success: true, savedPlaces: user.savedPlaces });
});

app.delete('/api/user/places/:id', authenticateToken, (req, res) => {
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.savedPlaces = user.savedPlaces.filter(p => p.id !== req.params.id);
  saveDatabase(db);
  res.json({ success: true, savedPlaces: user.savedPlaces });
});

app.post('/api/user/routes', authenticateToken, (req, res) => {
  const { title, originLabel, originCoords, destLabel, destCoords, isFavorite, notify } = req.body;
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (!originCoords || !destCoords) {
    return res.status(400).json({ error: 'Origin and destination coordinates are required.' });
  }

  const newRoute = {
    id: 'rt-' + Date.now().toString(36),
    title: title || `${originLabel || 'Start'} to ${destLabel || 'End'}`,
    originLabel: originLabel || 'Start Location',
    originCoords,
    destLabel: destLabel || 'Destination',
    destCoords,
    isFavorite: Boolean(isFavorite),
    notify: notify !== undefined ? Boolean(notify) : true,
    distanceKm: 'Calculating...',
    typicalDuration: 'Approx 15-20 min'
  };

  user.savedRoutes.push(newRoute);
  saveDatabase(db);
  res.status(201).json({ success: true, savedRoutes: user.savedRoutes });
});

app.delete('/api/user/routes/:id', authenticateToken, (req, res) => {
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.savedRoutes = user.savedRoutes.filter(r => r.id !== req.params.id);
  saveDatabase(db);
  res.json({ success: true, savedRoutes: user.savedRoutes });
});

// Update User Preferences
app.put('/api/user/preferences', authenticateToken, (req, res) => {
  const { emailAlerts, browserPush, categories, minSeverity } = req.body;
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.settings = {
    ...user.settings,
    emailAlerts: emailAlerts !== undefined ? Boolean(emailAlerts) : user.settings.emailAlerts,
    browserPush: browserPush !== undefined ? Boolean(browserPush) : user.settings.browserPush,
    categories: categories || user.settings.categories,
    minSeverity: minSeverity || user.settings.minSeverity
  };

  saveDatabase(db);
  res.json({ success: true, settings: user.settings });
});

// 7. Notifications
app.get('/api/notifications', authenticateToken, (req, res) => {
  const userNotifs = db.notifications.filter(n => n.userId === req.user.id || n.userId === 'all');
  res.json({ notifications: userNotifs });
});

app.post('/api/notifications/:id/read', authenticateToken, (req, res) => {
  const notif = db.notifications.find(n => n.id === req.params.id);
  if (notif) notif.read = true;
  saveDatabase(db);
  res.json({ success: true });
});

app.post('/api/notifications/mark-all-read', authenticateToken, (req, res) => {
  db.notifications.forEach(n => {
    if (n.userId === req.user.id || n.userId === 'all') {
      n.read = true;
    }
  });
  saveDatabase(db);
  res.json({ success: true });
});

// 8. Admin Moderation & Duplicate Detection
app.get('/api/admin/reports', authenticateToken, requireAdmin, (req, res) => {
  res.json({
    totalIncidents: db.incidents.length,
    incidents: db.incidents,
    auditTrail: db.moderationAudit
  });
});

app.post('/api/admin/moderate', authenticateToken, requireAdmin, (req, res) => {
  const { incidentId, newStatus, verificationStatus, officialSource, reason } = req.body;
  const incident = db.incidents.find(i => i.id === incidentId);
  if (!incident) return res.status(404).json({ error: 'Incident not found' });

  const prevStatus = incident.verificationStatus;
  if (verificationStatus) incident.verificationStatus = verificationStatus;
  if (newStatus) incident.status = newStatus;
  if (officialSource) incident.officialSource = officialSource;
  incident.updatedAt = new Date().toISOString();

  incident.history.push({
    timestamp: new Date().toISOString(),
    action: `Moderator Updated: ${verificationStatus || newStatus}`,
    note: reason || 'Reviewed and modified in administrative console.'
  });

  const auditEntry = {
    id: 'aud-' + Date.now().toString(36),
    incidentId,
    moderatorName: req.user.name || 'Admin',
    action: `Changed status from ${prevStatus} to ${verificationStatus || newStatus}`,
    reason: reason || 'Standard moderation check',
    timestamp: new Date().toISOString()
  };

  db.moderationAudit.unshift(auditEntry);
  saveDatabase(db);

  res.json({ success: true, incident, auditEntry });
});

// Admin Reset Demo Data
app.post('/api/admin/reset-demo-data', authenticateToken, requireAdmin, (req, res) => {
  db.incidents = SEED_INCIDENTS.map(i => ({ ...i }));
  saveDatabase(db);
  res.json({ success: true, message: 'Demo Belagavi incidents reset successfully.' });
});

// SPA fallback
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, async () => {
  console.log(`\n========================================`);
  console.log(`🚀 Raasta Mobility Platform is running!`);
  console.log(`📍 Launch City: ${db.cityConfig.name}, Karnataka`);
  console.log(`🌐 Server URL: http://localhost:${PORT}`);
  console.log(`🎨 Theme: Wine Burgundy (#5C0D1D) & Vanilla Cream (#FDF6E5)`);
  console.log(`========================================\n`);

  // Connect to MongoDB Atlas
  await connectDB();
});
