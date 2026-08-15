(function (global) {
  var BLOCK = { P: 1, DIV: 1, LI: 1, UL: 1, OL: 1, BR: 1, B: 1, STRONG: 1, I: 1, EM: 1, A: 1, SPAN: 1, FONT: 1 };
  var SIZES = ["14px", "16px", "20px", "28px"];
  var NAMED_COLORS = {
    black: "#111111",
    white: "#ffffff",
    red: "#c0392b",
    blue: "#1d4ed8",
    green: "#0f766e",
    orange: "#c2410c",
    purple: "#6d28d9",
    gray: "#4b5563",
    grey: "#4b5563",
  };

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

  function safeColor(value) {
    var color = String(value || "").trim().toLowerCase();
    if (NAMED_COLORS[color]) return NAMED_COLORS[color];
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color)) return color;
    return "";
  }

  function safeSize(value) {
    var size = String(value || "").trim().toLowerCase();
    var mapped = { "1": "14px", "2": "14px", "3": "16px", "4": "20px", "5": "28px", "6": "28px", "7": "28px" };
    if (mapped[size]) return mapped[size];
    if (SIZES.indexOf(size) !== -1) return size;
    return "";
  }

  function safeStyle(style, extras) {
    var out = [];
    var color = "";
    var size = "";
    String(style || "").split(";").forEach(function (part) {
      var bits = part.split(":");
      if (bits.length < 2) return;
      var key = bits.shift().trim().toLowerCase();
      var val = bits.join(":").trim();
      if (key === "color") color = safeColor(val);
      if (key === "font-size") size = safeSize(val);
    });
    if (extras && extras.color) color = safeColor(extras.color) || color;
    if (extras && extras.size) size = safeSize(extras.size) || size;
    if (color) out.push("color:" + color);
    if (size) out.push("font-size:" + size);
    return out.join(";");
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
          } else if (tag === "FONT") {
            var span = document.createElement("span");
            var style = safeStyle(child.getAttribute("style"), {
              color: child.getAttribute("color"),
              size: child.getAttribute("size"),
            });
            if (style) span.setAttribute("style", style);
            while (child.firstChild) span.appendChild(child.firstChild);
            node.replaceChild(span, child);
            walk(span);
          } else {
            if (tag === "A") {
              var href = child.getAttribute("href") || "";
              while (child.attributes.length) child.removeAttribute(child.attributes[0].name);
              if (/^https?:\/\//i.test(href) || /^mailto:/i.test(href)) child.setAttribute("href", href);
              child.setAttribute("rel", "noopener noreferrer");
              child.setAttribute("target", "_blank");
            } else if (tag === "SPAN") {
              var keep = safeStyle(child.getAttribute("style"));
              while (child.attributes.length) child.removeAttribute(child.attributes[0].name);
              if (keep) child.setAttribute("style", keep);
              else {
                while (child.firstChild) node.insertBefore(child.firstChild, child);
                node.removeChild(child);
                child = next;
                continue;
              }
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
      '<button type="button" data-cmd="insertOrderedList">1.</button>' +
      '<select data-size aria-label="Tamaño de letra">' +
      '<option value="">Tamaño</option>' +
      '<option value="14px">Pequeño</option>' +
      '<option value="16px">Normal</option>' +
      '<option value="20px">Grande</option>' +
      '<option value="28px">Muy grande</option>' +
      "</select>" +
      '<label class="rich-color" title="Color de letra">' +
      '<span class="swatch" aria-hidden="true"></span>' +
      '<input type="color" data-color value="#111111" aria-label="Color de letra" />' +
      "</label>";
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

    function applyFontSize(size) {
      if (!safeSize(size)) return;
      surface.focus();
      document.execCommand("styleWithCSS", false, true);
      document.execCommand("fontSize", false, "7");
      Array.prototype.slice.call(surface.querySelectorAll('font[size="7"], span[style*="xxx-large"], span[style*="xx-large"]')).forEach(function (el) {
        var span = document.createElement("span");
        span.style.fontSize = size;
        while (el.firstChild) span.appendChild(el.firstChild);
        el.parentNode.replaceChild(span, el);
      });
      sync();
    }

    toolbar.addEventListener("mousedown", function (event) {
      if (event.target.closest("select, input")) return;
      event.preventDefault();
    });
    toolbar.addEventListener("click", function (event) {
      var button = event.target.closest("button");
      if (!button) return;
      surface.focus();
      document.execCommand(button.getAttribute("data-cmd"), false, null);
      sync();
    });
    toolbar.addEventListener("change", function (event) {
      if (event.target.hasAttribute("data-size") && event.target.value) {
        applyFontSize(event.target.value);
        event.target.value = "";
        return;
      }
      if (event.target.hasAttribute("data-color")) {
        var swatch = toolbar.querySelector(".rich-color .swatch");
        if (swatch) swatch.style.background = event.target.value;
        surface.focus();
        document.execCommand("styleWithCSS", false, true);
        document.execCommand("foreColor", false, event.target.value);
        sync();
      }
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
