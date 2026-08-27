import { createRoomBoundary } from "@/features/office/core/roomBoundaries";
import {
  createPlacedObject,
  createObjectId,
  type PlacedObject,
} from "@/features/office/core/objects";
import type { DrawWallType } from "@/features/office/core/roomConfig";
import type { WorkspaceDraft } from "@/features/office/scene/WorkspaceDrawController";

/** Build placed wall/door objects from a drag draft (same gesture as workspace). */
export function wallsFromDraft(
  draft: WorkspaceDraft,
  wallType: DrawWallType,
  indexBase = 0,
): PlacedObject[] {
  if (wallType === "door") {
    const horizontal = draft.width >= draft.depth;
    return [
      createPlacedObject("door", indexBase, {
        x: draft.x,
        z: draft.z,
        length: Math.max(0.8, horizontal ? draft.width : draft.depth),
        rotationY: horizontal ? 0 : 90,
        elevation: 0,
        scale: 1,
      }),
    ];
  }

  return createRoomBoundary({
    cx: draft.x,
    cz: draft.z,
    innerW: draft.width,
    innerD: draft.depth,
    wallType,
    doorSide: "s",
  }).map((object, index) => ({
    ...object,
    id: createObjectId(object.type, `drawn-${indexBase + index}`),
  }));
}
