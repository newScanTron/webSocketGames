/**
 * A small helper class that can take control of our shadow tilemap layer. It keeps track of which
 * room is currently active.
 */
export default class TilemapVisibility {
  constructor(shadowLayer) {
    this.shadowLayer = shadowLayer;
    this.activeRoom = null;
  }

  setActiveRoom(room) {
    // We only need to update the tiles if the active room has changed
    if (room !== this.activeRoom) {
      this.setRoomAlpha(room, 0); // Make the new room visible
      if (this.activeRoom) this.setRoomAlpha(this.activeRoom, 0.5); // Dim the old room
      this.activeRoom = room;
    }
  }

  setActiveArea(plyr) {
    this.setActiveAlpha(plyr, 0.0);
  }

  setActiveAlpha(plyr, alpha) {

    this.shadowLayer.forEachTile(
      t => (t.alpha = 1),
      this,
      plyr.x-3,
      plyr.y-3,
      7,
      7
    );

    this.shadowLayer.forEachTile(
      t => (t.alpha = alpha),
      this,
      plyr.x-2,
      plyr.y-2,
      5,
      5
    );
  }

  // Helper to set the alpha on all tiles within a room
  setRoomAlpha(room, alpha) {
    this.shadowLayer.forEachTile(
      t => (t.alpha = alpha),
      this,
      room.x,
      room.y,
      room.width,
      room.height
    );
  }
}
