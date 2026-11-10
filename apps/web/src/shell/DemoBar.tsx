import { useSyncExternalStore } from 'react';
import { demo, SCENARIOS, type DemoScenario } from '../data';
import { useToast } from '../lib/toast';
import { forgetSampleVisits } from '../lib/visits';

/**
 * Shown on every sample screen, so sample data is never mistaken for real
 * activity. It also lets you switch on a failure to see how Trellis recovers.
 */
export function DemoBar({ onChange }: { onChange?: () => void }) {
  const scenario = useSyncExternalStore(demo.subscribe, () => demo.scenario);
  const toast = useToast();

  return (
    <aside className="demobar" aria-label="Sample data">
      <p className="demobar__text">
        <strong>Sample data.</strong> Nothing here reaches GitHub or Figma.
      </p>
      <div className="demobar__controls">
        <label className="demobar__field">
          <span>Try:</span>
          <select
            value={scenario}
            onChange={(event) => {
              demo.setScenario(event.target.value as DemoScenario);
              onChange?.();
            }}
          >
            {SCENARIOS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="demobar__reset"
          onClick={() => {
            demo.reset();
            forgetSampleVisits();
            onChange?.();
            toast('Sample projects are back to how they started.');
          }}
        >
          Reset
        </button>
      </div>
    </aside>
  );
}
