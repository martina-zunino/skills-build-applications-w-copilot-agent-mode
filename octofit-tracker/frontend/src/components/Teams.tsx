import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Team = { name?: string; members?: string[] };

export default function Teams() {
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getJson<{ teams: Team[] }>('/api/teams')
      .then((data) => {
        if (!Array.isArray(data.teams)) throw new Error('Invalid teams response');
        if (active) setTeams(data.teams);
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
      title="Teams"
      description="Manage teams and members."
      items={teams}
      error={error}
      emptyMessage="No teams yet."
      renderItem={(team) => <>{team.name ?? 'Team'}{team.members?.length ? ` — ${team.members.join(', ')}` : ''}</>}
    />
  );
}
