import { randomUUID } from 'crypto';
import type { Params } from 'nestjs-pino';
import type { IncomingMessage } from 'http';

const isProduction = process.env.NODE_ENV === 'production';

export const loggerConfig: Params = {
  pinoHttp: {
    level: process.env.LOG_LEVEL ?? (isProduction ? 'info' : 'debug'),
    genReqId: (req: IncomingMessage) =>
      (req.headers['x-request-id'] as string) ?? randomUUID(),
    customProps: () => ({
      service: 'blogs-app',
    }),
    serializers: {
      req: (req) => ({
        id: req.id,
        method: req.method,
        url: req.url,
      }),
      res: (res) => ({
        statusCode: res.statusCode,
      }),
    },
    transport: isProduction
      ? undefined
      : {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:HH:MM:ss.l',
            ignore: 'pid,hostname,service',
            singleLine: false,
          },
        },
  },
};
