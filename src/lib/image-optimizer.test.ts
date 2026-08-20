import { describe, expect, test } from "bun:test";
import { calculateScaledDimensions, getOptimizedFileName, calculateReduction } from "./image-optimizer";

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
});
