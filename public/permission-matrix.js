(function () {
  var paintChip = function (chip) {
    var matrix = chip.closest("[data-permission-matrix]");
    if (!matrix) return;
    var permissionId = chip.getAttribute("data-perm-chip");
    var allow = matrix.querySelector('[data-allow-box][value="' + permissionId + '"]');
    var quota = matrix.querySelector('[data-quota-input][data-permission-id="' + permissionId + '"]');
    var manual = matrix.querySelector('[data-translate-manual][data-permission-id="' + permissionId + '"]');
    var ai = matrix.querySelector('[data-translate-ai][data-permission-id="' + permissionId + '"]');
    var allowOn = Boolean(allow && allow.checked);
    var quotaValue = quota && String(quota.value || "").trim();
    var manualOn = Boolean(manual && manual.checked);
    var aiOn = Boolean(ai && ai.checked);
    var labelAllow = matrix.getAttribute("data-label-allow") || "Allow";
    var labelNone = matrix.getAttribute("data-label-none") || "—";
    var labelLimit = matrix.getAttribute("data-label-limit") || "Limit";
    var labelTranslate = matrix.getAttribute("data-label-translate") || "Translation";
    var labelManual = matrix.getAttribute("data-label-manual") || "Manual";
    var labelAi = matrix.getAttribute("data-label-ai") || "AI";
    var parts = [];
    if (allowOn) parts.push({ text: labelAllow, tip: labelAllow, tone: "neutral" });
    if (allowOn && quotaValue) parts.push({ text: quotaValue, tip: labelLimit, tone: "neutral" });
    if (allowOn && manualOn) parts.push({ text: labelManual, tip: labelTranslate, tone: "neutral" });
    if (allowOn && aiOn) parts.push({ text: labelAi, tip: labelTranslate, tone: "ai" });

    chip.replaceChildren();
    if (!parts.length) {
      var empty = document.createElement("span");
      empty.className = "badge badge-ghost badge-sm";
      empty.textContent = labelNone;
      chip.appendChild(empty);
      return;
    }

    parts.forEach(function (part) {
      var wrap = document.createElement("span");
      wrap.className = part.tone === "ai" ? "tooltip tooltip-top tooltip-secondary" : "tooltip tooltip-top";
      wrap.setAttribute("data-tip", part.tip);
      var badge = document.createElement("span");
      badge.className = part.tone === "ai" ? "badge badge-sm badge-soft badge-ai" : "badge badge-sm badge-soft";
      badge.textContent = part.text;
      wrap.appendChild(badge);
      chip.appendChild(wrap);
    });
  };

  var paintMatrix = function (matrix) {
    matrix.querySelectorAll("[data-perm-chip]").forEach(paintChip);
  };

  var bindMatrix = function (matrix) {
    if (matrix.dataset.bound === "true") return;
    matrix.dataset.bound = "true";

    matrix.querySelectorAll("[data-open-module]").forEach(function (button) {
      button.addEventListener("click", function () {
        var modal = matrix.querySelector('[data-module-modal="' + button.getAttribute("data-open-module") + '"]');
        if (modal && typeof modal.showModal === "function") modal.showModal();
      });
    });

    matrix.querySelectorAll("[data-module-modal]").forEach(function (modal) {
      modal.addEventListener("click", function (event) {
        if (event.target === modal) modal.close();
      });
      modal.querySelectorAll("[data-close-modal]").forEach(function (button) {
        button.addEventListener("click", function () { modal.close(); });
      });
    });

    matrix.querySelectorAll("[data-allow-box], [data-quota-input], [data-translate-manual], [data-translate-ai]").forEach(function (input) {
      input.addEventListener("input", function () { paintMatrix(matrix); });
      input.addEventListener("change", function () { paintMatrix(matrix); });
    });

    paintMatrix(matrix);
  };

  var bindAll = function () {
    document.querySelectorAll("[data-permission-matrix]").forEach(bindMatrix);
  };

  window.AfroUpPermissions = { paint: paintMatrix, bind: bindMatrix };
  bindAll();
  document.addEventListener("astro:page-load", function () {
    document.querySelectorAll("[data-permission-matrix]").forEach(function (matrix) {
      matrix.dataset.bound = "";
    });
    bindAll();
  });
})();
