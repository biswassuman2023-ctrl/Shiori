/**
 * Onboarding, diagnostic, results and placement.
 *
 * A linear flow with no application navigation: leaving it half-finished is
 * how learners end up unplaced.
 *
 * TODO — DECISION REQUIRED: whether this flow requires an account up front, or
 * runs anonymously and attaches its results at signup.
 */
export default function OnboardingLayout({ children }: LayoutProps<"/">) {
  return children;
}
