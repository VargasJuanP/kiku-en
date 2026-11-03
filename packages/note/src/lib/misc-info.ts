import { parseHtml } from "./dom";

/**
 * Whether MiscInfo is just the title of one of Yomitan's own pages, which is
 * what {document-title} gives for words looked up in Yomitan's search page or
 * its settings preview: "read - Yomitan Search", "Yomitan Popup Preview".
 */
export function isYomitanPageTitle(html: string) {
  const text = (parseHtml(html).body.textContent ?? "").trim();
  return /^(?:.* - )?Yomitan (?:Search|Popup Preview)$/.test(text);
}
