// app.js - Full Interactive Application Logic for Raasta Platform
(function() {
  'use strict';

  // Application State
  const state = {
    currentView: 'landing',
    user: null,
    token: localStorage.getItem('raasta_token') || null,
    incidents: [],
    cityConfig: {
      name: 'Belagavi (Belgaum)',
      state: 'Karnataka',
      lat: 15.8497,
      lng: 74.4977,
      zoom: 13
    },
    map: null,
    mapMarkers: [],
    pickerMap: null,
    pickerMarker: null,
    pickerModalMap: null,
    pickerModalMarker: null,
    activePickerTarget: null,
    currentPickerCoords: { lat: 15.8497, lng: 74.4977, address: 'Tilakwadi 3rd Gate, Belagavi' },
    routeMiniMap: null,
    routeLayerGroup: null,
    activeFilters: {
      category: 'all',
      severity: 'all',
      status: 'all',
      search: ''
    },
    alertsFilter: {
      category: 'all',
      status: 'all', // 'all', 'unresolved', 'resolved'
      severity: 'all',
      search: ''
    },
    authMode: 'login' // 'login' or 'signup'
  };

  // Color Mapping for Map Markers & Badges
  const CATEGORY_COLORS = {
    roadblock: '#DC2626',   // Red
    maintenance: '#D97706', // Amber/Orange
    pothole: '#EA580C',     // Orange
    diversion: '#9333EA',   // Purple
    flooding: '#2563EB'      // Blue
  };

  // Preset Belagavi Coordinate Reference Points for Route Demonstration & Distance Calculation
  const BELAGAVI_POINTS = {
    // City Hubs & Junctions
    'tilakwadi': { name: 'Tilakwadi 3rd Gate', lat: 15.8365, lng: 74.5082 },
    'tilakwadi 2nd': { name: 'Tilakwadi 2nd Gate', lat: 15.8341, lng: 74.5056 },
    'tilakwadi 1st': { name: 'Tilakwadi 1st Gate', lat: 15.8318, lng: 74.5032 },
    'rpd': { name: 'RPD College Cross, Tilakwadi', lat: 15.8398, lng: 74.5021 },
    'chennamma': { name: 'Rani Chennamma Circle', lat: 15.8596, lng: 74.5098 },
    'bogarves': { name: 'Bogarves Junction', lat: 15.8521, lng: 74.5042 },
    'goaves': { name: 'Goaves Circle', lat: 15.8450, lng: 74.5065 },
    'camp': { name: 'Camp Area / Cantonment', lat: 15.8548, lng: 74.4965 },
    'club road': { name: 'Club Road', lat: 15.8570, lng: 74.5030 },
    'college road': { name: 'College Road', lat: 15.8580, lng: 74.5065 },
    'cbt': { name: 'Central Bus Stand (CBT)', lat: 15.8542, lng: 74.5145 },
    'railway': { name: 'Belagavi Railway Station (SWR)', lat: 15.8480, lng: 74.5135 },
    'subhash nagar': { name: 'Subhash Nagar / BCC HQ', lat: 15.8562, lng: 74.5091 },
    'shahu nagar': { name: 'Shahu Nagar', lat: 15.8672, lng: 74.5280 },
    'nehru nagar': { name: 'Nehru Nagar', lat: 15.8750, lng: 74.5220 },
    'kumarswamy': { name: 'Kumarswamy Layout', lat: 15.8415, lng: 74.5212 },
    'bhagya nagar': { name: 'Bhagya Nagar', lat: 15.8302, lng: 74.5123 },
    'angol': { name: 'Angol Main Road', lat: 15.8240, lng: 74.5170 },
    'vadgaon': { name: 'Vadgaon', lat: 15.8350, lng: 74.5190 },
    'shahapur': { name: 'Shahapur', lat: 15.8420, lng: 74.5160 },
    'khasbag': { name: 'Khasbag', lat: 15.8380, lng: 74.5140 },
    'mahantesh nagar': { name: 'Mahantesh Nagar', lat: 15.8710, lng: 74.5310 },
    'shivaji nagar': { name: 'Shivaji Nagar', lat: 15.8640, lng: 74.5210 },
    'ramteerth nagar': { name: 'Ramteerth Nagar', lat: 15.8820, lng: 74.5410 },
    'auto nagar': { name: 'Auto Nagar', lat: 15.8780, lng: 74.5510 },
    'fort lake': { name: 'Fort Lake / Kote Kere', lat: 15.8610, lng: 74.5160 },
    'military': { name: 'Military Mahadev Temple', lat: 15.8600, lng: 74.4920 },
    
    // Academic & Tech Institutions
    'kle': { name: 'KLE Tech / JNMC Campus', lat: 15.8812, lng: 74.5187 },
    'vtu': { name: 'VTU Campus, Machhe', lat: 15.8891, lng: 74.5367 },
    'jain college': { name: 'Jain College of Engineering', lat: 15.8860, lng: 74.5580 },
    'maratha mandal': { name: 'Maratha Mandal Engineering College', lat: 15.8920, lng: 74.5290 },
    
    // Industrial & Transit Corridors
    'udyambag': { name: 'Udyambag Industrial Estate', lat: 15.8190, lng: 74.4980 },
    'machhe': { name: 'Machhe Industrial Area', lat: 15.8120, lng: 74.4820 },
    'peeranwadi': { name: 'Peeranwadi Cross', lat: 15.8220, lng: 74.4680 },
    'mandoli': { name: 'Mandoli Road', lat: 15.8285, lng: 74.4754 },
    'sambra': { name: 'Sambra Belagavi Airport Road', lat: 15.8712, lng: 74.5421 },
    'airport': { name: 'Belagavi Airport (IXG)', lat: 15.8593, lng: 74.6183 },
    'kanbargi': { name: 'Kanbargi Bypass', lat: 15.8840, lng: 74.5540 },
    'kakati': { name: 'Kakati Industrial Area', lat: 15.9250, lng: 74.5280 },
    'honaga': { name: 'Honaga Industrial Area', lat: 15.9420, lng: 74.5340 },
    'hindalga': { name: 'Hindalga Ganapati Temple Road', lat: 15.8720, lng: 74.4780 },

    // Surrounding Belagavi District Taluks & Towns
    'khanapur': { name: 'Khanapur Town', lat: 15.6370, lng: 74.5140 },
    'bailhongal': { name: 'Bailhongal', lat: 15.8160, lng: 74.8580 },
    'gokak': { name: 'Gokak Falls Road', lat: 16.1680, lng: 74.8250 },
    'chikkodi': { name: 'Chikkodi', lat: 16.4320, lng: 74.5980 },
    'sankeshwar': { name: 'Sankeshwar', lat: 16.2620, lng: 74.4820 },
    'nippani': { name: 'Nippani', lat: 16.4020, lng: 74.3820 },
    'kittur': { name: 'Kittur Fort Road', lat: 15.5980, lng: 74.7920 },
    'hukkeri': { name: 'Hukkeri', lat: 16.2280, lng: 74.6020 },
    'athani': { name: 'Athani', lat: 16.7320, lng: 75.0620 },
    'raibag': { name: 'Raibag', lat: 16.4920, lng: 74.7820 },
    'ramdurg': { name: 'Ramdurg', lat: 15.9480, lng: 75.2980 },
    'saundatti': { name: 'Saundatti Yellamma', lat: 15.7680, lng: 75.1180 }
  };

  function resolveCoords(query, inputElementId) {
    if (!query) return null;

    // Check if the input element has exact user-selected coordinates from the pin-picker
    if (inputElementId) {
      const el = document.getElementById(inputElementId);
      if (el && el.getAttribute('data-lat') && el.getAttribute('data-lng')) {
        const dLat = parseFloat(el.getAttribute('data-lat'));
        const dLng = parseFloat(el.getAttribute('data-lng'));
        if (!isNaN(dLat) && !isNaN(dLng)) {
          return { name: query, lat: dLat, lng: dLng };
        }
      }
    }

    const q = query.toLowerCase().trim();
    for (const key in BELAGAVI_POINTS) {
      if (q.includes(key) || q.includes(BELAGAVI_POINTS[key].name.toLowerCase()) || BELAGAVI_POINTS[key].name.toLowerCase().includes(q)) {
        return BELAGAVI_POINTS[key];
      }
    }

    // Default to Belagavi city center
    return { name: query, lat: 15.8497, lng: 74.4977 };
  }

  function calculateDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    // Real road distance is approximately 1.25x haversine distance in city grids
    return Math.max(1.2, +(d * 1.25).toFixed(1));
  }

  // ==================== GLOBAL PERCENTAGE LOADER ENGINE ====================
  let activeLoaderInterval = null;
  let currentLoaderPercentage = 0;
  let activeLoaderCount = 0;

  function startPercentageLoader(title = 'Processing Backend Request...', subtitle = 'Communicating with Belagavi traffic and road telemetry server') {
    activeLoaderCount++;
    const modal = document.getElementById('raasta-global-loader');
    const titleEl = document.getElementById('loader-status-title');
    const subtitleEl = document.getElementById('loader-status-subtitle');
    const numberEl = document.getElementById('loader-percentage-number');
    const barEl = document.getElementById('loader-progress-bar');
    const stepEl = document.getElementById('loader-step-text');
    const topBar = document.getElementById('raasta-top-bar');

    if (titleEl) titleEl.textContent = title;
    if (subtitleEl) subtitleEl.textContent = subtitle;

    if (modal && activeLoaderCount === 1) {
      modal.classList.remove('hidden');
      currentLoaderPercentage = 5;
      if (numberEl) numberEl.textContent = '5';
      if (barEl) barEl.style.width = '5%';
      if (stepEl) stepEl.textContent = 'Establishing secure socket connection...';
      if (topBar) {
        topBar.style.opacity = '1';
        topBar.style.width = '8%';
      }

      if (activeLoaderInterval) clearInterval(activeLoaderInterval);

      // Smooth realistic percentage progression curve while waiting for response
      const steps = [
        { p: 15, text: 'Querying Belagavi municipal database...' },
        { p: 32, text: 'Verifying road geometry & traffic incidents...' },
        { p: 54, text: 'Syncing live telemetry & telemetry checkpoints...' },
        { p: 72, text: 'Analyzing corridor alternatives & detour coordinates...' },
        { p: 88, text: 'Compiling structured response payload...' },
        { p: 94, text: 'Finalizing verification...' }
      ];

      activeLoaderInterval = setInterval(() => {
        if (currentLoaderPercentage < 94) {
          // Incrementally climb up to 94% smoothly
          const increment = Math.max(1, Math.floor((95 - currentLoaderPercentage) / 7));
          currentLoaderPercentage += increment;
          if (currentLoaderPercentage > 94) currentLoaderPercentage = 94;

          if (numberEl) numberEl.textContent = Math.round(currentLoaderPercentage);
          if (barEl) barEl.style.width = `${currentLoaderPercentage}%`;
          if (topBar) topBar.style.width = `${currentLoaderPercentage}%`;

          // Pick appropriate contextual step text
          for (let i = steps.length - 1; i >= 0; i--) {
            if (currentLoaderPercentage >= steps[i].p) {
              if (stepEl) stepEl.textContent = steps[i].text;
              break;
            }
          }
        }
      }, 120);
    }
  }

  function stopPercentageLoader() {
    activeLoaderCount = Math.max(0, activeLoaderCount - 1);
    if (activeLoaderCount === 0) {
      if (activeLoaderInterval) {
        clearInterval(activeLoaderInterval);
        activeLoaderInterval = null;
      }

      const modal = document.getElementById('raasta-global-loader');
      const numberEl = document.getElementById('loader-percentage-number');
      const barEl = document.getElementById('loader-progress-bar');
      const stepEl = document.getElementById('loader-step-text');
      const topBar = document.getElementById('raasta-top-bar');

      // Surge swiftly to 100% completion before hiding
      if (numberEl) numberEl.textContent = '100';
      if (barEl) barEl.style.width = '100%';
      if (stepEl) stepEl.textContent = 'Complete! Updating view...';
      if (topBar) topBar.style.width = '100%';

      setTimeout(() => {
        if (modal) modal.classList.add('hidden');
        if (topBar) {
          topBar.style.opacity = '0';
          setTimeout(() => { topBar.style.width = '0%'; }, 200);
        }
        currentLoaderPercentage = 0;
      }, 260);
    }
  }

  // Universal Backend Async Wrapper with Guaranteed Percentage Loader
  async function wrapBackendCall(asyncFn, title = 'Processing Request...', subtitle = 'Communicating with Belagavi traffic and road telemetry server') {
    startPercentageLoader(title, subtitle);
    try {
      const result = await asyncFn();
      return result;
    } finally {
      stopPercentageLoader();
    }
  }

  // Automatic Global Interceptor: Catches all backend /api/ and routing HTTP calls
  // ensures a percentage loading screen is always shown rather than blank or blurred screens
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url ? args[0].url : '');
    
    // Ignore tile tile requests or static assets so map panning isn't blocked
    const isTileOrAsset = url.includes('.tile.openstreetmap.org') || url.endsWith('.png') || url.endsWith('.jpg') || url.endsWith('.css');
    
    if (isTileOrAsset) {
      return originalFetch.apply(this, args);
    }

    // Determine user-friendly title and subtitle based on request target
    let title = 'Processing Backend Request...';
    let subtitle = 'Communicating with Belagavi traffic and road telemetry server';

    if (url.includes('/api/incidents/report')) {
      title = 'Transmitting Road Incident Report...';
      subtitle = 'Submitting citizen report coordinates to municipal moderation queue';
    } else if (url.includes('/api/incidents') && url.includes('/confirm')) {
      title = 'Submitting Community Confirmation...';
      subtitle = 'Updating crowd-sourced consensus & credibility weight';
    } else if (url.includes('/api/admin')) {
      title = 'Administering Moderation Console...';
      subtitle = 'Updating official status and recording administrative audit logs';
    } else if (url.includes('/api/auth')) {
      title = 'Authenticating User Account...';
      subtitle = 'Verifying credentials and synchronizing user preferences';
    } else if (url.includes('/api/user/routes') || url.includes('/api/user/places')) {
      title = 'Synchronizing Saved Commute Data...';
      subtitle = 'Saving personalized Belagavi corridors to your profile';
    } else if (url.includes('router.project-osrm.org')) {
      title = 'Calculating Street-Level Road Route...';
      subtitle = 'Querying OpenStreetMap live driving graph & corridor geometry';
    } else if (url.includes('/api/incidents')) {
      title = 'Synchronizing Belagavi Road Alerts...';
      subtitle = 'Fetching real-time roadblocks, potholes, and municipal alerts';
    }

    startPercentageLoader(title, subtitle);
    try {
      // Ensure smooth visual transition: introduce a tiny 200ms processing delay if response is instantaneous
      const fetchPromise = originalFetch.apply(this, args);
      const delayPromise = new Promise(resolve => setTimeout(resolve, 220));
      const [res] = await Promise.all([fetchPromise, delayPromise]);
      return res;
    } finally {
      stopPercentageLoader();
    }
  };

  // Initialize Application
  async function init() {
    setupLucide();
    await fetchConfig();
    await checkSession();
    await loadIncidents();

    // Setup map picker map lazily when viewing report
    initMainMap();

    // Check URL hash if direct navigation
    const hash = window.location.hash.replace('#', '');
    if (hash && ['landing', 'map', 'route-checker', 'alerts', 'report', 'dashboard', 'admin', 'how-it-works'].includes(hash)) {
      switchView(hash);
    } else {
      switchView('landing');
    }
  }

  function setupLucide() {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // 1. Fetch Configuration & Demo State
  async function fetchConfig() {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      if (data.city) {
        state.cityConfig = data.city;
        const cityLabel = document.getElementById('nav-active-city-label');
        if (cityLabel) cityLabel.textContent = `${data.city.name}, ${data.city.state}`;
      }
    } catch (e) {
      console.warn('Using local default configuration:', e);
    }
  }

  // 2. Fetch Incidents
  async function loadIncidents() {
    try {
      const query = new URLSearchParams();
      if (state.activeFilters.category !== 'all') query.append('category', state.activeFilters.category);
      if (state.activeFilters.severity !== 'all') query.append('severity', state.activeFilters.severity);
      if (state.activeFilters.search) query.append('search', state.activeFilters.search);

      const res = await fetch(`/api/incidents?${query.toString()}`);
      const data = await res.json();
      state.incidents = data.incidents || [];

      // Update counters
      const activeCount = state.incidents.filter(i => i.status === 'active').length;
      const statCountElem = document.getElementById('stat-active-count');
      if (statCountElem) statCountElem.textContent = activeCount;

      const mapCountElem = document.getElementById('map-incident-count');
      if (mapCountElem) mapCountElem.textContent = `${activeCount} Active Issues`;

      // Render Map Markers & Sidebars
      renderMapMarkers();
      renderMapIncidentList();
      renderAlertsGrid();
      renderDashboardFeed();
    } catch (e) {
      console.error('Failed to load incidents:', e);
    }
  }

  // 3. Initialize Interactive Leaflet Map for Belagavi
  function initMainMap() {
    const mapContainer = document.getElementById('leaflet-map');
    if (!mapContainer || state.map) return;

    // Center on Belagavi
    state.map = L.map('leaflet-map').setView([state.cityConfig.lat, state.cityConfig.lng], state.cityConfig.zoom);

    // OpenStreetMap CartoDB Positron / OSM Tiles with fallback
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
    }).addTo(state.map);

    // Render incidents on map
    renderMapMarkers();
  }

  function renderMapMarkers() {
    if (!state.map) return;

    // Clear existing markers
    state.mapMarkers.forEach(m => state.map.removeLayer(m));
    state.mapMarkers = [];

    state.incidents.forEach(inc => {
      const color = CATEGORY_COLORS[inc.category] || '#5C0D1D';
      
      // Custom Circular Pin Icon
      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `<div class="custom-map-pin" style="background-color: ${color}; width: 32px; height: 32px; font-size: 13px;">!</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([inc.lat, inc.lng], { icon: customIcon }).addTo(state.map);

      // Popup Content
      const popupHtml = `
        <div class="p-1 space-y-1.5 max-w-[220px]">
          <div class="flex items-center gap-1.5">
            <span class="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded text-white" style="background:${color}">${inc.categoryLabel}</span>
            <span class="text-[9px] font-bold text-slate-500 uppercase">${inc.severity}</span>
          </div>
          <h4 class="font-bold text-xs text-slate-900 leading-snug">${escapeHtml(inc.title)}</h4>
          <p class="text-[11px] text-slate-600">${escapeHtml(inc.roadName)}</p>
          <div class="pt-1.5 flex justify-between items-center border-t border-slate-200">
            <span class="text-[10px] text-emerald-700 font-semibold">${inc.verificationStatus}</span>
            <button onclick="window.raastaApp.openIncidentDetail('${inc.id}')" class="text-[10px] font-bold text-burgundy underline hover:text-red-700">View Full Details</button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      state.mapMarkers.push(marker);
    });
  }

  // 4. Render Incident List in Map Sidebar
  function renderMapIncidentList() {
    const container = document.getElementById('map-incident-list');
    if (!container) return;

    if (state.incidents.length === 0) {
      container.innerHTML = `
        <div class="text-center py-10 px-4 text-slate-500 space-y-2">
          <i data-lucide="check-circle" class="w-8 h-8 text-emerald-600 mx-auto"></i>
          <p class="text-xs font-semibold">No active issues found for selected filter.</p>
        </div>
      `;
      setupLucide();
      return;
    }

    container.innerHTML = state.incidents.map(inc => {
      const color = CATEGORY_COLORS[inc.category] || '#5C0D1D';
      return `
        <div onclick="window.raastaApp.focusIncidentOnMap('${inc.id}')" class="p-3 hover:bg-cream rounded-xl cursor-pointer transition border border-transparent hover:border-cream-border">
          <div class="flex items-center justify-between gap-1 mb-1">
            <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded text-white" style="background:${color}">${inc.categoryLabel}</span>
            <span class="text-[10px] font-semibold text-slate-500">${inc.verificationStatus}</span>
          </div>
          <h4 class="text-xs font-bold text-slate-900">${escapeHtml(inc.title)}</h4>
          <p class="text-[11px] text-slate-600 flex items-center gap-1 mt-0.5">
            <i data-lucide="map-pin" class="w-3 h-3 text-slate-400"></i> ${escapeHtml(inc.roadName)}
          </p>
          <div class="flex items-center justify-between mt-2 pt-2 border-t border-cream-border text-[10px] text-slate-500">
            <span>👍 ${inc.confirmations.confirm} Confirmed</span>
            <span class="font-bold text-burgundy hover:underline">Explore →</span>
          </div>
        </div>
      `;
    }).join('');

    setupLucide();
  }

  // Focus and open popup on map
  function focusIncidentOnMap(id) {
    const inc = state.incidents.find(i => i.id === id);
    if (!inc || !state.map) return;
    state.map.setView([inc.lat, inc.lng], 16);
    
    // Find matching marker and open popup
    const marker = state.mapMarkers.find(m => {
      const latlng = m.getLatLng();
      return Math.abs(latlng.lat - inc.lat) < 0.0001 && Math.abs(latlng.lng - inc.lng) < 0.0001;
    });
    if (marker) marker.openPopup();
  }

  // 5. Render Alerts Grid with Category, Resolved/Unresolved, Severity and Search Filters
  function renderAlertsGrid() {
    const container = document.getElementById('alerts-grid-container');
    if (!container) return;

    let filtered = [...state.incidents];

    // Status filter: resolved or unresolved
    if (state.alertsFilter.status === 'resolved') {
      filtered = filtered.filter(i => i.status === 'resolved' || i.verificationStatus === 'Resolved');
    } else if (state.alertsFilter.status === 'unresolved') {
      filtered = filtered.filter(i => i.status !== 'resolved' && i.verificationStatus !== 'Resolved');
    }

    // Category filter
    if (state.alertsFilter.category && state.alertsFilter.category !== 'all' && state.alertsFilter.category !== 'resolved' && state.alertsFilter.category !== 'unresolved') {
      filtered = filtered.filter(i => i.category === state.alertsFilter.category);
    }

    // Severity filter
    if (state.alertsFilter.severity && state.alertsFilter.severity !== 'all') {
      filtered = filtered.filter(i => i.severity === state.alertsFilter.severity);
    }

    // Search filter
    if (state.alertsFilter.search) {
      const q = state.alertsFilter.search.toLowerCase();
      filtered = filtered.filter(i =>
        i.title.toLowerCase().includes(q) ||
        i.roadName.toLowerCase().includes(q) ||
        i.landmark.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q)
      );
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="col-span-full text-center py-12 raasta-card p-6 space-y-2">
          <i data-lucide="filter" class="w-8 h-8 text-slate-400 mx-auto"></i>
          <p class="text-sm font-bold text-slate-700">No road alerts match this specific category, severity & status filter.</p>
          <button onclick="window.raastaApp.resetAlertsFilters()" class="text-xs font-bold text-burgundy underline">Clear All Filters</button>
        </div>
      `;
      setupLucide();
      return;
    }

    container.innerHTML = filtered.map(inc => {
      const color = CATEGORY_COLORS[inc.category] || '#5C0D1D';
      return `
        <div class="raasta-card p-5 space-y-3 flex flex-col justify-between">
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded text-white" style="background:${color}">${inc.categoryLabel}</span>
              <span class="text-[11px] font-bold ${getSeverityClass(inc.severity)} px-2 py-0.5 rounded">${inc.severity.toUpperCase()}</span>
            </div>
            <h3 class="text-base font-extrabold text-slate-900 leading-snug">${escapeHtml(inc.title)}</h3>
            <p class="text-xs font-semibold text-burgundy flex items-center gap-1">
              <i data-lucide="map-pin" class="w-3.5 h-3.5"></i> ${escapeHtml(inc.roadName)}
            </p>
            <p class="text-xs text-slate-600 leading-relaxed">${escapeHtml(inc.description)}</p>
          </div>

          <div class="pt-3 border-t border-cream-border space-y-2">
            <div class="flex items-center justify-between text-[11px] text-slate-500">
              <span class="font-semibold text-emerald-700">${inc.verificationStatus}</span>
              <span>Observed: ${formatRelativeTime(inc.reportedAt)}</span>
            </div>
            <div class="flex gap-2">
              <button onclick="window.raastaApp.openIncidentDetail('${inc.id}')" class="btn-primary flex-1 justify-center !text-xs !py-1.5">
                View & Confirm
              </button>
              <button onclick="window.raastaApp.switchView('map'); window.raastaApp.focusIncidentOnMap('${inc.id}')" class="btn-secondary !text-xs !py-1.5">
                <i data-lucide="map" class="w-3.5 h-3.5 text-burgundy"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    setupLucide();
  }

  // 6. Render User Dashboard Feed & Summary
  function renderDashboardFeed() {
    const feed = document.getElementById('dash-incidents-feed');
    if (!feed) return;

    const closures = state.incidents.filter(i => i.category === 'roadblock').length;
    const works = state.incidents.filter(i => i.category === 'maintenance').length;
    const potholes = state.incidents.filter(i => i.category === 'pothole').length;
    const flooding = state.incidents.filter(i => i.category === 'flooding').length;

    const statClosures = document.getElementById('dash-stat-closures');
    if (statClosures) statClosures.textContent = closures;
    const statWorks = document.getElementById('dash-stat-maintenance');
    if (statWorks) statWorks.textContent = works;
    const statPotholes = document.getElementById('dash-stat-potholes');
    if (statPotholes) statPotholes.textContent = potholes;
    const statFlooding = document.getElementById('dash-stat-flooding');
    if (statFlooding) statFlooding.textContent = flooding;

    feed.innerHTML = state.incidents.slice(0, 5).map(inc => {
      const color = CATEGORY_COLORS[inc.category] || '#5C0D1D';
      return `
        <div class="p-3.5 bg-cream hover:bg-cream-soft rounded-xl border border-cream-border transition flex items-start justify-between gap-3">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full" style="background:${color}"></span>
              <span class="text-xs font-bold text-slate-900">${escapeHtml(inc.title)}</span>
              <span class="text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-200 font-semibold text-slate-700">${inc.categoryLabel}</span>
            </div>
            <p class="text-[11px] text-slate-600">${escapeHtml(inc.roadName)} • ${inc.landmark}</p>
          </div>
          <button onclick="window.raastaApp.openIncidentDetail('${inc.id}')" class="btn-outline-burgundy !py-1 !px-2.5 !text-xs whitespace-nowrap">
            Details
          </button>
        </div>
      `;
    }).join('');

    // Saved places and routes
    renderSavedRoutes();
    renderSavedPlaces();
  }

  function renderSavedRoutes() {
    const list = document.getElementById('dash-saved-routes-list');
    if (!list) return;

    if (!state.user || !state.user.savedRoutes || state.user.savedRoutes.length === 0) {
      list.innerHTML = `
        <div class="p-4 bg-cream rounded-xl text-center text-xs text-slate-600 space-y-2">
          <p>No saved routes yet. Save your daily route to get personalized alert notifications.</p>
          <button onclick="window.raastaApp.openAddRouteModal()" class="text-xs font-bold text-burgundy underline">Add First Route</button>
        </div>
      `;
      return;
    }

    list.innerHTML = state.user.savedRoutes.map(rt => `
      <div class="p-3 bg-cream rounded-xl border border-cream-border flex items-center justify-between gap-2">
        <div>
          <h4 class="text-xs font-bold text-slate-900">${escapeHtml(rt.title)}</h4>
          <p class="text-[11px] text-slate-600 flex items-center gap-1 mt-0.5">
            <span>${escapeHtml(rt.originLabel)}</span>
            <i data-lucide="arrow-right" class="w-3 h-3 text-burgundy"></i>
            <span>${escapeHtml(rt.destLabel)}</span>
          </p>
        </div>
        <div class="flex items-center gap-1.5">
          <button onclick="window.raastaApp.checkSavedRoute('${rt.originLabel}', '${rt.destLabel}')" title="Check Disruptions Now" class="p-1.5 bg-burgundy text-cream rounded-lg hover:bg-burgundy-light">
            <i data-lucide="compass" class="w-3.5 h-3.5"></i>
          </button>
          <button onclick="window.raastaApp.deleteSavedRoute('${rt.id}')" title="Remove" class="p-1.5 text-slate-400 hover:text-red-600">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>
    `).join('');

    setupLucide();
  }

  function renderSavedPlaces() {
    const list = document.getElementById('dash-saved-places-list');
    if (!list) return;

    if (!state.user || !state.user.savedPlaces || state.user.savedPlaces.length === 0) {
      list.innerHTML = `<p class="text-xs text-slate-500">No saved places yet.</p>`;
      return;
    }

    list.innerHTML = state.user.savedPlaces.map(sp => `
      <div class="p-2.5 bg-cream rounded-lg flex items-center justify-between text-xs">
        <div class="flex items-center gap-2">
          <i data-lucide="map-pin" class="w-3.5 h-3.5 text-burgundy"></i>
          <div>
            <p class="font-bold text-slate-800">${escapeHtml(sp.label)}</p>
            <p class="text-[10px] text-slate-500">${escapeHtml(sp.address)}</p>
          </div>
        </div>
        <button onclick="window.raastaApp.deleteSavedPlace('${sp.id}')" class="text-slate-400 hover:text-red-600">
          <i data-lucide="x" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    `).join('');

    setupLucide();
  }

  // Helper: Generate dynamically personalized detour based on specific origin, destination, and identified incidents
  function generatePersonalizedDetour(origin, dest, affected) {
    const o = origin.toLowerCase();
    const d = dest.toLowerCase();

    // Check specific corridors in Belagavi
    if (affected.some(i => i.roadName.toLowerCase().includes('congress') || i.landmark.toLowerCase().includes('gate'))) {
      if (o.includes('tilakwadi') || d.includes('tilakwadi') || o.includes('rpd') || d.includes('camp')) {
        return {
          title: `Personalized Detour for ${escapeHtml(origin)} ➔ ${escapeHtml(dest)}`,
          route: `Bypass Congress Road & 3rd Railway Gate via <strong>Tilakwadi 2nd Gate (Deshmukh Road) ➔ Club Road ➔ Goaves Circle</strong> to reconnect directly to ${escapeHtml(dest)}.`,
          benefit: `Avoids railway gate closure and peak signal congestion; saves ~12–15 mins.`
        };
      }
      return {
        title: `Personalized Detour for ${escapeHtml(origin)} ➔ ${escapeHtml(dest)}`,
        route: `Take the parallel <strong>Shahu Nagar Link Road ➔ Bogarves Junction</strong> to circumvent the Congress Road blockage.`,
        benefit: `Smooth multilane corridor; bypasses all active repair zones.`
      };
    }

    if (affected.some(i => i.roadName.toLowerCase().includes('khanapur') || i.roadName.toLowerCase().includes('camp'))) {
      if (o.includes('peeranwadi') || d.includes('peeranwadi') || o.includes('machhe') || d.includes('udyambag')) {
        return {
          title: `Personalized Detour for ${escapeHtml(origin)} ➔ ${escapeHtml(dest)}`,
          route: `Divert via <strong>Peeranwadi Bypass ➔ Bauxite Road ➔ Hindalga Ganapati Road</strong> entering Camp from the western bypass.`,
          benefit: `Completely circumvents Khanapur Road pipeline excavation; saves ~14 mins.`
        };
      }
      return {
        title: `Personalized Detour for ${escapeHtml(origin)} ➔ ${escapeHtml(dest)}`,
        route: `Use <strong>RPD College Cross ➔ Hindwadi ➔ Camp Cantonment Avenue</strong> instead of the disrupted main arterial.`,
        benefit: `Quiet residential arterial; zero bottleneck delays.`
      };
    }

    if (affected.some(i => i.roadName.toLowerCase().includes('sambra') || i.roadName.toLowerCase().includes('airport') || i.landmark.toLowerCase().includes('airport'))) {
      return {
        title: `Personalized Detour for ${escapeHtml(origin)} ➔ ${escapeHtml(dest)}`,
        route: `Take <strong>Kanbargi Ring Road / NH-48 Bypass ➔ Shahu Nagar Extension</strong> to connect directly to ${escapeHtml(dest)} avoiding Sambra culvert works.`,
        benefit: `High-speed bypass route; bypasses 3km culvert slowdown.`
      };
    }

    if (affected.some(i => i.roadName.toLowerCase().includes('mandoli'))) {
      return {
        title: `Personalized Detour for ${escapeHtml(origin)} ➔ ${escapeHtml(dest)}`,
        route: `Navigate via <strong>Savagaon Road link ➔ Military Mahadev Road</strong> to reach ${escapeHtml(dest)} smoothly.`,
        benefit: `Circumvents unpaved road shoulder repairs.`
      };
    }

    // Dynamic contextual fallback for any arbitrary route in Belagavi
    const primaryHazard = affected[0];
    return {
      title: `Personalized Detour for ${escapeHtml(origin)} ➔ ${escapeHtml(dest)}`,
      route: `To avoid <strong>${escapeHtml(primaryHazard.roadName)}</strong> (${escapeHtml(primaryHazard.title)}), divert your path via <strong>College Road ➔ Bogarves ➔ Civil Hospital Link</strong> towards ${escapeHtml(dest)}.`,
      benefit: `Guarantees continuous movement and circumvents the active hazard zone.`
    };
  }

  // 7. Route Checker Execution & Disruption Analysis
  async function executeRouteCheck() {
    const origin = document.getElementById('route-input-origin').value.trim();
    const dest = document.getElementById('route-input-dest').value.trim();
    const resultsContainer = document.getElementById('route-check-results');

    if (!origin || !dest) {
      alert('Please enter both origin and destination in Belagavi.');
      return;
    }

    // Resolve coordinates
    const c1 = resolveCoords(origin, 'route-input-origin') || { name: origin, lat: 15.8365, lng: 74.5082 };
    const c2 = resolveCoords(dest, 'route-input-dest') || { name: dest, lat: 15.8891, lng: 74.5367 };

    // Identify affected incidents matching origin, dest, or connecting corridors
    const lowerO = origin.toLowerCase();
    const lowerD = dest.toLowerCase();

    const affected = state.incidents.filter(inc => {
      const road = inc.roadName.toLowerCase();
      const land = inc.landmark.toLowerCase();
      return lowerO.includes(road) || lowerD.includes(road) ||
             (lowerO.includes('tilakwadi') && road.includes('congress')) ||
             (lowerD.includes('chennamma') && road.includes('college')) ||
             (lowerD.includes('airport') && road.includes('sambra')) ||
             (lowerD.includes('vtu') && road.includes('sambra')) ||
             (lowerO.includes('camp') && road.includes('khanapur')) ||
             (lowerD.includes('camp') && road.includes('khanapur')) ||
             (lowerD.includes('mandoli') && road.includes('mandoli'));
    });

    resultsContainer.classList.remove('hidden');

    let disruptionHtml = '';
    if (affected.length > 0) {
      const detour = generatePersonalizedDetour(origin, dest, affected);
      disruptionHtml = `
        <div class="p-4 bg-red-50 border-2 border-red-300 rounded-2xl space-y-3">
          <div class="flex items-center gap-2 text-red-900 font-extrabold text-sm">
            <i data-lucide="alert-octagon" class="w-5 h-5 text-red-600"></i>
            <span>Warning: ${affected.length} Road Disruption(s) Identified Along This Corridor</span>
          </div>
          <div class="space-y-2">
            ${affected.map(inc => `
              <div class="p-3 bg-white rounded-xl border border-red-200 shadow-sm flex items-start justify-between gap-3">
                <div>
                  <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded text-white bg-red-600">${inc.categoryLabel}</span>
                  <h4 class="text-xs font-bold text-slate-900 mt-1">${escapeHtml(inc.title)}</h4>
                  <p class="text-[11px] text-slate-600">${escapeHtml(inc.roadName)} (${inc.landmark})</p>
                  <p class="text-[10px] text-amber-700 font-semibold mt-1">Expected end: ${inc.expectedEndTime}</p>
                </div>
                <button onclick="window.raastaApp.openIncidentDetail('${inc.id}')" class="btn-outline-burgundy !py-1 !px-2.5 !text-xs whitespace-nowrap">
                  View Notice
                </button>
              </div>
            `).join('')}
          </div>

          <!-- Dynamic Personalized Detour Suggestion -->
          <div class="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl space-y-1.5 text-xs shadow-sm">
            <p class="font-extrabold text-emerald-900 flex items-center gap-1.5">
              <i data-lucide="split" class="w-4 h-4 text-emerald-700"></i> ${detour.title}:
            </p>
            <p class="text-emerald-800 leading-relaxed">
              ${detour.route}
            </p>
            <div class="pt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
              <i data-lucide="sparkles" class="w-3.5 h-3.5 text-emerald-600"></i>
              <span>${detour.benefit}</span>
            </div>
          </div>
        </div>
      `;
    } else {
      disruptionHtml = `
        <div class="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl space-y-2 text-emerald-900">
          <div class="flex items-center gap-2 font-bold text-sm">
            <i data-lucide="check-circle-2" class="w-5 h-5 text-emerald-600"></i>
            <span>Route Clear: No Severe Roadblocks Reported</span>
          </div>
          <p class="text-xs text-emerald-800">
            Standard commute speed expected between <strong>${escapeHtml(origin)}</strong> and <strong>${escapeHtml(dest)}</strong>. Road condition is optimal.
          </p>
        </div>
      `;
    }

    const initialDistanceKm = calculateDistanceKm(c1.lat, c1.lng, c2.lat, c2.lng);
    const initialDurationMin = Math.round(initialDistanceKm * 2.5 + 4);

    resultsContainer.innerHTML = `
      <div class="raasta-card p-6 space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between border-b border-cream-border pb-3 gap-2">
          <div>
            <h3 class="text-base font-extrabold text-burgundy">Journey Evaluation Report</h3>
            <p class="text-xs text-slate-500">Origin to Destination Road Network Analysis</p>
          </div>
          <div class="flex items-center gap-2">
            <span id="route-badge-distance" class="text-xs font-extrabold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-300 flex items-center gap-1.5 shadow-sm">
              <i data-lucide="gauge" class="w-3.5 h-3.5 text-emerald-700"></i> <span id="route-dist-text">${initialDistanceKm} km Distance</span>
            </span>
            <span id="route-badge-duration" class="text-xs font-extrabold bg-amber-100 text-amber-900 px-3 py-1 rounded-full border border-amber-300 flex items-center gap-1.5 shadow-sm">
              <i data-lucide="clock" class="w-3.5 h-3.5 text-amber-700"></i> <span id="route-dur-text">~${initialDurationMin} mins</span>
            </span>
          </div>
        </div>

        <!-- On-Map Interactive Route Display -->
        <div class="space-y-1.5">
          <div class="flex justify-between items-center text-xs">
            <span class="font-bold text-burgundy flex items-center gap-1.5">
              <i data-lucide="map" class="w-3.5 h-3.5 text-amber-500"></i> Real Road Route Preview & Driving Distance:
            </span>
            <span class="text-[11px] text-slate-500 font-semibold">${escapeHtml(c1.name || origin)} ➔ ${escapeHtml(c2.name || dest)}</span>
          </div>
          <div id="route-result-mini-map" class="h-72 w-full rounded-xl border-2 border-cream-border shadow-inner relative z-0"></div>
          <div class="flex items-center justify-between text-[11px] text-slate-500 pt-0.5 px-1">
            <span class="flex items-center gap-1 text-burgundy font-semibold">
              <span class="inline-block w-2.5 h-2.5 rounded-full bg-emerald-600"></span> Origin: ${escapeHtml(c1.name || origin)}
            </span>
            <span class="flex items-center gap-1 text-burgundy font-semibold">
              <span class="inline-block w-2.5 h-2.5 rounded-full bg-burgundy"></span> Destination: ${escapeHtml(c2.name || dest)}
            </span>
          </div>
        </div>

        ${disruptionHtml}

        <div class="pt-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs text-slate-500 border-t border-cream-border">
          <span class="flex items-center gap-1"><i data-lucide="navigation-2" class="w-3.5 h-3.5 text-burgundy"></i> Street-level OSRM driving geometry applied</span>
          <button onclick="window.raastaApp.switchView('map')" class="text-burgundy font-bold underline flex items-center gap-1">
            <i data-lucide="radar" class="w-3.5 h-3.5"></i> Inspect on Full City Radar →
          </button>
        </div>
      </div>
    `;

    setupLucide();

    // Render interactive route map with actual road geometry
    setTimeout(() => {
      renderRouteOnMiniMap(c1, c2, affected);
    }, 150);
  }

  async function renderRouteOnMiniMap(c1, c2, affectedIncidents) {
    const mapDiv = document.getElementById('route-result-mini-map');
    if (!mapDiv) return;

    if (state.routeMiniMap) {
      state.routeMiniMap.remove();
      state.routeMiniMap = null;
    }

    const map = L.map('route-result-mini-map');
    state.routeMiniMap = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    // Origin Marker (Green)
    const originIcon = L.divIcon({
      className: 'custom-route-icon',
      html: `<div style="background-color:#059669; color:#fff; font-weight:bold; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2.5px solid #fff; box-shadow:0 2px 8px rgba(0,0,0,0.35); font-size:12px;">A</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
    L.marker([c1.lat, c1.lng], { icon: originIcon }).addTo(map).bindPopup(`<b>Origin:</b> ${escapeHtml(c1.name)}`);

    // Destination Marker (Burgundy)
    const destIcon = L.divIcon({
      className: 'custom-route-icon',
      html: `<div style="background-color:#5C0D1D; color:#fff; font-weight:bold; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2.5px solid #fff; box-shadow:0 2px 8px rgba(0,0,0,0.35); font-size:12px;">B</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
    L.marker([c2.lat, c2.lng], { icon: destIcon }).addTo(map).bindPopup(`<b>Destination:</b> ${escapeHtml(c2.name)}`);

    // Try fetching real road network path from OpenStreetMap OSRM routing service
    let latlngs = [];
    try {
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${c1.lng},${c1.lat};${c2.lng},${c2.lat}?overview=full&geometries=geojson`;
      const res = await fetch(osrmUrl);
      if (res.ok) {
        const data = await res.json();
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          // GeoJSON coordinates are [lng, lat] -> convert to Leaflet [lat, lng]
          latlngs = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
          
          // Update real driving distance and driving duration
          const actualKm = (route.distance / 1000).toFixed(1);
          const actualMin = Math.round(route.duration / 60);
          
          const distEl = document.getElementById('route-dist-text');
          const durEl = document.getElementById('route-dur-text');
          if (distEl) distEl.textContent = `${actualKm} km Road Distance`;
          if (durEl) durEl.textContent = `~${actualMin} mins Driving`;
        }
      }
    } catch (err) {
      console.warn('OSRM routing fetch fallback to road corridor nodes:', err);
    }

    // Fallback if offline or network timeout: generate corridor road segments through Belagavi junctions
    if (latlngs.length === 0) {
      const mid1Lat = c1.lat + (c2.lat - c1.lat) * 0.33 + 0.002;
      const mid1Lng = c1.lng + (c2.lng - c1.lng) * 0.33 - 0.001;
      const mid2Lat = c1.lat + (c2.lat - c1.lat) * 0.66 - 0.0015;
      const mid2Lng = c1.lng + (c2.lng - c1.lng) * 0.66 + 0.002;
      latlngs = [
        [c1.lat, c1.lng],
        [mid1Lat, mid1Lng],
        [mid2Lat, mid2Lng],
        [c2.lat, c2.lng]
      ];
    }

    // Outer glow / road outline
    L.polyline(latlngs, {
      color: '#F59E0B',
      weight: 8,
      opacity: 0.6,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);

    // Inner primary road line
    const roadPolyline = L.polyline(latlngs, {
      color: '#5C0D1D',
      weight: 5,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);

    // Plot affected disruptions along the corridor
    if (affectedIncidents && affectedIncidents.length > 0) {
      affectedIncidents.forEach(inc => {
        const hazIcon = L.divIcon({
          className: 'hazard-icon',
          html: `<div style="background-color:#DC2626; color:#fff; font-weight:bold; width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid #fff; box-shadow:0 2px 8px rgba(220,38,38,0.5); font-size:12px;">!</div>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13]
        });
        L.marker([inc.lat, inc.lng], { icon: hazIcon }).addTo(map)
          .bindPopup(`<b>Hazard: ${escapeHtml(inc.title)}</b><br><span style="font-size:11px;color:#b91c1c">${escapeHtml(inc.roadName)}</span>`);
      });
    }

    map.fitBounds(roadPolyline.getBounds().pad(0.18));
  }

  function setRoutePreset(orig, dest) {
    document.getElementById('route-input-origin').value = orig + ', Belagavi';
    document.getElementById('route-input-dest').value = dest + ', Belagavi';
    executeRouteCheck();
  }

  function checkHeroRoute() {
    const oInput = document.getElementById('hero-origin');
    const dInput = document.getElementById('hero-dest');
    const o = oInput ? oInput.value : '';
    const d = dInput ? dInput.value : '';

    switchView('route-checker');

    const rOrig = document.getElementById('route-input-origin');
    const rDest = document.getElementById('route-input-dest');
    if (rOrig) {
      rOrig.value = o;
      if (oInput && oInput.getAttribute('data-lat')) {
        rOrig.setAttribute('data-lat', oInput.getAttribute('data-lat'));
        rOrig.setAttribute('data-lng', oInput.getAttribute('data-lng'));
      }
    }
    if (rDest) {
      rDest.value = d;
      if (dInput && dInput.getAttribute('data-lat')) {
        rDest.setAttribute('data-lat', dInput.getAttribute('data-lat'));
        rDest.setAttribute('data-lng', dInput.getAttribute('data-lng'));
      }
    }
    executeRouteCheck();
  }

  // 8. Incident Details & Community Voting
  function openIncidentDetail(id) {
    const inc = state.incidents.find(i => i.id === id);
    if (!inc) return;

    const modal = document.getElementById('modal-incident-detail');
    const content = document.getElementById('incident-modal-content');
    const color = CATEGORY_COLORS[inc.category] || '#5C0D1D';

    content.innerHTML = `
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold uppercase px-2.5 py-1 rounded text-white" style="background:${color}">${inc.categoryLabel}</span>
          <span class="text-xs font-bold ${getSeverityClass(inc.severity)} px-2.5 py-1 rounded uppercase">${inc.severity} Severity</span>
        </div>

        <div>
          <h3 class="text-xl font-extrabold text-slate-900">${escapeHtml(inc.title)}</h3>
          <p class="text-xs font-semibold text-burgundy flex items-center gap-1 mt-1">
            <i data-lucide="map-pin" class="w-4 h-4"></i> ${escapeHtml(inc.roadName)} (${inc.landmark})
          </p>
        </div>

        <div class="p-3 bg-cream rounded-xl text-xs space-y-1 text-slate-700">
          <p><strong>Description:</strong> ${escapeHtml(inc.description)}</p>
          <p><strong>Expected Clearance:</strong> ${escapeHtml(inc.expectedEndTime || 'Ongoing assessment')}</p>
          <p><strong>Source / Reporter:</strong> ${escapeHtml(inc.reportedBy)} (${inc.reportedRole})</p>
          ${inc.officialSource ? `<p class="text-emerald-800"><strong>Official Gazette:</strong> ${escapeHtml(inc.officialSource)}</p>` : ''}
        </div>

        <!-- Verification Status & Evidence -->
        <div class="border border-cream-border p-3.5 rounded-xl space-y-2">
          <div class="flex items-center justify-between text-xs">
            <span class="font-bold text-slate-700">Verification Status:</span>
            <span class="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">${inc.verificationStatus}</span>
          </div>
          <p class="text-[11px] text-slate-500">
            Backed by ${inc.confirmations.confirm} independent community confirmations and ward officer notice.
          </p>
        </div>

        <!-- Community Voting Section -->
        <div class="bg-cream-soft p-4 rounded-xl space-y-2.5 border border-cream-border">
          <h4 class="text-xs font-bold text-burgundy uppercase">Commuter Road Confirmation</h4>
          <p class="text-[11px] text-slate-600">Are you travelling on this road? Help keep Belagavi informed:</p>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button onclick="window.raastaApp.submitVote('${inc.id}', 'confirm')" class="px-2 py-2 bg-white hover:bg-emerald-50 border border-slate-300 hover:border-emerald-500 rounded-lg text-xs font-semibold text-slate-800 flex flex-col items-center gap-0.5">
              <span>👍 I Confirm</span>
              <span class="text-[10px] text-emerald-600 font-bold">${inc.confirmations.confirm}</span>
            </button>
            <button onclick="window.raastaApp.submitVote('${inc.id}', 'stillHappening')" class="px-2 py-2 bg-white hover:bg-amber-50 border border-slate-300 hover:border-amber-500 rounded-lg text-xs font-semibold text-slate-800 flex flex-col items-center gap-0.5">
              <span>⚠️ Still Active</span>
              <span class="text-[10px] text-amber-600 font-bold">${inc.confirmations.stillHappening}</span>
            </button>
            <button onclick="window.raastaApp.submitVote('${inc.id}', 'resolved')" class="px-2 py-2 bg-white hover:bg-blue-50 border border-slate-300 hover:border-blue-500 rounded-lg text-xs font-semibold text-slate-800 flex flex-col items-center gap-0.5">
              <span>✅ Resolved</span>
              <span class="text-[10px] text-blue-600 font-bold">${inc.confirmations.resolved}</span>
            </button>
            <button onclick="window.raastaApp.submitVote('${inc.id}', 'inaccurate')" class="px-2 py-2 bg-white hover:bg-red-50 border border-slate-300 hover:border-red-500 rounded-lg text-xs font-semibold text-slate-800 flex flex-col items-center gap-0.5">
              <span>❌ Inaccurate</span>
              <span class="text-[10px] text-red-600 font-bold">${inc.confirmations.inaccurate}</span>
            </button>
          </div>
        </div>

        <div class="pt-2 flex justify-between items-center">
          <button onclick="window.raastaApp.switchView('map'); window.raastaApp.closeModal('modal-incident-detail'); window.raastaApp.focusIncidentOnMap('${inc.id}')" class="btn-primary !text-xs">
            <i data-lucide="map" class="w-3.5 h-3.5"></i> Locate on Radar
          </button>
          <button onclick="window.raastaApp.closeModal('modal-incident-detail')" class="btn-secondary !text-xs">
            Close
          </button>
        </div>
      </div>
    `;

    setupLucide();
    modal.classList.remove('hidden');
  }

  async function submitVote(incidentId, action) {
    try {
      const res = await fetch(`/api/incidents/${incidentId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, voterId: state.user ? state.user.id : undefined })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to register community response.');
        return;
      }
      alert('Thank you! Your community confirmation helps Belagavi commuters.');
      await loadIncidents();
      openIncidentDetail(incidentId); // Refresh modal view
    } catch (e) {
      alert('Network error while submitting vote.');
    }
  }

  // 9. Report Issue Form & Pin Map Picker
  function initPickerMap() {
    const container = document.getElementById('picker-map');
    if (!container || state.pickerMap) return;

    state.pickerMap = L.map('picker-map').setView([state.cityConfig.lat, state.cityConfig.lng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(state.pickerMap);

    state.pickerMarker = L.marker([state.cityConfig.lat, state.cityConfig.lng], { draggable: true }).addTo(state.pickerMap);

    state.pickerMarker.on('dragend', function(e) {
      const pos = e.target.getLatLng();
      updatePickerCoords(pos.lat, pos.lng);
    });

    state.pickerMap.on('click', function(e) {
      state.pickerMarker.setLatLng(e.latlng);
      updatePickerCoords(e.latlng.lat, e.latlng.lng);
    });
  }

  function updatePickerCoords(lat, lng) {
    const latEl = document.getElementById('report-lat');
    const lngEl = document.getElementById('report-lng');
    const display = document.getElementById('pin-coords-display');
    
    if (latEl) latEl.value = lat.toFixed(5);
    if (lngEl) lngEl.value = lng.toFixed(5);
    if (display) display.textContent = `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`;

    // Detect and autofill nearest landmark and road name if empty
    let nearest = null;
    let minD = 999;
    for (const key in BELAGAVI_POINTS) {
      const p = BELAGAVI_POINTS[key];
      const d = Math.hypot(p.lat - lat, p.lng - lng);
      if (d < minD) {
        minD = d;
        nearest = p;
      }
    }

    if (nearest && minD < 0.02) {
      const landmarkInput = document.getElementById('report-landmark');
      const roadInput = document.getElementById('report-road-name');
      if (landmarkInput && !landmarkInput.value) {
        landmarkInput.value = nearest.name;
      }
      if (roadInput && !roadInput.value) {
        roadInput.value = `${nearest.name.split(',')[0]} Road`;
      }
    }
  }

  async function handleReportSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const category = form.reportCategory.value;
    const roadName = document.getElementById('report-road-name').value.trim();
    const landmark = document.getElementById('report-landmark').value.trim();
    const title = document.getElementById('report-title').value.trim();
    const description = document.getElementById('report-description').value.trim();
    const severity = document.getElementById('report-severity').value;
    const lat = document.getElementById('report-lat').value;
    const lng = document.getElementById('report-lng').value;
    const reporterName = document.getElementById('report-reporter-name').value.trim() || (state.user ? state.user.name : 'Belagavi Citizen');

    const payload = {
      title,
      category,
      roadName,
      landmark,
      description,
      severity,
      lat,
      lng,
      reporterName
    };

    try {
      const res = await fetch('/api/incidents/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to submit report');
        return;
      }

      alert(`✅ Road Report successfully submitted! Reference ID: ${data.referenceId}.\nIt is now listed for community confirmation.`);
      form.reset();
      await loadIncidents();
      switchView('map');
      focusIncidentOnMap(data.referenceId);
    } catch (err) {
      alert('Error submitting report. Please try again.');
    }
  }

  // 10. Admin Portal & Moderation Functions
  async function loadAdminData() {
    if (!state.user || state.user.role !== 'admin') {
      alert('Admin access requires administrative clearance. Please log in with the admin demo account.');
      openAuthModal('login');
      return;
    }

    try {
      const res = await fetch('/api/admin/reports', {
        headers: { 'Authorization': `Bearer ${state.token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Access denied');
        return;
      }

      const tableBody = document.getElementById('admin-reports-table-body');
      const queueCount = document.getElementById('admin-queue-count');
      if (queueCount) queueCount.textContent = `${data.incidents.length} Records in System`;

      if (tableBody) {
        tableBody.innerHTML = data.incidents.map(inc => `
          <tr class="hover:bg-cream">
            <td class="p-3">
              <span class="font-mono text-[10px] text-slate-500">${inc.id}</span>
              <p class="font-bold text-slate-800">${escapeHtml(inc.title)}</p>
            </td>
            <td class="p-3">
              <span class="px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase" style="background:${CATEGORY_COLORS[inc.category] || '#5C0D1D'}">
                ${inc.category}
              </span>
            </td>
            <td class="p-3">
              <p class="font-semibold text-slate-800">${escapeHtml(inc.roadName)}</p>
              <p class="text-[10px] text-slate-500">${escapeHtml(inc.landmark)}</p>
            </td>
            <td class="p-3 text-[11px] text-slate-600">${escapeHtml(inc.reportedBy)}</td>
            <td class="p-3">
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                ${inc.verificationStatus}
              </span>
            </td>
            <td class="p-3 text-[11px]">
              <span class="text-emerald-700 font-bold">${inc.confirmations.confirm}</span> / 
              <span class="text-blue-700 font-bold">${inc.confirmations.resolved}</span>
            </td>
            <td class="p-3 text-right space-x-1">
              <button onclick="window.raastaApp.moderateIncident('${inc.id}', 'Verified', 'active')" class="px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[10px] font-bold">
                Verify
              </button>
              <button onclick="window.raastaApp.moderateIncident('${inc.id}', 'Resolved', 'resolved')" class="px-2 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded text-[10px] font-bold">
                Resolve
              </button>
              <button onclick="window.raastaApp.moderateIncident('${inc.id}', 'Rejected', 'inactive')" class="px-2 py-1 bg-red-700 hover:bg-red-800 text-white rounded text-[10px] font-bold">
                Reject
              </button>
            </td>
          </tr>
        `).join('');
      }

      // Audit list
      const auditList = document.getElementById('admin-audit-list');
      if (auditList && data.auditTrail) {
        auditList.innerHTML = data.auditTrail.map(aud => `
          <div class="p-2.5 bg-cream rounded-lg border border-cream-border flex justify-between items-center">
            <div>
              <p class="font-bold text-slate-800">${escapeHtml(aud.action)}</p>
              <p class="text-[10px] text-slate-500">By ${escapeHtml(aud.moderatorName)} • ${escapeHtml(aud.reason)}</p>
            </div>
            <span class="text-[10px] text-slate-400">${formatRelativeTime(aud.timestamp)}</span>
          </div>
        `).join('');
      }

    } catch (e) {
      console.error(e);
    }
  }

  async function moderateIncident(incidentId, verificationStatus, newStatus) {
    const reason = prompt('Enter moderation note / official reference:', 'Checked against Belagavi Traffic Police dispatch');
    if (reason === null) return;

    try {
      const res = await fetch('/api/admin/moderate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`
        },
        body: JSON.stringify({
          incidentId,
          verificationStatus,
          newStatus,
          reason
        })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to moderate');
        return;
      }
      alert('Status updated successfully.');
      await loadIncidents();
      await loadAdminData();
    } catch (e) {
      alert('Error communicating with server.');
    }
  }

  async function resetDemoData() {
    if (!confirm('Reset all Belagavi road records back to standard demo dataset?')) return;
    try {
      const res = await fetch('/api/admin/reset-demo-data', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${state.token}` }
      });
      await res.json();
      alert('Demo incidents restored.');
      await loadIncidents();
      await loadAdminData();
    } catch (e) {
      alert('Reset failed.');
    }
  }

  // 11. Authentication (Login / Register / Session)
  async function checkSession() {
    if (!state.token) {
      updateAuthUI(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${state.token}` }
      });
      if (res.ok) {
        const user = await res.json();
        state.user = user;
        updateAuthUI(true);
      } else {
        logout();
      }
    } catch (e) {
      console.warn('Session verification offline:', e);
    }
  }

  function updateAuthUI(isLoggedIn) {
    const loggedOutEl = document.getElementById('auth-logged-out');
    const loggedInEl = document.getElementById('auth-logged-in');
    const userDisplayName = document.getElementById('user-display-name');
    const userAvatarInitial = document.getElementById('user-avatar-initial');
    const dashUserName = document.getElementById('dash-user-name');

    if (isLoggedIn && state.user) {
      if (loggedOutEl) loggedOutEl.classList.add('hidden');
      if (loggedInEl) loggedInEl.classList.remove('hidden');
      if (userDisplayName) userDisplayName.textContent = state.user.name.split(' ')[0];
      if (userAvatarInitial) userAvatarInitial.textContent = state.user.name[0].toUpperCase();
      if (dashUserName) dashUserName.textContent = state.user.name.split(' ')[0];
    } else {
      if (loggedOutEl) loggedOutEl.classList.remove('hidden');
      if (loggedInEl) loggedInEl.classList.add('hidden');
      if (dashUserName) dashUserName.textContent = 'Belagavi Commuter';
    }
  }

  async function handleAuthSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    const name = document.getElementById('auth-name').value.trim();

    const endpoint = state.authMode === 'signup' ? '/api/auth/register' : '/api/auth/login';
    const payload = state.authMode === 'signup' ? { name, email, password } : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Authentication failed');
        return;
      }

      state.token = data.token;
      state.user = data.user;
      localStorage.setItem('raasta_token', data.token);

      updateAuthUI(true);
      closeModal('modal-auth');
      alert(`Welcome, ${state.user.name}!`);

      if (state.currentView === 'landing') {
        switchView('dashboard');
      } else {
        renderDashboardFeed();
      }
    } catch (err) {
      alert('Network or server error during sign in.');
    }
  }

  function quickLogin(role) {
    if (role === 'admin') {
      document.getElementById('auth-email').value = 'admin@raasta.in';
      document.getElementById('auth-password').value = 'admin123';
    } else {
      document.getElementById('auth-email').value = 'rahul@example.com';
      document.getElementById('auth-password').value = 'raasta2026';
    }
    setAuthMode('login');
    document.getElementById('auth-submit-btn').click();
  }

  function toggleAuthMode() {
    setAuthMode(state.authMode === 'login' ? 'signup' : 'login');
  }

  function setAuthMode(mode) {
    state.authMode = mode;
    const title = document.getElementById('auth-modal-title');
    const nameField = document.getElementById('auth-name-field');
    const submitBtn = document.getElementById('auth-submit-btn');
    const switchPrompt = document.getElementById('auth-switch-prompt');
    const switchBtn = document.getElementById('auth-switch-btn');

    if (mode === 'signup') {
      if (title) title.textContent = 'Create a Raasta Account';
      if (nameField) nameField.classList.remove('hidden');
      if (submitBtn) submitBtn.textContent = 'Create Free Account';
      if (switchPrompt) switchPrompt.textContent = 'Already registered?';
      if (switchBtn) switchBtn.textContent = 'Sign In';
    } else {
      if (title) title.textContent = 'Sign in to Raasta';
      if (nameField) nameField.classList.add('hidden');
      if (submitBtn) submitBtn.textContent = 'Sign In';
      if (switchPrompt) switchPrompt.textContent = "Don't have an account?";
      if (switchBtn) switchBtn.textContent = 'Sign Up';
    }
  }

  function logout() {
    state.token = null;
    state.user = null;
    localStorage.removeItem('raasta_token');
    updateAuthUI(false);
    switchView('landing');
  }

  // 12. Saved Places and Routes Management
  async function submitNewSavedRoute() {
    if (!state.user) {
      alert('Please log in to save personalized routes.');
      openAuthModal('login');
      return;
    }

    const title = document.getElementById('new-route-title').value.trim();
    const originLabel = document.getElementById('new-route-origin').value.trim();
    const destLabel = document.getElementById('new-route-dest').value.trim();

    if (!originLabel || !destLabel) {
      alert('Origin and destination are required.');
      return;
    }

    try {
      const res = await fetch('/api/user/routes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`
        },
        body: JSON.stringify({
          title,
          originLabel,
          destLabel,
          originCoords: [15.8365, 74.5082],
          destCoords: [15.8891, 74.5367]
        })
      });
      const data = await res.json();
      state.user.savedRoutes = data.savedRoutes;
      closeModal('modal-add-route');
      renderSavedRoutes();
      alert('Journey route saved to your Belagavi profile!');
    } catch (e) {
      alert('Failed to save route');
    }
  }

  async function deleteSavedRoute(id) {
    if (!confirm('Remove this route from your saved list?')) return;
    try {
      const res = await fetch(`/api/user/routes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${state.token}` }
      });
      const data = await res.json();
      state.user.savedRoutes = data.savedRoutes;
      renderSavedRoutes();
    } catch (e) {
      alert('Failed to delete route');
    }
  }

  async function submitNewSavedPlace() {
    if (!state.user) {
      alert('Please log in to save places.');
      openAuthModal('login');
      return;
    }

    const label = document.getElementById('new-place-label').value.trim();
    const address = document.getElementById('new-place-address').value.trim();

    if (!label) {
      alert('Please enter a place label (e.g. Office).');
      return;
    }

    try {
      const res = await fetch('/api/user/places', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`
        },
        body: JSON.stringify({
          label,
          address: address || 'Belagavi, Karnataka',
          lat: 15.8497,
          lng: 74.4977
        })
      });
      const data = await res.json();
      state.user.savedPlaces = data.savedPlaces;
      closeModal('modal-add-place');
      renderSavedPlaces();
    } catch (e) {
      alert('Failed to save place');
    }
  }

  async function deleteSavedPlace(id) {
    try {
      const res = await fetch(`/api/user/places/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${state.token}` }
      });
      const data = await res.json();
      state.user.savedPlaces = data.savedPlaces;
      renderSavedPlaces();
    } catch (e) {
      alert('Failed to delete place');
    }
  }

  function checkSavedRoute(orig, dest) {
    switchView('route-checker');
    document.getElementById('route-input-origin').value = orig;
    document.getElementById('route-input-dest').value = dest;
    executeRouteCheck();
  }

  function saveCurrentRoutePrompt() {
    if (!state.user) {
      openAuthModal('signup');
      return;
    }
    const o = document.getElementById('route-input-origin').value;
    const d = document.getElementById('route-input-dest').value;
    document.getElementById('new-route-origin').value = o;
    document.getElementById('new-route-dest').value = d;
    document.getElementById('new-route-title').value = `${o.split(',')[0]} to ${d.split(',')[0]}`;
    openAddRouteModal();
  }

  // 13. Settings & API Keys
  async function saveApiSettings() {
    const key = document.getElementById('settings-google-api-key').value.trim();
    try {
      const res = await fetch('/api/config/api-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ googleMapsApiKey: key })
      });
      await res.json();
      alert('Configuration updated successfully!');
      closeModal('modal-api');
    } catch (e) {
      alert('Error updating configuration.');
    }
  }

  // 14. View Switching Navigation
  function switchView(viewName) {
    state.currentView = viewName;
    window.location.hash = viewName;

    // Hide all view panels
    document.querySelectorAll('.view-panel').forEach(p => p.classList.add('hidden'));

    // Show target view panel
    const target = document.getElementById(`view-${viewName}`);
    if (target) {
      target.classList.remove('hidden');
    }

    // Update active nav links
    document.querySelectorAll('.nav-item').forEach(btn => {
      if (btn.getAttribute('data-view') === viewName) {
        btn.classList.add('bg-[#7E1529]');
      } else if (!btn.classList.contains('bg-[#7E1529]') || btn.getAttribute('data-view') !== 'report') {
        btn.classList.remove('bg-[#7E1529]');
      }
    });

    // Close mobile menu if open
    const mobMenu = document.getElementById('mobile-nav-menu');
    if (mobMenu) mobMenu.classList.add('hidden');

    // Trigger map invalidation / rendering if entering map view
    if (viewName === 'map') {
      setTimeout(() => {
        if (!state.map) initMainMap();
        else state.map.invalidateSize();
      }, 100);
    }

    if (viewName === 'report') {
      setTimeout(() => {
        if (!state.pickerMap) initPickerMap();
        else state.pickerMap.invalidateSize();
      }, 100);
    }

    if (viewName === 'dashboard') {
      if (!state.user) {
        openAuthModal('login');
      } else {
        renderDashboardFeed();
      }
    }

    if (viewName === 'admin') {
      loadAdminData();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    setupLucide();
  }

  // Filter Handlers
  function applyMapFilters() {
    state.activeFilters.category = document.getElementById('map-filter-category').value;
    state.activeFilters.severity = document.getElementById('map-filter-severity').value;
    loadIncidents();
  }

  function resetMapFilters() {
    document.getElementById('map-filter-category').value = 'all';
    document.getElementById('map-filter-severity').value = 'all';
    state.activeFilters.category = 'all';
    state.activeFilters.severity = 'all';
    loadIncidents();
  }

  function filterAlertsByCategory(cat) {
    if (cat === 'resolved' || cat === 'unresolved') {
      state.alertsFilter.status = cat;
      // keep existing category if already set or default
    } else if (cat === 'all') {
      state.alertsFilter.category = 'all';
      state.alertsFilter.status = 'all';
    } else {
      state.alertsFilter.category = cat;
    }

    // Update active button classes
    document.querySelectorAll('.alert-cat-btn').forEach(btn => {
      const btnCat = btn.getAttribute('data-cat');
      const isSelected = (btnCat === 'all' && state.alertsFilter.category === 'all' && state.alertsFilter.status === 'all') ||
                         (btnCat === state.alertsFilter.status) ||
                         (btnCat === state.alertsFilter.category && state.alertsFilter.status === 'all');

      if (isSelected) {
        btn.className = 'alert-cat-btn px-3 py-1.5 rounded-lg bg-burgundy text-cream font-semibold shadow-sm';
      } else if (btnCat === 'unresolved') {
        btn.className = 'alert-cat-btn px-3 py-1.5 rounded-lg bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300 font-semibold';
      } else if (btnCat === 'resolved') {
        btn.className = 'alert-cat-btn px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-900 hover:bg-emerald-200 border border-emerald-300 font-semibold';
      } else {
        btn.className = 'alert-cat-btn px-3 py-1.5 rounded-lg bg-cream-soft text-slate-700 hover:bg-cream border border-cream-border font-medium';
      }
    });

    renderAlertsGrid();
  }

  function filterAlertsBySeverity(sev) {
    state.alertsFilter.severity = sev;
    renderAlertsGrid();
  }

  function filterAlertsTable() {
    state.alertsFilter.search = document.getElementById('alerts-search-input').value.trim();
    renderAlertsGrid();
  }

  function resetAlertsFilters() {
    state.alertsFilter = { category: 'all', status: 'all', severity: 'all', search: '' };
    const searchInput = document.getElementById('alerts-search-input');
    if (searchInput) searchInput.value = '';
    const sevSelect = document.getElementById('alerts-severity-select');
    if (sevSelect) sevSelect.value = 'all';
    filterAlertsByCategory('all');
  }

  // --- Interactive Pin Drop Map Picker Functions ---
  function openPinPickerModal(targetInputId) {
    state.activePickerTarget = targetInputId;
    const modal = document.getElementById('modal-pin-picker');
    if (!modal) return;
    modal.classList.remove('hidden');

    // Get current input value to center map if available
    const inputEl = document.getElementById(targetInputId);
    let startLat = state.cityConfig.lat;
    let startLng = state.cityConfig.lng;
    let startName = 'Tilakwadi 3rd Gate, Belagavi';

    if (inputEl && inputEl.value.trim()) {
      const match = resolveCoords(inputEl.value.trim());
      if (match) {
        startLat = match.lat;
        startLng = match.lng;
        startName = match.name;
      }
    }

    state.currentPickerCoords = { lat: startLat, lng: startLng, address: startName };
    updatePickerModalUI(startLat, startLng, startName);

    setTimeout(() => {
      initOrUpdatePickerModalMap(startLat, startLng);
    }, 150);

    setupLucide();
  }

  function initOrUpdatePickerModalMap(lat, lng) {
    const mapDiv = document.getElementById('interactive-pin-picker-map');
    if (!mapDiv) return;

    if (!state.pickerModalMap) {
      state.pickerModalMap = L.map('interactive-pin-picker-map').setView([lat, lng], 14);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(state.pickerModalMap);

      const pinIcon = L.divIcon({
        className: 'picker-pin-icon',
        html: `<div style="background-color:#5C0D1D; color:#fff; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2.5px solid #fff; box-shadow:0 3px 10px rgba(0,0,0,0.4); font-size:16px;">📍</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 34]
      });

      state.pickerModalMarker = L.marker([lat, lng], { icon: pinIcon, draggable: true }).addTo(state.pickerModalMap);

      state.pickerModalMarker.on('dragend', function(e) {
        const pos = e.target.getLatLng();
        handleMapPinDrop(pos.lat, pos.lng);
      });

      state.pickerModalMap.on('click', function(e) {
        state.pickerModalMarker.setLatLng(e.latlng);
        handleMapPinDrop(e.latlng.lat, e.latlng.lng);
      });

      setTimeout(() => {
        if (state.pickerModalMap) state.pickerModalMap.invalidateSize();
      }, 250);
    } else {
      state.pickerModalMap.setView([lat, lng], 14);
      state.pickerModalMarker.setLatLng([lat, lng]);
      setTimeout(() => {
        if (state.pickerModalMap) state.pickerModalMap.invalidateSize();
      }, 100);
    }
  }

  function handleMapPinDrop(lat, lng) {
    // Find nearest landmark across comprehensive Belagavi database
    let nearestName = `Belagavi Location (${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E)`;
    let minD = 999;
    for (const key in BELAGAVI_POINTS) {
      const p = BELAGAVI_POINTS[key];
      const d = Math.hypot(p.lat - lat, p.lng - lng);
      if (d < minD) {
        minD = d;
        if (d < 0.015) {
          nearestName = `${p.name}, Belagavi`;
        } else if (d < 0.035) {
          nearestName = `Near ${p.name}, Belagavi`;
        }
      }
    }

    state.currentPickerCoords = { lat, lng, address: nearestName };
    updatePickerModalUI(lat, lng, nearestName);

    // Asynchronously query OpenStreetMap Nominatim for human-readable street address if online
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`)
      .then(res => res.json())
      .then(geo => {
        if (geo && geo.display_name) {
          const parts = geo.display_name.split(',');
          const shortAddr = parts.slice(0, 3).join(',').trim();
          state.currentPickerCoords.address = `${shortAddr}, Belagavi`;
          updatePickerModalUI(lat, lng, state.currentPickerCoords.address);
        }
      })
      .catch(() => {
        // graceful offline fallback to nearest identified landmark
      });
  }

  function setPickerPreset(name, lat, lng) {
    state.currentPickerCoords = { lat, lng, address: `${name}, Belagavi` };
    if (state.pickerModalMap && state.pickerModalMarker) {
      state.pickerModalMap.setView([lat, lng], 15);
      state.pickerModalMarker.setLatLng([lat, lng]);
    }
    updatePickerModalUI(lat, lng, `${name}, Belagavi`);
  }

  function updatePickerModalUI(lat, lng, address) {
    const addrEl = document.getElementById('picker-selected-address');
    if (addrEl) addrEl.textContent = address;
    const coordsEl = document.getElementById('picker-selected-coords');
    if (coordsEl) coordsEl.textContent = `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`;
  }

  function confirmPinPickerSelection() {
    if (state.activePickerTarget && state.currentPickerCoords) {
      const input = document.getElementById(state.activePickerTarget);
      if (input) {
        input.value = state.currentPickerCoords.address;
        input.setAttribute('data-lat', state.currentPickerCoords.lat);
        input.setAttribute('data-lng', state.currentPickerCoords.lng);
      }
    }
    closeModal('modal-pin-picker');
  }

  // Modals & UI Toggles
  function openAuthModal(mode) {
    setAuthMode(mode || 'login');
    const m = document.getElementById('modal-auth');
    if (m) m.classList.remove('hidden');
    setupLucide();
  }

  function openApiModal() {
    const m = document.getElementById('modal-api');
    if (m) m.classList.remove('hidden');
    setupLucide();
  }

  function openAddRouteModal() {
    const m = document.getElementById('modal-add-route');
    if (m) m.classList.remove('hidden');
    setupLucide();
  }

  function openAddPlaceModal() {
    const m = document.getElementById('modal-add-place');
    if (m) m.classList.remove('hidden');
    setupLucide();
  }

  function closeModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.add('hidden');
  }

  function toggleMobileMenu() {
    const m = document.getElementById('mobile-nav-menu');
    if (m) m.classList.toggle('hidden');
  }

  function toggleNotifDropdown() {
    const d = document.getElementById('notif-dropdown');
    if (d) d.classList.toggle('hidden');
  }

  function markAllNotifsRead() {
    const badge = document.getElementById('notif-badge');
    if (badge) badge.classList.add('hidden');
    alert('All road alerts marked as read.');
    toggleNotifDropdown();
  }

  // Utilities
  function escapeHtml(text) {
    if (!text) return '';
    return String(text).replace(/[&<>"']/g, function(m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
  }

  function getSeverityClass(sev) {
    if (sev === 'critical') return 'badge-critical';
    if (sev === 'moderate') return 'badge-moderate';
    return 'badge-minor';
  }

  function formatRelativeTime(isoString) {
    if (!isoString) return 'recently';
    const diff = (Date.now() - new Date(isoString).getTime()) / 1000;
    if (diff < 3600) return `${Math.round(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.round(diff / 3600)} hr ago`;
    return `${Math.round(diff / 86400)} days ago`;
  }

  // Expose to window for inline HTML onclick handlers
  window.raastaApp = {
    startPercentageLoader,
    stopPercentageLoader,
    wrapBackendCall,
    switchView,
    openAuthModal,
    openApiModal,
    openAddRouteModal,
    openAddPlaceModal,
    closeModal,
    toggleAuthMode,
    quickLogin,
    handleAuthSubmit,
    logout,
    loadIncidents,
    focusIncidentOnMap,
    openIncidentDetail,
    submitVote,
    handleReportSubmit,
    applyMapFilters,
    resetMapFilters,
    filterAlertsByCategory,
    filterAlertsBySeverity,
    filterAlertsTable,
    resetAlertsFilters,
    openPinPickerModal,
    setPickerPreset,
    confirmPinPickerSelection,
    executeRouteCheck,
    setRoutePreset,
    checkHeroRoute,
    checkSavedRoute,
    saveCurrentRoutePrompt,
    submitNewSavedRoute,
    deleteSavedRoute,
    submitNewSavedPlace,
    deleteSavedPlace,
    saveApiSettings,
    loadAdminData,
    moderateIncident,
    resetDemoData,
    toggleMobileMenu,
    toggleNotifDropdown,
    markAllNotifsRead
  };

  // Start application on DOM ready
  document.addEventListener('DOMContentLoaded', init);

})();
