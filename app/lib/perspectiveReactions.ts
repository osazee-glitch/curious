const reactionKey = (perspectiveId: number, reaction: "like" | "dislike") =>
  `ithinkly:perspective-reaction:${perspectiveId}:${reaction}`;

export function hasPerspectiveReaction(
  perspectiveId: number,
  reaction: "like" | "dislike"
) {
  try {
    return window.localStorage.getItem(reactionKey(perspectiveId, reaction)) === "1";
  } catch {
    return false;
  }
}

export function markPerspectiveReaction(
  perspectiveId: number,
  reaction: "like" | "dislike"
) {
  try {
    window.localStorage.setItem(reactionKey(perspectiveId, reaction), "1");
  } catch {
    // Keep the existing reaction behavior if browser storage is unavailable.
  }
}

export function clearPerspectiveReaction(
  perspectiveId: number,
  reaction: "like" | "dislike"
) {
  try {
    window.localStorage.removeItem(reactionKey(perspectiveId, reaction));
  } catch {
    // Nothing to clear if browser storage is unavailable.
  }
}
