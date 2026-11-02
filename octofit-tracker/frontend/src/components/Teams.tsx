import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Team = {
  _id: string;
  name: string;
  mascot: string;
  members: string[];
};

type ApiResponse = {
  teams: Team[];
};

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getJson<ApiResponse>('/api/teams')
      .then((data) => {
        setTeams(data.teams);
        setLoading(false);
      })
      .catch((err) => {
        setError('Unable to load teams');
        setLoading(false);
      });
  }, []);

  return (
    <section className="card">
      <div className="card-body">
        <h2 className="h4">Teams</h2>
        {loading && <div role="status">Loading teams...</div>}
        {error && <div role="alert">{error}</div>}
        {!loading && !error && teams.length === 0 && <p>No teams yet. Time to build a squad!</p>}
        {!loading && !error && teams.length > 0 && (
          <div className="row g-3">
            {teams.map((team) => (
              <div key={team._id} className="col-md-6">
                <div className="card">
                  <div className="card-body">
                    <h3 className="card-title h5">{team.name}</h3>
                    <p className="card-text">Mascot: {team.mascot}</p>
                    <p className="card-text">
                      <small className="text-muted">Members: {team.members.length}</small>
                    </p>
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
