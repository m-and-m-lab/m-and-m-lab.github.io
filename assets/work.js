// Research section: rebuilds one paper list as Most recent, Highlights, or By area.
// By area shows one area at a time. Without JavaScript the full list stays visible.
(function () {
  var list = document.getElementById("work-list");
  var wrap = document.querySelector(".view-bar");
  var section = document.getElementById("research");
  var note = document.getElementById("view-note");
  if (!list || !wrap) return;
  var tabs = wrap.querySelector(".area-tabs");
  var items = Array.prototype.slice.call(list.querySelectorAll("li[data-date]"));
  var buttons = Array.prototype.slice.call(wrap.querySelectorAll(".views button"));
  var AREAS = [
    ["representation", "Visual representation learning"],
    ["search", "Active perception and search"],
    ["space", "Space applications"]
  ];
  var NOTES = {
    recent: "",
    highlights: "Selected papers by year, including Professor Bucher's work with collaborators from before the lab began.",
    areas: "Includes Professor Bucher's work with collaborators from before the lab began."
  };
  var area = AREAS[0][0];

  var areaButtons = AREAS.map(function (a) {
    var b = document.createElement("button");
    b.type = "button";
    b.textContent = a[1];
    b.setAttribute("data-area", a[0]);
    b.addEventListener("click", function () { area = a[0]; choose("areas"); });
    tabs.appendChild(b);
    return b;
  });

  function byDate(a, b) {
    var x = a.getAttribute("data-date"), y = b.getAttribute("data-date");
    return x < y ? 1 : x > y ? -1 : items.indexOf(a) - items.indexOf(b);
  }
  function has(name) { return function (li) { return li.hasAttribute(name); }; }
  function year(li) { return li.getAttribute("data-date").slice(0, 4); }

  function groups(view) {
    if (view === "areas") {
      return [{ title: "", items: items.filter(function (li) { return li.getAttribute("data-area") === area; }).sort(byDate) }];
    }
    if (view === "highlights") {
      var years = [];
      items.filter(has("data-highlight")).sort(byDate).forEach(function (li) {
        var y = year(li);
        if (!years.length || years[years.length - 1].title !== y) years.push({ title: y, items: [] });
        years[years.length - 1].items.push(li);
      });
      return years;
    }
    // Most recent shows the newest year in the list, so it rolls over with the first paper of a new year.
    var latest = items.map(year).sort().pop();
    return [{ title: "", items: items.filter(function (li) { return year(li) === latest; }).sort(byDate) }];
  }

  function show(view) {
    list.textContent = "";
    groups(view).forEach(function (g) {
      var box = document.createElement("div");
      box.className = "area";
      if (g.title) {
        var h = document.createElement("h3");
        h.textContent = g.title;
        box.appendChild(h);
      }
      var ul = document.createElement("ul");
      ul.className = "work";
      g.items.forEach(function (li) { ul.appendChild(li); });
      box.appendChild(ul);
      list.appendChild(box);
    });
    note.textContent = view === "areas" && area !== "search" ? "" : NOTES[view];
    tabs.hidden = view !== "areas";
    buttons.forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-view") === view ? "true" : "false");
    });
    areaButtons.forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-area") === area ? "true" : "false");
    });
  }

  function choose(view) {
    show(view);
    history.replaceState(null, "", "#" + (view === "areas" ? "areas-" + area : view));
    // After a long list, return to the top of the section so the new view starts in sight.
    if (section.getBoundingClientRect().top < 0) section.scrollIntoView({ block: "start" });
  }

  buttons.forEach(function (b) {
    b.addEventListener("click", function () { choose(b.getAttribute("data-view")); });
  });

  // Links such as /#highlights or /#areas-space open that view directly.
  var start = location.hash.slice(1), view = "recent", linked = false;
  if (start === "recent" || start === "highlights") { view = start; linked = true; }
  if (start === "areas" || start.indexOf("areas-") === 0) {
    view = "areas"; linked = true;
    var want = start.slice(6);
    if (AREAS.some(function (a) { return a[0] === want; })) area = want;
  }
  wrap.hidden = false;
  show(view);
  if (linked) section.scrollIntoView();
})();
