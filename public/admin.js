(function () {
  var state = {
    departments: [],
    categories: [],
    entries: [],
    status: "pending",
    query: "",
    current: null,
  };

  var loginPanel = document.getElementById("login-panel");
  var dashboard = document.getElementById("dashboard");
  var loginForm = document.getElementById("login-form");
  var loginMsg = document.getElementById("login-msg");
  var statusChips = document.getElementById("status-chips");
  var entriesBody = document.getElementById("entries-body");
  var emptyMsg = document.getElementById("empty-msg");
  var editor = document.getElementById("editor");
  var editMsg = document.getElementById("edit-msg");
  var logoutBtn = document.getElementById("logout-btn");
  var departmentSelect = document.getElementById("edit-department");
  var searchForm = document.getElementById("admin-search");
  var searchInput = document.getElementById("admin-q");
  var alertForm = document.getElementById("alert-form");
  var alertActive = document.getElementById("alert-active");
  var alertMessage = document.getElementById("alert-message");
  var alertLinkUrl = document.getElementById("alert-link-url");
  var alertLinkText = document.getElementById("alert-link-text");
  var alertClearBtn = document.getElementById("alert-clear-btn");
  var alertMsg = document.getElementById("alert-msg");
  var infoEditor = window.AfroUpRichEditor ? window.AfroUpRichEditor.attach("#edit-information") : null;

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

  var csrfValue = "";

  function csrfToken() {
    if (csrfValue) return csrfValue;
    var match = document.cookie.match(/(?:^|; )afroup_csrf=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : "";
  }

  function fetchJson(url, options) {
    options = options || {};
    options.credentials = "same-origin";
    options.headers = options.headers || {};
    var method = String(options.method || "GET").toUpperCase();
    if (method !== "GET" && method !== "HEAD") {
      options.headers["x-csrf-token"] = csrfToken();
    }
    return fetch(url, options).then(function (res) {
      return res.json().catch(function () {
        return {};
      }).then(function (data) {
        if (data && data.csrf) csrfValue = data.csrf;
        if (!res.ok) {
          var err = new Error(data.error || "No se pudo completar la solicitud.");
          err.status = res.status;
          throw err;
        }
        return data;
      });
    });
  }

  function showDashboard(on) {
    loginPanel.classList.toggle("hidden", on);
    dashboard.classList.toggle("hidden", !on);
  }

  function fillDepartments() {
    departmentSelect.innerHTML = state.departments
      .map(function (dept) {
        return '<option value="' + escapeHtml(dept.slug) + '">' + escapeHtml(dept.name) + "</option>";
      })
      .join("");
  }

  var CATEGORIES = [
    "Punto de acopio",
    "Donación económica",
    "Banco de sangre",
    "Albergue",
    "Alimentos / insumos",
    "Voluntariado",
    "Otro",
  ];
  var categorySelect = document.getElementById("edit-category");
  var categoryOther = document.getElementById("edit-category-other");

  function setCategoryOther(show, value) {
    if (!categoryOther) return;
    categoryOther.hidden = !show;
    categoryOther.required = !!show;
    categoryOther.value = show ? (value || "") : "";
  }

  function setCategoryValue(value) {
    var category = String(value || "").trim();
    if (!categorySelect) return;
    if (!category) {
      categorySelect.value = "";
      setCategoryOther(false);
      return;
    }
    if (CATEGORIES.indexOf(category) !== -1 && category !== "Otro") {
      categorySelect.value = category;
      setCategoryOther(false);
      return;
    }
    categorySelect.value = "Otro";
    setCategoryOther(true, category === "Otro" ? "" : category);
  }

  function selectedCategory() {
    var category = categorySelect ? categorySelect.value : "";
    if (category === "Otro" && categoryOther && categoryOther.value.trim()) {
      return categoryOther.value.trim();
    }
    return category;
  }

  function renderTable() {
    entriesBody.innerHTML = state.entries
      .map(function (entry) {
        var contact = [entry.contact_name, entry.contact_phone, entry.contact_email]
          .filter(Boolean)
          .map(escapeHtml)
          .join("<br>");
        return (
          "<tr>" +
          "<td><strong>" +
          escapeHtml(entry.title) +
          "</strong><div class='dek'>" +
          escapeHtml(entry.summary || "") +
          "</div></td>" +
          "<td>" +
          escapeHtml(entry.department_name) +
          "</td>" +
          "<td><span class='status " +
          escapeHtml(entry.status) +
          "'>" +
          escapeHtml(entry.status) +
          "</span></td>" +
          "<td>" +
          (contact || "—") +
          "</td>" +
          "<td class='actions'><button class='btn btn-ghost btn-sm' type='button' data-edit='" +
          entry.id +
          "'>Editar</button>" +
          (entry.status === "rejected"
            ? "<button class='btn btn-ghost btn-sm' type='button' data-delete='" + entry.id + "'>Eliminar</button>"
            : "") +
          "</td>" +
          "</tr>"
        );
      })
      .join("");
    emptyMsg.hidden = state.entries.length > 0;
    emptyMsg.textContent = state.query
      ? "No hay registros que coincidan con “" + state.query + "”."
      : "No hay registros en este filtro.";
  }

  function openEditor(entry) {
    state.current = entry;
    editor.classList.add("open");
    document.getElementById("edit-id").value = entry.id;
    departmentSelect.value = entry.department_slug;
    document.getElementById("edit-status").value = entry.status;
    setCategoryValue(entry.category || "");
    var info = entry.information || entry.body || entry.summary || "";
    if (infoEditor) infoEditor.setHtml(info);
    else document.getElementById("edit-information").value = info;
    setMsg(editMsg, "", true);
    editor.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function payloadFromEditor(status) {
    return {
      department: departmentSelect.value,
      status: status || document.getElementById("edit-status").value,
      category: selectedCategory(),
      information: infoEditor ? infoEditor.getHtml() : document.getElementById("edit-information").value,
    };
  }

  function loadEntries() {
    var params = new URLSearchParams();
    params.set("status", state.status);
    if (state.query) params.set("q", state.query);
    return fetchJson("/api/admin/entries?" + params.toString()).then(function (data) {
      state.entries = data.entries || [];
      renderTable();
      showDashboard(true);
    });
  }

  function loadDepartments() {
    return fetchJson("/api/departments").then(function (data) {
      state.departments = data.departments || [];
      fillDepartments();
    });
  }

  function loadCategories() {
    return fetchJson("/api/admin/categories").then(function (data) {
      state.categories = data.categories || [];
    });
  }

  function saveEntry(status) {
    var id = document.getElementById("edit-id").value;
    if (!id) return;
    fetchJson("/api/admin/entries/" + id, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payloadFromEditor(status)),
    })
      .then(function (data) {
        setMsg(editMsg, "Cambios guardados.", true);
        if (data.entry) openEditor(data.entry);
        return Promise.all([loadEntries(), loadCategories()]);
      })
      .catch(function (err) {
        if (err.status === 401) {
          showDashboard(false);
          setMsg(loginMsg, "La sesión venció. Vuelve a ingresar.", false);
          return;
        }
        setMsg(editMsg, err.message, false);
      });
  }

  function loadAlert() {
    if (!alertForm) return Promise.resolve();
    return fetchJson("/api/admin/alert").then(function (data) {
      var alert = data && data.alert;
      if (alert) {
        if (alertActive) alertActive.checked = !!alert.is_active;
        if (alertMessage) alertMessage.value = alert.message || "";
        if (alertLinkUrl) alertLinkUrl.value = alert.link_url || "";
        if (alertLinkText) alertLinkText.value = alert.link_text || "";
      }
    });
  }

  function saveAlert() {
    setMsg(alertMsg, "Guardando…", true);
    var payload = {
      is_active: alertActive ? alertActive.checked : false,
      message: alertMessage ? alertMessage.value.trim() : "",
      link_url: alertLinkUrl ? alertLinkUrl.value.trim() : "",
      link_text: alertLinkText ? alertLinkText.value.trim() : "",
    };
    return fetchJson("/api/admin/alert", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(function (res) {
        setMsg(alertMsg, res.message || "Alerta guardada correctamente.", true);
        setTimeout(function () {
          setMsg(alertMsg, "");
        }, 4000);
      })
      .catch(function (err) {
        setMsg(alertMsg, err.message, false);
      });
  }

  function clearAlert() {
    if (alertActive) alertActive.checked = false;
    if (alertMessage) alertMessage.value = "";
    if (alertLinkUrl) alertLinkUrl.value = "";
    if (alertLinkText) alertLinkText.value = "";
    saveAlert();
  }

  if (alertForm) {
    alertForm.addEventListener("submit", function (event) {
      event.preventDefault();
      saveAlert();
    });
  }

  if (alertClearBtn) {
    alertClearBtn.addEventListener("click", function () {
      clearAlert();
    });
  }

  loginForm.addEventListener("submit", function (event) {
    event.preventDefault();
    fetchJson("/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        username: document.getElementById("username").value,
        password: document.getElementById("password").value,
      }),
    })
      .then(function () {
        setMsg(loginMsg, "", true);
        return Promise.all([loadDepartments(), loadCategories(), loadEntries(), loadAlert()]);
      })
      .catch(function (err) {
        setMsg(loginMsg, err.message, false);
      });
  });

  logoutBtn.addEventListener("click", function () {
    fetchJson("/api/admin/logout", { method: "POST" })
      .catch(function () {})
      .then(function () {
        editor.classList.remove("open");
        showDashboard(false);
      });
  });

  if (searchForm) {
    searchForm.addEventListener("submit", function (event) {
      event.preventDefault();
      state.query = searchInput ? searchInput.value.trim() : "";
      loadEntries().catch(function (err) {
        if (err.status === 401) showDashboard(false);
      });
    });
  }

  statusChips.addEventListener("click", function (event) {
    var chip = event.target.closest(".chip");
    if (!chip) return;
    statusChips.querySelectorAll(".chip").forEach(function (el) {
      el.classList.remove("on");
    });
    chip.classList.add("on");
    state.status = chip.getAttribute("data-status") || "pending";
    loadEntries().catch(function (err) {
      if (err.status === 401) showDashboard(false);
    });
  });

  entriesBody.addEventListener("click", function (event) {
    var deleteButton = event.target.closest("[data-delete]");
    if (deleteButton) {
      var deleteId = Number(deleteButton.getAttribute("data-delete"));
      var doomed = state.entries.find(function (item) { return item.id === deleteId; });
      if (!doomed || doomed.status !== "rejected") return;
      if (!window.confirm("¿Eliminar \"" + (doomed.title || "este registro") + "\"? Esta acción no se puede deshacer.")) return;
      fetchJson("/api/admin/entries/" + deleteId, { method: "DELETE" })
        .then(function () {
          if (state.current && state.current.id === deleteId) {
            editor.classList.remove("open");
            state.current = null;
          }
          return loadEntries();
        })
        .catch(function (err) {
          if (err.status === 401) {
            showDashboard(false);
            setMsg(loginMsg, "La sesión venció. Vuelve a ingresar.", false);
          }
        });
      return;
    }
    var button = event.target.closest("[data-edit]");
    if (!button) return;
    var id = Number(button.getAttribute("data-edit"));
    var entry = state.entries.find(function (item) {
      return item.id === id;
    });
    if (entry) openEditor(entry);
  });

  if (categorySelect) {
    categorySelect.addEventListener("change", function () {
      setCategoryOther(categorySelect.value === "Otro", "");
    });
  }

  editor.addEventListener("submit", function (event) {
    event.preventDefault();
    saveEntry();
  });

  document.getElementById("publish-btn").addEventListener("click", function () {
    saveEntry("published");
  });

  document.getElementById("reject-btn").addEventListener("click", function () {
    saveEntry("rejected");
  });

  Promise.all([loadDepartments(), loadCategories(), loadEntries(), loadAlert()]).catch(function (err) {
    if (err.status === 401) {
      showDashboard(false);
      return;
    }
    setMsg(loginMsg, err.message, false);
  });
})();
