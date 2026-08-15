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

  function fillCategories() {
    var list = document.getElementById("category-options");
    if (!list) return;
    list.innerHTML = state.categories
      .map(function (category) {
        return '<option value="' + escapeHtml(category) + '"></option>';
      })
      .join("");
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
    document.getElementById("edit-category").value = entry.category || "";
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
      category: document.getElementById("edit-category").value,
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
      fillCategories();
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
        return Promise.all([loadDepartments(), loadCategories(), loadEntries()]);
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

  Promise.all([loadDepartments(), loadCategories(), loadEntries()]).catch(function (err) {
    if (err.status === 401) {
      showDashboard(false);
      return;
    }
    setMsg(loginMsg, err.message, false);
  });
})();
