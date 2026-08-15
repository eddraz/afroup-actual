(function () {
  function start() {
  var PAGE_SIZE = 4;
  var params = new URLSearchParams(window.location.search);
  var state = {
    departments: [],
    entries: [],
    department: params.get("department") || "",
    query: (params.get("q") || "").trim(),
    pages: { list: Math.max(1, parseInt(params.get("page") || "1", 10) || 1) },
  };

  var chips = document.getElementById("department-chips");
  var entriesEl = document.getElementById("entries");
  var form = document.getElementById("submit-form");
  var formMsg = document.getElementById("form-msg");
  var departmentSelect = document.getElementById("department");
  var searchForm = document.querySelector(".topbar form.search");
  var searchInput = searchForm ? searchForm.querySelector('input[name="q"]') : null;
  if (searchInput && state.query) searchInput.value = state.query;

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function setMsg(el, text, ok) {
    if (!el) return;
    el.hidden = !text;
    el.textContent = text || "";
    el.className = "msg " + (ok ? "ok" : "err");
  }

  function fetchJson(url, options) {
    return fetch(url, options).then(function (res) {
      return res.json().catch(function () {
        return {};
      }).then(function (data) {
        if (!res.ok) throw new Error(data.error || "No se pudo completar la solicitud.");
        return data;
      });
    });
  }

  function renderChips() {
    if (!chips) return;
    var html = '<button class="chip' + (state.department === "" ? " on" : "") + '" type="button" data-slug="">Todos</button>';
    state.departments.forEach(function (dept) {
      html +=
        '<button class="chip' +
        (state.department === dept.slug ? " on" : "") +
        '" type="button" data-slug="' +
        escapeHtml(dept.slug) +
        '">' +
        escapeHtml(dept.name) +
        " (" +
        Number(dept.published_count || 0) +
        ")</button>";
    });
    chips.innerHTML = html;
  }

  function fillDepartmentSelect() {
    if (!departmentSelect) return;
    departmentSelect.innerHTML = state.departments
      .map(function (dept) {
        var selected = dept.slug === "choco" ? " selected" : "";
        return '<option value="' + escapeHtml(dept.slug) + '"' + selected + ">" + escapeHtml(dept.name) + "</option>";
      })
      .join("");
  }

  function compactText() {
    var parts = [];
    for (var i = 0; i < arguments.length; i += 1) {
      var value = String(arguments[i] || "").replace(/\s+/g, " ").trim();
      if (value && parts.indexOf(value) === -1) parts.push(value);
    }
    return parts.join(" ");
  }

  function entryCard(entry) {
    var contact = [entry.contact_name, entry.contact_phone, entry.contact_email]
      .filter(Boolean)
      .join(" · ");
    var text = compactText(entry.location, entry.summary, entry.body, contact);
    return (
      '<article class="card">' +
      '<div class="body">' +
      '<span class="tag c-actualidad"><span class="sq"></span> ' +
      escapeHtml(entry.category || entry.department_name) +
      "</span>" +
      "<h3>" +
      escapeHtml(entry.title) +
      "</h3>" +
      '<p class="dek">' +
      escapeHtml(text || "Sin descripción adicional.") +
      "</p>" +
      "</div></article>"
    );
  }

  function pageCount(total) {
    return Math.max(1, Math.ceil(total / PAGE_SIZE));
  }

  function currentPage(key, total) {
    var max = pageCount(total);
    var page = Number(state.pages[key] || 1);
    if (page < 1) page = 1;
    if (page > max) page = max;
    state.pages[key] = page;
    return page;
  }

  function syncUrl() {
    var next = new URLSearchParams();
    if (state.department) next.set("department", state.department);
    if (state.query) next.set("q", state.query);
    var page = Number(state.pages.list || 1);
    if (page > 1) next.set("page", String(page));
    var qs = next.toString();
    var nextUrl = window.location.pathname + (qs ? "?" + qs : "") + "#ayudas";
    if (window.location.pathname + window.location.search + window.location.hash !== nextUrl) {
      history.pushState({ department: state.department, query: state.query, page: page }, "", nextUrl);
    }
  }

  function pageSlice(entries, key) {
    var page = currentPage(key, entries.length);
    var start = (page - 1) * PAGE_SIZE;
    return entries.slice(start, start + PAGE_SIZE);
  }

  function visiblePages(page, pages) {
    var set = { 1: true, [pages]: true, [page]: true, [page - 1]: true, [page + 1]: true };
    return Object.keys(set).map(Number).filter(function (n) { return n >= 1 && n <= pages; }).sort(function (a, b) { return a - b; });
  }

  function pagerMarkup(key, total) {
    var pages = pageCount(total);
    if (pages <= 1) return "";
    var page = currentPage(key, total);
    var shown = visiblePages(page, pages);
    var buttons = "";
    var last = 0;
    shown.forEach(function (n) {
      if (last && n - last > 1) buttons += '<span class="pager-gap">…</span>';
      buttons += '<button type="button" data-page="' + n + '"' + (n === page ? ' class="on"' : "") + ">" + n + "</button>";
      last = n;
    });
    return (
      '<div class="pager" data-page-key="' + escapeHtml(key) + '">' +
      '<button type="button" data-page="' + (page - 1) + '" ' + (page === 1 ? "disabled" : "") + ">Anterior</button>" +
      buttons +
      '<button type="button" data-page="' + (page + 1) + '" ' + (page === pages ? "disabled" : "") + ">Siguiente</button>" +
      "</div>"
    );
  }

  function sectionMarkup(name, entries, key) {
    if (!entries.length) {
      return '<section class="dept-block"><div class="dept-head"><h3>' + escapeHtml(name) + '</h3></div><p class="empty">Sin ayudas publicadas todavía en este departamento.</p></section>';
    }
    var page = currentPage(key, entries.length);
    var pages = pageCount(entries.length);
    var meta = pages > 1
      ? '<span class="page-meta">Página ' + page + " de " + pages + " · " + entries.length + " ayudas</span>"
      : '<span class="page-meta">' + entries.length + (entries.length === 1 ? " ayuda" : " ayudas") + "</span>";
    return (
      '<section class="dept-block">' +
      '<div class="dept-head"><h3>' + escapeHtml(name) + "</h3>" + meta + "</div>" +
      '<div class="feed">' + pageSlice(entries, key).map(entryCard).join("") + "</div>" +
      pagerMarkup(key, entries.length) +
      "</section>"
    );
  }

  function renderEntries() {
    if (!entriesEl) return;
    if (!state.entries.length) {
      entriesEl.innerHTML = '<p class="empty">No hay ayudas publicadas en esta vista.</p>';
      return;
    }

    var label = "Todas las ayudas";
    if (state.query) label = "Resultados";
    else if (state.department) {
      label = ((state.departments.find(function (dept) { return dept.slug === state.department; }) || {}).name || "Ayudas");
    }
    entriesEl.innerHTML = sectionMarkup(label, state.entries, "list");
    syncUrl();
  }

  function loadEntries() {
    var params = new URLSearchParams();
    if (state.department) params.set("department", state.department);
    if (state.query) params.set("q", state.query);
    var qs = params.toString();
    return fetchJson("/api/entries" + (qs ? "?" + qs : "")).then(function (data) {
      state.entries = data.entries || [];
      renderEntries();
    });
  }

  function loadDepartments() {
    return fetchJson("/api/departments").then(function (data) {
      state.departments = data.departments || [];
      renderChips();
      fillDepartmentSelect();
    });
  }

  if (chips) {
    chips.addEventListener("click", function (event) {
      var button = event.target.closest(".chip");
      if (!button) return;
      state.department = button.getAttribute("data-slug") || "";
      state.pages = { list: 1 };
      renderChips();
      loadEntries().catch(function (err) {
        entriesEl.innerHTML = '<p class="empty">' + escapeHtml(err.message) + "</p>";
      });
    });
  }

  if (searchForm) {
    searchForm.setAttribute("action", "/");
    searchForm.addEventListener("submit", function (event) {
      event.preventDefault();
      state.query = searchInput ? searchInput.value.trim() : "";
      state.pages = { list: 1 };
      loadEntries().catch(function (err) {
        entriesEl.innerHTML = '<p class="empty">' + escapeHtml(err.message) + "</p>";
      });
    });
  }

  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var payload = {
        department: departmentSelect.value,
        title: document.getElementById("title").value,
        summary: document.getElementById("summary").value,
        body: document.getElementById("body").value,
        category: document.getElementById("category").value,
        location: document.getElementById("location").value,
        source: document.getElementById("source").value,
        contact_name: document.getElementById("contact_name").value,
        contact_phone: document.getElementById("contact_phone").value,
        contact_email: document.getElementById("contact_email").value,
        submitted_by_name: document.getElementById("submitted_by_name").value,
      };
      fetchJson("/api/entries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(function (data) {
          form.reset();
          fillDepartmentSelect();
          setMsg(formMsg, data.message || "Información enviada para revisión.", true);
        })
        .catch(function (err) {
          setMsg(formMsg, err.message, false);
        });
    });
  }

  if (entriesEl) {
    entriesEl.addEventListener("click", function (event) {
      var button = event.target.closest(".pager button");
      if (!button || button.disabled) return;
      var pager = button.closest(".pager");
      var key = pager ? pager.getAttribute("data-page-key") : "";
      var page = Number(button.getAttribute("data-page") || 0);
      if (!key || !page) return;
      state.pages[key] = page;
      renderEntries();
      var block = entriesEl.querySelector('[data-page-key="' + key + '"]');
      if (block && block.closest(".dept-block")) {
        block.closest(".dept-block").scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  window.addEventListener("popstate", function () {
    var next = new URLSearchParams(window.location.search);
    state.department = next.get("department") || "";
    state.query = (next.get("q") || "").trim();
    state.pages = { list: Math.max(1, parseInt(next.get("page") || "1", 10) || 1) };
    if (searchInput) searchInput.value = state.query;
    renderChips();
    loadEntries().catch(function (err) {
      entriesEl.innerHTML = '<p class="empty">' + escapeHtml(err.message) + "</p>";
    });
  });

  Promise.all([loadDepartments(), loadEntries()]).catch(function (err) {
    if (entriesEl) entriesEl.innerHTML = '<p class="empty">' + escapeHtml(err.message) + "</p>";
  });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
