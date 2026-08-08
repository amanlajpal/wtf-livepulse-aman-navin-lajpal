import { useEffect } from 'react';
import { useGymStore } from '../store/gymStore';

export function useAnomalies() {
  const anomalies = useGymStore((state) => state.anomalies);
  const loading = useGymStore((state) => state.loading.anomalies);
  const fetchAnomalies = useGymStore((state) => state.fetchAnomalies);
  const dismissAnomaly = useGymStore((state) => state.dismissAnomaly);

  useEffect(() => {
    fetchAnomalies();
  }, [fetchAnomalies]);

  return {
    anomalies,
    loading,
    dismissAnomaly,
    fetchAnomalies
  };
}
