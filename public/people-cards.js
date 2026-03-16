/**
 * Build cards of all people/entities from arf.json, grouped by institution and country.
 * Sort: institutions by countries, people by institution.
 * Cards show country flag, icon (from card heading then institution), name, comment, and contact (url/email).
 */
(() => {
	var COUNTRY_ORDER = [
		"Norway",
		"France",
		"Germany",
		"International",
		"Associations",
	];
	// Country -> flag emoji or icon (aria-label for accessibility)
	var COUNTRY_FLAG = {
		Norway: "\uD83C\uDDF3\uD83C\uDDF4",
		France: "\uD83C\uDDEB\uD83C\uDDF7",
		Germany: "\uD83C\uDDE9\uD83C\uDDEA",
		International: "\uD83C\uDF10",
		Associations: "\uD83E\uDD1D",
	};
	// Institution name (from arf.json path) -> Font Awesome icon class (one icon per type, e.g. one for all Associations)
	var INSTITUTION_ICON = {
		Authorities: "fa-landmark",
		Auhtorities: "fa-landmark",
		Police: "fa-shield",
		"Police and Gendarmerie": "fa-shield",
		Justice: "fa-scale-balanced",
		School: "fa-graduation-cap",
		Lawyers: "fa-gavel",
		Associations: "fa-people-group",
		"Norwegian population registry": "fa-address-book",
		"Social Welfare Service": "fa-hands-holding-child",
		"Ombudsman-Barneombudet": "fa-user-tie",
		Sivilombudsmannen: "fa-user-tie",
		"Norwegian Directorate for Children, Youth and Family Affairs":
			"fa-hands-holding-child",
		"Norwegian King Harald V (Royal House)": "fa-crown",
		"Norwegian Central Authority": "fa-globe",
		"French Central Authority": "fa-globe",
		"Bureau d'entraide civile internationale": "fa-globe",
		"German Central Authority": "fa-globe",
		"Conseil Europeen": "fa-building-columns",
	};

	function isLeaf(node) {
		return !node.children || node.children.length === 0;
	}

	function collectLeaves(node, path, out) {
		if (!node) return;
		var name = node.name;
		if (isLeaf(node)) {
			// Leaf: path is [country, institution?, ...]; we want country and institution
			var country = path[0] || "Other";
			var institution = path[1] || "Other";
			out.push({
				country: country,
				institution: institution,
				name: name,
				url: node.url || "#",
				comment: node.comment || "",
				email: node.email || "",
			});
			return;
		}
		var nextPath = path.concat([name]);
		(node.children || []).forEach((child) => {
			collectLeaves(child, nextPath, out);
		});
	}

	function flattenTree(root) {
		var out = [];
		(root.children || []).forEach((countryNode) => {
			collectLeaves(countryNode, [countryNode.name], out);
		});
		return out;
	}

	function sortEntries(entries) {
		return entries.slice().sort((a, b) => {
			var i = COUNTRY_ORDER.indexOf(a.country);
			var j = COUNTRY_ORDER.indexOf(b.country);
			if (i !== j) return (i === -1 ? 999 : i) - (j === -1 ? 999 : j);
			var ci = (a.institution || "").localeCompare(b.institution || "");
			if (ci !== 0) return ci;
			return (a.name || "").localeCompare(b.name || "");
		});
	}

	function escapeHtml(s) {
		if (!s) return "";
		var div = document.createElement("div");
		div.textContent = s;
		return div.innerHTML;
	}

	function getCountryFlag(country) {
		var emoji = COUNTRY_FLAG[country];
		if (!emoji) return "";
		return (
			'<span class="people-card-flag" aria-label="' +
			escapeHtml(country) +
			'">' +
			emoji +
			"</span>"
		);
	}

	/**
	 * Choose icon for the card from the card main heading (entry.name), then fallback to institution.
	 */
	function getIconClassForHeading(name, institution) {
		if (!name) return INSTITUTION_ICON[institution] || "fa-building";
		var n = name.toLowerCase();
		if (/police|gendarmerie|igpn|iggn|polizei|commissariat/.test(n))
			return "fa-shield";
		if (/school|barnehage|lycée|lycee|aefe|jugendamt/.test(n))
			return "fa-graduation-cap";
		if (
			/sos papa|paternet|mannsforum|grue jaune|vaeter ohne|exclusion parentale|marche egalite|paternites imposees/.test(
				n,
			)
		)
			return "fa-people-group";
		if (
			/court|justice|palais|procureur|ombudsman|sivilombud|tingret|domstol|bureau du droit|entraide civile/.test(
				n,
			)
		)
			return "fa-scale-balanced";
		if (/central authority|bureau d'entraide|conseil europeen/.test(n))
			return "fa-globe";
		if (/population registry|registry/.test(n)) return "fa-address-book";
		if (
			/social welfare|social service|directorate for children|youth and family/.test(
				n,
			)
		)
			return "fa-hands-holding-child";
		if (/king|royal house/.test(n)) return "fa-crown";
		if (/lawyer|kramer/.test(n)) return "fa-gavel";
		return INSTITUTION_ICON[institution] || "fa-building";
	}

	function getCardIcon(entry) {
		var iconClass = getIconClassForHeading(entry.name, entry.institution);
		return (
			'<i class="fa ' +
			escapeHtml(iconClass) +
			' people-card-icon" aria-hidden="true"></i>'
		);
	}

	function renderCard(entry) {
		var name = escapeHtml(entry.name);
		var comment = escapeHtml(entry.comment);
		var url = entry.url && entry.url !== "#" ? entry.url : null;
		var email =
			entry.email && entry.email.indexOf("@") !== -1 ? entry.email : null;
		var linkAttrs = url
			? ' href="' +
				escapeHtml(url) +
				'" target="_blank" rel="noopener noreferrer"'
			: "";
		var linkTag = url ? "a" : "span";
		var flag = getCountryFlag(entry.country);
		var icon = getCardIcon(entry);
		var inner =
			'<div class="card h-100 people-card">' +
			'<div class="card-body">' +
			'<div class="d-flex align-items-center gap-2 mb-2">' +
			(flag ? flag + " " : "") +
			icon +
			"</div>" +
			'<h3 class="h6 card-title"><' +
			linkTag +
			linkAttrs +
			">" +
			name +
			"</" +
			linkTag +
			"></h3>";
		if (comment)
			inner += '<p class="card-text text-muted small mb-1">' + comment + "</p>";
		if (email)
			inner +=
				'<p class="card-text small mb-0"><a href="mailto:' +
				escapeHtml(email) +
				'">' +
				escapeHtml(email) +
				"</a></p>";
		inner += "</div></div>";
		return inner;
	}

	function groupByCountryThenInstitution(entries) {
		var byCountry = {};
		entries.forEach((e) => {
			if (!byCountry[e.country]) byCountry[e.country] = {};
			if (!byCountry[e.country][e.institution])
				byCountry[e.country][e.institution] = [];
			byCountry[e.country][e.institution].push(e);
		});
		return byCountry;
	}

	function render(container) {
		if (!container) return;
		container.innerHTML = '<p class="text-muted">Loading…</p>';
		fetch("arf.json")
			.then((r) => r.json())
			.then((root) => {
				var entries = flattenTree(root);
				var sorted = sortEntries(entries);
				var grouped = groupByCountryThenInstitution(sorted);
				var html = "";
				COUNTRY_ORDER.forEach((country) => {
					var institutions = grouped[country];
					if (!institutions) return;
					var flagEmoji = COUNTRY_FLAG[country];
					var flagSpan = flagEmoji
						? '<span class="people-country-flag" aria-label="' +
							escapeHtml(country) +
							'">' +
							flagEmoji +
							"</span> "
						: "";
					html += '<div class="people-by-country mb-4">';
					html +=
						'<h3 class="h5 mb-3">' + flagSpan + escapeHtml(country) + "</h3>";
					var instNames = Object.keys(institutions).sort((a, b) =>
						a.localeCompare(b),
					);
					instNames.forEach((inst) => {
						var people = institutions[inst];
						html += '<div class="people-by-institution mb-3">';
						html +=
							'<h4 class="h6 text-muted mb-2">' + escapeHtml(inst) + "</h4>";
						html += '<div class="row g-2">';
						people.forEach((p) => {
							html +=
								'<div class="col-12 col-sm-6 col-lg-4">' +
								renderCard(p) +
								"</div>";
						});
						html += "</div></div>";
					});
					html += "</div>";
				});
				container.innerHTML = html;
			})
			.catch(() => {
				container.innerHTML =
					'<p class="text-muted">Could not load the list.</p>';
			});
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", () => {
			render(document.getElementById("people-cards-root"));
		});
	} else {
		render(document.getElementById("people-cards-root"));
	}
})();
