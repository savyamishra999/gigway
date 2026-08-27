export const MEDIA_PLAY_EVENT = "gigway:media-play";

export function announceMediaPlay(id: string) {
  window.dispatchEvent(new CustomEvent<string>(MEDIA_PLAY_EVENT, { detail: id }));
}
