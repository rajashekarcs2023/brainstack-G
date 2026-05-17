"use client";

import { VERTICALS, type VerticalId } from "@/lib/verticals";

type Props = {
  value: VerticalId;
  onChange: (id: VerticalId) => void;
};

export function VerticalSwitcher({ value, onChange }: Props) {
  return (
    <section className="border hairline-bright bg-[color:var(--paper-2)] relative">
      <div className="absolute -top-3 left-5 px-2 bg-[color:var(--paper)] label-eyebrow !text-[color:var(--beacon)]">
        Vertical · who Compass serves today
      </div>

      <div className="px-5 pt-5 pb-4">
        <div className="flex items-baseline justify-between gap-4 mb-3 flex-wrap">
          <div>
            <div className="font-display text-lg leading-tight">
              Same swarm, <span className="headline-italic beacon-text">different business.</span>
            </div>
            <p className="font-body italic text-[12px] text-[color:var(--ink-400)] leading-snug mt-1 max-w-2xl">
              The five agents are identical across verticals. Only the taglines, the customer language, and the example signals change. Pick a vertical to see how Compass ships for that owner.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {VERTICALS.map((v) => {
            const active = value === v.id;
            return (
              <button
                key={v.id}
                onClick={() => onChange(v.id)}
                className={`px-3 py-2 border text-left transition ${
                  active
                    ? "border-[color:var(--beacon)] bg-[color:var(--paper-3)]"
                    : "border-[color:var(--rule)] bg-[color:var(--paper-2)] hover:border-[color:var(--rule-bright)]"
                }`}
              >
                <div
                  className={`font-display text-sm leading-tight ${
                    active ? "text-[color:var(--ink-100)]" : "text-[color:var(--ink-200)]"
                  }`}
                >
                  {v.short}
                </div>
                <div className="label-eyebrow mt-0.5 !text-[color:var(--ink-500)]">
                  {v.buyer}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
