/**
 * Custom Editor.js Block Tools for AfroUp Editorial Platform
 * - CarouselTool: Multi-image interactive gallery & carousel with R2 WebP optimization
 * - VideoTool: Native video player and external video embedding with R2 video upload
 */

export interface CarouselSlide {
  url: string;
  caption?: string;
}

export interface CarouselData {
  slides: CarouselSlide[];
  caption?: string;
}

export interface VideoData {
  url: string;
  caption?: string;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
}

/**
 * Optimizes an image file in browser canvas and uploads to Cloudflare R2
 */
async function uploadOptimizedImage(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = dataUrl;
  });

  const origW = img.naturalWidth || img.width;
  const origH = img.naturalHeight || img.height;
  const maxBound = 1920;
  let targetW = origW;
  let targetH = origH;

  if (origW > maxBound || origH > maxBound) {
    if (origW > origH) {
      targetW = maxBound;
      targetH = Math.round(maxBound / (origW / origH));
    } else {
      targetH = maxBound;
      targetW = Math.round(maxBound * (origW / origH));
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas creation failed");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, targetW, targetH);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), "image/webp", 0.85);
  });
  if (!blob) throw new Error("Optimization failed");

  const cleanName = file.name.replace(/\.[^/.]+$/, "");
  const optimizedFile = new File([blob], `${cleanName}.webp`, { type: "image/webp" });

  const formData = new FormData();
  formData.append("_intent", "upload");
  formData.append("file", optimizedFile);
  formData.append("bucket", "media");
  formData.append("prefix", "articles/gallery");
  formData.append("customName", optimizedFile.name);

  const res = await fetch("/api/admin/r2", { method: "POST", body: formData });
  const json = (await res.json()) as any;
  if (!json.ok || !json.streamUrl) throw new Error(json.error || "R2 upload error");
  return json.streamUrl;
}

/**
 * Uploads a video file directly to Cloudflare R2
 */
async function uploadVideoToR2(file: File, onProgress?: (percent: number) => void): Promise<string> {
  const formData = new FormData();
  formData.append("_intent", "upload");
  formData.append("file", file);
  formData.append("bucket", "media");
  formData.append("prefix", "videos");
  formData.append("customName", file.name);

  const res = await fetch("/api/admin/r2", { method: "POST", body: formData });
  const json = (await res.json()) as any;
  if (!json.ok || !json.streamUrl) throw new Error(json.error || "Video upload failed");
  return json.streamUrl;
}

// --------------------------------------------------------------------------
// CAROUSEL TOOL
// --------------------------------------------------------------------------
export class CarouselTool {
  static get toolbox() {
    return {
      title: "Image carousel",
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 3 3 18"/><path d="m15 3 3 18"/><circle cx="6" cy="6" r="1"/></svg>`,
    };
  }

  private data: CarouselData;
  private wrapper: HTMLElement | null = null;
  private currentSlideIndex = 0;
  private labels: { slideCaption: string; carouselCaption: string; uploadImages: string; addUrl: string };

  constructor({ data, config }: { data: CarouselData; config?: Partial<{ slideCaption: string; carouselCaption: string; uploadImages: string; addUrl: string }> }) {
    this.data = {
      slides: Array.isArray(data?.slides) ? data.slides : [],
      caption: data?.caption || "",
    };
    this.labels = {
      slideCaption: config?.slideCaption || "Pie de foto (opcional)...",
      carouselCaption: config?.carouselCaption || "Pie de título general del carrusel (opcional)...",
      uploadImages: config?.uploadImages || "Subir imágenes",
      addUrl: config?.addUrl || "Agregar URL",
    };
  }

  render(): HTMLElement {
    this.wrapper = document.createElement("div");
    this.wrapper.className = "cdx-carousel-block rounded-2xl border border-base-300 bg-base-200/40 p-4 space-y-4 shadow-xs";
    this.renderUI();
    return this.wrapper;
  }

  private renderUI() {
    if (!this.wrapper) return;
    this.wrapper.innerHTML = "";

    // Header
    const header = document.createElement("div");
    header.className = "flex items-center justify-between border-b border-base-300 pb-2.5";
    header.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="size-2 rounded-full bg-primary animate-pulse"></span>
        <span class="font-display font-bold text-xs uppercase tracking-wider text-base-content/80">Carrusel de Imágenes</span>
      </div>
      <span class="badge badge-primary badge-xs font-bold">${this.data.slides.length} diapositivas</span>
    `;
    this.wrapper.appendChild(header);

    // If has slides, render preview slider
    if (this.data.slides.length > 0) {
      const sliderContainer = document.createElement("div");
      sliderContainer.className = "relative aspect-video w-full rounded-xl bg-black overflow-hidden group";

      const currentSlide = this.data.slides[this.currentSlideIndex] || this.data.slides[0];

      const img = document.createElement("img");
      img.src = currentSlide.url;
      img.alt = currentSlide.caption || "Slide";
      img.className = "size-full object-contain";
      sliderContainer.appendChild(img);

      // Slide caption badge
      if (currentSlide.caption) {
        const captionBadge = document.createElement("div");
        captionBadge.className = "absolute bottom-3 left-3 right-3 bg-black/60 backdrop-blur-xs text-white text-xs px-3 py-1.5 rounded-lg truncate";
        captionBadge.textContent = currentSlide.caption;
        sliderContainer.appendChild(captionBadge);
      }

      // Prev / Next Controls
      if (this.data.slides.length > 1) {
        const prevBtn = document.createElement("button");
        prevBtn.type = "button";
        prevBtn.className = "btn btn-circle btn-xs btn-neutral absolute left-2 top-1/2 -translate-y-1/2 opacity-80 hover:opacity-100";
        prevBtn.innerHTML = "❮";
        prevBtn.onclick = (e) => {
          e.preventDefault();
          this.currentSlideIndex = (this.currentSlideIndex - 1 + this.data.slides.length) % this.data.slides.length;
          this.renderUI();
        };
        sliderContainer.appendChild(prevBtn);

        const nextBtn = document.createElement("button");
        nextBtn.type = "button";
        nextBtn.className = "btn btn-circle btn-xs btn-neutral absolute right-2 top-1/2 -translate-y-1/2 opacity-80 hover:opacity-100";
        nextBtn.innerHTML = "❯";
        nextBtn.onclick = (e) => {
          e.preventDefault();
          this.currentSlideIndex = (this.currentSlideIndex + 1) % this.data.slides.length;
          this.renderUI();
        };
        sliderContainer.appendChild(nextBtn);

        // Counter indicator
        const counter = document.createElement("div");
        counter.className = "absolute top-2 right-2 badge badge-neutral badge-xs font-mono font-bold bg-black/70 text-white";
        counter.textContent = `${this.currentSlideIndex + 1} / ${this.data.slides.length}`;
        sliderContainer.appendChild(counter);
      }

      this.wrapper.appendChild(sliderContainer);

      // Slide Management Cards List
      const listContainer = document.createElement("div");
      listContainer.className = "space-y-2 max-h-48 overflow-y-auto pr-1";

      this.data.slides.forEach((slide, idx) => {
        const row = document.createElement("div");
        row.className = `flex items-center gap-2 p-2 rounded-xl border ${idx === this.currentSlideIndex ? "border-primary bg-primary/5" : "border-base-300 bg-base-100"}`;

        const thumb = document.createElement("img");
        thumb.src = slide.url;
        thumb.className = "size-9 rounded-lg object-cover border border-base-300 shrink-0 cursor-pointer";
        thumb.onclick = () => {
          this.currentSlideIndex = idx;
          this.renderUI();
        };
        row.appendChild(thumb);

        const capInput = document.createElement("input");
        capInput.type = "text";
        capInput.className = "input input-bordered input-xs w-full text-xs";
        capInput.placeholder = this.labels.slideCaption;
        capInput.value = slide.caption || "";
        capInput.oninput = () => {
          slide.caption = capInput.value;
        };
        row.appendChild(capInput);

        // Delete slide
        const delBtn = document.createElement("button");
        delBtn.type = "button";
        delBtn.className = "btn btn-ghost btn-circle btn-xs text-error";
        delBtn.innerHTML = "✕";
        delBtn.onclick = () => {
          this.data.slides.splice(idx, 1);
          this.currentSlideIndex = Math.max(0, Math.min(this.currentSlideIndex, this.data.slides.length - 1));
          this.renderUI();
        };
        row.appendChild(delBtn);

        listContainer.appendChild(row);
      });

      this.wrapper.appendChild(listContainer);
    }

    // Ingestion Bar (Add More Files / Paste URL)
    const ingestBox = document.createElement("div");
    ingestBox.className = "p-3 rounded-xl border-2 border-dashed border-base-300 bg-base-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs";

    const leftUpload = document.createElement("div");
    leftUpload.className = "flex items-center gap-2";

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.multiple = true;
    fileInput.className = "hidden";
    fileInput.onchange = async () => {
      if (!fileInput.files || fileInput.files.length === 0) return;
      const files = Array.from(fileInput.files);
      for (const f of files) {
        try {
          const url = await uploadOptimizedImage(f);
          this.data.slides.push({ url, caption: "" });
        } catch (e) {
          console.error("Gallery slide upload error", e);
        }
      }
      this.currentSlideIndex = this.data.slides.length - 1;
      this.renderUI();
    };

    const addFilesBtn = document.createElement("button");
    addFilesBtn.type = "button";
    addFilesBtn.className = "btn btn-xs btn-primary gap-1.5 font-bold";
    addFilesBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="M12 5v14"/></svg><span>${this.labels.uploadImages}</span>`;
    addFilesBtn.onclick = () => fileInput.click();
    leftUpload.appendChild(addFilesBtn);
    leftUpload.appendChild(fileInput);
    ingestBox.appendChild(leftUpload);

    // URL input
    const urlJoin = document.createElement("div");
    urlJoin.className = "join w-full sm:w-auto";
    const urlInput = document.createElement("input");
    urlInput.type = "url";
    urlInput.className = "input input-bordered input-xs join-item w-full sm:w-48 text-xs";
    urlInput.placeholder = "https://... (URL)";
    const urlAddBtn = document.createElement("button");
    urlAddBtn.type = "button";
    urlAddBtn.className = "btn btn-xs btn-neutral join-item font-semibold";
    urlAddBtn.textContent = this.labels.addUrl;
    urlAddBtn.onclick = () => {
      const u = urlInput.value.trim();
      if (u) {
        this.data.slides.push({ url: u, caption: "" });
        urlInput.value = "";
        this.currentSlideIndex = this.data.slides.length - 1;
        this.renderUI();
      }
    };
    urlJoin.appendChild(urlInput);
    urlJoin.appendChild(urlAddBtn);
    ingestBox.appendChild(urlJoin);

    this.wrapper.appendChild(ingestBox);

    // Global Carousel Caption
    const globalCap = document.createElement("input");
    globalCap.type = "text";
    globalCap.className = "input input-bordered input-xs w-full text-xs font-semibold";
    globalCap.placeholder = this.labels.carouselCaption;
    globalCap.value = this.data.caption || "";
    globalCap.oninput = () => {
      this.data.caption = globalCap.value;
    };
    this.wrapper.appendChild(globalCap);
  }

  save(): CarouselData {
    return {
      slides: this.data.slides || [],
      caption: this.data.caption || "",
    };
  }

  validate(savedData: CarouselData): boolean {
    return Array.isArray(savedData.slides) && savedData.slides.length > 0;
  }
}

// --------------------------------------------------------------------------
// VIDEO PLAYER TOOL
// --------------------------------------------------------------------------
export class VideoTool {
  static get toolbox() {
    return {
      title: "Video player",
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2"/></svg>`,
    };
  }

  private data: VideoData;
  private wrapper: HTMLElement | null = null;
  private labels: { videoCaption: string; addUrl: string };

  constructor({ data, config }: { data: VideoData; config?: Partial<{ videoCaption: string; addUrl: string }> }) {
    this.data = {
      url: data?.url || "",
      caption: data?.caption || "",
      autoplay: Boolean(data?.autoplay),
      loop: Boolean(data?.loop),
      muted: Boolean(data?.muted),
      controls: data?.controls !== false,
    };
    this.labels = {
      videoCaption: config?.videoCaption || "Pie de video / descripción (opcional)...",
      addUrl: config?.addUrl || "Agregar URL",
    };
  }

  render(): HTMLElement {
    this.wrapper = document.createElement("div");
    this.wrapper.className = "cdx-video-block rounded-2xl border border-base-300 bg-base-200/40 p-4 space-y-4 shadow-xs";
    this.renderUI();
    return this.wrapper;
  }

  private renderUI() {
    if (!this.wrapper) return;
    this.wrapper.innerHTML = "";

    // Header
    const header = document.createElement("div");
    header.className = "flex items-center justify-between border-b border-base-300 pb-2.5";
    header.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="size-2 rounded-full bg-accent animate-pulse"></span>
        <span class="font-display font-bold text-xs uppercase tracking-wider text-base-content/80">Reproductor de Video</span>
      </div>
      ${this.data.url ? '<span class="badge badge-success badge-xs font-bold">Video Cargado</span>' : '<span class="badge badge-ghost badge-xs">Sin video</span>'}
    `;
    this.wrapper.appendChild(header);

    if (this.data.url) {
      // Video Player Preview
      const playerBox = document.createElement("div");
      playerBox.className = "aspect-video w-full rounded-xl bg-black overflow-hidden shadow-md flex items-center justify-center relative";

      const isDirectFile = this.data.url.match(/\.(mp4|webm|ogg|mov)$/i) || this.data.url.includes("/api/r2/stream/");

      if (isDirectFile) {
        const video = document.createElement("video");
        video.src = this.data.url;
        video.controls = this.data.controls;
        video.autoplay = this.data.autoplay;
        video.loop = this.data.loop;
        video.muted = this.data.muted;
        video.className = "size-full object-contain";
        playerBox.appendChild(video);
      } else {
        // Embed frame for external platforms
        const iframe = document.createElement("iframe");
        iframe.src = this.data.url;
        iframe.className = "size-full";
        iframe.setAttribute("allowfullscreen", "true");
        iframe.setAttribute("frameborder", "0");
        playerBox.appendChild(iframe);
      }
      this.wrapper.appendChild(playerBox);

      // Video Controls & Settings
      const settingsGrid = document.createElement("div");
      settingsGrid.className = "grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1";

      const toggles: Array<{ key: keyof VideoData; label: string }> = [
        { key: "controls", label: "Controles" },
        { key: "autoplay", label: "Autoplay" },
        { key: "loop", label: "Bucle (Loop)" },
        { key: "muted", label: "Silenciado" },
      ];

      toggles.forEach(({ key, label }) => {
        const lbl = document.createElement("label");
        lbl.className = "label cursor-pointer gap-2 justify-start py-0";
        const chk = document.createElement("input");
        chk.type = "checkbox";
        chk.className = "checkbox checkbox-primary checkbox-xs";
        chk.checked = Boolean(this.data[key]);
        chk.onchange = () => {
          (this.data as any)[key] = chk.checked;
          this.renderUI();
        };
        lbl.appendChild(chk);
        const txt = document.createElement("span");
        txt.className = "label-text text-xs font-semibold";
        txt.textContent = label;
        lbl.appendChild(txt);
        settingsGrid.appendChild(lbl);
      });

      this.wrapper.appendChild(settingsGrid);

      // Caption & Change Video Row
      const capRow = document.createElement("div");
      capRow.className = "flex items-center gap-2 pt-1";

      const capInput = document.createElement("input");
      capInput.type = "text";
      capInput.className = "input input-bordered input-xs w-full text-xs";
      capInput.placeholder = this.labels.videoCaption;
      capInput.value = this.data.caption || "";
      capInput.oninput = () => {
        this.data.caption = capInput.value;
      };
      capRow.appendChild(capInput);

      const changeBtn = document.createElement("button");
      changeBtn.type = "button";
      changeBtn.className = "btn btn-ghost btn-xs text-error font-semibold shrink-0";
      changeBtn.textContent = "Cambiar";
      changeBtn.onclick = () => {
        this.data.url = "";
        this.renderUI();
      };
      capRow.appendChild(changeBtn);
      this.wrapper.appendChild(capRow);
    } else {
      // Ingestion State: Drag/Browse Video File + URL input
      const dropzone = document.createElement("div");
      dropzone.className = "border-2 border-dashed border-base-300 rounded-xl p-6 text-center bg-base-100 space-y-3";

      const icon = document.createElement("div");
      icon.className = "size-10 rounded-full bg-base-200 text-primary mx-auto flex items-center justify-center";
      icon.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
      dropzone.appendChild(icon);

      const lead = document.createElement("p");
      lead.className = "text-xs font-bold text-base-content";
      lead.textContent = "Sube un archivo de video a R2 (MP4, WebM) o pega una URL";
      dropzone.appendChild(lead);

      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = "video/mp4,video/webm,video/ogg,video/quicktime";
      fileInput.className = "hidden";
      fileInput.onchange = async () => {
        if (!fileInput.files || fileInput.files.length === 0) return;
        const file = fileInput.files[0];
        lead.textContent = "Subiendo video a R2...";
        try {
          const streamUrl = await uploadVideoToR2(file);
          this.data.url = streamUrl;
          this.renderUI();
        } catch (e: any) {
          lead.textContent = "Error al subir video.";
          console.error(e);
        }
      };

      const uploadBtn = document.createElement("button");
      uploadBtn.type = "button";
      uploadBtn.className = "btn btn-sm btn-primary font-bold gap-2";
      uploadBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg><span>Subir Video (MP4 / WebM)</span>`;
      uploadBtn.onclick = () => fileInput.click();
      dropzone.appendChild(uploadBtn);
      dropzone.appendChild(fileInput);

      // URL Fallback
      const divider = document.createElement("div");
      divider.className = "divider text-[10px] font-bold text-base-content/40 uppercase my-2";
      divider.textContent = "O ENLACE DIRECTO DE VIDEO";
      dropzone.appendChild(divider);

      const urlJoin = document.createElement("div");
      urlJoin.className = "join w-full max-w-md mx-auto";
      const urlInp = document.createElement("input");
      urlInp.type = "url";
      urlInp.className = "input input-bordered input-sm join-item w-full text-xs font-mono";
      urlInp.placeholder = "https://... (URL de video / stream)";
      const urlBtn = document.createElement("button");
      urlBtn.type = "button";
      urlBtn.className = "btn btn-sm btn-neutral join-item font-bold";
      urlBtn.textContent = "Cargar";
      urlBtn.onclick = () => {
        const u = urlInp.value.trim();
        if (u) {
          this.data.url = u;
          this.renderUI();
        }
      };
      urlJoin.appendChild(urlInp);
      urlJoin.appendChild(urlBtn);
      dropzone.appendChild(urlJoin);

      this.wrapper.appendChild(dropzone);
    }
  }

  save(): VideoData {
    return {
      url: this.data.url || "",
      caption: this.data.caption || "",
      autoplay: Boolean(this.data.autoplay),
      loop: Boolean(this.data.loop),
      muted: Boolean(this.data.muted),
      controls: this.data.controls !== false,
    };
  }

  validate(savedData: VideoData): boolean {
    return Boolean(savedData.url && savedData.url.trim());
  }
}
