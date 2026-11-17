import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../services/api.js';

/** Load an admin quiz (with validated questions). */
export function useQuiz(quizId) {
  const [data, setData] = useState({ quiz: null, questions: [], stats: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await adminApi.getQuiz(quizId);
      setData(r);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [quizId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { ...data, loading, error, reload, setData };
}
