interface StatCard {
  label: string;
  value: string | number;
}

interface SummaryCardsProps {
  cards: [StatCard, StatCard, StatCard, StatCard];
}

export function SummaryCards({ cards }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-lg border border-border bg-background/50 p-3"
        >
          <div className="text-xs text-muted-foreground">{card.label}</div>
          <div className="mt-1 text-lg font-bold">{card.value}</div>
        </div>
      ))}
    </div>
  );
}
