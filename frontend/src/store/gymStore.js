import { create } from 'zustand';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export const useGymStore = create((set, get) => ({
  gyms: [],
  selectedGymId: null,
  liveSnapshot: null,
  analytics: null,
  crossGymData: [],
  anomalies: [],
  activityFeed: [],
  dateRange: '30d',
  isWsConnected: false,
  simulatorState: { status: 'paused', speed: 1 },
  loading: {
    gyms: true,
    snapshot: true,
    analytics: true,
    anomalies: true
  },

  setWsConnected: (status) => set({ isWsConnected: status }),

  setDateRange: (range) => {
    set({ dateRange: range });
    const { selectedGymId, fetchAnalytics } = get();
    if (selectedGymId) {
      fetchAnalytics(selectedGymId, range);
    }
  },

  setSelectedGymId: (id) => {
    set({ selectedGymId: id });
    const { fetchLiveSnapshot, fetchAnalytics, dateRange } = get();
    fetchLiveSnapshot(id);
    fetchAnalytics(id, dateRange);
  },

  fetchGyms: async () => {
    try {
      const res = await fetch(`${API_BASE}/api/gyms`);
      if (res.ok) {
        const data = await res.json();
        set({ gyms: data, loading: { ...get().loading, gyms: false } });
        if (!get().selectedGymId && data.length > 0) {
          get().setSelectedGymId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching gyms:', err);
    }
  },

  fetchLiveSnapshot: async (gymId) => {
    if (!gymId) return;
    set({ loading: { ...get().loading, snapshot: true } });
    try {
      const res = await fetch(`${API_BASE}/api/gyms/${gymId}/live`);
      if (res.ok) {
        const data = await res.json();
        set({ liveSnapshot: data, loading: { ...get().loading, snapshot: false } });
      }
    } catch (err) {
      console.error('Error fetching live snapshot:', err);
    }
  },

  fetchAnalytics: async (gymId, dateRange = '30d') => {
    if (!gymId) return;
    set({ loading: { ...get().loading, analytics: true } });
    try {
      const res = await fetch(`${API_BASE}/api/gyms/${gymId}/analytics?dateRange=${dateRange}`);
      if (res.ok) {
        const data = await res.json();
        set({ analytics: data, loading: { ...get().loading, analytics: false } });
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  },

  fetchCrossGym: async () => {
    try {
      const res = await fetch(`${API_BASE}/api/analytics/cross-gym`);
      if (res.ok) {
        const data = await res.json();
        set({ crossGymData: data });
      }
    } catch (err) {
      console.error('Error fetching cross gym data:', err);
    }
  },

  fetchAnomalies: async () => {
    set({ loading: { ...get().loading, anomalies: true } });
    try {
      const res = await fetch(`${API_BASE}/api/anomalies`);
      if (res.ok) {
        const data = await res.json();
        set({ anomalies: data, loading: { ...get().loading, anomalies: false } });
      }
    } catch (err) {
      console.error('Error fetching anomalies:', err);
    }
  },

  fetchActivityFeed: async () => {
    try {
      const res = await fetch(`${API_BASE}/api/analytics/activity-feed`);
      if (res.ok) {
        const data = await res.json();
        set({ activityFeed: data });
      }
    } catch (err) {
      console.error('Error fetching activity feed:', err);
    }
  },

  dismissAnomaly: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/anomalies/${id}/dismiss`, { method: 'PATCH' });
      if (res.ok) {
        const updated = await res.json();
        set((state) => ({
          anomalies: state.anomalies.filter((a) => a.id !== id)
        }));
        return { success: true };
      } else {
        const errData = await res.json();
        return { success: false, error: errData.error };
      }
    } catch (err) {
      console.error('Error dismissing anomaly:', err);
      return { success: false, error: 'Network error' };
    }
  },

  handleWsEvent: (event) => {
    const { type, gym_id } = event;
    const { selectedGymId, liveSnapshot, anomalies, activityFeed, fetchGyms, fetchCrossGym } = get();

    // 1. Update activity feed
    if (type === 'CHECKIN_EVENT' || type === 'CHECKOUT_EVENT' || type === 'PAYMENT_EVENT') {
      const newFeedItem = {
        event_type: type.replace('_EVENT', ''),
        member_name: event.member_name,
        gym_name: event.gym_name,
        timestamp: event.timestamp || new Date().toISOString(),
        gym_id: event.gym_id
      };
      set({ activityFeed: [newFeedItem, ...activityFeed.slice(0, 19)] });
    }

    // 2. Update selected gym snapshot if matches
    if (selectedGymId === gym_id && liveSnapshot) {
      if (type === 'CHECKIN_EVENT' || type === 'CHECKOUT_EVENT') {
        set({
          liveSnapshot: {
            ...liveSnapshot,
            current_occupancy: event.current_occupancy
          }
        });
      } else if (type === 'PAYMENT_EVENT') {
        set({
          liveSnapshot: {
            ...liveSnapshot,
            today_revenue: event.today_total
          }
        });
      }
    }

    // 3. Handle Anomaly Events
    if (type === 'ANOMALY_DETECTED') {
      const newAnomaly = {
        id: event.anomaly_id,
        gym_id: event.gym_id,
        gym_name: event.gym_name,
        type: event.anomaly_type,
        severity: event.severity,
        message: event.message,
        detected_at: new Date().toISOString(),
        resolved: false
      };
      set({ anomalies: [newAnomaly, ...anomalies.filter((a) => a.id !== event.anomaly_id)] });
    } else if (type === 'ANOMALY_RESOLVED') {
      set({ anomalies: anomalies.filter((a) => a.id !== event.anomaly_id) });
    }

    // Periodically update all-gym summaries
    fetchGyms();
    fetchCrossGym();
  },

  startSimulator: async (speed = 1) => {
    try {
      const res = await fetch(`${API_BASE}/api/simulator/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ speed })
      });
      if (res.ok) {
        const data = await res.json();
        set({ simulatorState: { status: data.status, speed: data.speed } });
      }
    } catch (err) {
      console.error('Error starting simulator:', err);
    }
  },

  stopSimulator: async () => {
    try {
      const res = await fetch(`${API_BASE}/api/simulator/stop`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        set({ simulatorState: { status: data.status, speed: get().simulatorState.speed } });
      }
    } catch (err) {
      console.error('Error stopping simulator:', err);
    }
  },

  resetSimulator: async () => {
    try {
      const res = await fetch(`${API_BASE}/api/simulator/reset`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        set({ simulatorState: { status: 'paused', speed: 1 } });
        get().fetchGyms();
        if (get().selectedGymId) {
          get().fetchLiveSnapshot(get().selectedGymId);
        }
      }
    } catch (err) {
      console.error('Error resetting simulator:', err);
    }
  }
}));
