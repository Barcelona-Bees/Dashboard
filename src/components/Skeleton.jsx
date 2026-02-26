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
      <div className="center">
        <Skeleton className="skeletonTitle" style={{ width: 160, height: 28, margin: "0 auto" }} />
        <Skeleton className="skeletonSub" style={{ width: 120, height: 14, margin: "8px auto 0" }} />
      </div>

      <div className="heroRow">
        <Skeleton className="heroMetric" style={{ flex: 1, minHeight: 80 }} />
        <Skeleton className="heroMetric" style={{ flex: 1, minHeight: 80 }} />
      </div>

      <div className="grid2">
        <Skeleton style={{ minHeight: 140, borderRadius: "var(--radius-lg)" }} />
        <Skeleton style={{ minHeight: 140, borderRadius: "var(--radius-lg)" }} />
      </div>

      <section className="pageSection">
        <Skeleton className="skeletonSectionTitle" style={{ width: 120, height: 14 }} />
        <div className="hardwareInfoRow">
          <Skeleton style={{ flex: 1, minHeight: 56, minWidth: 100 }} />
          <Skeleton style={{ flex: 1, minHeight: 56, minWidth: 100 }} />
          <Skeleton style={{ flex: 1, minHeight: 56, minWidth: 100 }} />
        </div>
      </section>

      <section className="pageSection">
        <Skeleton className="skeletonSectionTitle" style={{ width: 180, height: 14 }} />
        <Skeleton style={{ width: "100%", minHeight: 220, borderRadius: "var(--radius-lg)" }} />
      </section>

      <section className="pageSection">
        <Skeleton className="skeletonSectionTitle" style={{ width: 60, height: 14 }} />
        <Skeleton style={{ width: "100%", height: 60, borderRadius: "var(--radius-md)" }} />
      </section>
    </div>
  );
}

export function AlertsSkeleton() {
  return (
    <div className="page">
      <div className="center">
        <Skeleton style={{ width: 160, height: 24, margin: "0 auto" }} />
        <Skeleton style={{ width: 100, height: 14, margin: "8px auto 0" }} />
      </div>
      <div className="yellowPanel" style={{ marginTop: 16 }}>
        <Skeleton style={{ width: 60, height: 16, margin: "0 auto 12px" }} />
        <Skeleton style={{ width: "100%", height: 80, borderRadius: "var(--radius-md)" }} />
      </div>
    </div>
  );
}

export function DataSkeleton() {
  return (
    <div className="page">
      <div className="dataTopRow">
        <div className="center" style={{ flex: 1 }}>
          <Skeleton style={{ width: 140, height: 24, margin: "0 auto" }} />
          <Skeleton style={{ width: 100, height: 14, margin: "8px auto 0" }} />
        </div>
        <Skeleton style={{ width: 80, height: 40, borderRadius: "var(--radius-md)" }} />
      </div>

      <div className="dataGrid">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} style={{ minHeight: 220, borderRadius: "var(--radius-lg)" }} />
        ))}
      </div>
    </div>
  );
}
