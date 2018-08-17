import Player from "./player.js";
import TILES from "./tile-mapping.js";

import TilemapVisibility from "./tilemap-visibility.js";

/**
 * Scene that generates a new dungeon
 */
export default class UiScene extends Phaser.Scene {
  var isVisi = false;
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
      this.add
      .text(16, 16, `Find the stairs. Go deeper.\nCurrent level: ${tp}`, {
        font: "4px monospace",
        fill: "#000000",
        padding: { x: 20, y: 10 },
        backgroundColor: "rgba(255,255,255,0.5)"
      })
      .setScrollFactor(0);

    }, this);
    // Help text that has a "fixed" position on the screen
  }

}
