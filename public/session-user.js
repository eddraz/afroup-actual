(function () {
  var initialsFrom = function (value) {
    var parts = String(value || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  var paint = function (user) {
    if (!user) return;
    var name = user.name || user.email || "";
    var email = user.email || "";
    var initials = initialsFrom(name);
    document.querySelectorAll("[data-session-name]").forEach(function (node) {
      node.textContent = name;
    });
    document.querySelectorAll("[data-session-email]").forEach(function (node) {
      if (node.textContent && node.textContent.trim()) return;
      node.textContent = email;
    });
    document.querySelectorAll("[data-session-initials]").forEach(function (node) {
      node.textContent = initials;
      node.classList.toggle("hidden", Boolean(user.avatar_url));
    });
    document.querySelectorAll("[data-session-guest]").forEach(function (node) {
      node.classList.add("hidden");
    });
    document.querySelectorAll("[data-session-photo]").forEach(function (node) {
      if (user.avatar_url) {
        node.setAttribute("src", user.avatar_url);
        node.setAttribute("alt", name);
        node.classList.remove("hidden");
      } else {
        node.removeAttribute("src");
        node.classList.add("hidden");
      }
    });
    document.querySelectorAll("[data-session-avatar]").forEach(function (node) {
      node.classList.toggle("avatar-placeholder", !user.avatar_url);
      var frame = node.querySelector(":scope > div");
      if (!frame) return;
      frame.classList.toggle("bg-neutral", !user.avatar_url);
      frame.classList.toggle("text-neutral-content", !user.avatar_url);
    });
    document.querySelectorAll("[data-session-guest-nav]").forEach(function (node) {
      node.classList.add("hidden");
    });
    document.querySelectorAll("[data-session-user-nav]").forEach(function (node) {
      node.classList.remove("hidden");
    });
    document.querySelectorAll("[data-session-link]").forEach(function (node) {
      var href = node.getAttribute("data-session-href");
      if (href) node.setAttribute("href", href);
      node.setAttribute("aria-label", name || href || "");
    });
    document.querySelectorAll("[data-session-tooltip]").forEach(function (node) {
      node.setAttribute("data-tip", name);
    });
  };

  var bind = function () {
    if (document.documentElement.dataset.sessionUserBound === "true") return;
    document.documentElement.dataset.sessionUserBound = "true";
    fetch("/api/me", { credentials: "same-origin" })
      .then(function (res) { return res.json(); })
      .then(function (result) {
        document.dispatchEvent(new CustomEvent("afroup:session", { detail: result || { ok: false } }));
        if (!result || !result.ok || !result.user) return;
        paint(result.user);
      })
      .catch(function () {
        document.dispatchEvent(new CustomEvent("afroup:session", { detail: { ok: false } }));
      });
  };

  window.AfroUpSession = { paint: paint, bind: bind };
  bind();
  document.addEventListener("astro:page-load", function () {
    document.documentElement.dataset.sessionUserBound = "";
    bind();
  });
})();
