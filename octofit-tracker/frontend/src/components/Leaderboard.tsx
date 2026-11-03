import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Ranking = { teamName?: string; totalPoints?: number; rank?: number };

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<Ranking[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getJson<{ leaderboard: Ranking[] }>('/api/leaderboard')
      .then((data) => {
        if (!Array.isArray(data.leaderboard)) throw new Error('Invalid leaderboard response');
        if (active) setLeaderboard(data.leaderboard);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : String(reason));
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <CapabilityCard
      title="Leaderboard"
      description="Compare team point totals."
      items={leaderboard}
      error={error}
      emptyMessage="No rankings yet."
      renderItem={(ranking) => <>{ranking.rank != null && `#${ranking.rank} `}{ranking.teamName ?? 'Team'}{ranking.totalPoints != null && ` — ${ranking.totalPoints} points`}</>}
    />
  );
}
