(function (global) {
  var TOAST_MS = 2800;

  function host() {
    var node = document.getElementById("afroup-toasts");
    if (node) return node;
    node = document.createElement("div");
    node.id = "afroup-toasts";
    node.className = "toast toast-top toast-end z-50";
    document.body.appendChild(node);
    return node;
  }

  function toast(message, kind) {
    var text = String(message || "").trim();
    if (!text) return;
    var tone = kind === "success" ? "alert-success" : kind === "warning" ? "alert-warning" : "alert-error";
    var alert = document.createElement("div");
    alert.setAttribute("role", "alert");
    alert.className = "alert " + tone;
    var span = document.createElement("span");
    span.textContent = text;
    alert.appendChild(span);
    host().appendChild(alert);
    setTimeout(function () {
      alert.remove();
    }, TOAST_MS);
  }

  function dialogNode() {
    var dialog = document.getElementById("afroup-feedback-dialog");
    if (dialog) return dialog;
    dialog = document.createElement("dialog");
    dialog.id = "afroup-feedback-dialog";
    dialog.className = "modal";
    dialog.innerHTML =
      '<div class="modal-box max-w-[440px]">' +
      '<h3 class="font-display text-[20px] tracking-[-0.005em]" data-feedback-title></h3>' +
      '<p class="mt-2 text-sm opacity-70" data-feedback-lead></p>' +
      '<div class="modal-action" data-feedback-actions></div>' +
      "</div>" +
      '<form method="dialog" class="modal-backdrop"><button type="submit">close</button></form>';
    document.body.appendChild(dialog);
    return dialog;
  }

  function modal(options) {
    var opts = options || {};
    var dialog = dialogNode();
    var title = dialog.querySelector("[data-feedback-title]");
    var lead = dialog.querySelector("[data-feedback-lead]");
    var actions = dialog.querySelector("[data-feedback-actions]");
    if (title) title.textContent = opts.title || "";
    if (lead) lead.textContent = opts.message || "";
    if (actions) {
      actions.replaceChildren();
      var label = opts.actionLabel || (document.documentElement.lang === "en" ? "Continue" : "Continuar");
      var button = document.createElement("button");
      button.type = "button";
      button.className = "btn btn-primary btn-sm";
      button.textContent = label;
      button.addEventListener("click", function () {
        dialog.close();
        if (typeof opts.onAction === "function") opts.onAction();
      });
      actions.appendChild(button);
    }
    if (typeof dialog.showModal === "function") dialog.showModal();
  }

  global.AfroUpFeedback = { toast: toast, modal: modal };
})(window);
