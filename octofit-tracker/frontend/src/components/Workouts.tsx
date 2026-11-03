import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Suggestion = { title?: string; reason?: string };

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getJson<{ suggestions: Suggestion[] }>(
      `/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`,
    )
      .then((data) => {
        if (!Array.isArray(data.suggestions)) throw new Error('Invalid workout suggestions response');
        if (active) setSuggestions(data.suggestions);
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
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      items={suggestions}
      error={error}
      emptyMessage="No workout suggestions yet."
      renderItem={(suggestion) => <>{suggestion.title ?? 'Workout'}{suggestion.reason && ` — ${suggestion.reason}`}</>}
    />
  );
}
