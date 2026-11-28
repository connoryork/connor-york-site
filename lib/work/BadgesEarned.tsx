import BadgeShelf, { type BadgeData } from "@/lib/pixel/BadgeShelf";
import { badges } from "./badges";

/** Every badge in badges.json, most recently earned first. */
export default function BadgesEarned() {
  const shelf: BadgeData[] = badges
    .toSorted((a, b) => b.earned.localeCompare(a.earned))
    .map((badge) => ({
      name: badge.name,
      caption: `EARNED ${badge.earned.slice(0, 4)}`,
      color: badge.color,
      logo: `/logos/${badge.logo}`,
      data: badge,
    }));
  return <BadgeShelf title="BADGES EARNED" badges={shelf} />;
}
