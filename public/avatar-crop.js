(function () {
  var SIZE = 360;
  var OUTPUT = 512;
  var MIN_OUTPUT = 256;
  var MAX_BYTES = 2 * 1024 * 1024;

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function bind() {
    var dialog = $("#avatar-crop-dialog");
    var fileInput = $("[data-avatar-file]");
    var canvas = $("#avatar-crop-canvas");
    var zoom = $("#avatar-crop-zoom");
    var save = $("[data-avatar-crop-save]");
    var cancel = $("[data-avatar-crop-cancel]");
    var remove = $("[data-avatar-remove]");
    var errorBox = $("[data-avatar-error]");
    var errorText = $("[data-avatar-error-text]");
    if (!dialog || !fileInput || !canvas || !zoom || !save || dialog.dataset.bound === "true") return;
    dialog.dataset.bound = "true";

    var ctx = canvas.getContext("2d");
    var image = null;
    var scale = 1;
    var minScale = 1;
    var offsetX = 0;
    var offsetY = 0;
    var drag = null;
    var copy = {
      type: fileInput.getAttribute("data-error-type") || "Use a PNG or JPG image.",
      size: fileInput.getAttribute("data-error-size") || "The image can't be larger than 2 MB.",
      upload: fileInput.getAttribute("data-error-upload") || "We couldn't upload the photo. Try again.",
    };

    function showError(message) {
      if (!errorBox || !errorText) return;
      errorText.textContent = message;
      errorBox.classList.remove("hidden");
    }

    function hideError() {
      if (errorBox) errorBox.classList.add("hidden");
    }

    function draw() {
      if (!image || !ctx) return;
      ctx.fillStyle = "#17150F";
      ctx.fillRect(0, 0, SIZE, SIZE);
      var w = image.width * scale;
      var h = image.height * scale;
      ctx.drawImage(image, offsetX, offsetY, w, h);
    }

    function resetToCover() {
      if (!image) return;
      minScale = Math.max(SIZE / image.width, SIZE / image.height);
      scale = minScale;
      offsetX = (SIZE - image.width * scale) / 2;
      offsetY = (SIZE - image.height * scale) / 2;
      zoom.min = String(minScale);
      zoom.max = String(minScale * 3);
      zoom.step = String(minScale / 20);
      zoom.value = String(scale);
      draw();
    }

    function clampOffsets() {
      if (!image) return;
      var w = image.width * scale;
      var h = image.height * scale;
      offsetX = Math.min(0, Math.max(SIZE - w, offsetX));
      offsetY = Math.min(0, Math.max(SIZE - h, offsetY));
    }

    fileInput.addEventListener("change", function () {
      hideError();
      var file = fileInput.files && fileInput.files[0];
      fileInput.value = "";
      if (!file) return;
      if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
        showError(copy.type);
        return;
      }
      var reader = new FileReader();
      reader.onload = function () {
        var next = new Image();
        next.onload = function () {
          image = next;
          resetToCover();
          dialog.showModal();
        };
        next.src = String(reader.result || "");
      };
      reader.readAsDataURL(file);
    });

    zoom.addEventListener("input", function () {
      if (!image) return;
      var nextScale = Number(zoom.value);
      var cx = SIZE / 2;
      var cy = SIZE / 2;
      var ratio = nextScale / scale;
      offsetX = cx - (cx - offsetX) * ratio;
      offsetY = cy - (cy - offsetY) * ratio;
      scale = nextScale;
      clampOffsets();
      draw();
    });

    canvas.addEventListener("pointerdown", function (event) {
      drag = { x: event.clientX, y: event.clientY, ox: offsetX, oy: offsetY };
      canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener("pointermove", function (event) {
      if (!drag) return;
      offsetX = drag.ox + (event.clientX - drag.x);
      offsetY = drag.oy + (event.clientY - drag.y);
      clampOffsets();
      draw();
    });
    canvas.addEventListener("pointerup", function () { drag = null; });
    canvas.addEventListener("pointercancel", function () { drag = null; });

    if (cancel) {
      cancel.addEventListener("click", function () {
        dialog.close();
        image = null;
      });
    }

    function blobFromCanvas(source, size, quality) {
      return new Promise(function (resolve) {
        var out = document.createElement("canvas");
        out.width = size;
        out.height = size;
        var outCtx = out.getContext("2d");
        var ratio = size / SIZE;
        outCtx.drawImage(image, offsetX * ratio, offsetY * ratio, image.width * scale * ratio, image.height * scale * ratio);
        out.toBlob(resolve, "image/jpeg", quality);
      });
    }

    async function compressCrop() {
      var size = OUTPUT;
      var qualities = [0.9, 0.8, 0.7, 0.6, 0.5, 0.4];
      while (size >= MIN_OUTPUT) {
        for (var i = 0; i < qualities.length; i += 1) {
          var blob = await blobFromCanvas(image, size, qualities[i]);
          if (blob && blob.size <= MAX_BYTES) return blob;
        }
        size = Math.floor(size * 0.75);
      }
      return blobFromCanvas(image, MIN_OUTPUT, 0.4);
    }

    save.addEventListener("click", function () {
      if (!image) return;
      hideError();
      save.disabled = true;
      compressCrop()
        .then(function (blob) {
          if (!blob || blob.size > MAX_BYTES) {
            save.disabled = false;
            showError(copy.size);
            return;
          }
          var data = new FormData();
          data.append("avatar", blob, "avatar.jpg");
          return fetch("/api/avatar", { method: "POST", body: data })
            .then(function (res) { return res.json().then(function (body) { return { ok: res.ok, body: body }; }); })
            .then(function (result) {
              if (!result.ok) throw new Error("upload");
              window.location.reload();
            });
        })
        .catch(function () {
          save.disabled = false;
          showError(copy.upload);
        });
    });

    if (remove) {
      remove.addEventListener("click", function () {
        hideError();
        fetch("/api/avatar", { method: "DELETE" })
          .then(function (res) { return res.json(); })
          .then(function () { window.location.reload(); })
          .catch(function () { showError(copy.upload); });
      });
    }
  }

  bind();
  document.addEventListener("astro:after-swap", bind);
})();
