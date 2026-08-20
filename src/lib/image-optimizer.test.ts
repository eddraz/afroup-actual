import { describe, expect, test } from "bun:test";
import { calculateScaledDimensions, getOptimizedFileName, calculateReduction, clampCropRect, getPresetCropRect } from "./image-optimizer";

describe("image-optimizer helper", () => {
  test("calculateScaledDimensions maintains aspect ratio correctly", () => {
    // 4000x3000 (4:3 ratio) scaled down to 2000px width
    const result = calculateScaledDimensions(4000, 3000, 2000, undefined, true);
    expect(result.width).toBe(2000);
    expect(result.height).toBe(1500);

    // 1920x1080 (16:9 ratio) scaled down to 540px height
    const resHeight = calculateScaledDimensions(1920, 1080, undefined, 540, true);
    expect(resHeight.width).toBe(960);
    expect(resHeight.height).toBe(540);
  });

  test("calculateScaledDimensions caps at original dimensions (no upscaling)", () => {
    // Requested 5000px width for an 800px image
    const result = calculateScaledDimensions(800, 600, 5000, 5000, true);
    expect(result.width).toBe(800);
    expect(result.height).toBe(600);
  });

  test("calculateScaledDimensions handles custom width/height when maintainAspectRatio is false", () => {
    const result = calculateScaledDimensions(1000, 1000, 500, 300, false);
    expect(result.width).toBe(500);
    expect(result.height).toBe(300);
  });

  test("getOptimizedFileName outputs correct file extensions", () => {
    expect(getOptimizedFileName("photo.PNG", "webp")).toBe("photo.webp");
    expect(getOptimizedFileName("portrait.jpeg", "webp")).toBe("portrait.webp");
    expect(getOptimizedFileName("graphic.svg", "png")).toBe("graphic.png");
    expect(getOptimizedFileName("image.webp", "jpeg")).toBe("image.jpg");
    expect(getOptimizedFileName("file.pdf", "original")).toBe("file.pdf");
  });

  test("calculateReduction calculates savings percentage accurately", () => {
    expect(calculateReduction(1000, 200)).toBe(80);
    expect(calculateReduction(5000000, 500000)).toBe(90);
    expect(calculateReduction(100, 150)).toBe(0);
    expect(calculateReduction(0, 0)).toBe(0);
  });

  test("clampCropRect restricts coordinates to image bounds", () => {
    const clamped = clampCropRect({ x: -20, y: -10, width: 2500, height: 1500 }, 1920, 1080);
    expect(clamped.x).toBe(0);
    expect(clamped.y).toBe(0);
    expect(clamped.width).toBe(1920);
    expect(clamped.height).toBe(1080);
  });

  test("getPresetCropRect calculates correct 1:1 and 16:9 crops", () => {
    // 1920x1080 image with 1:1 crop -> 1080x1080 centered
    const squareCrop = getPresetCropRect(1920, 1080, "1:1");
    expect(squareCrop.width).toBe(1080);
    expect(squareCrop.height).toBe(1080);
    expect(squareCrop.x).toBe(420);
    expect(squareCrop.y).toBe(0);

    // 1000x1000 image with 16:9 crop -> 1000x563 centered
    const wideCrop = getPresetCropRect(1000, 1000, "16:9");
    expect(wideCrop.width).toBe(1000);
    expect(wideCrop.height).toBe(563);
    expect(wideCrop.x).toBe(0);
    expect(wideCrop.y).toBe(219);
  });
});
