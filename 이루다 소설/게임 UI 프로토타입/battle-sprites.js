window.battleSpriteAssets = {
  "이루어질": {
    "src": "assets/battle/sd/sd-55/00_이루어질_SD_55_grid.png",
    "scale": 1,
    "combat": true,
    "canvas": [
      1086,
      1448
    ],
    "footPivot": [
      543,
      1375
    ],
    "bodyHeight": 1297
  },
  "이루어져": {
    "src": "assets/battle/sd/sd-55/01_이루어져_SD_55_final.png",
    "scale": 1,
    "combat": true,
    "canvas": [
      1086,
      1448
    ],
    "footPivot": [
      543,
      1402
    ],
    "bodyHeight": 1315
  },
  "이루어라": {
    "src": "assets/battle/sd/sd-55/02_이루어라_SD_55_final.png",
    "scale": 1,
    "combat": true,
    "canvas": [
      1086,
      1448
    ],
    "footPivot": [
      543,
      1410
    ],
    "bodyHeight": 1342
  },
  "이루소서": {
    "src": "assets/battle/sd/sd-55/03_이루소서_SD_55_grid.png",
    "scale": 1,
    "combat": true,
    "canvas": [
      1086,
      1448
    ],
    "footPivot": [
      543,
      1409
    ],
    "bodyHeight": 1397
  },
  "이루리": {
    "src": "assets/battle/sd/04_이루리_SD_v2.png",
    "scale": 1,
    "combat": false,
    "canvas": [
      768,
      1024
    ],
    "footPivot": [
      384,
      964
    ]
  },
  "이루어도": {
    "src": "assets/battle/sd/sd-55/05_이루어도_SD_55_final.png",
    "scale": 1,
    "combat": true,
    "canvas": [
      1086,
      1448
    ],
    "footPivot": [
      543,
      1400
    ],
    "bodyHeight": 1346
  },
  "이루게나": {
    "src": "assets/battle/sd/sd-55/06_이루게나_SD_55_grid.png",
    "scale": 1,
    "combat": true,
    "canvas": [
      1086,
      1448
    ],
    "footPivot": [
      543,
      1376
    ],
    "bodyHeight": 1296
  },
  "이루도록": {
    "src": "assets/battle/sd/sd-55/07_이루도록_SD_55_final.png",
    "scale": 1,
    "combat": true,
    "canvas": [
      1086,
      1448
    ],
    "footPivot": [
      543,
      1410
    ],
    "bodyHeight": 1375
  },
  "이루려나": {
    "src": "assets/battle/sd/sd-55/08_이루려나_SD_55_final.png",
    "scale": 1,
    "combat": true,
    "canvas": [
      1086,
      1448
    ],
    "footPivot": [
      543,
      1387
    ],
    "bodyHeight": 1275
  },
  "이루겠네": {
    "src": "assets/battle/sd/sd-55/09_이루겠네_SD_55_final.png",
    "scale": 1,
    "combat": true,
    "canvas": [
      1086,
      1448
    ],
    "footPivot": [
      543,
      1433
    ],
    "bodyHeight": 1413
  }
};

// Register each native idle by crown-to-sole height, without changing its anatomy.
window.battleSpriteRegistration = name => {
  const sprite = window.battleSpriteAssets[name];
  if (!sprite?.combat) return null;
  const renderScale = sprite.canvas[1] / (sprite.bodyHeight || 900);
  return { renderScale, bottomOffset: (1 - sprite.footPivot[1] / sprite.canvas[1]) * renderScale,
    motionRenderScale: 1024 / 900 };
};
