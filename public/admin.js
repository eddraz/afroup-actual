(function () {
  var state = {
    departments: [],
    entries: [],
    status: "pending",
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
  }

  function openEditor(entry) {
    state.current = entry;
    editor.classList.add("open");
    document.getElementById("edit-id").value = entry.id;
    departmentSelect.value = entry.department_slug;
    document.getElementById("edit-status").value = entry.status;
    document.getElementById("edit-title").value = entry.title || "";
    document.getElementById("edit-summary").value = entry.summary || "";
    document.getElementById("edit-body").value = entry.body || "";
    document.getElementById("edit-location").value = entry.location || "";
    document.getElementById("edit-category").value = entry.category || "";
    document.getElementById("edit-contact-name").value = entry.contact_name || "";
    document.getElementById("edit-contact-phone").value = entry.contact_phone || "";
    document.getElementById("edit-contact-email").value = entry.contact_email || "";
    document.getElementById("edit-source").value = entry.source || "";
    setMsg(editMsg, "", true);
    editor.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function payloadFromEditor(status) {
    return {
      department: departmentSelect.value,
      status: status || document.getElementById("edit-status").value,
      title: document.getElementById("edit-title").value,
      summary: document.getElementById("edit-summary").value,
      body: document.getElementById("edit-body").value,
      location: document.getElementById("edit-location").value,
      category: document.getElementById("edit-category").value,
      contact_name: document.getElementById("edit-contact-name").value,
      contact_phone: document.getElementById("edit-contact-phone").value,
      contact_email: document.getElementById("edit-contact-email").value,
      source: document.getElementById("edit-source").value,
    };
  }

  function loadEntries() {
    return fetchJson("/api/admin/entries?status=" + encodeURIComponent(state.status)).then(function (data) {
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
        return loadEntries();
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
        return Promise.all([loadDepartments(), loadEntries()]);
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

  Promise.all([loadDepartments(), loadEntries()]).catch(function (err) {
    if (err.status === 401) {
      showDashboard(false);
      return;
    }
    setMsg(loginMsg, err.message, false);
  });
})();
