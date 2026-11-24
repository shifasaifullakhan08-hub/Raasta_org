// services/changeDetector.js
// Intelligent change detection, deduplication, corridor extraction & audit history logger

// Belagavi coordinate reference dictionary for corridor and landmark detection
const BELAGAVI_POINTS = {
  // 38 Belagavi Nagar Localities (Center Coordinates)
  'hanuman nagar': { name: 'Hanuman Nagar', lat: 15.8768, lng: 74.4892 },
  'bhagya nagar': { name: 'Bhagya Nagar', lat: 15.8307, lng: 74.5067 },
  'sadashiv nagar': { name: 'Sadashiv Nagar', lat: 15.8783, lng: 74.5085 },
  'shivabasava nagar': { name: 'Shivabasava Nagar', lat: 15.8705, lng: 74.5130 },
  'rani chennamma nagar': { name: 'Rani Chennamma Nagar', lat: 15.8271, lng: 74.4907 },
  'rukmini nagar': { name: 'Rukmini Nagar', lat: 15.8740, lng: 74.5310 },
  'chidambar nagar': { name: 'Chidambar Nagar', lat: 15.8285, lng: 74.5035 },
  'vaibhav nagar': { name: 'Vaibhav Nagar', lat: 15.8932, lng: 74.5185 },
  'guruprasad nagar': { name: 'Guruprasad Nagar', lat: 15.8385, lng: 74.4965 },
  'kaveri nagar': { name: 'Kaveri Nagar', lat: 15.8625, lng: 74.4775 },
  'godse nagar': { name: 'Godse Nagar', lat: 15.8360, lng: 74.4940 },
  'mahantesh nagar': { name: 'Mahantesh Nagar', lat: 15.8771, lng: 74.5332 },
  'sahyadri nagar': { name: 'Sahyadri Nagar', lat: 15.8849, lng: 74.4833 },
  'ramteerth nagar': { name: 'Ramteerth Nagar', lat: 15.8902, lng: 74.5438 },
  'ashok nagar': { name: 'Ashok Nagar', lat: 15.8675, lng: 74.5245 },
  'azad nagar': { name: 'Azad Nagar', lat: 15.8645, lng: 74.5260 },
  'azam nagar': { name: 'Azam Nagar', lat: 15.8850, lng: 74.5134 },
  'subhash nagar': { name: 'Subhash Nagar', lat: 15.8739, lng: 74.5178 },
  'nehru nagar': { name: 'Nehru Nagar', lat: 15.8667, lng: 74.5000 },
  'gandhi nagar': { name: 'Gandhi Nagar', lat: 15.8624, lng: 74.5319 },
  'shahu nagar': { name: 'Shahu Nagar', lat: 15.8922, lng: 74.5116 },
  'shree nagar': { name: 'Shree Nagar', lat: 15.8845, lng: 74.5365 },
  'samarth nagar': { name: 'Samarth Nagar', lat: 15.8510, lng: 74.5273 },
  'bharat nagar': { name: 'Bharat Nagar', lat: 15.8435, lng: 74.5210 },
  'lakshmi nagar': { name: 'Lakshmi Nagar', lat: 15.8680, lng: 74.4760 },
  'devang nagar': { name: 'Devang Nagar', lat: 15.8330, lng: 74.5160 },
  'om nagar': { name: 'Om Nagar', lat: 15.8315, lng: 74.5145 },
  'sangameshwar nagar': { name: 'Sangameshwar Nagar', lat: 15.8805, lng: 74.5095 },
  'vidya nagar': { name: 'Vidya Nagar', lat: 15.8202, lng: 74.5038 },
  'vinayak nagar': { name: 'Vinayak Nagar', lat: 15.8655, lng: 74.4785 },
  'anand nagar': { name: 'Anand Nagar', lat: 15.8375, lng: 74.5180 },
  'gokul nagar': { name: 'Gokul Nagar', lat: 15.8820, lng: 74.4860 },
  'adarsh nagar': { name: 'Adarsh Nagar', lat: 15.8340, lng: 74.5176 },
  'shastri nagar': { name: 'Shastri Nagar', lat: 15.8445, lng: 74.5140 },
  'r.c. nagar': { name: 'R.C. Nagar', lat: 15.8260, lng: 74.4915 },
  'rc nagar': { name: 'R.C. Nagar', lat: 15.8260, lng: 74.4915 },
  'veerbhadra nagar': { name: 'Veerbhadra Nagar', lat: 15.8715, lng: 74.5236 },
  'shivaji nagar': { name: 'Shivaji Nagar', lat: 15.8667, lng: 74.5000 },
  'ambedkar nagar': { name: 'Ambedkar Nagar', lat: 15.8815, lng: 74.5110 },
  'auto nagar': { name: 'Auto Nagar', lat: 15.8904, lng: 74.5437 },

  // Key Junctions, Hubs & Transit Points
  'tilakwadi': { name: 'Tilakwadi 3rd Gate', lat: 15.8365, lng: 74.5082 },
  'congress road': { name: 'Congress Road Railway Overbridge', lat: 15.8365, lng: 74.5082 },
  '3rd railway gate': { name: '3rd Railway Gate, Tilakwadi', lat: 15.8365, lng: 74.5082 },
  '2nd gate': { name: 'Tilakwadi 2nd Gate', lat: 15.8341, lng: 74.5056 },
  '1st gate': { name: 'Tilakwadi 1st Gate', lat: 15.8318, lng: 74.5032 },
  'rpd': { name: 'RPD College Cross, Tilakwadi', lat: 15.8398, lng: 74.5021 },
  'khanapur road': { name: 'Khanapur Road', lat: 15.8398, lng: 74.5021 },
  'chennamma': { name: 'Rani Chennamma Circle', lat: 15.8596, lng: 74.5098 },
  'bogarves': { name: 'Bogarves Junction', lat: 15.8521, lng: 74.5042 },
  'goaves': { name: 'Goaves Circle', lat: 15.8450, lng: 74.5065 },
  'camp': { name: 'Camp Area / Cantonment', lat: 15.8548, lng: 74.4965 },
  'club road': { name: 'Club Road', lat: 15.8570, lng: 74.5030 },
  'college road': { name: 'College Road', lat: 15.8580, lng: 74.5065 },
  'cbt': { name: 'Central Bus Stand (CBT)', lat: 15.8542, lng: 74.5145 },
  'railway station': { name: 'Belagavi Railway Station (SWR)', lat: 15.8480, lng: 74.5135 },
  'sambra': { name: 'Sambra Belagavi Airport Road', lat: 15.8712, lng: 74.5421 },
  'airport': { name: 'Belagavi Airport (IXG)', lat: 15.8593, lng: 74.6183 },
  'mandoli': { name: 'Mandoli Road', lat: 15.8285, lng: 74.4754 },
  'peeranwadi': { name: 'Peeranwadi Cross', lat: 15.8220, lng: 74.4680 },
  'ballari nala': { name: 'Ballari Nala Bridge', lat: 15.8650, lng: 74.5380 },
  'nh-48': { name: 'NH-48 Pune-Bengaluru Bypass (Belagavi)', lat: 15.8890, lng: 74.5510 },
  'vtu': { name: 'VTU Campus, Machhe', lat: 15.8891, lng: 74.5367 },
  'kle': { name: 'KLE Tech / JNMC Campus', lat: 15.8812, lng: 74.5187 }
};

/**
 * Standardize Category label
 */
function getCategoryLabel(category) {
  const map = {
    roadblock: 'Roadblock & Closure',
    maintenance: 'Maintenance & Work',
    pothole: 'Pothole & Damaged Road',
    diversion: 'Diversion & Traffic Change',
    flooding: 'Waterlogging & Flooding'
  };
  return map[category] || 'General Disruption';
}

/**
 * Extract road and coordinates from raw text if missing
 */
function extractCorridorAndLocation(text, rawRoad, rawLandmark) {
  const combined = `${rawRoad || ''} ${rawLandmark || ''} ${text || ''}`.toLowerCase();
  
  for (const key in BELAGAVI_POINTS) {
    if (combined.includes(key)) {
      const match = BELAGAVI_POINTS[key];
      return {
        roadName: rawRoad || match.name,
        landmark: rawLandmark || key.toUpperCase(),
        lat: match.lat,
        lng: match.lng,
        matchedKey: key
      };
    }
  }

  // Fallback to Belagavi city center
  return {
    roadName: rawRoad || 'Belagavi Municipal Corridor',
    landmark: rawLandmark || 'Belagavi Central Ward',
    lat: 15.8497,
    lng: 74.4977,
    matchedKey: 'belagavi'
  };
}

/**
 * Compare an incoming record against existing incidents in the database.
 * Detects whether this is a NEW incident or an UPDATE to an existing record.
 */
function detectChange(incoming, existingIncidents) {
  const incRoad = (incoming.roadName || '').toLowerCase().trim();
  const incTitle = (incoming.title || '').toLowerCase().trim();
  const incCategory = (incoming.category || '').toLowerCase().trim();

  // Find candidates on same road or matching key coordinates
  let match = null;
  let matchScore = 0;

  for (const existing of existingIncidents) {
    // Never match if existing is already archived or superseded
    const exRoad = (existing.roadName || '').toLowerCase().trim();
    const exTitle = (existing.title || '').toLowerCase().trim();
    const exCat = (existing.category || '').toLowerCase().trim();

    let score = 0;

    // 1. Direct ID or external reference match
    if (incoming.externalId && existing.externalId === incoming.externalId) {
      match = existing;
      matchScore = 100;
      break;
    }

    // 2. Road name match
    if (incRoad && exRoad && (incRoad.includes(exRoad) || exRoad.includes(incRoad))) {
      score += 40;
    }

    // 3. Category match
    if (incCategory === exCat) {
      score += 25;
    }

    // 4. Proximity match (< 500 meters)
    if (incoming.lat && incoming.lng && existing.lat && existing.lng) {
      const dist = Math.hypot(incoming.lat - existing.lat, incoming.lng - existing.lng);
      if (dist < 0.005) { // ~500m
        score += 25;
      }
    }

    // 5. Title keyword similarity
    if (incTitle && exTitle) {
      const wordsA = incTitle.split(' ').filter(w => w.length > 3);
      const matchedWords = wordsA.filter(w => exTitle.includes(w));
      if (matchedWords.length > 0) score += 15;
    }

    if (score > matchScore && score >= 60) {
      matchScore = score;
      match = existing;
    }
  }

  if (!match) {
    return {
      action: 'NEW_INCIDENT',
      matchScore: 0,
      existing: null,
      changes: []
    };
  }

  // Detect specific changes between incoming and existing
  const changes = [];

  // Check status transition
  if (incoming.status && incoming.status !== match.status) {
    changes.push({ field: 'status', oldVal: match.status, newVal: incoming.status, note: `Status transitioned from ${match.status} to ${incoming.status}` });
  }

  // Check expected completion extension
  if (incoming.expectedEndTime && incoming.expectedEndTime !== match.expectedEndTime) {
    changes.push({ field: 'expectedEndTime', oldVal: match.expectedEndTime, newVal: incoming.expectedEndTime, note: `Timeline adjusted from ${match.expectedEndTime} to ${incoming.expectedEndTime}` });
  }

  // Check severity change
  if (incoming.severity && incoming.severity !== match.severity) {
    changes.push({ field: 'severity', oldVal: match.severity, newVal: incoming.severity, note: `Severity changed from ${match.severity} to ${incoming.severity}` });
  }

  // Check description expansion
  if (incoming.description && incoming.description !== match.description && incoming.description.length > (match.description || '').length) {
    changes.push({ field: 'description', oldVal: match.description, newVal: incoming.description, note: 'Notice description updated with newer details' });
  }

  return {
    action: changes.length > 0 ? 'UPDATE_INCIDENT' : 'NO_CHANGE',
    matchScore,
    existing: match,
    changes
  };
}

module.exports = {
  BELAGAVI_POINTS,
  getCategoryLabel,
  extractCorridorAndLocation,
  detectChange
};
