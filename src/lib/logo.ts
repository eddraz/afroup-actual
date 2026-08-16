export type LogoVariant = "wordmark" | "mark";

export const LOGO_VIEWBOX = {
  wordmark: { width: 1600, height: 288 },
  mark: { width: 1368, height: 845 },
} as const;

function n(value: number) {
  return Number(value.toFixed(2));
}

function tombstone(x0: number, y0: number, width: number, height: number, hole: "top" | "bottom") {
  const radius = width / 2;
  const holeWidth = width * (55 / 222);
  const holeRadius = holeWidth / 2;
  const holeLeft = x0 + radius - holeRadius;
  const holeRight = x0 + radius + holeRadius;
  const x1 = x0 + width;
  const y1 = y0 + height;

  if (hole === "bottom") {
    const holeCy = y1 - holeWidth;
    return [
      `M${n(x0)} ${n(y1)}`,
      `V${n(y0 + radius)}`,
      `A${n(radius)} ${n(radius)} 0 0 1 ${n(x1)} ${n(y0 + radius)}`,
      `V${n(y1)}`,
      `H${n(holeRight)}`,
      `V${n(holeCy)}`,
      `A${n(holeRadius)} ${n(holeRadius)} 0 0 0 ${n(holeLeft)} ${n(holeCy)}`,
      `V${n(y1)}`,
      "Z",
    ].join("");
  }

  return [
    `M${n(x0)} ${n(y0)}`,
    `V${n(y1 - radius)}`,
    `A${n(radius)} ${n(radius)} 0 0 0 ${n(x1)} ${n(y1 - radius)}`,
    `V${n(y0)}`,
    `H${n(holeRight)}`,
    `V${n(y0 + holeRadius)}`,
    `A${n(holeRadius)} ${n(holeRadius)} 0 0 1 ${n(holeLeft)} ${n(y0 + holeRadius)}`,
    `V${n(y0)}`,
    "Z",
  ].join("");
}

function letterF(x0: number, y0: number, width: number, height: number) {
  const x1 = x0 + width;
  const y1 = y0 + height;
  const stem = 113;
  const topBar = 77;
  const gap = 55;
  const midBar = 56;
  const notchX = x0 + stem + gap / 2 - 1;
  const slotTop = y0 + topBar;
  const slotBot = slotTop + gap;
  const midBot = slotBot + midBar;
  const holeRadius = gap / 2;

  return [
    `M${n(x0)} ${n(y0)}`,
    `H${n(x1)}`,
    `V${n(slotTop)}`,
    `H${n(notchX)}`,
    `A${n(holeRadius)} ${n(holeRadius)} 0 0 1 ${n(notchX)} ${n(slotBot)}`,
    `H${n(x1)}`,
    `V${n(midBot)}`,
    `H${n(x0 + stem)}`,
    `V${n(y1)}`,
    `H${n(x0)}`,
    "Z",
  ].join("");
}

function letterO(x0: number, y0: number, width: number, height: number) {
  const radius = height / 2;
  const left = x0 + radius;
  const right = x0 + width - radius;
  const y1 = y0 + height;
  const holeRadius = 27.5;
  const holeLeft = x0 + width / 2 - holeRadius;
  const holeRight = x0 + width / 2 + holeRadius;
  const holeTop = y0 + 109;
  const holeBot = y0 + 177;

  return [
    `M${n(left)} ${n(y0)}`,
    `H${n(right)}`,
    `A${n(radius)} ${n(radius)} 0 0 1 ${n(right)} ${n(y1)}`,
    `H${n(left)}`,
    `A${n(radius)} ${n(radius)} 0 0 1 ${n(left)} ${n(y0)}`,
    "Z",
    `M${n(holeLeft)} ${n(holeBot)}`,
    `V${n(holeTop)}`,
    `A${n(holeRadius)} ${n(holeRadius)} 0 0 1 ${n(holeRight)} ${n(holeTop)}`,
    `V${n(holeBot)}`,
    "Z",
  ].join("");
}

function bowlHole(stemRight: number, top: number, height: number) {
  const radius = height / 2;
  const right = stemRight + 13 + radius;
  const bot = top + height;
  return [
    `M${n(stemRight)} ${n(top)}`,
    `V${n(bot)}`,
    `H${n(right)}`,
    `A${n(radius)} ${n(radius)} 0 0 0 ${n(right)} ${n(top)}`,
    "Z",
  ].join("");
}

function letterP(x0: number, y0: number, width: number, height: number) {
  const stem = 111;
  const bowlRadius = 114;
  const bowlCx = x0 + stem + 45;
  const bowlCy = y0 + 114;
  const stemRight = x0 + stem;
  const y1 = y0 + height;

  return [
    `M${n(x0)} ${n(y0)}`,
    `H${n(bowlCx)}`,
    `A${n(bowlRadius)} ${n(bowlRadius)} 0 0 1 ${n(x0 + width)} ${n(bowlCy)}`,
    `A${n(bowlRadius)} ${n(bowlRadius)} 0 0 1 ${n(bowlCx)} ${n(y0 + bowlRadius * 2)}`,
    `H${n(stemRight)}`,
    `V${n(y1)}`,
    `H${n(x0)}`,
    "Z",
    bowlHole(stemRight, y0 + 78, 55),
  ].join("");
}

function letterR(x0: number, y0: number) {
  const stemRight = x0 + 112;
  const bowlCx = x0 + 162;
  const bowlRadius = 107;
  const footRadius = 56;
  const y1 = y0 + 276;

  return [
    `M${n(x0)} ${n(y0)}`,
    `H${n(bowlCx)}`,
    `A${n(bowlRadius)} ${n(bowlRadius)} 0 0 1 ${n(695.14)} ${n(180.02)}`,
    `A${n(footRadius)} ${n(footRadius)} 0 1 1 ${n(613.78)} ${n(214.98)}`,
    `H${n(stemRight)}`,
    `V${n(y1)}`,
    `H${n(x0)}`,
    "Z",
    bowlHole(stemRight, y0 + 78, 55),
  ].join("");
}

export const LOGO_PATHS: Record<LogoVariant, readonly string[]> = {
  wordmark: [
    tombstone(0, 0, 222, 278, "bottom"),
    letterF(248, 1, 178, 275),
    letterR(454, 1),
    letterO(748, 0, 306, 288),
    tombstone(1082, 2, 221, 276, "top"),
    letterP(1330, 1, 269, 276),
  ],
  mark: [tombstone(0, 0, 664, 845, "bottom"), tombstone(704, 0, 664, 845, "top")],
};

export function logoSize(variant: LogoVariant, height: number) {
  if (!Number.isFinite(height) || height <= 0) {
    throw new Error("Logo height must be a positive number");
  }

  const box = LOGO_VIEWBOX[variant];
  return {
    width: height * (box.width / box.height),
    height,
    viewBox: `0 0 ${box.width} ${box.height}`,
  };
}
