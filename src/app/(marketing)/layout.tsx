/**
 * Marketing area: public, no session required, no application chrome.
 *
 * The route group keeps this separate from the signed-in application so the
 * two never share a layout by accident.
 */
export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return children;
}
