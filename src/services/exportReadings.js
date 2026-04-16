/**
 * Client-side export for merged reading rows (`{ timestamp, temperatureF, humidity }`).
 * Pass the full time-ordered series for the window (e.g. getMergedFourteenDayLocalWindow) so
 * every stored sample in range is included (~10 min cadence when the backend records that way).
 */

function escapeCsvCell(val) {
  if (val == null || val === "") return "";
  const s = String(val);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * @param {Array<{ timestamp: string, temperatureF?: number, humidity?: number|null }>} rawRows
 * @param {{ temp: boolean, humidity: boolean }} opts
 */
export function buildExportPayload(rawRows, opts) {
  const { temp, humidity } = opts;
  const columns = ["timestamp"];
  if (temp) columns.push("temperature_f");
  if (humidity) columns.push("humidity_pct");

  const rows = (rawRows || []).map((r) => {
    const row = { timestamp: r.timestamp };
    if (temp) row.temperature_f = r.temperatureF;
    if (humidity) {
      row.humidity_pct = r.humidity != null && !Number.isNaN(r.humidity) ? r.humidity : "";
    }
    return row;
  });

  return { rows, columns };
}

export function downloadBlob(filename, mimeType, content) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke after the browser has started the download (Safari can drop early if revoked immediately).
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

export function exportCsv(payload, filename) {
  const { rows, columns } = payload;
  const header = columns.map(escapeCsvCell).join(",");
  const lines = rows.map((r) => columns.map((c) => escapeCsvCell(r[c])).join(","));
  const body = `\uFEFF${header}\n${lines.join("\n")}`;
  downloadBlob(filename, "text/csv;charset=utf-8", body);
}

export function exportJson(payload, filename) {
  const { rows, columns } = payload;
  const slim = rows.map((r) => {
    const o = {};
    for (const c of columns) o[c] = r[c];
    return o;
  });
  downloadBlob(filename, "application/json;charset=utf-8", JSON.stringify(slim, null, 2));
}

export async function exportXlsx(payload, filename) {
  const ExcelJS = (await import("exceljs")).default;
  const { rows, columns } = payload;
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Readings");
  worksheet.addRow(columns);
  for (const r of rows) {
    worksheet.addRow(columns.map((c) => r[c]));
  }
  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(
    filename,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer
  );
}

/**
 * Builds printable HTML for table export.
 */
function buildPrintableHtml(payload, title) {
  const { rows, columns } = payload;
  const thead = `<tr>${columns.map((c) => `<th>${escapeHtml(c)}</th>`).join("")}</tr>`;
  const tbody = rows
    .map(
      (r) =>
        `<tr>${columns.map((c) => `<td>${escapeHtml(r[c] == null ? "" : String(r[c]))}</td>`).join("")}</tr>`
    )
    .join("");
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>${escapeHtml(
    title
  )}</title><style>
    body { font-family: system-ui, sans-serif; margin: 24px; color: #1e293b; }
    h1 { font-size: 1.1rem; margin-bottom: 16px; }
    table { border-collapse: collapse; width: 100%; font-size: 11px; }
    th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
    th { background: #f1f5f9; font-weight: 600; }
    .hint { margin-top: 20px; font-size: 12px; color: #64748b; }
  </style></head><body>
    <h1>${escapeHtml(title)}</h1>
    <table><thead>${thead}</thead><tbody>${tbody}</tbody></table>
    <p class="hint">Use your browser’s Print dialog, then choose <strong>Save as PDF</strong>.</p>
  </body></html>`;
}

/**
 * Opens print flow without a popup when possible; user chooses Print -> Save as PDF.
 */
export function openPrintableTable(payload, title) {
  const html = buildPrintableHtml(payload, title);

  // Primary path: hidden iframe in current tab (avoids popup blockers).
  try {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.setAttribute("aria-hidden", "true");
    document.body.appendChild(iframe);

    iframe.onload = () => {
      const w = iframe.contentWindow;
      if (!w) {
        iframe.remove();
        return;
      }

      const cleanup = () => {
        window.removeEventListener("focus", onFocusBack);
        setTimeout(() => {
          if (iframe.parentNode) iframe.remove();
        }, 300);
      };
      const onFocusBack = () => cleanup();
      window.addEventListener("focus", onFocusBack, { once: true });

      w.focus();
      w.print();
      // Fallback cleanup if focus event never fires.
      setTimeout(cleanup, 15_000);
    };

    const doc = iframe.contentDocument;
    if (!doc) {
      iframe.remove();
      return false;
    }
    doc.open();
    doc.write(html);
    doc.close();
    return true;
  } catch {
    // Fallback: open a new tab if iframe printing fails.
  }

  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.write(html);
  w.document.close();
  return true;
}

export function defaultExportFilename(stem, ext) {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(
    d.getMinutes()
  )}${pad(d.getSeconds())}`;
  return `${stem}-${stamp}.${ext}`;
}
