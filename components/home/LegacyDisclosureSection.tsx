/** Preserve the approved document-processing disclosure as a native details widget. */
export default function LegacyDisclosureSection() {
  return <section id="preview-document-disclosure" lang="en" aria-label="Documents on this website">
    <details>
      <summary>Documents on this website — processing notice</summary>
      <p>Documents provided on this website have been processed as follows: spelling and grammar fixes, anonymization (to protect the child), and translation when required. Otherwise they remain as close as possible to the original.</p>
      <p>Some documents are missing because they require validation before being published.</p>
    </details>
  </section>;
}
