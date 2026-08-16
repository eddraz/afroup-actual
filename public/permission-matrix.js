(function () {
  var paintChip = function (chip) {
    var matrix = chip.closest("[data-permission-matrix]");
    if (!matrix) return;
    var permissionId = chip.getAttribute("data-perm-chip");
    var parent = matrix.querySelector('[data-parent-box][value="' + permissionId + '"]');
    var quota = matrix.querySelector('[data-quota-input][data-permission-id="' + permissionId + '"]');
    var parentOn = Boolean(parent && parent.checked);
    var quotaValue = quota && String(quota.value || "").trim();
    var labelParent = matrix.getAttribute("data-label-parent") || "Parent";
    var labelAll = matrix.getAttribute("data-label-all") || "All";
    var labelNone = matrix.getAttribute("data-label-none") || "—";
    var text = labelNone;
    if (parentOn && quotaValue) text = labelParent + " · " + quotaValue;
    else if (parentOn) text = labelParent + " · " + labelAll;
    else if (quotaValue) text = quotaValue;
    chip.textContent = text;
    chip.classList.toggle("badge-ghost", text === labelNone);
    chip.classList.toggle("badge-soft", text !== labelNone);
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

    matrix.querySelectorAll("[data-parent-box], [data-quota-input]").forEach(function (input) {
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
