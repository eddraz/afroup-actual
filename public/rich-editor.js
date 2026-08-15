(function (global) {
  var BLOCK = { P: 1, DIV: 1, LI: 1, UL: 1, OL: 1, BR: 1, B: 1, STRONG: 1, I: 1, EM: 1, A: 1 };

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function textToHtml(value) {
    var text = String(value == null ? "" : value);
    if (!text.trim()) return "";
    if (/<[a-z][\s\S]*>/i.test(text)) return text;
    return text
      .split(/\n{2,}/)
      .map(function (block) {
        return "<p>" + escapeHtml(block).replace(/\n/g, "<br>") + "</p>";
      })
      .join("");
  }

  function sanitize(html) {
    var host = document.createElement("div");
    host.innerHTML = String(html || "");
    function walk(node) {
      var child = node.firstChild;
      while (child) {
        var next = child.nextSibling;
        if (child.nodeType === 1) {
          var tag = child.tagName;
          if (!BLOCK[tag]) {
            while (child.firstChild) node.insertBefore(child.firstChild, child);
            node.removeChild(child);
          } else {
            if (tag === "A") {
              var href = child.getAttribute("href") || "";
              child.removeAttribute("style");
              child.removeAttribute("class");
              if (!/^https?:\/\//i.test(href) && !/^mailto:/i.test(href)) child.removeAttribute("href");
              child.setAttribute("rel", "noopener noreferrer");
              child.setAttribute("target", "_blank");
            } else {
              while (child.attributes.length) child.removeAttribute(child.attributes[0].name);
            }
            walk(child);
          }
        } else if (child.nodeType !== 3) {
          node.removeChild(child);
        }
        child = next;
      }
    }
    walk(host);
    return host.innerHTML.trim();
  }

  function attach(selector) {
    var textarea = document.querySelector(selector);
    if (!textarea) return null;
    var wrap = document.createElement("div");
    wrap.className = "rich-editor";
    var toolbar = document.createElement("div");
    toolbar.className = "rich-toolbar";
    toolbar.innerHTML =
      '<button type="button" data-cmd="bold">B</button>' +
      '<button type="button" data-cmd="italic">I</button>' +
      '<button type="button" data-cmd="insertUnorderedList">Lista</button>' +
      '<button type="button" data-cmd="insertOrderedList">1.</button>';
    var surface = document.createElement("div");
    surface.className = "rich-surface";
    surface.contentEditable = "true";
    surface.setAttribute("role", "textbox");
    surface.setAttribute("aria-multiline", "true");
    textarea.classList.add("rich-source");
    textarea.required = false;
    textarea.parentNode.insertBefore(wrap, textarea);
    wrap.appendChild(toolbar);
    wrap.appendChild(surface);
    wrap.appendChild(textarea);

    function sync() {
      textarea.value = sanitize(surface.innerHTML);
    }

    function setHtml(html) {
      surface.innerHTML = sanitize(textToHtml(html || ""));
      sync();
    }

    toolbar.addEventListener("mousedown", function (event) {
      event.preventDefault();
    });
    toolbar.addEventListener("click", function (event) {
      var button = event.target.closest("button");
      if (!button) return;
      surface.focus();
      document.execCommand(button.getAttribute("data-cmd"), false, null);
      sync();
    });
    surface.addEventListener("input", sync);
    surface.addEventListener("blur", sync);
    setHtml(textarea.value);

    return {
      getHtml: function () {
        sync();
        return textarea.value;
      },
      setHtml: setHtml,
      isEmpty: function () {
        return !surface.innerText.replace(/\u00a0/g, " ").trim();
      },
    };
  }

  global.AfroUpRichEditor = { attach: attach, sanitize: sanitize, textToHtml: textToHtml };
})(window);
