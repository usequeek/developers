/**
 * Failure paths: a missing key, an error envelope from the API, a 404, and
 * URL building for slugs and query values. Runs on a stubbed `fetch`, so it
 * needs no network and no key: `node --test tests/*.test.mjs`.
 */
import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createQueekClient } from "@usequeek/client-sdk";
import {
  QueekSdkError,
  getClient,
  getProduct,
  isNotFound,
  listProducts,
  setClientForTests,
} from "../lib/queek.js";

const BASE = "https://client.usequeek.com/v1";

/** Answers every request with `status` and a JSON body; records the URLs. */
function stubFetch(status, body, seen = []) {
  const fetchImpl = async (url) => {
    seen.push(String(url).replace(BASE, ""));
    return {
      ok: status < 400,
      status,
      headers: { get: () => "application/json" },
      json: async () => body,
    };
  };
  return fetchImpl;
}

function useClient(fetchImpl) {
  setClientForTests(
    createQueekClient({ baseUrl: BASE, clientKey: "sk_test_stub", fetch: fetchImpl }),
  );
}

beforeEach(() => {
  setClientForTests(null);
});

describe("configuration", () => {
  it("names the variable and where to find the key when it is missing", () => {
    const saved = process.env.QUEEK_SECRET_KEY;
    delete process.env.QUEEK_SECRET_KEY;
    try {
      assert.throws(() => getClient(), /QUEEK_SECRET_KEY is not set.*Dev stores/s);
    } finally {
      if (saved !== undefined) process.env.QUEEK_SECRET_KEY = saved;
    }
  });
});

describe("API errors", () => {
  it("surfaces the stable error code and status", async () => {
    useClient(
      stubFetch(401, {
        status: "failed",
        error_code: "invalid_client_key",
        message: "This API key is unknown or has been revoked.",
        error: { code: "invalid_client_key", request_id: "req-1" },
      }),
    );
    await assert.rejects(listProducts(), (error) => {
      assert.ok(error instanceof QueekSdkError);
      assert.equal(error.code, "invalid_client_key");
      assert.equal(error.status, 401);
      assert.equal(isNotFound(error), false);
      return true;
    });
  });

  it("recognises a 404 so pages can render not-found", async () => {
    useClient(
      stubFetch(404, { status: "failed", error_code: "not_found", message: "Product not found." }),
    );
    await assert.rejects(getProduct("missing"), (error) => isNotFound(error));
  });

  it("does not treat other failures as not-found", () => {
    assert.equal(isNotFound(new Error("boom")), false);
    assert.equal(isNotFound(new QueekSdkError("rate limited", "too_many_requests", 429)), false);
  });
});

describe("URL building", () => {
  it("encodes the product slug as one path segment", async () => {
    const seen = [];
    useClient(stubFetch(200, { data: { id: "p", slug: "a/b c" } }, seen));
    await getProduct("a/b c");
    assert.deepEqual(seen, ["/store/products/a%2Fb%20c"]);
  });

  it("encodes query values and skips undefined ones", async () => {
    const seen = [];
    useClient(stubFetch(200, { data: [] }, seen));
    await listProducts({ keyword: "red & blue", per_page: 5, sort: undefined });
    assert.deepEqual(seen, ["/store/products?keyword=red+%26+blue&per_page=5"]);
  });
});
