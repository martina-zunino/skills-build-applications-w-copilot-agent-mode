import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Activity = {
  _id: string;
  user: string;
  team: string;
  type: string;
  minutes: number;
  points: number;
  occurredAt: string;
};

type ApiResponse = {
  activities: Activity[];
};

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getJson<ApiResponse>('/api/activities')
      .then((data) => {
        setActivities(data.activities);
        setLoading(false);
      })
      .catch((err) => {
        setError('Unable to load activities');
        setLoading(false);
      });
  }, []);

  return (
    <section className="card">
      <div className="card-body">
        <h2 className="h4">Activities</h2>
        {loading && <div role="status">Loading activities...</div>}
        {error && <div role="alert">{error}</div>}
        {!loading && !error && activities.length === 0 && <p>No activities recorded yet. Get moving!</p>}
        {!loading && !error && activities.length > 0 && (
          <div className="table-responsive">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Minutes</th>
                  <th>Points</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((activity) => (
                  <tr key={activity._id}>
                    <td>{activity.type}</td>
                    <td>{activity.minutes}</td>
                    <td>{activity.points}</td>
                    <td>{new Date(activity.occurredAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
