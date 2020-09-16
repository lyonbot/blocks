export default function elt(tag: string, attr?: Record<string, string> | null, text?: string) {
  const ans = document.createElement(tag);
  if (attr) for (const k in attr) ans.setAttribute(k, attr[k]);
  if (text) ans.textContent = text;
  return ans;
}
