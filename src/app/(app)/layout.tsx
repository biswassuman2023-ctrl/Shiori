/**
 * The signed-in application.
 *
 * TODO — this layout will host the application shell (navigation, review-due
 * indicator) and enforce the authentication redirect. Route protection is not
 * wired up yet; the proxy currently only refreshes the session.
 */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return children;
}
