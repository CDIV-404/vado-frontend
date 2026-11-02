import { EXPERIMENTS, FEATURE_FLAGS, type Experiment } from '../data/mock';
import { load, save } from './store';

export type FlagState = Record<string, boolean>;

export function flagOn(id: string): boolean {
  const def = FEATURE_FLAGS.find((f) => f.id === id)?.defaultOn ?? false;
  return load<FlagState>('featureFlags', {})[id] ?? def;
}

export function setFlag(id: string, on: boolean): void {
  save('featureFlags', { ...load<FlagState>('featureFlags', {}), [id]: on });
}

export function onVariant(exp: Experiment): string | null {
  if (exp.status === 'stopped') return null;
  const bucket = load<string>('deviceId', '') || (() => {
    const id = `dev-${Math.random().toString(36).slice(2, 10)}`;
    save('deviceId', id);
    return id;
  })();
  let h = 0;
  for (const ch of `${exp.id}:${bucket}`) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  if (h % 100 >= exp.rollout) return null;
  const overrides = load<Record<string, number>>('expVariant', {});
  const idx = overrides[exp.id] ?? h % exp.variants.length;
  return exp.variants[idx];
}

export function forceVariant(expId: string, variant: string): void {
  const exp = EXPERIMENTS.find((e) => e.id === expId);
  if (!exp) return;
  const idx = exp.variants.indexOf(variant);
  if (idx < 0) return;
  save('expVariant', { ...load<Record<string, number>>('expVariant', {}), [expId]: idx });
}
