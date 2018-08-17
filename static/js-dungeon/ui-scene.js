import Player from "./player.js";
import TILES from "./tile-mapping.js";

import TilemapVisibility from "./tilemap-visibility.js";

/**
 * Scene that generates a new dungeon
 */
export default class UiScene extends Phaser.Scene {

  constructor() {
    super({key: 'UiScene', active: true});
  }

  preload() {
    this.load.image("ui-tiles", "/static/assets/tilesets/buch-tileset-48px-extruded.png");
    this.load.spritesheet(
      "ui=characters",
      "/static/assets/spritesheets/buch-characters-64px-extruded.png",
      {
        frameWidth: 64,
        frameHeight: 64,
        margin: 1,
        spacing: 2
      }
    );
  }

  create() {
    //  Grab a reference to the Game Scene
    var tp;
    let ourGame = this.scene.get('GameScene');
    ourGame.events.on('dungeonBuilt', function(dungeon){
      tp = dungeon.drawMiniMap();


      // Creating a blank tilemap with dimensions matching the dungeon
      const map = this.make.tilemap({
        tileWidth: 16,
        tileHeight: 16,
        width: dungeon.width,
        height: dungeon.height
      });
      const tileset = map.addTilesetImage("tiles", null, 48, 48, 1, 2); // 1px margin, 2px spacing
      this.groundLayer = map.createBlankDynamicLayer("Ground", tileset).fill(TILES.BLANK);
      this.stuffLayer = map.createBlankDynamicLayer("Stuff", tileset);
      const shadowLayer = map.createBlankDynamicLayer("Shadow", tileset).fill(TILES.BLANK);

      this.tilemapVisibility = new TilemapVisibility(shadowLayer);

      // Use the array of rooms generated to place tiles in the map
      // Note: using an arrow function here so that "this" still refers to our scene
      dungeon.rooms.forEach(room => {
        const { x, y, width, height, left, right, top, bottom } = room;

        // Fill the floor with mostly clean tiles, but occasionally place a dirty tile
        // See "Weighted Randomize" example for more information on how to use weightedRandomize.
        this.groundLayer.weightedRandomize(x + 1, y + 1, width - 2, height - 2, TILES.FLOOR);

        // Place the room corners tiles
        this.groundLayer.putTileAt(TILES.WALL.TOP_LEFT, left, top);
        this.groundLayer.putTileAt(TILES.WALL.TOP_RIGHT, right, top);
        this.groundLayer.putTileAt(TILES.WALL.BOTTOM_RIGHT, right, bottom);
        this.groundLayer.putTileAt(TILES.WALL.BOTTOM_LEFT, left, bottom);

        // Fill the walls with mostly clean tiles, but occasionally place a dirty tile
        this.groundLayer.weightedRandomize(left + 1, top, width - 2, 1, TILES.WALL.TOP);
        this.groundLayer.weightedRandomize(left + 1, bottom, width - 2, 1, TILES.WALL.BOTTOM);
        this.groundLayer.weightedRandomize(left, top + 1, 1, height - 2, TILES.WALL.LEFT);
        this.groundLayer.weightedRandomize(right, top + 1, 1, height - 2, TILES.WALL.RIGHT);

        // Dungeons have rooms that are connected with doors. Each door has an x & y relative to the
        // room's location. Each direction has a different door to tile mapping.
        var doors = room.getDoorLocations(); // → Returns an array of {x, y} objects
        for (var i = 0; i < doors.length; i++) {
          if (doors[i].y === 0) {
            this.groundLayer.putTilesAt(TILES.DOOR.TOP, x + doors[i].x - 1, y + doors[i].y);
          } else if (doors[i].y === room.height - 1) {
            this.groundLayer.putTilesAt(TILES.DOOR.BOTTOM, x + doors[i].x - 1, y + doors[i].y);
          } else if (doors[i].x === 0) {
            this.groundLayer.putTilesAt(TILES.DOOR.LEFT, x + doors[i].x, y + doors[i].y - 1);
          } else if (doors[i].x === room.width - 1) {
            this.groundLayer.putTilesAt(TILES.DOOR.RIGHT, x + doors[i].x, y + doors[i].y - 1);
          }
        }
      });

      // Separate out the rooms into:
      //  - The starting room (index = 0)
      //  - A random room to be designated as the end room (with stairs and nothing else)
      //  - An array of 90% of the remaining rooms, for placing random stuff (leaving 10% empty)
      const rooms = dungeon.rooms.slice();
      const startRoom = rooms.shift();
      const endRoom = Phaser.Utils.Array.RemoveRandomElement(rooms);
      const otherRooms = Phaser.Utils.Array.Shuffle(rooms).slice(0, rooms.length * 0.9);

      // Place the stairs
      this.stuffLayer.putTileAt(TILES.STAIRS, endRoom.centerX, endRoom.centerY);

      // Place stuff in the 90% "otherRooms"
      otherRooms.forEach(room => {
        var rand = Math.random();
        if (rand <= 0.25) {
          // 25% chance of chest
          this.stuffLayer.putTileAt(TILES.CHEST, room.centerX, room.centerY);
        } else if (rand <= 0.5) {
          // 50% chance of a pot anywhere in the room... except don't block a door!
          const x = Phaser.Math.Between(room.left + 2, room.right - 2);
          const y = Phaser.Math.Between(room.top + 2, room.bottom - 2);
          this.stuffLayer.weightedRandomize(x, y, 1, 1, TILES.POT);
        } else {
          // 25% of either 2 or 4 towers, depending on the room size
          if (room.height >= 9) {
            this.stuffLayer.putTilesAt(TILES.TOWER, room.centerX - 1, room.centerY + 1);
            this.stuffLayer.putTilesAt(TILES.TOWER, room.centerX + 1, room.centerY + 1);
            this.stuffLayer.putTilesAt(TILES.TOWER, room.centerX - 1, room.centerY - 2);
            this.stuffLayer.putTilesAt(TILES.TOWER, room.centerX + 1, room.centerY - 2);
          } else {
            this.stuffLayer.putTilesAt(TILES.TOWER, room.centerX - 1, room.centerY - 1);
            this.stuffLayer.putTilesAt(TILES.TOWER, room.centerX + 1, room.centerY - 1);
          }
        }
      });
      // Not exactly correct for the tileset since there are more possible floor tiles, but this will
      // do for the example.
      this.groundLayer.setCollisionByExclusion([-1, 6, 7, 8, 26]);
      this.stuffLayer.setCollisionByExclusion([-1, 6, 7, 8, 26]);

      this.stuffLayer.setTileIndexCallback(TILES.STAIRS, () => {
        this.stuffLayer.setTileIndexCallback(TILES.STAIRS, null);
        this.hasPlayerReachedStairs = true;
        this.player.freeze();
        const cam = this.cameras.main;
        cam.fade(250, 0, 0, 0);
        cam.once("camerafadeoutcomplete", () => {
          this.player.destroy();
          this.scene.restart();
        });
      });

      // Place the player in the first room
      const playerRoom = startRoom;
      const x = map.tileToWorldX(playerRoom.centerX);
      const y = map.tileToWorldY(playerRoom.centerY);
      this.player = new Player(this, x, y);




    }, this);
    // Help text that has a "fixed" position on the screen
  }

}
