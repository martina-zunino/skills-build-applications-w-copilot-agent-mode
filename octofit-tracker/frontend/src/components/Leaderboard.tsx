import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type LeaderboardEntry = {
  teamName: string;
  totalPoints: number;
  rank: number;
};

type ApiResponse = {
  leaderboard: LeaderboardEntry[];
};

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getJson<ApiResponse>('/api/leaderboard')
      .then((data) => {
        setLeaderboard(data.leaderboard);
        setLoading(false);
      })
      .catch((err) => {
        setError('Unable to load leaderboard');
        setLoading(false);
      });
  }, []);

  return (
    <section className="card">
      <div className="card-body">
        <h2 className="h4">Leaderboard</h2>
        {loading && <div role="status">Loading leaderboard...</div>}
        {error && <div role="alert">{error}</div>}
        {!loading && !error && leaderboard.length === 0 && <p>No rankings yet. Start logging activities!</p>}
        {!loading && !error && leaderboard.length > 0 && (
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Team</th>
                  <th>Total Points</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry) => (
                  <tr key={entry.rank}>
                    <td>{entry.rank}</td>
                    <td>{entry.teamName}</td>
                    <td className="fw-bold">{entry.totalPoints}</td>
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
