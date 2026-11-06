// Universal Print Utility with In-DOM Isolation for Reliable Browser Printing
export function printHtmlContent(title: string, printableHtml: string): void {
  try {
    // 1. Remove previous printable container if any
    const prev = document.getElementById('legend-printable-receipt-container');
    if (prev) prev.remove();

    // 2. Remove previous print style if any
    const prevStyle = document.getElementById('legend-printable-style');
    if (prevStyle) prevStyle.remove();

    // 3. Inject Print Stylesheet with strict isolation
    const style = document.createElement('style');
    style.id = 'legend-printable-style';
    style.innerHTML = `
      @media screen {
        #legend-printable-receipt-container {
          display: none !important;
        }
      }
      @media print {
        /* Hide entire React root and normal application UI */
        body > *:not(#legend-printable-receipt-container) {
          display: none !important;
        }
        html, body {
          background: #ffffff !important;
          color: #000000 !important;
          margin: 0 !important;
          padding: 0 !important;
          height: auto !important;
          min-height: auto !important;
          overflow: visible !important;
        }
        /* Display only the printable container */
        #legend-printable-receipt-container {
          display: block !important;
          position: relative !important;
          width: 100% !important;
          max-width: 80mm !important;
          margin: 0 auto !important;
          padding: 4mm !important;
          font-family: 'Courier New', Courier, monospace, system-ui !important;
          font-size: 11px !important;
          line-height: 1.35 !important;
          color: #000000 !important;
          background: #ffffff !important;
          page-break-inside: avoid !important;
        }
        @page {
          size: auto;
          margin: 4mm;
        }
      }
    `;
    document.head.appendChild(style);

    // 4. Create and inject printable container
    const container = document.createElement('div');
    container.id = 'legend-printable-receipt-container';
    container.innerHTML = printableHtml;
    document.body.appendChild(container);

    // 5. Trigger browser print dialog directly
    const originalTitle = document.title;
    if (title) document.title = title;

    window.focus();
    window.print();

    // Restore title and cleanup after print dialog completes
    setTimeout(() => {
      document.title = originalTitle;
      container.remove();
      style.remove();
    }, 2000);
  } catch (err) {
    console.warn('printHtmlContent error, falling back to standard print:', err);
    try {
      window.print();
    } catch {
      // ignore
    }
  }
}
