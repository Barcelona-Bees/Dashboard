import AccessibleLineChart from "./AccessibleLineChart";

export default function ChartCard({ title = "", data = [], xLabelKey = "xLabel", series }) {
  if (!data.length) {
    return (
      <div className="chartFrame" aria-label={title || "Chart"}>
        <div className="chartCaption">{title || "Chart"}</div>
      </div>
    );
  }

  return (
    <div className="chartFrame">
      <AccessibleLineChart title={title} data={data} xLabelKey={xLabelKey} series={series} />
    </div>
  );
}
