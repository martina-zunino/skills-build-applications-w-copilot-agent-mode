import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Workout = {
  _id: string;
  title: string;
  focus: string;
  minutes: number;
  difficulty: string;
  reason?: string;
};

type ApiResponse = {
  suggestions: Workout[];
};

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getJson<ApiResponse>('/api/workouts/suggestions/mona%40example.com')
      .then((data) => {
        setSuggestions(data.suggestions);
        setLoading(false);
      })
      .catch((err) => {
        setError('Unable to load workout suggestions');
        setLoading(false);
      });
  }, []);

  return (
    <section className="card">
      <div className="card-body">
        <h2 className="h4">Workout suggestions</h2>
        {loading && <div role="status">Loading workout suggestions...</div>}
        {error && <div role="alert">{error}</div>}
        {!loading && !error && suggestions.length === 0 && <p>No workout suggestions available at this time.</p>}
        {!loading && !error && suggestions.length > 0 && (
          <div className="row g-3">
            {suggestions.map((workout) => (
              <div key={workout._id} className="col-md-6">
                <div className="card">
                  <div className="card-body">
                    <h3 className="card-title h5">{workout.title}</h3>
                    <p className="card-text">
                      <strong>Focus:</strong> {workout.focus}
                    </p>
                    <p className="card-text">
                      <strong>Duration:</strong> {workout.minutes} minutes
                    </p>
                    <p className="card-text">
                      <strong>Difficulty:</strong> {workout.difficulty}
                    </p>
                    {workout.reason && (
                      <p className="card-text">
                        <small className="text-muted">{workout.reason}</small>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
