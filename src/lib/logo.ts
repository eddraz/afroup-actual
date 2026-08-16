export type LogoVariant = "wordmark" | "mark";

export const LOGO_VIEWBOX = {
  wordmark: { width: 1600, height: 288 },
  mark: { width: 1368, height: 845 },
} as const;

export const LOGO_PATHS: Record<LogoVariant, readonly string[]> = {
  wordmark: [
    "M92 0h24l14 2l9 3h5l17 8l8 5l14 13l8 11l8 15l4 10v4l3 6l6 23l6 45l1 24l1 1v25l1 1v81h-84v-27l-3 -20l-3 -9l-4 -6l-6 -5l-7 -2h-13l-6 2l-7 6l-3 6l-4 16v39h-81v-142l3 -29l2 -6v-9l3 -13l12 -32l3 -3l6 -11l9 -10l9 -7l19 -10h5l13 -4h7Z",
    "M248 1h178v77l-31 1l-17 4l-7 3l-7 7l-4 9l1 15l2 4l7 7l4 2l14 4h38v56h-63l-2 2v84h-113v-274Z",
    "M454 1h145l1 1h16l18 3h9l21 6l2 2l17 7l8 6l14 14l11 21l7 36v26l-2 12l-6 20l-11 18l-12 13l-9 7l-11 7l-20 9l2 3l4 2l15 4h17l32 -7v66l-19 5h-11l-20 3h-18l-26 -4l-22 -10l-12 -10l-9 -11l-9 -19h-10l-1 1v45h-111v-275ZM602 79v-1h-36l-1 1v54l1 1h30l13 -2l14 -5l7 -6l4 -10v-12l-2 -7l-4 -5l-9 -5l-10 -3h-6Z",
    "M879 0l47 1l12 2l4 2h7l17 6l7 4h3l22 13l17 14l20 25l5 9l1 5l9 20v7l4 19v33l-4 18v6l-4 11l-7 15l-13 20l-20 20l-10 8l-24 14h-3l-13 6l-13 4l-25 4l-21 1l-40 -5l-3 -2l-9 -2l-24 -11l-24 -17l-17 -17l-12 -17l-10 -19l-6 -18l-4 -21v-31l2 -13l3 -12l9 -24l19 -28l14 -14l12 -9l16 -10l23 -10l26 -6h6ZM907 109v-1l-16 1l-7 4l-7 10l-4 18v35l2 2h53l1 -1v-29l-4 -23l-3 -6l-8 -8l-6 -2Z",
    "M1082 2h83l1 34l5 20l5 7l5 4l6 3l7 1l8 -1l7 -3l7 -7l2 -4l3 -14v-40h82v127l-1 1l-1 35l-4 24l-6 19v4l-11 25l-9 12l-10 10l-19 12l-29 7l-37 -1l-16 -5h-4l-11 -5l-15 -10l-11 -11l-15 -24l-11 -33l-9 -58l-1 -27l-1 -1v-100Z",
    "M1330 1h145l1 1h15l19 3h9l23 7l15 7l9 6l10 9l6 8l9 17l3 9l5 33l-1 29l-6 26l-11 21l-19 20l-14 10l-23 11l-28 8l-22 4l-33 1l-1 1v45h-111v-275ZM1478 79v-1h-37l-1 1v54l1 1h30l14 -2l14 -5l8 -8l3 -5l1 -5v-8l-4 -10l-6 -6l-6 -3l-10 -3h-6Z",
  ],
  mark: [
    "M299 0l67 3l7 3l26 3l44 13l42 20l24 16l35 32l26 33l26 48l22 58l13 48v8l3 5l13 73l6 69l3 11l7 116v274l-248 1l-2 -2v-69l-3 -43l-12 -48l-12 -21l-12 -12l-19 -10l-22 -4l-30 1l-21 9l-16 15l-10 17l-6 18l-6 34l-1 115h-241l-2 -2v-367l2 -59l6 -67l9 -59l13 -55l13 -40l19 -43l19 -32l30 -36l31 -26l41 -23l37 -13l43 -9l35 -2Z",
    "M704 19h250l1 85l4 34l10 37l12 21l15 14l18 9l27 4l22 -2l23 -9l15 -14l12 -21l7 -25l4 -35v-98h243l1 2l-1 368l-3 65l-13 106l-13 58l-17 51l-19 41l-27 41l-28 30l-32 24l-42 21l-45 13l-48 6h-52l-52 -6l-32 -8l-35 -13l-48 -28l-26 -22l-28 -32l-21 -32l-22 -47l-20 -60l-13 -56l-13 -80l-5 -47l-8 -128l-1 -266Z",
  ],
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
