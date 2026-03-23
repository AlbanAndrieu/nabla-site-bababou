/**
 * Obs.js 0.2.1 logic | (c) Harry Roberts, csswizardry.com | MIT
 * Adapted to load from an external classic script (upstream skips when script has src).
 * https://github.com/csswizardry/Obs.js
 */
(() => {
	const t = document.documentElement;
	const { connection: i } = navigator;
	window.obs = window.obs || {};
	const a = !0 === ((window.obs && window.obs.config) || {}).observeChanges;
	const o = () => {
		const e = window.obs || {};
		const i = "number" == typeof e.downlinkBucket ? e.downlinkBucket : null;
		e.connectionCapability =
			"low" === e.rttCategory && null != i && i >= 8
				? "strong"
				: "high" === e.rttCategory || (null != i && i <= 5)
					? "weak"
					: "moderate";
		const a = !0 === e.dataSaver || !0 === e.batteryLow || !0 === e.batteryCritical;
		e.conservationPreference = a ? "conserve" : "neutral";
		const o = "weak" === e.connectionCapability || !0 === e.dataSaver || !0 === e.batteryCritical;
		(e.deliveryMode = "strong" !== e.connectionCapability || o || a ? (o ? "lite" : "cautious") : "rich"),
			(e.canShowRichMedia = "lite" !== e.deliveryMode),
			(e.shouldAvoidRichMedia = "lite" === e.deliveryMode),
			["strong", "moderate", "weak"].forEach((e) => {
				t.classList.remove(`has-connection-capability-${e}`);
			}),
			t.classList.add(`has-connection-capability-${e.connectionCapability}`),
			["conserve", "neutral"].forEach((e) => {
				t.classList.remove(`has-conservation-preference-${e}`);
			}),
			t.classList.add(`has-conservation-preference-${e.conservationPreference}`),
			["rich", "cautious", "lite"].forEach((e) => {
				t.classList.remove(`has-delivery-mode-${e}`);
			}),
			t.classList.add(`has-delivery-mode-${e.deliveryMode}`);
	};
	const n = () => {
		if (!i) return;
		const { saveData: e, rtt: a, downlink: n } = i;
		(window.obs.dataSaver = !!e), t.classList.toggle("has-data-saver", !!e);
		const s = ((e) => (Number.isFinite(e) ? 25 * Math.ceil(e / 25) : null))(a);
		null != s && (window.obs.rttBucket = s);
		const r = ((e) => (Number.isFinite(e) ? (e < 75 ? "low" : e <= 275 ? "medium" : "high") : null))(a);
		r &&
			((window.obs.rttCategory = r),
			["low", "medium", "high"].forEach((e) => t.classList.remove(`has-latency-${e}`)),
			t.classList.add(`has-latency-${r}`));
		const c = ((l = n), Number.isFinite(l) ? Math.ceil(l) : null);
		var l;
		if (null != c) {
			window.obs.downlinkBucket = c;
			const e = c <= 5 ? "low" : c >= 8 ? "high" : "medium";
			(window.obs.downlinkCategory = e),
				["low", "medium", "high"].forEach((e) => t.classList.remove(`has-bandwidth-${e}`)),
				t.classList.add(`has-bandwidth-${e}`);
		}
		"downlinkMax" in i && (window.obs.downlinkMax = i.downlinkMax), o();
	};
	n(), a && i && "function" == typeof i.addEventListener && i.addEventListener("change", n);
	const s = (e) => {
		if (!e) return;
		const { level: i, charging: a } = e;
		const n = Number.isFinite(i) ? i <= 0.05 : null;
		window.obs.batteryCritical = n;
		const s = Number.isFinite(i) ? i <= 0.2 : null;
		(window.obs.batteryLow = s),
			["critical", "low"].forEach((e) => t.classList.remove(`has-battery-${e}`)),
			s && t.classList.add("has-battery-low"),
			n && t.classList.add("has-battery-critical");
		const r = !!a;
		(window.obs.batteryCharging = r), t.classList.toggle("has-battery-charging", r), o();
	};
	if (
		("getBattery" in navigator &&
			navigator
				.getBattery()
				.then((e) => {
					s(e),
						a &&
							"function" == typeof e.addEventListener &&
							(e.addEventListener("levelchange", () => s(e)), e.addEventListener("chargingchange", () => s(e)));
				})
				.catch(() => {}),
		"deviceMemory" in navigator)
	) {
		const e = Number(navigator.deviceMemory);
		const i = Number.isFinite(e) ? e : null;
		window.obs.ramBucket = i;
		const a = ((r = i), Number.isFinite(r) ? (r <= 1 ? "very-low" : r <= 2 ? "low" : r <= 4 ? "medium" : "high") : null);
		a &&
			((window.obs.ramCategory = a),
			["very-low", "low", "medium", "high"].forEach((e) => t.classList.remove(`has-ram-${e}`)),
			t.classList.add(`has-ram-${a}`));
	}
	var r;
	if ("hardwareConcurrency" in navigator) {
		const e = Number(navigator.hardwareConcurrency);
		const i = Number.isFinite(e) ? e : null;
		window.obs.cpuBucket = i;
		const a = ((e) => (Number.isFinite(e) ? (e <= 2 ? "low" : e <= 5 ? "medium" : "high") : null))(i);
		a &&
			((window.obs.cpuCategory = a),
			["low", "medium", "high"].forEach((e) => t.classList.remove(`has-cpu-${e}`)),
			t.classList.add(`has-cpu-${a}`));
	}
	(() => {
		const e = window.obs || {};
		const i = e.ramCategory;
		const a = e.cpuCategory;
		let o = "moderate";
		("high" !== i && "medium" !== i) || "high" !== a
			? ("very-low" === i || "low" === i || "low" === a) && (o = "weak")
			: (o = "strong"),
			(e.deviceCapability = o),
			["strong", "moderate", "weak"].forEach((e) => {
				t.classList.remove(`has-device-capability-${e}`);
			}),
			t.classList.add(`has-device-capability-${o}`);
	})();
})();
