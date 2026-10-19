import type { AnchorHTMLAttributes } from "react";
export default function BrowserLink(
  props: AnchorHTMLAttributes<HTMLAnchorElement>,
) {
  return <a {...props} />;
}
