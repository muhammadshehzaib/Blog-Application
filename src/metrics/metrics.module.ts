import { Global, Module } from '@nestjs/common';
import {
  PrometheusModule,
  makeCounterProvider,
  makeGaugeProvider,
  makeHistogramProvider,
} from '@willsoto/nestjs-prometheus';

export const COMMENTS_CREATED = 'comments_created_total';
export const REACTIONS_CHANGED = 'reactions_changed_total';
export const MAIL_QUEUE_DEPTH = 'mail_queue_depth';
export const HTTP_REQUEST_DURATION = 'http_request_duration_seconds';

const customMetricProviders = [
  makeCounterProvider({
    name: COMMENTS_CREATED,
    help: 'Total comments created',
  }),
  makeCounterProvider({
    name: REACTIONS_CHANGED,
    help: 'Total reaction mutations (create/update/delete)',
    labelNames: ['action'],
  }),
  makeGaugeProvider({
    name: MAIL_QUEUE_DEPTH,
    help: 'Current depth of the mail queue',
  }),
  makeHistogramProvider({
    name: HTTP_REQUEST_DURATION,
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status'],
    buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  }),
];

@Global()
@Module({
  imports: [
    PrometheusModule.register({
      defaultMetrics: { enabled: true },
      path: '/metrics',
    }),
  ],
  providers: customMetricProviders,
  exports: [PrometheusModule, ...customMetricProviders],
})
export class MetricsModule {}
