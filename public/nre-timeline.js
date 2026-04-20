/**
 * NRE pages: build timeline from #nre-table, update stat counters.
 * Locale from <html lang="en"> or lang="fr" (default en).
 */
(() => {
	var rows = document.querySelectorAll("#nre-table tbody tr");
	if (!rows.length) return;

	var timeline = document.getElementById("timeline");
	if (!timeline) return;

	var lang = (
		document.documentElement.getAttribute("lang") || "en"
	).toLowerCase();
	var fr = lang.indexOf("fr") === 0;

	var total = rows.length;
	var nreCount = 0;
	var exceptionCount = 0;
	var byYear = {};

	function shortMonthEn(monthLabel) {
		var m = monthLabel.replace(/\s*\d{4}$/, "").trim();
		if (m.indexOf("January") === 0) return "Jan";
		if (m.indexOf("February") === 0) return "Feb";
		if (m.indexOf("March") === 0) return "Mar";
		if (m.indexOf("April") === 0) return "Apr";
		if (m.indexOf("May") === 0) return "May";
		if (m.indexOf("June") === 0) return "Jun";
		if (m.indexOf("July") === 0) return "Jul";
		if (m.indexOf("August") === 0) return "Aug";
		if (m.indexOf("September") === 0) return "Sep";
		if (m.indexOf("October") === 0) return "Oct";
		if (m.indexOf("November") === 0) return "Nov";
		if (m.indexOf("December") === 0) return "Dec";
		return m;
	}

	function monthIndexEn(monthLabel) {
		var m = monthLabel.replace(/\s*\d{4}$/, "").trim();
		if (m.indexOf("January") === 0) return 1;
		if (m.indexOf("February") === 0) return 2;
		if (m.indexOf("March") === 0) return 3;
		if (m.indexOf("April") === 0) return 4;
		if (m.indexOf("May") === 0) return 5;
		if (m.indexOf("June") === 0) return 6;
		if (m.indexOf("July") === 0) return 7;
		if (m.indexOf("August") === 0) return 8;
		if (m.indexOf("September") === 0) return 9;
		if (m.indexOf("October") === 0) return 10;
		if (m.indexOf("November") === 0) return 11;
		if (m.indexOf("December") === 0) return 12;
		return 0;
	}

	function monthIndexFr(monthLabel) {
		var m = monthLabel.replace(/\s*\d{4}$/, "").trim();
		if (m.indexOf("Janvier") === 0) return 1;
		if (m.indexOf("Février") === 0) return 2;
		if (m.indexOf("Mars") === 0) return 3;
		if (m.indexOf("Avril") === 0) return 4;
		if (m.indexOf("Mai") === 0) return 5;
		if (m.indexOf("Juin") === 0) return 6;
		if (m.indexOf("Juillet") === 0) return 7;
		if (m.indexOf("Août") === 0) return 8;
		if (m.indexOf("Septembre") === 0) return 9;
		if (m.indexOf("Octobre") === 0) return 10;
		if (m.indexOf("Novembre") === 0) return 11;
		if (m.indexOf("Décembre") === 0) return 12;
		return 0;
	}

	function shortMonthFr(monthLabel) {
		var m = monthLabel.replace(/\s*\d{4}$/, "").trim();
		if (m.indexOf("Janvier") === 0) return "Janv.";
		if (m.indexOf("Février") === 0) return "Fév.";
		if (m.indexOf("Mars") === 0) return "Mars";
		if (m.indexOf("Avril") === 0) return "Avr.";
		if (m.indexOf("Mai") === 0) return "Mai";
		if (m.indexOf("Juin") === 0) return "Juin";
		if (m.indexOf("Juillet") === 0) return "Juil.";
		if (m.indexOf("Août") === 0) return "Août";
		if (m.indexOf("Septembre") === 0) return "Sept.";
		if (m.indexOf("Octobre") === 0) return "Oct.";
		if (m.indexOf("Novembre") === 0) return "Nov.";
		if (m.indexOf("Décembre") === 0) return "Déc.";
		return m;
	}

	if (!fr) {
		rows.forEach((r) => {
			var cells = r.querySelectorAll("td");
			if (cells.length >= 2) {
				var weekendCell = cells[1];
				var m = weekendCell.textContent.match(/(\d+)\s*[–-]\s*(\d+)/);
				if (m) weekendCell.textContent = m[1] + "\u2013" + m[2];
			}
		});
	}

	rows.forEach((r) => {
		if (r.getAttribute("data-nre") === "true") nreCount++;
		if (r.getAttribute("data-exception") === "true") exceptionCount++;
		var cells = r.querySelectorAll("td");
		var monthLabel = cells[0].textContent;
		var weekendCell = cells[1].textContent;
		var weekendMatch = weekendCell.match(/(\d+)\s*[–-]\s*(\d+)/);
		var weekendNum = weekendMatch
			? weekendMatch[1] + "–" + weekendMatch[2]
			: "";
		var yearMatch = monthLabel.match(/\d{4}/);
		var year = yearMatch ? yearMatch[0] : "";
		if (!byYear[year]) byYear[year] = [];
		var cls =
			r.getAttribute("data-nre") === "true"
				? "nre"
				: r.getAttribute("data-exception") === "true"
					? "exc"
					: "";
		var monthShort;
		var monthIndex;
		if (fr) {
			monthIndex = monthIndexFr(monthLabel);
			monthShort = shortMonthFr(monthLabel);
		} else {
			monthIndex = monthIndexEn(monthLabel);
			monthShort = shortMonthEn(monthLabel);
		}
		byYear[year].push({
			month: monthShort,
			weekend: weekendNum,
			class: cls,
			monthIndex: monthIndex,
		});
	});

	var flagNorway = "\uD83C\uDDF3\uD83C\uDDF4";
	var flagGermany = "\uD83C\uDDE9\uD83C\uDDEA";
	var yearOrder = [
		"2017",
		"2018",
		"2019",
		"2020",
		"2021",
		"2022",
		"2023",
		"2024",
		"2025",
		"2026",
	];
	var ariaDe = fr ? "Allemagne, Frankfurt" : "Germany, Frankfurt";
	var ariaNo = fr ? "Norvège, Oslo" : "Norway, Oslo";

	yearOrder.forEach((y) => {
		if (!byYear[y]) return;
		var flag = parseInt(y, 10) >= 2022 ? flagGermany : flagNorway;
		var item = document.createElement("div");
		item.className = "timeline-item";
		var marker = document.createElement("span");
		marker.className = "timeline-marker";
		item.appendChild(marker);
		var content = document.createElement("div");
		content.className = "timeline-content";
		var header = document.createElement("div");
		header.className = "timeline-header";
		var title = document.createElement("h3");
		title.className = "timeline-year-title";
		title.innerHTML =
			y +
			' <span class="timeline-year-location" aria-label="' +
			(parseInt(y, 10) >= 2022 ? ariaDe : ariaNo) +
			'">' +
			flag +
			"</span>";
		header.appendChild(title);
		content.appendChild(header);
		var items = document.createElement("div");
		items.className = "timeline-year-items";
		var sorted = byYear[y]
			.slice()
			.sort((a, b) => (a.monthIndex || 0) - (b.monthIndex || 0));
		var firstHalf = sorted.filter(
			(o) => o.monthIndex >= 1 && o.monthIndex <= 6,
		);
		var secondHalf = sorted.filter(
			(o) => o.monthIndex >= 7 && o.monthIndex <= 12,
		);
		[firstHalf, secondHalf].forEach((half) => {
			var row = document.createElement("div");
			row.className = "timeline-year-row";
			half.forEach((o) => {
				var card = document.createElement("div");
				card.className = "timeline-weekend-card " + (o.class || "");
				var text = o.month + (o.weekend ? " " + o.weekend : "");
				var icon =
					o.class === "nre" ? "\u2717" : o.class === "exc" ? "\u2713" : "";
				card.textContent = text + (icon ? " " + icon : "");
				row.appendChild(card);
			});
			items.appendChild(row);
		});
		content.appendChild(items);
		item.appendChild(content);
		timeline.appendChild(item);
	});

	var elTotal = document.getElementById("stat-total");
	var elNre = document.getElementById("stat-nre");
	var elExc = document.getElementById("stat-exceptions");
	if (elTotal) elTotal.textContent = total;
	if (elNre) elNre.textContent = nreCount;
	if (elExc) elExc.textContent = exceptionCount;
})();
