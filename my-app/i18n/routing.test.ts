import { describe, expect, it } from "vitest";
import { routing } from "./routing";

describe("i18n routing definition", () => {
	it("keeps supported locales and default locale stable", () => {
		expect(routing.locales).toEqual(["en", "fr"]);
		expect(routing.defaultLocale).toBe("en");
	});

	it("uses as-needed locale prefixing", () => {
		expect(routing.localePrefix).toBe("as-needed");
	});
});
