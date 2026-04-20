import { describe, expect, it, vi } from "vitest";

const { createMiddlewareMock } = vi.hoisted(() => ({
	createMiddlewareMock: vi.fn(() => "middleware-handler"),
}));

vi.mock("next-intl/middleware", () => ({
	default: createMiddlewareMock,
}));

import proxy, { config } from "./proxy";
import { routing } from "./i18n/routing";

describe("i18n proxy middleware", () => {
	it("creates middleware with shared routing configuration", () => {
		expect(createMiddlewareMock).toHaveBeenCalledTimes(1);
		expect(createMiddlewareMock).toHaveBeenCalledWith(routing);
		expect(proxy).toBe("middleware-handler");
	});

	it("matches content routes and excludes app internals", () => {
		expect(config.matcher).toBe("/((?!api|trpc|_next|_vercel|.*\\..*).*)");
	});
});
