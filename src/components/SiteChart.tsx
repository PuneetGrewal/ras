// Bar chart of each site's forms over the last 7 days, shown under the dashboard's summary boxes.
// It draws the same numbers as the "Last 7 days" box, which doubles as its text version.
"use client";

import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts";

// One horizontal bar per site (long site names read better down the side than under columns).
const ROW_HEIGHT = 40; // a 24 px bar plus air
const AXIS_HEIGHT = 30; // room for the numbers along the bottom

// Recharts writes colours as SVG attributes; plain values work in every browser, so these repeat
// the brand colours from src/app/globals.css (change both together).
const RAS_GREEN = "#194833";
const RAS_CHARCOAL = "#252425";
const RAS_GREY = "#515151";

type Props = { data: { site: string; count: number }[] };

export default function SiteChart({ data }: Props) {
  const summary = data.map((row) => `${row.site} ${row.count}`).join(", ");

  return (
    // role="img" + label: screen readers hear the numbers in one sentence instead of the SVG's parts.
    <div role="img" aria-label={`Forms per site in the last 7 days: ${summary}.`}>
      {/* accessibilityLayer off: Recharts' keyboard layer only drives tooltips, which this chart has none of;
          left on, it adds an empty Tab stop that screen readers announce instead of the sentence above. */}
      <BarChart
        responsive
        accessibilityLayer={false}
        layout="vertical"
        data={data}
        style={{ width: "100%", height: data.length * ROW_HEIGHT + AXIS_HEIGHT }}
        margin={{ top: 0, right: 32, bottom: 0, left: 0 }}
      >
        <XAxis type="number" allowDecimals={false} stroke="#d4d4d4" tick={{ fill: RAS_GREY, fontSize: 12 }} />
        <YAxis
          type="category"
          dataKey="site"
          width={150}
          axisLine={false}
          tickLine={false}
          tick={{ fill: RAS_CHARCOAL, fontSize: 13 }}
        />
        <Bar dataKey="count" fill={RAS_GREEN} barSize={24} radius={[0, 4, 4, 0]} isAnimationActive={false}>
          <LabelList dataKey="count" position="right" fill={RAS_CHARCOAL} fontSize={13} />
        </Bar>
      </BarChart>
    </div>
  );
}
