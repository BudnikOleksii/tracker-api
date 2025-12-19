/* eslint-disable jest/no-standalone-expect */
import { expect } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import request, { Response } from 'supertest';
import { App } from 'supertest/types';

export interface RequestOptions {
  headers?: Record<string, string>;
  body?: unknown;
  query?: Record<string, string>;
}

export class RequestHelper {
  constructor(private app: INestApplication<App>) {}

  async makeRequest(
    method: 'get' | 'post' | 'patch' | 'delete' | 'put',
    path: string,
    options?: RequestOptions,
  ): Promise<Response> {
    let req = request(this.app.getHttpServer())[method](path);

    if (options?.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        req = req.set(key, value);
      });
    }

    if (options?.query) {
      req = req.query(options.query);
    }

    if (options?.body) {
      req = req.send(options.body);
    }

    return req;
  }

  expectErrorResponse(
    response: Response,
    status: number,
    message?: string,
  ): void {
    expect(response.status).toBe(status);
    expect(response.body).toHaveProperty('statusCode', status);
    if (message) {
      expect(response.body).toHaveProperty('message');
      const body = response.body as { message?: string | string[] };
      if (Array.isArray(body.message)) {
        expect(body.message).toContainEqual(expect.stringContaining(message));
      } else if (body.message) {
        expect(body.message).toContain(message);
      }
    }
  }

  expectSuccessResponse(
    response: Response,
    status: number,
    schema?: Record<string, unknown>,
  ): void {
    expect(response.status).toBe(status);
    if (schema) {
      Object.keys(schema).forEach((key) => {
        expect(response.body).toHaveProperty(key);
      });
    }
  }
}
