type Props = {
  edition: string;
  title: string;
  kicker?: string;
  byline?: string;
  rightSlot?: React.ReactNode;
  italicizeWord?: string;
};

const TODAY = new Date().toLocaleDateString("en-US", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function Masthead({ edition, title, kicker, byline, rightSlot, italicizeWord }: Props) {
  let rendered: React.ReactNode = title;
  if (italicizeWord && title.includes(italicizeWord)) {
    const idx = title.indexOf(italicizeWord);
    rendered = (
      <>
        {title.slice(0, idx)}
        <span className="headline-italic beacon-text">{italicizeWord}</span>
        {title.slice(idx + italicizeWord.length)}
      </>
    );
  }

  return (
    <header className="border-b hairline-bright px-8 pt-7 pb-6 relative">
      <div className="flex items-start justify-between gap-6 mb-5 flex-wrap">
        <div className="flex items-center gap-3 label-eyebrow flex-wrap">
          <span className="beacon-text">●</span>
          <span>Compass</span>
          <span className="opacity-50">·</span>
          <span>{edition}</span>
          <span className="opacity-50">·</span>
          <span>{TODAY}</span>
          <span className="opacity-50">·</span>
          <span>No. 47</span>
        </div>
        {rightSlot}
      </div>

      {kicker ? (
        <div className="label-eyebrow mb-2 beacon-text">{kicker}</div>
      ) : null}

      <h1 className="headline text-4xl md:text-5xl leading-[1.02] max-w-3xl">
        {rendered}
      </h1>

      {byline ? (
        <div className="mt-4 font-body text-sm text-[color:var(--ink-300)] italic max-w-2xl">
          {byline}
        </div>
      ) : null}
    </header>
  );
}
