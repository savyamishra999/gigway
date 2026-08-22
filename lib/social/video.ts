export type VideoPresentation = "SHORT_VERTICAL" | "STANDARD_VIDEO";

export type VideoMetadata = {
  width?: number | null;
  height?: number | null;
  durationSeconds?: number | null;
};

export const SHORT_VIDEO_MAX_DURATION_SECONDS = 90;

export function classifyVideoPresentation({
  width,
  height,
  durationSeconds,
}: VideoMetadata): VideoPresentation {
  if (
    typeof width !== "number" ||
    typeof height !== "number" ||
    typeof durationSeconds !== "number" ||
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    !Number.isFinite(durationSeconds) ||
    width <= 0 ||
    height <= 0 ||
    durationSeconds <= 0
  ) {
    return "STANDARD_VIDEO";
  }

  return height > width && durationSeconds <= SHORT_VIDEO_MAX_DURATION_SECONDS
    ? "SHORT_VERTICAL"
    : "STANDARD_VIDEO";
}
