import * as Sentry from '@sentry/react-native';

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

/**
 * Crash reporting is opt-in via EXPO_PUBLIC_SENTRY_DSN. PII is never sent:
 * no default PII, and breadcrumbs/events carry no user content.
 */
export function initCrashReporting(): void {
  if (!dsn) return;
  Sentry.init({
    dsn,
    sendDefaultPii: false,
    tracesSampleRate: 0.2,
    beforeSend(event) {
      // Defense in depth: strip anything that could identify the user.
      delete event.user;
      return event;
    },
  });
}
