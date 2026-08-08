import { useEffect } from 'react';
import { useGymStore } from '../store/gymStore';

export function useGymData() {
  const gyms = useGymStore((state) => state.gyms);
  const selectedGymId = useGymStore((state) => state.selectedGymId);
  const liveSnapshot = useGymStore((state) => state.liveSnapshot);
  const analytics = useGymStore((state) => state.analytics);
  const crossGymData = useGymStore((state) => state.crossGymData);
  const activityFeed = useGymStore((state) => state.activityFeed);
  const loading = useGymStore((state) => state.loading);
  const dateRange = useGymStore((state) => state.dateRange);

  const fetchGyms = useGymStore((state) => state.fetchGyms);
  const fetchCrossGym = useGymStore((state) => state.fetchCrossGym);
  const fetchActivityFeed = useGymStore((state) => state.fetchActivityFeed);
  const setSelectedGymId = useGymStore((state) => state.setSelectedGymId);
  const setDateRange = useGymStore((state) => state.setDateRange);

  useEffect(() => {
    fetchGyms();
    fetchCrossGym();
    fetchActivityFeed();
  }, [fetchGyms, fetchCrossGym, fetchActivityFeed]);

  return {
    gyms,
    selectedGymId,
    liveSnapshot,
    analytics,
    crossGymData,
    activityFeed,
    loading,
    dateRange,
    setSelectedGymId,
    setDateRange
  };
}
