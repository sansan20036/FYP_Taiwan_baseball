import { useMemo } from 'react';

type Props = {
  title: string;
  file: string;
  description?: string;
};

export default function LegacyPage({ title, file, description }: Props) {
  const source = useMemo(() => `/legacy/${file}`, [file]);

  return (
    <section className="legacy">
      <header className="legacy__header">
        <div>
          <p className="legacy__eyebrow">Legacy HTML view</p>
          <h2 className="legacy__title">{title}</h2>
          {description ? <p className="legacy__description">{description}</p> : null}
        </div>
        <a className="legacy__button" href={source} target="_blank" rel="noreferrer">
          Open raw page
        </a>
      </header>

      <div className="legacy__frame-wrap">
        <iframe className="legacy__frame" src={source} title={title} loading="lazy" />
      </div>
    </section>
  );
}
