// services/monitorEngine.js
// Autonomous Background Monitoring Engine with Change Detection, Audit Preservation, & SSE Broadcast

const realtimeSync = require('./realtimeSync');
const { detectChange, getCategoryLabel } = require('./changeDetector');
const { INITIAL_SOURCES, pollSource, queueTestNotice, clearTestNotices } = require('./sourceAdapters');
const { evaluateCommuterAlerts } = require('./notificationService');

class MonitorEngine {
  constructor() {
    this.sources = [...INITIAL_SOURCES];
    this.timerHandles = new Map();
    this.isRunning = false;
    this.stats = {
      startedAt: null,
      lastCheckTime: null,
      nextScheduledCheckTime: null,
      totalChecksRun: 0,
      newIncidentsDetected: 0,
      incidentsUpdated: 0,
      awaitingVerificationCount: 0,
      failedChecksCount: 0,
      recentSyncLog: []
    };
    this.dbGetter = null;
    this.dbSaver = null;
  }

  /**
   * Bind Database functions
   */
  init(dbGetter, dbSaver) {
    this.dbGetter = dbGetter;
    this.dbSaver = dbSaver;
    this.restoreSourceState();
    this.start();
  }

  restoreSourceState() {
    const db = this.dbGetter ? this.dbGetter() : null;
    if (db && db.autoSyncSources && Array.isArray(db.autoSyncSources)) {
      // Merge saved source states with current definitions
      const savedMap = new Map(db.autoSyncSources.map(s => [s.id, s]));
      this.sources = this.sources.map(src => {
        const saved = savedMap.get(src.id);
        if (saved) {
          return {
            ...src,
            enabled: typeof saved.enabled === 'boolean' ? saved.enabled : src.enabled,
            intervalMinutes: saved.intervalMinutes || src.intervalMinutes,
            status: saved.status || src.status,
            lastChecked: saved.lastChecked || null,
            itemsDetected: saved.itemsDetected || 0,
            itemsUpdated: saved.itemsUpdated || 0,
            failuresCount: saved.failuresCount || 0
          };
        }
        return src;
      });
    }
  }

  saveSourceState() {
    if (!this.dbGetter || !this.dbSaver) return;
    const db = this.dbGetter();
    db.autoSyncSources = this.sources;
    this.dbSaver(db);
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.stats.startedAt = new Date().toISOString();
    console.log('🔄 RAASTA Automated Monitoring Engine started (Timezone: Asia/Kolkata)');

    // Schedule each enabled source according to its interval
    for (const source of this.sources) {
      this.scheduleSource(source);
    }

    // Schedule existing incident reconciliation every 15 minutes
    this.reconcileHandle = setInterval(() => {
      this.reconcileIncidents();
    }, 15 * 60 * 1000);

    // Initial check run shortly after startup (after 5 seconds)
    setTimeout(() => {
      this.runAllChecks();
    }, 5000);
  }

  stop() {
    this.isRunning = false;
    for (const [id, handle] of this.timerHandles) {
      clearInterval(handle);
    }
    this.timerHandles.clear();
    if (this.reconcileHandle) clearInterval(this.reconcileHandle);
    console.log('⏹️ RAASTA Monitoring Engine paused.');
  }

  scheduleSource(source) {
    if (this.timerHandles.has(source.id)) {
      clearInterval(this.timerHandles.get(source.id));
      this.timerHandles.delete(source.id);
    }

    if (!source.enabled) return;

    const intervalMs = Math.max(1, source.intervalMinutes || 15) * 60 * 1000;
    source.nextCheck = new Date(Date.now() + intervalMs).toISOString();

    const handle = setInterval(async () => {
      await this.runSourceCheck(source.id);
    }, intervalMs);

    this.timerHandles.set(source.id, handle);
  }

  /**
   * Run check on a specific source
   */
  async runSourceCheck(sourceId) {
    const source = this.sources.find(s => s.id === sourceId);
    if (!source) return null;

    source.status = 'Checking';
    this.broadcastSyncUpdate();

    try {
      const pollResult = await pollSource(source);
      source.lastChecked = new Date().toISOString();
      const intervalMs = Math.max(1, source.intervalMinutes || 15) * 60 * 1000;
      source.nextCheck = new Date(Date.now() + intervalMs).toISOString();
      this.stats.lastCheckTime = source.lastChecked;
      this.stats.totalChecksRun++;

      if (pollResult.error) {
        source.status = pollResult.status;
        source.failuresCount++;
        source.lastError = pollResult.error;
        this.stats.failedChecksCount++;
        this.logSyncActivity(`Check failed for ${source.name}: ${pollResult.error}`, 'error');
      } else {
        source.status = pollResult.status;
        source.lastError = null;

        // Process any returned incident items
        if (pollResult.items && pollResult.items.length > 0) {
          await this.processIncomingItems(pollResult.items, source);
        } else {
          this.logSyncActivity(`Checked ${source.name} — ${pollResult.status}`, 'info');
        }
      }

      this.saveSourceState();
      this.broadcastSyncUpdate();
      return pollResult;
    } catch (err) {
      source.status = 'Temporarily unavailable';
      source.failuresCount++;
      source.lastError = err.message;
      this.stats.failedChecksCount++;
      this.logSyncActivity(`Unexpected error checking ${source.name}: ${err.message}`, 'error');
      this.saveSourceState();
      this.broadcastSyncUpdate();
      return { error: err.message };
    }
  }

  /**
   * Run all enabled source checks immediately
   */
  async runAllChecks() {
    this.logSyncActivity('Running automated cycle across all registered information sources...', 'info');
    for (const source of this.sources) {
      if (source.enabled) {
        await this.runSourceCheck(source.id);
      }
    }
    this.reconcileIncidents();
  }

  /**
   * Ingest and reconcile incoming items through change detection
   */
  async processIncomingItems(items, source) {
    if (!this.dbGetter || !this.dbSaver) return;
    const db = this.dbGetter();

    for (const item of items) {
      const evaluation = detectChange(item, db.incidents);

      if (evaluation.action === 'NEW_INCIDENT') {
        // Create new incident
        const newId = `inc-auto-${Date.now().toString().slice(-4)}-${Math.random().toString(36).substr(2, 3)}`;
        const verificationStatus = source.trustLevel === 'Officially Confirmed' ? 'Officially Confirmed' : 'Automatically Detected';
        
        const newIncident = {
          id: newId,
          externalId: item.externalId,
          title: item.title,
          category: item.category,
          categoryLabel: getCategoryLabel(item.category),
          roadName: item.roadName,
          landmark: item.landmark,
          description: item.description,
          severity: item.severity,
          verificationStatus,
          lat: item.lat,
          lng: item.lng,
          reportedBy: item.reportedBy || source.name,
          reportedRole: item.reportedRole || 'official',
          reportedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          expectedEndTime: item.expectedEndTime || 'Under assessment',
          confirmations: { confirm: 1, stillHappening: 1, resolved: 0, inaccurate: 0 },
          voters: [],
          isDemo: false,
          isAutoDetected: true,
          sourceId: source.id,
          officialSource: item.officialSource || source.name,
          sourceUrl: item.sourceUrl || source.url,
          status: item.status || 'active',
          history: [
            {
              timestamp: new Date().toISOString(),
              action: `Automatically Collected by ${source.name}`,
              note: `Initial detection from ${source.name}. Trust classification: ${verificationStatus}.`
            }
          ]
        };

        db.incidents.unshift(newIncident);
        source.itemsDetected++;
        this.stats.newIncidentsDetected++;
        if (verificationStatus === 'Automatically Detected') {
          this.stats.awaitingVerificationCount++;
        }

        this.logSyncActivity(`New disruption detected: "${newIncident.title}" on ${newIncident.roadName} via ${source.name}`, 'success');

        // Evaluate commuter route alerts
        const userNotifs = evaluateCommuterAlerts(newIncident, db.users, 'NEW_DISRUPTION');
        if (userNotifs.length > 0) {
          db.notifications = (db.notifications || []).concat(userNotifs);
          userNotifs.forEach(notif => {
            realtimeSync.broadcast('commuter_notification', notif);
          });
        }

        // Broadcast real-time SSE event to all connected website visitors
        realtimeSync.broadcast('incident_created', newIncident);

      } else if (evaluation.action === 'UPDATE_INCIDENT') {
        const existing = evaluation.existing;
        const changeNotes = evaluation.changes.map(c => c.note).join('; ');

        // Apply detected updates
        if (item.status && item.status !== existing.status) existing.status = item.status;
        if (item.expectedEndTime) existing.expectedEndTime = item.expectedEndTime;
        if (item.severity) existing.severity = item.severity;
        if (item.description && item.description.length > existing.description.length) {
          existing.description = item.description;
        }

        existing.updatedAt = new Date().toISOString();
        existing.history.push({
          timestamp: new Date().toISOString(),
          action: `Automated Change Detected by ${source.name}`,
          note: changeNotes
        });

        source.itemsUpdated++;
        this.stats.incidentsUpdated++;
        this.logSyncActivity(`Updated incident "${existing.title}": ${changeNotes}`, 'warning');

        // Check if resolved to notify commuters of road clear
        if (existing.status === 'resolved') {
          const userNotifs = evaluateCommuterAlerts(existing, db.users, 'INCIDENT_RESOLVED');
          if (userNotifs.length > 0) {
            db.notifications = (db.notifications || []).concat(userNotifs);
            userNotifs.forEach(notif => {
              realtimeSync.broadcast('commuter_notification', notif);
            });
          }
          realtimeSync.broadcast('incident_resolved', existing);
        } else {
          realtimeSync.broadcast('incident_updated', existing);
        }
      }
    }

    this.dbSaver(db);
    realtimeSync.broadcast('stats_updated', this.getEngineStatus());
  }

  /**
   * Existing Incident Reconciliation:
   * Flags expired or overdue incidents without marking resolved unless confirmed
   */
  reconcileIncidents() {
    if (!this.dbGetter || !this.dbSaver) return;
    const db = this.dbGetter();
    let modified = false;

    for (const inc of db.incidents) {
      if (inc.status === 'active' && inc.expectedEndTime && inc.expectedEndTime.includes('Yesterday')) {
        // Flag for moderator check rather than auto-deleting
        if (!inc.needsReverification) {
          inc.needsReverification = true;
          inc.history.push({
            timestamp: new Date().toISOString(),
            action: 'Flagged for Reverification',
            note: 'Estimated completion time elapsed; awaiting authoritative clearance notice or moderator review.'
          });
          modified = true;
        }
      }
    }

    if (modified) {
      this.dbSaver(db);
      this.broadcastSyncUpdate();
    }
  }

  logSyncActivity(message, level = 'info') {
    const entry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      message,
      level
    };

    this.stats.recentSyncLog.unshift(entry);
    if (this.stats.recentSyncLog.length > 40) {
      this.stats.recentSyncLog.pop();
    }

    // Broadcast log event to admin console
    realtimeSync.broadcast('sync_log_entry', entry);
  }

  broadcastSyncUpdate() {
    realtimeSync.broadcast('autosync_status', this.getEngineStatus());
  }

  getEngineStatus() {
    return {
      isRunning: this.isRunning,
      stats: this.stats,
      sources: this.sources,
      connectedClients: realtimeSync.getClientCount(),
      serverTime: new Date().toISOString(),
      timezone: 'Asia/Kolkata'
    };
  }

  toggleSource(sourceId, enabled) {
    const source = this.sources.find(s => s.id === sourceId);
    if (!source) return { success: false, error: 'Source not found' };

    source.enabled = Boolean(enabled);
    if (!source.enabled) {
      if (this.timerHandles.has(source.id)) {
        clearInterval(this.timerHandles.get(source.id));
        this.timerHandles.delete(source.id);
      }
      source.status = 'Disabled';
      source.nextCheck = null;
    } else {
      source.status = 'Connected';
      this.scheduleSource(source);
    }

    this.saveSourceState();
    this.broadcastSyncUpdate();
    return { success: true, source };
  }

  setSourceInterval(sourceId, intervalMinutes) {
    const source = this.sources.find(s => s.id === sourceId);
    if (!source) return { success: false, error: 'Source not found' };

    const interval = Math.max(5, Math.min(1440, parseInt(intervalMinutes, 10) || 15));
    source.intervalMinutes = interval;
    if (source.enabled) {
      this.scheduleSource(source);
    }

    this.saveSourceState();
    this.broadcastSyncUpdate();
    return { success: true, source };
  }

  addCustomSource(sourceData) {
    const newId = `src-custom-${Date.now().toString().slice(-4)}`;
    const newSource = {
      id: newId,
      name: sourceData.name || 'Custom Civic Advisory Source',
      category: sourceData.category || 'roadblock',
      type: 'custom_url',
      url: sourceData.url,
      enabled: true,
      intervalMinutes: Math.max(10, parseInt(sourceData.intervalMinutes, 10) || 30),
      trustLevel: sourceData.trustLevel || 'Awaiting Verification',
      status: 'Connected',
      lastChecked: null,
      nextCheck: null,
      itemsDetected: 0,
      itemsUpdated: 0,
      failuresCount: 0,
      lastError: null,
      notes: sourceData.notes || 'Administrator configured custom information source'
    };

    this.sources.push(newSource);
    this.scheduleSource(newSource);
    this.saveSourceState();
    this.broadcastSyncUpdate();
    return { success: true, source: newSource };
  }
}

const monitorEngine = new MonitorEngine();
module.exports = {
  monitorEngine,
  queueTestNotice,
  clearTestNotices
};
