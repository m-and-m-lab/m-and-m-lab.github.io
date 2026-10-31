// New research section: rebuilds one paper list as Most recent, Highlights, or By area.
// Without JavaScript the full list stays visible in date order.
(function () {
  var list = document.getElementById("work-list");
  var bar = document.querySelector(".views");
  var note = document.getElementById("view-note");
  if (!list || !bar) return;
  var items = Array.prototype.slice.call(list.querySelectorAll("li[data-date]"));
  var buttons = Array.prototype.slice.call(bar.querySelectorAll("button"));
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

  function byDate(a, b) {
    var x = a.getAttribute("data-date"), y = b.getAttribute("data-date");
    return x < y ? 1 : x > y ? -1 : items.indexOf(a) - items.indexOf(b);
  }
  function has(name) { return function (li) { return li.hasAttribute(name); }; }
  function year(li) { return li.getAttribute("data-date").slice(0, 4); }

  function groups(view) {
    if (view === "areas") {
      return AREAS.map(function (a) {
        return { title: a[1], items: items.filter(function (li) { return li.getAttribute("data-area") === a[0]; }).sort(byDate) };
      });
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
    note.textContent = NOTES[view];
    buttons.forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-view") === view ? "true" : "false");
    });
  }

  buttons.forEach(function (b) {
    b.addEventListener("click", function () {
      var view = b.getAttribute("data-view");
      show(view);
      history.replaceState(null, "", "#" + view);
      var top = bar.getBoundingClientRect().top;
      if (top < 0 || top > window.innerHeight) bar.scrollIntoView({ block: "start" });
    });
  });

  // Links such as /#highlights open that view directly.
  var start = location.hash.slice(1);
  var known = buttons.some(function (b) { return b.getAttribute("data-view") === start; });
  bar.hidden = false;
  show(known ? start : "recent");
  if (known) document.getElementById("new-research").scrollIntoView();
})();
