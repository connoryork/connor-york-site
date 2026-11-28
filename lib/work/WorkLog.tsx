import PixelIntro from "@/lib/pixel/PixelIntro";
import { isoFromDay, dayNumber, latestDate } from "@/lib/timeline/dates";
import type { TimelineEntry } from "@/lib/timeline/layout";
import Timeline from "@/lib/timeline/Timeline";
import BadgesEarned from "./BadgesEarned";
import { orgOf, roles, type Role } from "./experience";

// Roles are dated by month. One starts on the 1st of its first month and ends
// the day before the 1st of its end month, so a promotion's old role merges
// back just before the new one branches out, in the same lane.
const startDate = (month: string) => `${month}-01`;
const endDate = (month: string) => isoFromDay(dayNumber(`${month}-01`) - 1);

function label(role: Role): string {
  return `${role.org} ${role.kind === "school" ? role.degree : role.team}`;
}

/** My jobs, internships and schooling: a badge for each place, then a timeline. */
export default function WorkLog() {
  const entries: TimelineEntry[] = roles.map((role) => ({
    start: startDate(role.start),
    end: role.end === null ? null : endDate(role.end),
    label: label(role),
    color: orgOf(role).color,
    data: role,
  }));
  // Prerendered pages can't read the clock; see BookLog.
  const today = latestDate(entries.flatMap((e) => [e.start, e.end ?? e.start]));
  const firstYear = Math.min(...roles.map((r) => Number(r.start.slice(0, 4))));

  return (
    <>
      <PixelIntro>
        <p>
          {roles.length} ROLES, {firstYear}-{today.slice(0, 4)}. HOVER OR TAP A BRANCH FOR DETAILS.
        </p>
      </PixelIntro>
      <BadgesEarned />
      <Timeline entries={entries} fallbackToday={today} ongoingLabel="CURRENT" label="Work timeline" />
    </>
  );
}
