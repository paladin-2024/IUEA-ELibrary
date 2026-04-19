const ABBREV = {
  English:    'EN', French: 'FR', Arabic: 'AR', Swahili: 'SW',
  Spanish:    'ES', Portuguese: 'PT', German: 'DE', Chinese: 'ZH',
  Luganda:    'LG', Runyakitara: 'RN',
};

export default function LanguageBadge({ language }) {
  const abbr = ABBREV[language] ?? language?.slice(0, 2).toUpperCase() ?? '??';
  return (
    <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-primary text-white leading-none">
      {abbr}
    </span>
  );
}
