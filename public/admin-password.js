(function () {
  var loginPanel = document.getElementById("login-panel");
  var passwordPanel = document.getElementById("password-panel");
  var loginForm = document.getElementById("login-form");
  var loginMsg = document.getElementById("login-msg");
  var passwordForm = document.getElementById("password-form");
  var passwordMsg = document.getElementById("password-msg");
  var logoutBtn = document.getElementById("logout-btn");

  function setMsg(el, text, ok) {
    if (!el) return;
    el.hidden = !text;
    el.textContent = text || "";
    el.className = "msg " + (ok ? "ok" : "err");
  }

  function csrfToken() {
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
        if (!res.ok) {
          var err = new Error(data.error || "No se pudo completar la solicitud.");
          err.status = res.status;
          throw err;
        }
        return data;
      });
    });
  }

  function showPassword(on) {
    loginPanel.classList.toggle("hidden", on);
    passwordPanel.classList.toggle("hidden", !on);
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
        showPassword(true);
      })
      .catch(function (err) {
        setMsg(loginMsg, err.message, false);
      });
  });

  logoutBtn.addEventListener("click", function () {
    fetchJson("/api/admin/logout", { method: "POST" })
      .catch(function () {})
      .then(function () {
        passwordForm.reset();
        showPassword(false);
      });
  });

  passwordForm.addEventListener("submit", function (event) {
    event.preventDefault();
    fetchJson("/api/admin/password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        current_password: document.getElementById("current-password").value,
        new_password: document.getElementById("new-password").value,
        confirm_password: document.getElementById("confirm-password").value,
      }),
    })
      .then(function (data) {
        passwordForm.reset();
        setMsg(passwordMsg, data.message || "Contraseña actualizada.", true);
      })
      .catch(function (err) {
        if (err.status === 401 && /sesión/i.test(err.message)) {
          showPassword(false);
          setMsg(loginMsg, "La sesión venció. Vuelve a ingresar.", false);
          return;
        }
        setMsg(passwordMsg, err.message, false);
      });
  });

  fetchJson("/api/admin/session")
    .then(function () {
      showPassword(true);
    })
    .catch(function () {
      showPassword(false);
    });
})();
