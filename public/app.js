(function () {
  function start() {
  var PAGE_SIZE = 4;
  var params = new URLSearchParams(window.location.search);
  var rawQuery = (params.get("q") || "").trim();
  var rawDepartment = (params.get("department") || "").trim();
  var state = {
    departments: [],
    entries: [],
    department: rawQuery ? "" : rawDepartment,
    query: rawQuery,
    pages: { list: Math.max(1, parseInt(params.get("page") || "1", 10) || 1) },
  };

  var chips = document.getElementById("department-chips");
  var entriesEl = document.getElementById("entries");
  var form = document.getElementById("submit-form");
  var formMsg = document.getElementById("form-msg");
  var departmentSelect = document.getElementById("department");
  var searchForm = document.querySelector(".topbar form.search");
  var searchInput = searchForm ? searchForm.querySelector('input[name="q"]') : null;
  if (searchInput) searchInput.value = state.query;

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

  function visibleDepartments() {
    return state.departments.filter(function (dept) {
      return Number(dept.published_count || 0) > 0;
    });
  }

  function renderChips() {
    if (!chips) return;
    var html = '<button class="chip' + (state.department === "" ? " on" : "") + '" type="button" data-slug="">Todos</button>';
    visibleDepartments().forEach(function (dept) {
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

  function normalizeText(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/[^a-z0-9@./]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function similarText(a, b) {
    if (!a || !b) return false;
    if (a === b) return true;
    if (a.length >= 12 && b.indexOf(a) !== -1 && a.length / b.length > 0.7) return true;
    if (b.length >= 12 && a.indexOf(b) !== -1 && b.length / a.length > 0.7) return true;
    return false;
  }

  function infoLines(value) {
    return String(value || "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li)>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/gi, " ")
      .split(/\n+/)
      .map(function (line) {
        return line.replace(/^[·•|\s]+|[·•|\s]+$/g, "").trim();
      })
      .filter(Boolean);
  }

  function isContactOnly(line, entry) {
    var leftover = normalizeText(line);
    var bits = [entry.contact_name, entry.contact_phone, entry.contact_email]
      .map(normalizeText)
      .filter(Boolean);
    if (!bits.length) return false;
    bits.forEach(function (bit) {
      leftover = leftover.split(bit).join(" ");
    });
    return !leftover.replace(/\s+/g, " ").trim();
  }

  function uniqueInfoLines(entry) {
    var known = [entry.title, entry.location, entry.category, entry.department_name]
      .map(normalizeText)
      .filter(Boolean);
    var seen = {};
    var lines = [];
    infoLines(entry.information || entry.body || entry.summary || "").forEach(function (line) {
      var n = normalizeText(line);
      if (!n || seen[n]) return;
      if (known.some(function (item) { return similarText(n, item); })) return;
      if (isContactOnly(line, entry)) return;
      var stripped = n.replace(/^(punto de acopio|punto de donaciones|punto de donacion|canal de donacion|centro de acopio)( en| de)?\s+/, "");
      if (stripped !== n && (!stripped || known.some(function (item) {
        return similarText(stripped, item) || item.indexOf(stripped) !== -1;
      }))) return;
      if (entry.contact_phone && n.indexOf(normalizeText(entry.contact_phone)) !== -1 && n.replace(normalizeText(entry.contact_phone), "").trim().length < 8) return;
      seen[n] = true;
      lines.push(line);
    });
    return lines;
  }

  function showLocation(entry) {
    var location = String(entry.location || "").trim();
    if (!location) return "";
    var n = normalizeText(location);
    if (similarText(n, normalizeText(entry.title))) return "";
    if (similarText(n, normalizeText(entry.department_name))) return "";
    if (n === "buenaventura" || n === "choco" || n === "quibdo") return "";
    return location;
  }

  function showContact(entry, lines) {
    var contact = [entry.contact_name, entry.contact_phone, entry.contact_email].filter(Boolean).join(" · ");
    if (!contact) return "";
    var phone = normalizeText(entry.contact_phone || "");
    var already = lines.some(function (line) {
      var n = normalizeText(line);
      return similarText(n, normalizeText(contact)) || (phone && n.indexOf(phone) !== -1);
    });
    return already ? "" : contact;
  }

  function looksLikeRichHtml(value) {
    return /<(span|strong|b|em|i|ul|ol|li)\b/i.test(String(value || ""));
  }

  function entryCard(entry) {
    var rich = looksLikeRichHtml(entry.information);
    var lines = rich ? [] : uniqueInfoLines(entry);
    var location = rich ? "" : showLocation(entry);
    var contact = rich ? "" : showContact(entry, lines);
    var dek = rich
      ? (window.AfroUpRichEditor ? window.AfroUpRichEditor.sanitize(entry.information) : entry.information)
      : lines.concat(contact ? [contact] : []).map(function (line) {
          return escapeHtml(line);
        }).join("<br>");
    return (
      '<article class="card">' +
      '<div class="body">' +
      '<span class="tag c-actualidad"><span class="sq"></span> ' +
      escapeHtml(entry.category || entry.department_name) +
      "</span>" +
      "<h3>" +
      escapeHtml(entry.title) +
      "</h3>" +
      (location ? '<p class="where">' + escapeHtml(location) + "</p>" : "") +
      (dek ? '<div class="dek">' + dek + "</div>" : "") +
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
    if (state.query) next.set("q", state.query);
    else if (state.department) next.set("department", state.department);
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

    var label = "Puntos y canales de ayuda";
    if (state.query) label = "Resultados";
    else if (state.department) {
      label = ((state.departments.find(function (dept) { return dept.slug === state.department; }) || {}).name || "Ubicación");
    }
    entriesEl.innerHTML = sectionMarkup(label, state.entries, "list");
    syncUrl();
  }

  function loadEntries() {
    var params = new URLSearchParams();
    if (state.query) params.set("q", state.query);
    else if (state.department) params.set("department", state.department);
    var qs = params.toString();
    return fetchJson("/api/entries" + (qs ? "?" + qs : "")).then(function (data) {
      state.entries = data.entries || [];
      renderEntries();
    });
  }

  function formatUpdatedAt(value) {
    if (!value) return "";
    var match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return "";
    var dateOnly = /T00:00:00/.test(value) || value.indexOf("T") === -1;
    var date = dateOnly
      ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
      : new Date(value.indexOf("T") === -1 ? value.replace(" ", "T") + "Z" : value);
    if (isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("es-CO", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: dateOnly ? undefined : "America/Bogota",
    }).format(date);
  }

  function renderUpdatedAt(value) {
    var el = document.getElementById("guide-updated");
    if (!el) return;
    var formatted = formatUpdatedAt(value);
    el.textContent = formatted
      ? "La información ha sido recopilada, verificada y se encuentra en actualización permanente. Última actualización: " + formatted + ". Los envíos de nuevos puntos son revisados antes de publicarse."
      : "La información ha sido recopilada, verificada y se encuentra en actualización permanente. Los envíos de nuevos puntos son revisados antes de publicarse.";
  }

  function loadDepartments() {
    return fetchJson("/api/departments").then(function (data) {
      state.departments = data.departments || [];
      renderUpdatedAt(data.updated_at);
      renderChips();
      fillDepartmentSelect();
    });
  }

  if (chips) {
    chips.addEventListener("click", function (event) {
      var button = event.target.closest(".chip");
      if (!button) return;
      state.department = button.getAttribute("data-slug") || "";
      state.query = "";
      if (searchInput) searchInput.value = "";
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
      state.department = "";
      state.pages = { list: 1 };
      renderChips();
      loadEntries().then(function () {
        var aidsSection = document.getElementById("ayudas");
        if (aidsSection) {
          aidsSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }).catch(function (err) {
        entriesEl.innerHTML = '<p class="empty">' + escapeHtml(err.message) + "</p>";
      });
    });

    if (searchInput) {
      searchInput.addEventListener("search", function () {
        if (!searchInput.value.trim() && state.query) {
          state.query = "";
          state.department = "";
          state.pages = { list: 1 };
          renderChips();
          loadEntries().catch(function (err) {
            entriesEl.innerHTML = '<p class="empty">' + escapeHtml(err.message) + "</p>";
          });
        }
      });
    }
  }

  var infoEditor = window.AfroUpRichEditor ? window.AfroUpRichEditor.attach("#information") : null;

  var categoryField = document.getElementById("category");
  var categoryOther = document.getElementById("category-other");
  if (categoryField && categoryOther) {
    categoryField.addEventListener("change", function () {
      var showOther = categoryField.value === "Otro";
      categoryOther.hidden = !showOther;
      categoryOther.required = showOther;
      if (!showOther) categoryOther.value = "";
    });
  }

  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var information = infoEditor ? infoEditor.getHtml() : document.getElementById("information").value;
      if (infoEditor && infoEditor.isEmpty()) {
        setMsg(formMsg, "La información es obligatoria.", false);
        return;
      }
      var categoryField = document.getElementById("category");
      var categoryOther = document.getElementById("category-other");
      var category = categoryField ? categoryField.value : "";
      if (category === "Otro" && categoryOther && categoryOther.value.trim()) {
        category = categoryOther.value.trim();
      }
      var payload = {
        department: departmentSelect.value,
        category: category,
        information: information,
      };
      fetchJson("/api/entries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(function (data) {
          form.reset();
          if (infoEditor) infoEditor.setHtml("");
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
    var nextQuery = (next.get("q") || "").trim();
    var nextDept = (next.get("department") || "").trim();
    if (nextQuery) {
      state.query = nextQuery;
      state.department = "";
    } else {
      state.query = "";
      state.department = nextDept;
    }
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
