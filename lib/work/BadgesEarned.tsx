import { LOGO_SIZE } from "@/lib/pixel/Badge";
import BadgeShelf, { type BadgeData } from "@/lib/pixel/BadgeShelf";
import { pixelate } from "@/lib/pixel/pixelate";
import { logoPath, orgs, roles } from "./experience";

/** A badge for every company and school, newest first. */
export default async function BadgesEarned() {
  const history = orgs
    .flatMap((org) => {
      const orgRoles = roles.filter((r) => r.org === org.name).sort((a, b) => a.start.localeCompare(b.start));
      return orgRoles.length ? [{ org, orgRoles, since: orgRoles[0].start }] : [];
    })
    .sort((a, b) => b.since.localeCompare(a.since));

  const badges: BadgeData[] = await Promise.all(
    history.map(async ({ org, orgRoles, since }) => {
      const until = orgRoles.some((r) => r.end === null) ? null : orgRoles.map((r) => r.end!).sort().at(-1)!;
      return {
        name: org.name,
        caption: `${since.slice(0, 4)}-${until ? until.slice(0, 4) : "NOW"}`,
        color: org.color,
        logo: await pixelate(logoPath(org.logo), LOGO_SIZE, org.logoColors),
        data: {
          org: org.name,
          since,
          until,
          roles: orgRoles
            .toReversed()
            .map((r) => (r.kind === "school" ? r.degree : `${r.title}, ${r.team}`)),
        },
      };
    }),
  );
  return <BadgeShelf title="BADGES EARNED" badges={badges} />;
}
