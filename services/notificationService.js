// services/notificationService.js
// Commuter Route Overlap Detection & Notification Generator

const { calculateDistanceKm } = require('./changeDetector');

/**
 * Check if a road incident affects any saved commuter route or place
 */
function evaluateCommuterAlerts(incident, users, actionType = 'NEW_DISRUPTION') {
  const notificationsGenerated = [];
  const incLat = incident.lat;
  const incLng = incident.lng;
  const incRoad = (incident.roadName || '').toLowerCase();

  for (const user of users) {
    if (!user.savedRoutes && !user.savedPlaces) continue;

    let affected = false;
    let matchReason = '';

    // Check saved routes
    if (user.savedRoutes) {
      for (const rt of user.savedRoutes) {
        const orig = (rt.originLabel || '').toLowerCase();
        const dest = (rt.destLabel || '').toLowerCase();

        // Check road name or corridor endpoints
        if (orig.includes(incRoad) || dest.includes(incRoad) || incRoad.includes(orig) || incRoad.includes(dest)) {
          affected = true;
          matchReason = `Directly affects your saved route: "${rt.title}" (${rt.originLabel} ➔ ${rt.destLabel})`;
          break;
        }

        // Proximity check to origin or destination coords (< 1.5 km)
        if (rt.originCoords && rt.originCoords.length === 2) {
          const d1 = Math.hypot(rt.originCoords[0] - incLat, rt.originCoords[1] - incLng);
          if (d1 < 0.015) {
            affected = true;
            matchReason = `Disruption detected near your origin point for "${rt.title}"`;
            break;
          }
        }
        if (rt.destCoords && rt.destCoords.length === 2) {
          const d2 = Math.hypot(rt.destCoords[0] - incLat, rt.destCoords[1] - incLng);
          if (d2 < 0.015) {
            affected = true;
            matchReason = `Disruption detected near your destination point for "${rt.title}"`;
            break;
          }
        }
      }
    }

    // Check saved places
    if (!affected && user.savedPlaces) {
      for (const sp of user.savedPlaces) {
        if (sp.lat && sp.lng) {
          const d = Math.hypot(sp.lat - incLat, sp.lng - incLng);
          if (d < 0.012) { // ~1.2 km
            affected = true;
            matchReason = `Disruption reported near saved place: "${sp.label}" (${sp.address})`;
            break;
          }
        }
      }
    }

    if (affected) {
      const notif = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        userId: user.id,
        incidentId: incident.id,
        title: actionType === 'INCIDENT_RESOLVED' ? `Road Clear: ${incident.roadName}` : `Road Alert: ${incident.title}`,
        message: actionType === 'INCIDENT_RESOLVED' 
          ? `Disruption resolved on ${incident.roadName}. Traffic movement restored.` 
          : `${matchReason}. Severity: ${incident.severity.toUpperCase()}.`,
        severity: incident.severity,
        read: false,
        createdAt: new Date().toISOString()
      };

      notificationsGenerated.push(notif);
    }
  }

  return notificationsGenerated;
}

module.exports = { evaluateCommuterAlerts };
