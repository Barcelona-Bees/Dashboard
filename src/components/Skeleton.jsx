/**
 * Skeleton – placeholder shapes shown during loading
 *
 * Use these to mimic the layout of real content (hero metrics, gauges, charts)
 * so the page doesn’t jump when data arrives. The .skeleton class animates
 * a subtle pulse to indicate loading.
 */
export default function Skeleton({ className = "", style = {} }) {
  return <div className={`skeleton ${className}`.trim()} style={style} aria-hidden="true" />;
}

export function HomeSkeleton() {
  return (
    <div className="page">
      <div className="pageHead">
        <Skeleton style={{ width: 200, height: 26, margin: "0 auto", borderRadius: "var(--radius-sm)" }} />
        <Skeleton style={{ width: 160, height: 14, margin: "10px auto 0", borderRadius: "var(--radius-sm)" }} />
      </div>

      <div className="heroRow">
        <Skeleton className="heroMetric" style={{ minHeight: 88 }} />
        <Skeleton className="heroMetric" style={{ minHeight: 88 }} />
      </div>

      <div className="gaugeSingleWrap">
        <Skeleton style={{ minHeight: 160, borderRadius: "var(--radius-lg)" }} />
      </div>

      <section className="pageSection">
        <Skeleton style={{ width: 100, height: 12, margin: "0 auto 12px", borderRadius: "var(--radius-sm)" }} />
        <div className="hardwareInfoRow">
          <Skeleton style={{ minHeight: 64 }} />
          <Skeleton style={{ minHeight: 64 }} />
        </div>
      </section>

      <section className="pageSection">
        <Skeleton style={{ width: 200, height: 12, margin: "0 auto 12px", borderRadius: "var(--radius-sm)" }} />
        <Skeleton style={{ width: "100%", minHeight: 240, borderRadius: "var(--radius-lg)" }} />
      </section>

      <section className="pageSection">
        <Skeleton style={{ width: 120, height: 12, margin: "0 auto 12px", borderRadius: "var(--radius-sm)" }} />
        <Skeleton style={{ width: "100%", height: 72, borderRadius: "var(--radius-md)" }} />
      </section>
    </div>
  );
}

export function AlertsSkeleton() {
  return (
    <div className="page">
      <div className="pageHead">
        <Skeleton style={{ width: 200, height: 26, margin: "0 auto", borderRadius: "var(--radius-sm)" }} />
        <Skeleton style={{ width: 280, height: 14, margin: "10px auto 0", borderRadius: "var(--radius-sm)" }} />
      </div>
      <div className="panelHistory">
        <Skeleton style={{ width: 140, height: 18, margin: "0 auto 16px", borderRadius: "var(--radius-sm)" }} />
        <Skeleton style={{ width: "100%", height: 96, borderRadius: "var(--radius-md)" }} />
      </div>
    </div>
  );
}

export function DataSkeleton() {
  return (
    <div className="page">
      <div className="dataTopRow">
        <div className="pageHead">
          <Skeleton style={{ width: 160, height: 26, margin: "0 auto", borderRadius: "var(--radius-sm)" }} />
          <Skeleton style={{ width: 120, height: 14, margin: "10px auto 0", borderRadius: "var(--radius-sm)" }} />
        </div>
        <Skeleton style={{ width: 88, height: 44, borderRadius: "var(--radius-md)" }} />
      </div>

      <div className="dataGrid">
        <Skeleton style={{ minHeight: 240, borderRadius: "var(--radius-lg)" }} />
        <Skeleton style={{ minHeight: 240, borderRadius: "var(--radius-lg)" }} />
      </div>
    </div>
  );
}
