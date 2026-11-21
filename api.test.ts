import assert from 'node:assert/strict';
import test from 'node:test';
import { ApiError, apiFetch } from './api.ts';

const hostingError = '<!DOCTYPE html><html><head><title>Page not found</title></head><body>Page not found</body></html>';

for (const { name, body, status, contentType, expectedStatus } of [
  { name: 'an HTML 404 from a login submission', body: hostingError, status: 404, contentType: 'text/html', expectedStatus: 404 },
  { name: 'a plain-text 405 from a profile update', body: 'Method Not Allowed', status: 405, contentType: 'text/plain', expectedStatus: 405 },
  { name: 'a successful HTML page fallback', body: hostingError, status: 200, contentType: 'text/html', expectedStatus: 502 },
  { name: 'malformed JSON', body: '{invalid', status: 200, contentType: 'application/json', expectedStatus: 502 },
  { name: 'an HTML response mislabeled as JSON', body: hostingError, status: 404, contentType: 'application/json', expectedStatus: 404 },
  { name: 'a non-string JSON error', body: '{"error":{"details":"internal error"}}', status: 500, contentType: 'application/json', expectedStatus: 500 },
]) {
  test(`shows a readable service error for ${name}`, async (t) => {
    t.mock.method(globalThis, 'fetch', async () => new Response(body, {
      status,
      headers: { 'Content-Type': contentType },
    }));

    await assert.rejects(apiFetch('/api/auth/login', { method: 'POST', body: '{}' }), (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, expectedStatus);
      assert.equal(error.message, 'This service is currently unavailable. Please try again later.');
      assert.doesNotMatch(error.message, /<!doctype|<html|\[object Object\]/i);
      return true;
    });
  });
}

test('preserves a valid API validation error', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({ error: 'Please enter your email address.' }, { status: 400 }));

  await assert.rejects(apiFetch('/api/auth/login'), (error: unknown) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.status, 400);
    assert.equal(error.message, 'Please enter your email address.');
    return true;
  });
});

test('returns a valid JSON response', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({ jobs: [] }));
  assert.deepEqual(await apiFetch('/api/jobs'), { jobs: [] });
});

test('accepts a JSON media type with a suffix', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response('{"jobs":[]}', {
    headers: { 'Content-Type': 'application/vnd.kaamconnect+json; charset=utf-8' },
  }));
  assert.deepEqual(await apiFetch('/api/jobs'), { jobs: [] });
});

test('preserves successful responses without a body', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 204 }));
  assert.deepEqual(await apiFetch('/api/auth/logout', { method: 'POST' }), {});
});
