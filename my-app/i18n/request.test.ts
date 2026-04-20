import { beforeEach, describe, expect, it, vi } from "vitest";

const { getRequestConfigMock, hasLocaleMock } = vi.hoisted(() => ({
	getRequestConfigMock: vi.fn((factory) => factory),
	hasLocaleMock: vi.fn(),
}));

vi.mock("next-intl/server", () => ({
	getRequestConfig: getRequestConfigMock,
}));

vi.mock("next-intl", () => ({
	hasLocale: hasLocaleMock,
}));

import requestConfig from "./request";

describe("i18n request config", () => {
	beforeEach(() => {
		hasLocaleMock.mockReset();
	});

	it("uses requested locale when it is supported", async () => {
		hasLocaleMock.mockReturnValue(true);

		const config = await requestConfig({
			requestLocale: Promise.resolve("fr"),
		});

		expect(config.locale).toBe("fr");
		expect(config.messages.Metadata.title).toBe(
			"Enfant disparu - page d'informations et de contact",
		);
		expect(hasLocaleMock).toHaveBeenCalledWith(["en", "fr"], "fr");
	});

	it("falls back to default locale when requested locale is unsupported", async () => {
		hasLocaleMock.mockReturnValue(false);

		const config = await requestConfig({
			requestLocale: Promise.resolve("es"),
		});

		expect(config.locale).toBe("en");
		expect(config.messages.Home.ctaPrimary).toBe("Contact the father");
		expect(hasLocaleMock).toHaveBeenCalledWith(["en", "fr"], "es");
	});

	it("falls back to default locale when request locale is missing", async () => {
		hasLocaleMock.mockReturnValue(false);

		const config = await requestConfig({
			requestLocale: Promise.resolve(undefined),
		});

		expect(config.locale).toBe("en");
		expect(config.messages.Metadata.description).toBe(
			"Support page with verified context and contact channels to protect the child.",
		);
		expect(hasLocaleMock).toHaveBeenCalledWith(["en", "fr"], undefined);
	});
});
