window.irudaMotionAssets={
  "kind": "key-poses",
  "canvas": [
    768,
    1024
  ],
  "footPivot": [
    384,
    964
  ],
  "review": "draft-needs-visual-approval",
  "characters": [
    {
      "id": "eojil",
      "name": "이루어질",
      "reference": "../sd/00_이루어질_SD_v2.png",
      "sheet": "sheets/eojil-v1.png",
      "scale": 2.6619217081850532,
      "rowDetection": "alpha-gaps",
      "frames": [
        {
          "key": "move",
          "label": "충돌 접근",
          "pose": "forward running stride, torso leaned toward right, one leading foot near ground, coat trailing left",
          "src": "eojil/move-v1.png",
          "review": "pending-visual-approval",
          "bounds": {
            "left": 22,
            "right": 264,
            "top": 47,
            "bottom": 278,
            "emptyFraction": 0.6210743257006602
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "clash",
          "label": "충돌",
          "pose": "firm forward interception pose, braced front leg, tool or forearm raised to meet an incoming strike from the right",
          "src": "eojil/clash-v1.png",
          "review": "pending-visual-approval",
          "bounds": {
            "left": 24,
            "right": 266,
            "top": 31,
            "bottom": 277,
            "emptyFraction": 0.5595117845117845
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "clash-loss",
          "label": "충돌 패배",
          "pose": "stagger backward toward left, torso recoiling, bent knees, equipment retained, pained but alive",
          "src": "eojil/clash-loss-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 5,
            "right": 280,
            "top": 45,
            "bottom": 275,
            "emptyFraction": 0.6456258911774926
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "clash-win",
          "label": "충돌 승리",
          "pose": "confident forward follow-through, stable stance, tool or fist directed right, not a victory dance",
          "src": "eojil/clash-win-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 0,
            "right": 273,
            "top": 44,
            "bottom": 276,
            "emptyFraction": 0.6227753727753728
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "hurt",
          "label": "피격",
          "pose": "distinct hit reaction: chest recoils, face winces, arms instinctively protect abdomen, no wounds or gore",
          "src": "eojil/hurt-v1.png",
          "review": "pending-visual-approval",
          "bounds": {
            "left": 44,
            "right": 232,
            "top": 21,
            "bottom": 244,
            "emptyFraction": 0.6321887479286082
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "defense",
          "label": "이루어질 · 회피",
          "pose": "low lateral dodge, bent knees, torso pulled backward, preserve balance",
          "src": "eojil/defense-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 2,
            "right": 279,
            "top": 55,
            "bottom": 246,
            "emptyFraction": 0.6031624863685933
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-1-hit-1",
          "label": "결말 예측 · 1타",
          "skillName": "결말 예측",
          "hit": 1,
          "pose": "Skill 1 named 결말 예측, 관통, hit 1 of 2: forward fingertip thrust. Initiating committed motion, visibly different silhouette from adjacent attacks. ",
          "src": "eojil/skill-1-hit-1-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 0,
            "right": 280,
            "top": 19,
            "bottom": 247,
            "emptyFraction": 0.5826247589035886
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-1-hit-2",
          "label": "결말 예측 · 2타",
          "skillName": "결말 예측",
          "hit": 2,
          "pose": "Skill 1 named 결말 예측, 관통, hit 2 of 2: cross-body palm thrust. Decisive finishing follow-through, visibly different silhouette from adjacent attacks. ",
          "src": "eojil/skill-1-hit-2-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 0,
            "right": 272,
            "top": 19,
            "bottom": 247,
            "emptyFraction": 0.5058478735005453
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-2-hit-1",
          "label": "확신의 일격 · 1타",
          "skillName": "확신의 일격",
          "hit": 1,
          "pose": "Skill 2 named 확신의 일격, 관통, hit 1 of 2: forward fingertip thrust. Initiating committed motion, visibly different silhouette from adjacent attacks. ",
          "src": "eojil/skill-2-hit-1-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 16,
            "right": 280,
            "top": 16,
            "bottom": 247,
            "emptyFraction": 0.5571480204626335
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-2-hit-2",
          "label": "확신의 일격 · 2타",
          "skillName": "확신의 일격",
          "hit": 2,
          "pose": "Skill 2 named 확신의 일격, 관통, hit 2 of 2: cross-body palm thrust. Decisive finishing follow-through, visibly different silhouette from adjacent attacks. ",
          "src": "eojil/skill-2-hit-2-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 0,
            "right": 273,
            "top": 15,
            "bottom": 247,
            "emptyFraction": 0.4979910714285714
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-3-hit-1",
          "label": "계획 수정 · 1타",
          "skillName": "계획 수정",
          "hit": 1,
          "pose": "Skill 3 named 계획 수정, 관통, hit 1 of 3: forward fingertip thrust. Initiating committed motion, visibly different silhouette from adjacent attacks. ",
          "src": "eojil/skill-3-hit-1-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 4,
            "right": 280,
            "top": 17,
            "bottom": 248,
            "emptyFraction": 0.5688945729537367
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-3-hit-2",
          "label": "계획 수정 · 2타",
          "skillName": "계획 수정",
          "hit": 2,
          "pose": "Skill 3 named 계획 수정, 관통, hit 2 of 3: cross-body palm thrust. Reverse-direction linking strike, visibly different silhouette from adjacent attacks. ",
          "src": "eojil/skill-3-hit-2-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 0,
            "right": 264,
            "top": 15,
            "bottom": 247,
            "emptyFraction": 0.5111886160714286
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-3-hit-3",
          "label": "계획 수정 · 3타",
          "skillName": "계획 수정",
          "hit": 3,
          "pose": "Skill 3 named 계획 수정, 관통, hit 3 of 3: decisive two-finger pointing thrust. Decisive finishing follow-through, visibly different silhouette from adjacent attacks. ",
          "src": "eojil/skill-3-hit-3-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 15,
            "right": 280,
            "top": 21,
            "bottom": 259,
            "emptyFraction": 0.5530249110320284
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-4-hit-1",
          "label": "결말 주석 · 1타",
          "skillName": "결말 주석",
          "hit": 1,
          "pose": "Skill 4 named 결말 주석, 관통, hit 1 of 1: forward fingertip thrust. Initiating committed motion, visibly different silhouette from adjacent attacks. Strongest normal skill, wider stable stance and forceful extension.",
          "src": "eojil/skill-4-hit-1-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 0,
            "right": 279,
            "top": 17,
            "bottom": 257,
            "emptyFraction": 0.5271957671957672
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "overdrive-hit-1",
          "label": "결말 주석 · 개념 폭주 · 1타",
          "skillName": "결말 주석 · 개념 폭주",
          "hit": 1,
          "pose": "Special concept overdrive 결말 주석 · 개념 폭주, hit 1: forward fingertip thrust, dramatic but anatomically grounded extension, small character-specific concept accent only; keep the same outfit and body proportions",
          "src": "eojil/overdrive-hit-1-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 0,
            "right": 280,
            "top": 10,
            "bottom": 257,
            "emptyFraction": 0.522854883353104
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "overdrive-hit-2",
          "label": "결말 주석 · 개념 폭주 · 2타",
          "skillName": "결말 주석 · 개념 폭주",
          "hit": 2,
          "pose": "Special concept overdrive 결말 주석 · 개념 폭주, hit 2: cross-body palm thrust, dramatic but anatomically grounded extension, small character-specific concept accent only; keep the same outfit and body proportions",
          "src": "eojil/overdrive-hit-2-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 0,
            "right": 267,
            "top": 8,
            "bottom": 251,
            "emptyFraction": 0.48158730158730156
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "overdrive-hit-3",
          "label": "결말 주석 · 개념 폭주 · 3타",
          "skillName": "결말 주석 · 개념 폭주",
          "hit": 3,
          "pose": "Special concept overdrive 결말 주석 · 개념 폭주, hit 3: decisive two-finger pointing thrust, dramatic but anatomically grounded extension, small character-specific concept accent only; keep the same outfit and body proportions",
          "src": "eojil/overdrive-hit-3-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 15,
            "right": 280,
            "top": 11,
            "bottom": 269,
            "emptyFraction": 0.5211109489542756
          },
          "pivotMethod": "silhouette-bottom approximation"
        }
      ]
    },
    {
      "id": "eojyeo",
      "name": "이루어져",
      "reference": "../sd/01_이루어져_SD_v2.png",
      "sheet": "sheets/eojyeo-v1.png",
      "scale": 2.6810035842293907,
      "rowDetection": "equal-grid-fallback",
      "frames": [
        {
          "key": "move",
          "label": "충돌 접근",
          "pose": "forward running stride, torso leaned toward right, one leading foot near ground, coat trailing left",
          "src": "eojyeo/move-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 48,
            "right": 279,
            "top": 31,
            "bottom": 279,
            "emptyFraction": 0.5495297407219115
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "clash",
          "label": "충돌",
          "pose": "firm forward interception pose, braced front leg, tool or forearm raised to meet an incoming strike from the right",
          "src": "eojyeo/clash-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 28,
            "right": 271,
            "top": 30,
            "bottom": 279,
            "emptyFraction": 0.5481887755102041
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "clash-loss",
          "label": "충돌 패배",
          "pose": "stagger backward toward left, torso recoiling, bent knees, equipment retained, pained but alive",
          "src": "eojyeo/clash-loss-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 8,
            "right": 280,
            "top": 34,
            "bottom": 279,
            "emptyFraction": 0.5679461108286731
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "clash-win",
          "label": "충돌 승리",
          "pose": "confident forward follow-through, stable stance, tool or fist directed right, not a victory dance",
          "src": "eojyeo/clash-win-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 0,
            "right": 262,
            "top": 36,
            "bottom": 279,
            "emptyFraction": 0.5401530612244898
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "hurt",
          "label": "피격",
          "pose": "distinct hit reaction: chest recoils, face winces, arms instinctively protect abdomen, no wounds or gore",
          "src": "eojyeo/hurt-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 50,
            "right": 257,
            "top": 0,
            "bottom": 270,
            "emptyFraction": 0.5913552259976445
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "defense",
          "label": "이루어져 · 방어",
          "pose": "broad braced guard, both forearms protect head and chest",
          "src": "eojyeo/defense-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 41,
            "right": 271,
            "top": 0,
            "bottom": 270,
            "emptyFraction": 0.5608540925266904
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-1-hit-1",
          "label": "꾸벅꾸벅 · 1타",
          "skillName": "꾸벅꾸벅",
          "hit": 1,
          "pose": "Skill 1 named 꾸벅꾸벅, 타격, hit 1 of 2: low sleepy palm wave. Initiating committed motion, visibly different silhouette from adjacent attacks. ",
          "src": "eojyeo/skill-1-hit-1-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 8,
            "right": 280,
            "top": 0,
            "bottom": 269,
            "emptyFraction": 0.5384303643570877
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-1-hit-2",
          "label": "꾸벅꾸벅 · 2타",
          "skillName": "꾸벅꾸벅",
          "hit": 2,
          "pose": "Skill 1 named 꾸벅꾸벅, 타격, hit 2 of 2: swaying shoulder and plush outward. Decisive finishing follow-through, visibly different silhouette from adjacent attacks. ",
          "src": "eojyeo/skill-1-hit-2-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 0,
            "right": 263,
            "top": 0,
            "bottom": 273,
            "emptyFraction": 0.47041179461108285
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-2-hit-1",
          "label": "비관의 잔향 · 1타",
          "skillName": "비관의 잔향",
          "hit": 1,
          "pose": "Skill 2 named 비관의 잔향, 타격, hit 1 of 2: low sleepy palm wave. Initiating committed motion, visibly different silhouette from adjacent attacks. ",
          "src": "eojyeo/skill-2-hit-1-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 39,
            "right": 280,
            "top": 11,
            "bottom": 279,
            "emptyFraction": 0.532308083375699
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-2-hit-2",
          "label": "비관의 잔향 · 2타",
          "skillName": "비관의 잔향",
          "hit": 2,
          "pose": "Skill 2 named 비관의 잔향, 타격, hit 2 of 2: swaying shoulder and plush outward. Decisive finishing follow-through, visibly different silhouette from adjacent attacks. ",
          "src": "eojyeo/skill-2-hit-2-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 0,
            "right": 273,
            "top": 5,
            "bottom": 279,
            "emptyFraction": 0.4956632653061224
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-3-hit-1",
          "label": "수면 유도 · 1타",
          "skillName": "수면 유도",
          "hit": 1,
          "pose": "Skill 3 named 수면 유도, 타격, hit 1 of 3: low sleepy palm wave. Initiating committed motion, visibly different silhouette from adjacent attacks. ",
          "src": "eojyeo/skill-3-hit-1-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 11,
            "right": 280,
            "top": 19,
            "bottom": 279,
            "emptyFraction": 0.5092399593289273
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-3-hit-2",
          "label": "수면 유도 · 2타",
          "skillName": "수면 유도",
          "hit": 2,
          "pose": "Skill 3 named 수면 유도, 타격, hit 2 of 3: swaying shoulder and plush outward. Reverse-direction linking strike, visibly different silhouette from adjacent attacks. ",
          "src": "eojyeo/skill-3-hit-2-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 0,
            "right": 263,
            "top": 17,
            "bottom": 279,
            "emptyFraction": 0.4930612244897959
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-3-hit-3",
          "label": "수면 유도 · 3타",
          "skillName": "수면 유도",
          "hit": 3,
          "pose": "Skill 3 named 수면 유도, 타격, hit 3 of 3: forward dream-projecting hand. Decisive finishing follow-through, visibly different silhouette from adjacent attacks. ",
          "src": "eojyeo/skill-3-hit-3-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 27,
            "right": 280,
            "top": 0,
            "bottom": 280,
            "emptyFraction": 0.48374514000582564
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-4-hit-1",
          "label": "비관의 침수 · 1타",
          "skillName": "비관의 침수",
          "hit": 1,
          "pose": "Skill 4 named 비관의 침수, 타격, hit 1 of 1: low sleepy palm wave. Initiating committed motion, visibly different silhouette from adjacent attacks. Strongest normal skill, wider stable stance and forceful extension.",
          "src": "eojyeo/skill-4-hit-1-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 0,
            "right": 276,
            "top": 0,
            "bottom": 280,
            "emptyFraction": 0.48826893746822575
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "overdrive-hit-1",
          "label": "비관의 침수 · 개념 폭주 · 1타",
          "skillName": "비관의 침수 · 개념 폭주",
          "hit": 1,
          "pose": "Special concept overdrive 비관의 침수 · 개념 폭주, hit 1: low sleepy palm wave, dramatic but anatomically grounded extension, small character-specific concept accent only; keep the same outfit and body proportions",
          "src": "eojyeo/overdrive-hit-1-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 2,
            "right": 280,
            "top": 0,
            "bottom": 238,
            "emptyFraction": 0.41951089778498246
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "overdrive-hit-2",
          "label": "비관의 침수 · 개념 폭주 · 2타",
          "skillName": "비관의 침수 · 개념 폭주",
          "hit": 2,
          "pose": "Special concept overdrive 비관의 침수 · 개념 폭주, hit 2: swaying shoulder and plush outward, dramatic but anatomically grounded extension, small character-specific concept accent only; keep the same outfit and body proportions",
          "src": "eojyeo/overdrive-hit-2-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 0,
            "right": 265,
            "top": 0,
            "bottom": 234,
            "emptyFraction": 0.44032791052364006
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "overdrive-hit-3",
          "label": "비관의 침수 · 개념 폭주 · 3타",
          "skillName": "비관의 침수 · 개념 폭주",
          "hit": 3,
          "pose": "Special concept overdrive 비관의 침수 · 개념 폭주, hit 3: forward dream-projecting hand, dramatic but anatomically grounded extension, small character-specific concept accent only; keep the same outfit and body proportions",
          "src": "eojyeo/overdrive-hit-3-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 13,
            "right": 280,
            "top": 0,
            "bottom": 248,
            "emptyFraction": 0.388065582104728
          },
          "pivotMethod": "silhouette-bottom approximation"
        }
      ]
    },
    {
      "id": "eora",
      "name": "이루어라",
      "reference": "../sd/02_이루어라_SD_v2.png",
      "sheet": "sheets/eora-v1.png",
      "scale": 2.75,
      "rowDetection": "alpha-gaps",
      "frames": [
        {
          "key": "move",
          "label": "충돌 접근",
          "pose": "forward running stride, torso leaned toward right, one leading foot near ground, coat trailing left",
          "src": "eora/move-v1.png",
          "review": "pending-visual-approval",
          "bounds": {
            "left": 11,
            "right": 276,
            "top": 18,
            "bottom": 267,
            "emptyFraction": 0.6350489795405103
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "clash",
          "label": "충돌",
          "pose": "firm forward interception pose, braced front leg, tool or forearm raised to meet an incoming strike from the right",
          "src": "eora/clash-v1.png",
          "review": "pending-visual-approval",
          "bounds": {
            "left": 14,
            "right": 260,
            "top": 14,
            "bottom": 274,
            "emptyFraction": 0.6076224129227663
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "clash-loss",
          "label": "충돌 패배",
          "pose": "stagger backward toward left, torso recoiling, bent knees, equipment retained, pained but alive",
          "src": "eora/clash-loss-v1.png",
          "review": "pending-visual-approval",
          "bounds": {
            "left": 25,
            "right": 267,
            "top": 37,
            "bottom": 275,
            "emptyFraction": 0.662122907837984
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "clash-win",
          "label": "충돌 승리",
          "pose": "confident forward follow-through, stable stance, tool or fist directed right, not a victory dance",
          "src": "eora/clash-win-v1.png",
          "review": "pending-visual-approval",
          "bounds": {
            "left": 30,
            "right": 263,
            "top": 16,
            "bottom": 273,
            "emptyFraction": 0.6561963654719839
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "hurt",
          "label": "피격",
          "pose": "distinct hit reaction: chest recoils, face winces, arms instinctively protect abdomen, no wounds or gore",
          "src": "eora/hurt-v1.png",
          "review": "pending-visual-approval",
          "bounds": {
            "left": 34,
            "right": 236,
            "top": 12,
            "bottom": 270,
            "emptyFraction": 0.6469877986781901
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "defense",
          "label": "이루어라 · 회피",
          "pose": "low lateral dodge, bent knees, torso pulled backward, preserve balance",
          "src": "eora/defense-v1.png",
          "review": "pending-visual-approval",
          "bounds": {
            "left": 23,
            "right": 258,
            "top": 47,
            "bottom": 264,
            "emptyFraction": 0.6568622448979592
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-1-hit-1",
          "label": "중력 핀 · 1타",
          "skillName": "중력 핀",
          "hit": 1,
          "pose": "Skill 1 named 중력 핀, 타격, hit 1 of 2: low gravity-pinning palm. Initiating committed motion, visibly different silhouette from adjacent attacks. ",
          "src": "eora/skill-1-hit-1-v1.png",
          "review": "pending-visual-approval",
          "bounds": {
            "left": 5,
            "right": 274,
            "top": 67,
            "bottom": 266,
            "emptyFraction": 0.6009405185561769
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-1-hit-2",
          "label": "중력 핀 · 2타",
          "skillName": "중력 핀",
          "hit": 2,
          "pose": "Skill 1 named 중력 핀, 타격, hit 2 of 2: upturned rearranging hand. Decisive finishing follow-through, visibly different silhouette from adjacent attacks. ",
          "src": "eora/skill-1-hit-2-v1.png",
          "review": "pending-visual-approval",
          "bounds": {
            "left": 17,
            "right": 261,
            "top": 9,
            "bottom": 270,
            "emptyFraction": 0.5286479591836735
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-2-hit-1",
          "label": "부품 재배열 · 1타",
          "skillName": "부품 재배열",
          "hit": 1,
          "pose": "Skill 2 named 부품 재배열, 타격, hit 1 of 2: low gravity-pinning palm. Initiating committed motion, visibly different silhouette from adjacent attacks. ",
          "src": "eora/skill-2-hit-1-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 9,
            "right": 280,
            "top": 46,
            "bottom": 267,
            "emptyFraction": 0.5695475343162176
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-2-hit-2",
          "label": "부품 재배열 · 2타",
          "skillName": "부품 재배열",
          "hit": 2,
          "pose": "Skill 2 named 부품 재배열, 타격, hit 2 of 2: upturned rearranging hand. Decisive finishing follow-through, visibly different silhouette from adjacent attacks. ",
          "src": "eora/skill-2-hit-2-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 0,
            "right": 269,
            "top": 10,
            "bottom": 275,
            "emptyFraction": 0.5724362244897959
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-3-hit-1",
          "label": "가설 검증 · 1타",
          "skillName": "가설 검증",
          "hit": 1,
          "pose": "Skill 3 named 가설 검증, 타격, hit 1 of 3: low gravity-pinning palm. Initiating committed motion, visibly different silhouette from adjacent attacks. ",
          "src": "eora/skill-3-hit-1-v1.png",
          "review": "pending-visual-approval",
          "bounds": {
            "left": 8,
            "right": 264,
            "top": 64,
            "bottom": 267,
            "emptyFraction": 0.6017412302999492
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-3-hit-2",
          "label": "가설 검증 · 2타",
          "skillName": "가설 검증",
          "hit": 2,
          "pose": "Skill 3 named 가설 검증, 타격, hit 2 of 3: upturned rearranging hand. Reverse-direction linking strike, visibly different silhouette from adjacent attacks. ",
          "src": "eora/skill-3-hit-2-v1.png",
          "review": "pending-visual-approval",
          "bounds": {
            "left": 11,
            "right": 269,
            "top": 16,
            "bottom": 267,
            "emptyFraction": 0.5407780612244898
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-3-hit-3",
          "label": "가설 검증 · 3타",
          "skillName": "가설 검증",
          "hit": 3,
          "pose": "Skill 3 named 가설 검증, 타격, hit 3 of 3: strong outward releasing palm. Decisive finishing follow-through, visibly different silhouette from adjacent attacks. ",
          "src": "eora/skill-3-hit-3-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 10,
            "right": 280,
            "top": 45,
            "bottom": 264,
            "emptyFraction": 0.5674918201608593
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-4-hit-1",
          "label": "가설 해체식 · 1타",
          "skillName": "가설 해체식",
          "hit": 1,
          "pose": "Skill 4 named 가설 해체식, 타격, hit 1 of 1: low gravity-pinning palm. Initiating committed motion, visibly different silhouette from adjacent attacks. Strongest normal skill, wider stable stance and forceful extension.",
          "src": "eora/skill-4-hit-1-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 0,
            "right": 268,
            "top": 27,
            "bottom": 251,
            "emptyFraction": 0.5653453689167975
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "overdrive-hit-1",
          "label": "가설 해체식 · 개념 폭주 · 1타",
          "skillName": "가설 해체식 · 개념 폭주",
          "hit": 1,
          "pose": "Special concept overdrive 가설 해체식 · 개념 폭주, hit 1: low gravity-pinning palm, dramatic but anatomically grounded extension, small character-specific concept accent only; keep the same outfit and body proportions",
          "src": "eora/overdrive-hit-1-v1.png",
          "review": "pending-visual-approval",
          "bounds": {
            "left": 5,
            "right": 276,
            "top": 16,
            "bottom": 255,
            "emptyFraction": 0.4210107804413854
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "overdrive-hit-2",
          "label": "가설 해체식 · 개념 폭주 · 2타",
          "skillName": "가설 해체식 · 개념 폭주",
          "hit": 2,
          "pose": "Special concept overdrive 가설 해체식 · 개념 폭주, hit 2: upturned rearranging hand, dramatic but anatomically grounded extension, small character-specific concept accent only; keep the same outfit and body proportions",
          "src": "eora/overdrive-hit-2-v1.png",
          "review": "pending-visual-approval",
          "bounds": {
            "left": 7,
            "right": 270,
            "top": 5,
            "bottom": 268,
            "emptyFraction": 0.4336734693877551
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "overdrive-hit-3",
          "label": "가설 해체식 · 개념 폭주 · 3타",
          "skillName": "가설 해체식 · 개념 폭주",
          "hit": 3,
          "pose": "Special concept overdrive 가설 해체식 · 개념 폭주, hit 3: strong outward releasing palm, dramatic but anatomically grounded extension, small character-specific concept accent only; keep the same outfit and body proportions",
          "src": "eora/overdrive-hit-3-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 11,
            "right": 279,
            "top": 5,
            "bottom": 270,
            "emptyFraction": 0.43860587810765744
          },
          "pivotMethod": "silhouette-bottom approximation"
        }
      ]
    },
    {
      "id": "sosuh",
      "name": "이루소서",
      "reference": "../sd/03_이루소서_SD_v2.png",
      "sheet": "sheets/sosuh-v1.png",
      "scale": 2.6619217081850532,
      "rowDetection": "alpha-gaps",
      "frames": [
        {
          "key": "move",
          "label": "충돌 접근",
          "pose": "forward running stride, torso leaned toward right, one leading foot near ground, coat trailing left",
          "src": "sosuh/move-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 25,
            "right": 280,
            "top": 31,
            "bottom": 272,
            "emptyFraction": 0.6207803762074224
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "clash",
          "label": "충돌",
          "pose": "firm forward interception pose, braced front leg, tool or forearm raised to meet an incoming strike from the right",
          "src": "sosuh/clash-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 0,
            "right": 261,
            "top": 18,
            "bottom": 268,
            "emptyFraction": 0.5826020408163265
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "clash-loss",
          "label": "충돌 패배",
          "pose": "stagger backward toward left, torso recoiling, bent knees, equipment retained, pained but alive",
          "src": "sosuh/clash-loss-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 13,
            "right": 280,
            "top": 25,
            "bottom": 270,
            "emptyFraction": 0.6078164717844433
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "clash-win",
          "label": "충돌 승리",
          "pose": "confident forward follow-through, stable stance, tool or fist directed right, not a victory dance",
          "src": "sosuh/clash-win-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 0,
            "right": 266,
            "top": 21,
            "bottom": 266,
            "emptyFraction": 0.5946683673469387
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "hurt",
          "label": "피격",
          "pose": "distinct hit reaction: chest recoils, face winces, arms instinctively protect abdomen, no wounds or gore",
          "src": "sosuh/hurt-v1.png",
          "review": "pending-visual-approval",
          "bounds": {
            "left": 26,
            "right": 258,
            "top": 10,
            "bottom": 257,
            "emptyFraction": 0.6010236314926627
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "defense",
          "label": "참호 반격",
          "pose": "compact ready-to-counter posture, tool or striking hand near hip, lead forearm guarding",
          "src": "sosuh/defense-v1.png",
          "review": "pending-visual-approval",
          "bounds": {
            "left": 23,
            "right": 249,
            "top": 8,
            "bottom": 258,
            "emptyFraction": 0.5561262707330124
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-1-hit-1",
          "label": "낡은 단검술 · 1타",
          "skillName": "낡은 단검술",
          "hit": 1,
          "pose": "Skill 1 named 낡은 단검술, 참격, hit 1 of 2: horizontal dagger slash. Initiating committed motion, visibly different silhouette from adjacent attacks. ",
          "src": "sosuh/skill-1-hit-1-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 1,
            "right": 280,
            "top": 17,
            "bottom": 259,
            "emptyFraction": 0.5592786596825143
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-1-hit-2",
          "label": "낡은 단검술 · 2타",
          "skillName": "낡은 단검술",
          "hit": 2,
          "pose": "Skill 1 named 낡은 단검술, 참격, hit 2 of 2: reverse diagonal dagger cut. Decisive finishing follow-through, visibly different silhouette from adjacent attacks. ",
          "src": "sosuh/skill-1-hit-2-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 0,
            "right": 262,
            "top": 12,
            "bottom": 261,
            "emptyFraction": 0.58517924023542
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-2-hit-1",
          "label": "눌 엣지 · 1타",
          "skillName": "눌 엣지",
          "hit": 1,
          "pose": "Skill 2 named 눌 엣지, 참격, hit 1 of 2: horizontal dagger slash. Initiating committed motion, visibly different silhouette from adjacent attacks. ",
          "src": "sosuh/skill-2-hit-1-v1.png",
          "review": "pending-visual-approval",
          "bounds": {
            "left": 29,
            "right": 276,
            "top": 40,
            "bottom": 272,
            "emptyFraction": 0.6086907660610601
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-2-hit-2",
          "label": "눌 엣지 · 2타",
          "skillName": "눌 엣지",
          "hit": 2,
          "pose": "Skill 2 named 눌 엣지, 참격, hit 2 of 2: reverse diagonal dagger cut. Decisive finishing follow-through, visibly different silhouette from adjacent attacks. ",
          "src": "sosuh/skill-2-hit-2-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 18,
            "right": 278,
            "top": 6,
            "bottom": 273,
            "emptyFraction": 0.6071052631578947
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-3-hit-1",
          "label": "베테랑의 급소 · 1타",
          "skillName": "베테랑의 급소",
          "hit": 1,
          "pose": "Skill 3 named 베테랑의 급소, 참격, hit 1 of 3: horizontal dagger slash. Initiating committed motion, visibly different silhouette from adjacent attacks. ",
          "src": "sosuh/skill-3-hit-1-v1.png",
          "review": "pending-visual-approval",
          "bounds": {
            "left": 23,
            "right": 256,
            "top": 42,
            "bottom": 276,
            "emptyFraction": 0.6292689017918461
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-3-hit-2",
          "label": "베테랑의 급소 · 2타",
          "skillName": "베테랑의 급소",
          "hit": 2,
          "pose": "Skill 3 named 베테랑의 급소, 참격, hit 2 of 3: reverse diagonal dagger cut. Reverse-direction linking strike, visibly different silhouette from adjacent attacks. ",
          "src": "sosuh/skill-3-hit-2-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 21,
            "right": 243,
            "top": 9,
            "bottom": 283,
            "emptyFraction": 0.6172681704260652
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-3-hit-3",
          "label": "베테랑의 급소 · 3타",
          "skillName": "베테랑의 급소",
          "hit": 3,
          "pose": "Skill 3 named 베테랑의 급소, 참격, hit 3 of 3: precise forward dagger thrust. Decisive finishing follow-through, visibly different silhouette from adjacent attacks. ",
          "src": "sosuh/skill-3-hit-3-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 20,
            "right": 280,
            "top": 39,
            "bottom": 250,
            "emptyFraction": 0.6246961659840193
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-4-hit-1",
          "label": "실패자의 낙인 · 1타",
          "skillName": "실패자의 낙인",
          "hit": 1,
          "pose": "Skill 4 named 실패자의 낙인, 참격, hit 1 of 1: horizontal dagger slash. Initiating committed motion, visibly different silhouette from adjacent attacks. Strongest normal skill, wider stable stance and forceful extension.",
          "src": "sosuh/skill-4-hit-1-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 0,
            "right": 279,
            "top": 31,
            "bottom": 251,
            "emptyFraction": 0.5697169811320755
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "overdrive-hit-1",
          "label": "인과 절단 · 1타",
          "skillName": "인과 절단",
          "hit": 1,
          "pose": "Special concept overdrive 인과 절단, hit 1: horizontal dagger slash, dramatic but anatomically grounded extension, small character-specific concept accent only; keep the same outfit and body proportions",
          "src": "sosuh/overdrive-hit-1-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 0,
            "right": 280,
            "top": 15,
            "bottom": 255,
            "emptyFraction": 0.5147787551198549
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "overdrive-hit-2",
          "label": "인과 절단 · 2타",
          "skillName": "인과 절단",
          "hit": 2,
          "pose": "Special concept overdrive 인과 절단, hit 2: reverse diagonal dagger cut, dramatic but anatomically grounded extension, small character-specific concept accent only; keep the same outfit and body proportions",
          "src": "sosuh/overdrive-hit-2-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 0,
            "right": 261,
            "top": 4,
            "bottom": 255,
            "emptyFraction": 0.5163477088948787
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "overdrive-hit-3",
          "label": "인과 절단 · 3타",
          "skillName": "인과 절단",
          "hit": 3,
          "pose": "Special concept overdrive 인과 절단, hit 3: precise forward dagger thrust, dramatic but anatomically grounded extension, small character-specific concept accent only; keep the same outfit and body proportions",
          "src": "sosuh/overdrive-hit-3-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 16,
            "right": 280,
            "top": 42,
            "bottom": 267,
            "emptyFraction": 0.6028819788810454
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "overdrive-hit-4",
          "label": "인과 절단 · 4타",
          "skillName": "인과 절단",
          "hit": 4,
          "pose": "Special concept overdrive 인과 절단, hit 4: horizontal dagger slash, dramatic but anatomically grounded extension, small character-specific concept accent only; keep the same outfit and body proportions",
          "src": "sosuh/overdrive-hit-4-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 0,
            "right": 279,
            "top": 10,
            "bottom": 271,
            "emptyFraction": 0.5034543325526932
          },
          "pivotMethod": "silhouette-bottom approximation"
        }
      ]
    },
    {
      "id": "eodo",
      "name": "이루어도",
      "reference": "../sd/05_이루어도_SD_v2.png",
      "sheet": "sheets/eodo-v1.png",
      "scale": 2.6906474820143886,
      "rowDetection": "alpha-gaps",
      "frames": [
        {
          "key": "move",
          "label": "충돌 접근",
          "pose": "forward running stride, torso leaned toward right, one leading foot near ground, coat trailing left",
          "src": "eodo/move-v1.png",
          "review": "pending-visual-approval",
          "bounds": {
            "left": 14,
            "right": 277,
            "top": 38,
            "bottom": 296,
            "emptyFraction": 0.6164997214421338
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "clash",
          "label": "충돌",
          "pose": "firm forward interception pose, braced front leg, tool or forearm raised to meet an incoming strike from the right",
          "src": "eodo/clash-v1.png",
          "review": "pending-visual-approval",
          "bounds": {
            "left": 3,
            "right": 273,
            "top": 40,
            "bottom": 299,
            "emptyFraction": 0.6144568690095846
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "clash-loss",
          "label": "충돌 패배",
          "pose": "stagger backward toward left, torso recoiling, bent knees, equipment retained, pained but alive",
          "src": "eodo/clash-loss-v1.png",
          "review": "pending-visual-approval",
          "bounds": {
            "left": 17,
            "right": 271,
            "top": 59,
            "bottom": 299,
            "emptyFraction": 0.6320875922367628
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "clash-win",
          "label": "충돌 승리",
          "pose": "confident forward follow-through, stable stance, tool or fist directed right, not a victory dance",
          "src": "eodo/clash-win-v1.png",
          "review": "pending-visual-approval",
          "bounds": {
            "left": 3,
            "right": 270,
            "top": 46,
            "bottom": 299,
            "emptyFraction": 0.6262551346417161
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "hurt",
          "label": "피격",
          "pose": "distinct hit reaction: chest recoils, face winces, arms instinctively protect abdomen, no wounds or gore",
          "src": "eodo/hurt-v1.png",
          "review": "pending-visual-approval",
          "bounds": {
            "left": 13,
            "right": 255,
            "top": 20,
            "bottom": 278,
            "emptyFraction": 0.5925798938295834
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "defense",
          "label": "거구 방어",
          "pose": "broad braced guard, both forearms protect head and chest",
          "src": "eodo/defense-v1.png",
          "review": "pending-visual-approval",
          "bounds": {
            "left": 10,
            "right": 270,
            "top": 15,
            "bottom": 280,
            "emptyFraction": 0.5843379212149976
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-1-hit-1",
          "label": "묵직한 손등 · 1타",
          "skillName": "묵직한 손등",
          "hit": 1,
          "pose": "Skill 1 named 묵직한 손등, 타격, hit 1 of 1: heavy backhand punch. Initiating committed motion, visibly different silhouette from adjacent attacks. ",
          "src": "eodo/skill-1-hit-1-v1.png",
          "review": "pending-visual-approval",
          "bounds": {
            "left": 9,
            "right": 267,
            "top": 30,
            "bottom": 285,
            "emptyFraction": 0.5794682020784809
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-2-hit-1",
          "label": "길막기 · 1타",
          "skillName": "길막기",
          "hit": 1,
          "pose": "Skill 2 named 길막기, 타격, hit 1 of 1: heavy backhand punch. Initiating committed motion, visibly different silhouette from adjacent attacks. ",
          "src": "eodo/skill-2-hit-1-v1.png",
          "review": "pending-visual-approval",
          "bounds": {
            "left": 4,
            "right": 269,
            "top": 25,
            "bottom": 280,
            "emptyFraction": 0.621155671570954
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-3-hit-1",
          "label": "거구 압박 · 1타",
          "skillName": "거구 압박",
          "hit": 1,
          "pose": "Skill 3 named 거구 압박, 타격, hit 1 of 2: heavy backhand punch. Initiating committed motion, visibly different silhouette from adjacent attacks. ",
          "src": "eodo/skill-3-hit-1-v1.png",
          "review": "pending-visual-approval",
          "bounds": {
            "left": 15,
            "right": 276,
            "top": 17,
            "bottom": 271,
            "emptyFraction": 0.8360279639431327
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-3-hit-2",
          "label": "거구 압박 · 2타",
          "skillName": "거구 압박",
          "hit": 2,
          "pose": "Skill 3 named 거구 압박, 타격, hit 2 of 2: shoulder shove. Decisive finishing follow-through, visibly different silhouette from adjacent attacks. ",
          "src": "eodo/skill-3-hit-2-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 0,
            "right": 275,
            "top": 20,
            "bottom": 268,
            "emptyFraction": 0.8532451051486585
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-4-hit-1",
          "label": "무너지는 벽 · 1타",
          "skillName": "무너지는 벽",
          "hit": 1,
          "pose": "Skill 4 named 무너지는 벽, 타격, hit 1 of 1: heavy backhand punch. Initiating committed motion, visibly different silhouette from adjacent attacks. Strongest normal skill, wider stable stance and forceful extension.",
          "src": "eodo/skill-4-hit-1-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 3,
            "right": 280,
            "top": 27,
            "bottom": 274,
            "emptyFraction": 0.8385253897429412
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "overdrive-hit-1",
          "label": "종이봉투 아래 산맥 · 1타",
          "skillName": "종이봉투 아래 산맥",
          "hit": 1,
          "pose": "Special concept overdrive 종이봉투 아래 산맥, hit 1: heavy backhand punch, dramatic but anatomically grounded extension, small character-specific concept accent only; keep the same outfit and body proportions",
          "src": "eodo/overdrive-hit-1-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 0,
            "right": 272,
            "top": 24,
            "bottom": 273,
            "emptyFraction": 0.8314675489485134
          },
          "pivotMethod": "silhouette-bottom approximation"
        }
      ]
    },
    {
      "id": "gena",
      "name": "이루게나",
      "reference": "../sd/06_이루게나_SD_v3.png",
      "sheet": "sheets/gena-v1.png",
      "scale": 2.6619217081850532,
      "rowDetection": "equal-grid-fallback",
      "frames": [
        {
          "key": "move",
          "label": "충돌 접근",
          "pose": "forward running stride, torso leaned toward right, one leading foot near ground, coat trailing left",
          "src": "gena/move-v1.png",
          "review": "pending-visual-approval",
          "bounds": {
            "left": 3,
            "right": 270,
            "top": 37,
            "bottom": 271,
            "emptyFraction": 0.575063548551093
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "clash",
          "label": "충돌",
          "pose": "firm forward interception pose, braced front leg, tool or forearm raised to meet an incoming strike from the right",
          "src": "gena/clash-v1.png",
          "review": "pending-visual-approval",
          "bounds": {
            "left": 31,
            "right": 253,
            "top": 8,
            "bottom": 271,
            "emptyFraction": 0.5962627551020409
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "clash-loss",
          "label": "충돌 패배",
          "pose": "stagger backward toward left, torso recoiling, bent knees, equipment retained, pained but alive",
          "src": "gena/clash-loss-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 20,
            "right": 280,
            "top": 44,
            "bottom": 266,
            "emptyFraction": 0.6264361972547026
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "clash-win",
          "label": "충돌 승리",
          "pose": "confident forward follow-through, stable stance, tool or fist directed right, not a victory dance",
          "src": "gena/clash-win-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 0,
            "right": 278,
            "top": 41,
            "bottom": 267,
            "emptyFraction": 0.5965178571428571
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "hurt",
          "label": "피격",
          "pose": "distinct hit reaction: chest recoils, face winces, arms instinctively protect abdomen, no wounds or gore",
          "src": "gena/hurt-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 18,
            "right": 280,
            "top": 38,
            "bottom": 258,
            "emptyFraction": 0.6504856828054356
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "defense",
          "label": "이루게나 · 반격",
          "pose": "compact ready-to-counter posture, tool or striking hand near hip, lead forearm guarding",
          "src": "gena/defense-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 0,
            "right": 236,
            "top": 36,
            "bottom": 255,
            "emptyFraction": 0.6068505338078292
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-1-hit-1",
          "label": "도끼 이빨 · 1타",
          "skillName": "도끼 이빨",
          "hit": 1,
          "pose": "Skill 1 named 도끼 이빨, 참격, hit 1 of 2: low axe sweep. Initiating committed motion, visibly different silhouette from adjacent attacks. ",
          "src": "gena/skill-1-hit-1-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 7,
            "right": 280,
            "top": 65,
            "bottom": 258,
            "emptyFraction": 0.6162282645863147
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-1-hit-2",
          "label": "도끼 이빨 · 2타",
          "skillName": "도끼 이빨",
          "hit": 2,
          "pose": "Skill 1 named 도끼 이빨, 참격, hit 2 of 2: diagonal axe chop. Decisive finishing follow-through, visibly different silhouette from adjacent attacks. ",
          "src": "gena/skill-1-hit-2-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 0,
            "right": 274,
            "top": 12,
            "bottom": 261,
            "emptyFraction": 0.5881545500762583
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-2-hit-1",
          "label": "피 냄새 · 1타",
          "skillName": "피 냄새",
          "hit": 1,
          "pose": "Skill 2 named 피 냄새, 참격, hit 1 of 2: low axe sweep. Initiating committed motion, visibly different silhouette from adjacent attacks. ",
          "src": "gena/skill-2-hit-1-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 31,
            "right": 280,
            "top": 41,
            "bottom": 279,
            "emptyFraction": 0.6417768174885613
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-2-hit-2",
          "label": "피 냄새 · 2타",
          "skillName": "피 냄새",
          "hit": 2,
          "pose": "Skill 2 named 피 냄새, 참격, hit 2 of 2: diagonal axe chop. Decisive finishing follow-through, visibly different silhouette from adjacent attacks. ",
          "src": "gena/skill-2-hit-2-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 0,
            "right": 269,
            "top": 3,
            "bottom": 256,
            "emptyFraction": 0.6092091836734694
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-3-hit-1",
          "label": "짐승의 보폭 · 1타",
          "skillName": "짐승의 보폭",
          "hit": 1,
          "pose": "Skill 3 named 짐승의 보폭, 참격, hit 1 of 3: low axe sweep. Initiating committed motion, visibly different silhouette from adjacent attacks. ",
          "src": "gena/skill-3-hit-1-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 10,
            "right": 280,
            "top": 54,
            "bottom": 264,
            "emptyFraction": 0.6130274529740722
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-3-hit-2",
          "label": "짐승의 보폭 · 2타",
          "skillName": "짐승의 보폭",
          "hit": 2,
          "pose": "Skill 3 named 짐승의 보폭, 참격, hit 2 of 3: diagonal axe chop. Reverse-direction linking strike, visibly different silhouette from adjacent attacks. ",
          "src": "gena/skill-3-hit-2-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 0,
            "right": 277,
            "top": 34,
            "bottom": 279,
            "emptyFraction": 0.559234693877551
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-3-hit-3",
          "label": "짐승의 보폭 · 3타",
          "skillName": "짐승의 보폭",
          "hit": 3,
          "pose": "Skill 3 named 짐승의 보폭, 참격, hit 3 of 3: overhead axe smash. Decisive finishing follow-through, visibly different silhouette from adjacent attacks. ",
          "src": "gena/skill-3-hit-3-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 33,
            "right": 267,
            "top": 0,
            "bottom": 280,
            "emptyFraction": 0.5348209875761452
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-4-hit-1",
          "label": "피 묻은 황무지 · 1타",
          "skillName": "피 묻은 황무지",
          "hit": 1,
          "pose": "Skill 4 named 피 묻은 황무지, 참격, hit 1 of 1: low axe sweep. Initiating committed motion, visibly different silhouette from adjacent attacks. Strongest normal skill, wider stable stance and forceful extension.",
          "src": "gena/skill-4-hit-1-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 8,
            "right": 279,
            "top": 56,
            "bottom": 241,
            "emptyFraction": 0.6686959837315709
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "overdrive-hit-1",
          "label": "피 묻은 황무지 · 개념 폭주 · 1타",
          "skillName": "피 묻은 황무지 · 개념 폭주",
          "hit": 1,
          "pose": "Special concept overdrive 피 묻은 황무지 · 개념 폭주, hit 1: low axe sweep, dramatic but anatomically grounded extension, small character-specific concept accent only; keep the same outfit and body proportions",
          "src": "gena/overdrive-hit-1-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 0,
            "right": 280,
            "top": 48,
            "bottom": 250,
            "emptyFraction": 0.5230430212383328
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "overdrive-hit-2",
          "label": "피 묻은 황무지 · 개념 폭주 · 2타",
          "skillName": "피 묻은 황무지 · 개념 폭주",
          "hit": 2,
          "pose": "Special concept overdrive 피 묻은 황무지 · 개념 폭주, hit 2: diagonal axe chop, dramatic but anatomically grounded extension, small character-specific concept accent only; keep the same outfit and body proportions",
          "src": "gena/overdrive-hit-2-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 0,
            "right": 275,
            "top": 0,
            "bottom": 251,
            "emptyFraction": 0.47896542958820537
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "overdrive-hit-3",
          "label": "피 묻은 황무지 · 개념 폭주 · 3타",
          "skillName": "피 묻은 황무지 · 개념 폭주",
          "hit": 3,
          "pose": "Special concept overdrive 피 묻은 황무지 · 개념 폭주, hit 3: overhead axe smash, dramatic but anatomically grounded extension, small character-specific concept accent only; keep the same outfit and body proportions",
          "src": "gena/overdrive-hit-3-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 11,
            "right": 280,
            "top": 0,
            "bottom": 266,
            "emptyFraction": 0.37726232841891205
          },
          "pivotMethod": "silhouette-bottom approximation"
        }
      ]
    },
    {
      "id": "dorok",
      "name": "이루도록",
      "reference": "../sd/07_이루도록_SD_v2.png",
      "sheet": "sheets/dorok-v1.png",
      "scale": 2.6619217081850532,
      "rowDetection": "alpha-gaps",
      "frames": [
        {
          "key": "move",
          "label": "충돌 접근",
          "pose": "forward running stride, torso leaned toward right, one leading foot near ground, coat trailing left",
          "src": "dorok/move-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 32,
            "right": 280,
            "top": 19,
            "bottom": 272,
            "emptyFraction": 0.5926519973936144
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "clash",
          "label": "충돌",
          "pose": "firm forward interception pose, braced front leg, tool or forearm raised to meet an incoming strike from the right",
          "src": "dorok/clash-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 0,
            "right": 255,
            "top": 18,
            "bottom": 276,
            "emptyFraction": 0.6031061368209255
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "clash-loss",
          "label": "충돌 패배",
          "pose": "stagger backward toward left, torso recoiling, bent knees, equipment retained, pained but alive",
          "src": "dorok/clash-loss-v1.png",
          "review": "pending-visual-approval",
          "bounds": {
            "left": 7,
            "right": 266,
            "top": 32,
            "bottom": 276,
            "emptyFraction": 0.6304445892436469
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "clash-win",
          "label": "충돌 승리",
          "pose": "confident forward follow-through, stable stance, tool or fist directed right, not a victory dance",
          "src": "dorok/clash-win-v1.png",
          "review": "pending-visual-approval",
          "bounds": {
            "left": 5,
            "right": 257,
            "top": 18,
            "bottom": 276,
            "emptyFraction": 0.6108903420523139
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "hurt",
          "label": "피격",
          "pose": "distinct hit reaction: chest recoils, face winces, arms instinctively protect abdomen, no wounds or gore",
          "src": "dorok/hurt-v1.png",
          "review": "pending-visual-approval",
          "bounds": {
            "left": 26,
            "right": 241,
            "top": 8,
            "bottom": 273,
            "emptyFraction": 0.6287111904731965
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "defense",
          "label": "이루도록 · 반격",
          "pose": "compact ready-to-counter posture, tool or striking hand near hip, lead forearm guarding",
          "src": "dorok/defense-v1.png",
          "review": "pending-visual-approval",
          "bounds": {
            "left": 30,
            "right": 261,
            "top": 12,
            "bottom": 274,
            "emptyFraction": 0.5993816254416962
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-1-hit-1",
          "label": "대칭 배치 · 1타",
          "skillName": "대칭 배치",
          "hit": 1,
          "pose": "Skill 1 named 대칭 배치, 관통, hit 1 of 2: forward coordinate-pointing hand. Initiating committed motion, visibly different silhouette from adjacent attacks. ",
          "src": "dorok/skill-1-hit-1-v1.png",
          "review": "pending-visual-approval",
          "bounds": {
            "left": 9,
            "right": 276,
            "top": 11,
            "bottom": 275,
            "emptyFraction": 0.5981288432277454
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-1-hit-2",
          "label": "대칭 배치 · 2타",
          "skillName": "대칭 배치",
          "hit": 2,
          "pose": "Skill 1 named 대칭 배치, 관통, hit 2 of 2: cross-body symmetric gesture. Decisive finishing follow-through, visibly different silhouette from adjacent attacks. ",
          "src": "dorok/skill-1-hit-2-v1.png",
          "review": "pending-visual-approval",
          "bounds": {
            "left": 35,
            "right": 256,
            "top": 10,
            "bottom": 277,
            "emptyFraction": 0.6195734477536597
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-2-hit-1",
          "label": "좌표 계산 · 1타",
          "skillName": "좌표 계산",
          "hit": 1,
          "pose": "Skill 2 named 좌표 계산, 관통, hit 1 of 2: forward coordinate-pointing hand. Initiating committed motion, visibly different silhouette from adjacent attacks. ",
          "src": "dorok/skill-2-hit-1-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 16,
            "right": 280,
            "top": 8,
            "bottom": 273,
            "emptyFraction": 0.5914463650228775
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-2-hit-2",
          "label": "좌표 계산 · 2타",
          "skillName": "좌표 계산",
          "hit": 2,
          "pose": "Skill 2 named 좌표 계산, 관통, hit 2 of 2: cross-body symmetric gesture. Decisive finishing follow-through, visibly different silhouette from adjacent attacks. ",
          "src": "dorok/skill-2-hit-2-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 0,
            "right": 271,
            "top": 9,
            "bottom": 275,
            "emptyFraction": 0.6114923469387755
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-3-hit-1",
          "label": "참모의 지시 · 1타",
          "skillName": "참모의 지시",
          "hit": 1,
          "pose": "Skill 3 named 참모의 지시, 관통, hit 1 of 3: forward coordinate-pointing hand. Initiating committed motion, visibly different silhouette from adjacent attacks. ",
          "src": "dorok/skill-3-hit-1-v1.png",
          "review": "pending-visual-approval",
          "bounds": {
            "left": 14,
            "right": 273,
            "top": 9,
            "bottom": 270,
            "emptyFraction": 0.6084011184544993
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-3-hit-2",
          "label": "참모의 지시 · 2타",
          "skillName": "참모의 지시",
          "hit": 2,
          "pose": "Skill 3 named 참모의 지시, 관통, hit 2 of 3: cross-body symmetric gesture. Reverse-direction linking strike, visibly different silhouette from adjacent attacks. ",
          "src": "dorok/skill-3-hit-2-v1.png",
          "review": "pending-visual-approval",
          "bounds": {
            "left": 36,
            "right": 267,
            "top": 6,
            "bottom": 268,
            "emptyFraction": 0.6088265306122449
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-3-hit-3",
          "label": "참모의 지시 · 3타",
          "skillName": "참모의 지시",
          "hit": 3,
          "pose": "Skill 3 named 참모의 지시, 관통, hit 3 of 3: two-handed force release. Decisive finishing follow-through, visibly different silhouette from adjacent attacks. ",
          "src": "dorok/skill-3-hit-3-v1.png",
          "review": "pending-visual-approval",
          "bounds": {
            "left": 22,
            "right": 265,
            "top": 6,
            "bottom": 262,
            "emptyFraction": 0.5705237159398736
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-4-hit-1",
          "label": "완전 대칭 · 1타",
          "skillName": "완전 대칭",
          "hit": 1,
          "pose": "Skill 4 named 완전 대칭, 관통, hit 1 of 1: forward coordinate-pointing hand. Initiating committed motion, visibly different silhouette from adjacent attacks. Strongest normal skill, wider stable stance and forceful extension.",
          "src": "dorok/skill-4-hit-1-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 14,
            "right": 279,
            "top": 8,
            "bottom": 264,
            "emptyFraction": 0.5590884861407249
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "overdrive-hit-1",
          "label": "완전 대칭 · 개념 폭주 · 1타",
          "skillName": "완전 대칭 · 개념 폭주",
          "hit": 1,
          "pose": "Special concept overdrive 완전 대칭 · 개념 폭주, hit 1: forward coordinate-pointing hand, dramatic but anatomically grounded extension, small character-specific concept accent only; keep the same outfit and body proportions",
          "src": "dorok/overdrive-hit-1-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 0,
            "right": 280,
            "top": 8,
            "bottom": 264,
            "emptyFraction": 0.5425452807138684
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "overdrive-hit-2",
          "label": "완전 대칭 · 개념 폭주 · 2타",
          "skillName": "완전 대칭 · 개념 폭주",
          "hit": 2,
          "pose": "Special concept overdrive 완전 대칭 · 개념 폭주, hit 2: cross-body symmetric gesture, dramatic but anatomically grounded extension, small character-specific concept accent only; keep the same outfit and body proportions",
          "src": "dorok/overdrive-hit-2-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 0,
            "right": 271,
            "top": 9,
            "bottom": 264,
            "emptyFraction": 0.5048107675906184
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "overdrive-hit-3",
          "label": "완전 대칭 · 개념 폭주 · 3타",
          "skillName": "완전 대칭 · 개념 폭주",
          "hit": 3,
          "pose": "Special concept overdrive 완전 대칭 · 개념 폭주, hit 3: two-handed force release, dramatic but anatomically grounded extension, small character-specific concept accent only; keep the same outfit and body proportions",
          "src": "dorok/overdrive-hit-3-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 12,
            "right": 280,
            "top": 3,
            "bottom": 270,
            "emptyFraction": 0.44607982937989016
          },
          "pivotMethod": "silhouette-bottom approximation"
        }
      ]
    },
    {
      "id": "ryeona",
      "name": "이루려나",
      "reference": "../sd/08_이루려나_SD_v2.png",
      "sheet": "sheets/ryeona-v1.png",
      "scale": 2.6619217081850532,
      "rowDetection": "alpha-gaps",
      "frames": [
        {
          "key": "move",
          "label": "충돌 접근",
          "pose": "forward running stride, torso leaned toward right, one leading foot near ground, coat trailing left",
          "src": "ryeona/move-v1.png",
          "review": "pending-visual-approval",
          "bounds": {
            "left": 8,
            "right": 269,
            "top": 24,
            "bottom": 283,
            "emptyFraction": 0.5810549840282754
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "clash",
          "label": "충돌",
          "pose": "firm forward interception pose, braced front leg, tool or forearm raised to meet an incoming strike from the right",
          "src": "ryeona/clash-v1.png",
          "review": "pending-visual-approval",
          "bounds": {
            "left": 32,
            "right": 266,
            "top": 19,
            "bottom": 282,
            "emptyFraction": 0.5902974158946855
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "clash-loss",
          "label": "충돌 패배",
          "pose": "stagger backward toward left, torso recoiling, bent knees, equipment retained, pained but alive",
          "src": "ryeona/clash-loss-v1.png",
          "review": "pending-visual-approval",
          "bounds": {
            "left": 14,
            "right": 261,
            "top": 36,
            "bottom": 283,
            "emptyFraction": 0.5857311163203089
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "clash-win",
          "label": "충돌 승리",
          "pose": "confident forward follow-through, stable stance, tool or fist directed right, not a victory dance",
          "src": "ryeona/clash-win-v1.png",
          "review": "pending-visual-approval",
          "bounds": {
            "left": 11,
            "right": 264,
            "top": 26,
            "bottom": 283,
            "emptyFraction": 0.6152852267186738
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "hurt",
          "label": "피격",
          "pose": "distinct hit reaction: chest recoils, face winces, arms instinctively protect abdomen, no wounds or gore",
          "src": "ryeona/hurt-v1.png",
          "review": "pending-visual-approval",
          "bounds": {
            "left": 13,
            "right": 215,
            "top": 20,
            "bottom": 258,
            "emptyFraction": 0.6343018006055133
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "defense",
          "label": "점멸 회피",
          "pose": "low lateral dodge, bent knees, torso pulled backward, preserve balance",
          "src": "ryeona/defense-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 10,
            "right": 279,
            "top": 73,
            "bottom": 250,
            "emptyFraction": 0.6287846481876332
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-1-hit-1",
          "label": "스패너 튕기기 · 1타",
          "skillName": "스패너 튕기기",
          "hit": 1,
          "pose": "Skill 1 named 스패너 튕기기, 타격, hit 1 of 2: wrench flick from wrist. Initiating committed motion, visibly different silhouette from adjacent attacks. ",
          "src": "ryeona/skill-1-hit-1-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 0,
            "right": 280,
            "top": 11,
            "bottom": 259,
            "emptyFraction": 0.5862989323843416
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-1-hit-2",
          "label": "스패너 튕기기 · 2타",
          "skillName": "스패너 튕기기",
          "hit": 2,
          "pose": "Skill 1 named 스패너 튕기기, 타격, hit 2 of 2: throw compact pyrotechnic charge. Decisive finishing follow-through, visibly different silhouette from adjacent attacks. ",
          "src": "ryeona/skill-1-hit-2-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 0,
            "right": 266,
            "top": 19,
            "bottom": 260,
            "emptyFraction": 0.5471215351812366
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-2-hit-1",
          "label": "깜짝 폭죽 · 1타",
          "skillName": "깜짝 폭죽",
          "hit": 1,
          "pose": "Skill 2 named 깜짝 폭죽, 타격, hit 1 of 1: wrench flick from wrist. Initiating committed motion, visibly different silhouette from adjacent attacks. ",
          "src": "ryeona/skill-2-hit-1-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 16,
            "right": 280,
            "top": 19,
            "bottom": 257,
            "emptyFraction": 0.5508762505875243
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-3-hit-1",
          "label": "불량품 대폭발 · 1타",
          "skillName": "불량품 대폭발",
          "hit": 1,
          "pose": "Skill 3 named 불량품 대폭발, 타격, hit 1 of 3: wrench flick from wrist. Initiating committed motion, visibly different silhouette from adjacent attacks. ",
          "src": "ryeona/skill-3-hit-1-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 0,
            "right": 266,
            "top": 9,
            "bottom": 256,
            "emptyFraction": 0.5477762803234502
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-3-hit-2",
          "label": "불량품 대폭발 · 2타",
          "skillName": "불량품 대폭발",
          "hit": 2,
          "pose": "Skill 3 named 불량품 대폭발, 타격, hit 2 of 3: throw compact pyrotechnic charge. Reverse-direction linking strike, visibly different silhouette from adjacent attacks. ",
          "src": "ryeona/skill-3-hit-2-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 5,
            "right": 280,
            "top": 34,
            "bottom": 256,
            "emptyFraction": 0.5877929228496609
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-3-hit-3",
          "label": "불량품 대폭발 · 3타",
          "skillName": "불량품 대폭발",
          "hit": 3,
          "pose": "Skill 3 named 불량품 대폭발, 타격, hit 3 of 3: press detonator while bracing. Decisive finishing follow-through, visibly different silhouette from adjacent attacks. ",
          "src": "ryeona/skill-3-hit-3-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 0,
            "right": 257,
            "top": 22,
            "bottom": 257,
            "emptyFraction": 0.5854851752021564
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-4-hit-1",
          "label": "하룬식 기계장난 · 1타",
          "skillName": "하룬식 기계장난",
          "hit": 1,
          "pose": "Skill 4 named 하룬식 기계장난, 타격, hit 1 of 1: wrench flick from wrist. Initiating committed motion, visibly different silhouette from adjacent attacks. Strongest normal skill, wider stable stance and forceful extension.",
          "src": "ryeona/skill-4-hit-1-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 23,
            "right": 280,
            "top": 12,
            "bottom": 261,
            "emptyFraction": 0.7904371787267694
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "overdrive-hit-1",
          "label": "주황색 불량품 축제 · 1타",
          "skillName": "주황색 불량품 축제",
          "hit": 1,
          "pose": "Special concept overdrive 주황색 불량품 축제, hit 1: wrench flick from wrist, dramatic but anatomically grounded extension, small character-specific concept accent only; keep the same outfit and body proportions",
          "src": "ryeona/overdrive-hit-1-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 0,
            "right": 279,
            "top": 8,
            "bottom": 261,
            "emptyFraction": 0.7654141865079365
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "overdrive-hit-2",
          "label": "주황색 불량품 축제 · 2타",
          "skillName": "주황색 불량품 축제",
          "hit": 2,
          "pose": "Special concept overdrive 주황색 불량품 축제, hit 2: throw compact pyrotechnic charge, dramatic but anatomically grounded extension, small character-specific concept accent only; keep the same outfit and body proportions",
          "src": "ryeona/overdrive-hit-2-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 0,
            "right": 280,
            "top": 26,
            "bottom": 258,
            "emptyFraction": 0.7886145709766706
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "overdrive-hit-3",
          "label": "주황색 불량품 축제 · 3타",
          "skillName": "주황색 불량품 축제",
          "hit": 3,
          "pose": "Special concept overdrive 주황색 불량품 축제, hit 3: press detonator while bracing, dramatic but anatomically grounded extension, small character-specific concept accent only; keep the same outfit and body proportions",
          "src": "ryeona/overdrive-hit-3-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 0,
            "right": 265,
            "top": 19,
            "bottom": 260,
            "emptyFraction": 0.7805493551587301
          },
          "pivotMethod": "silhouette-bottom approximation"
        }
      ]
    },
    {
      "id": "getne",
      "name": "이루겠네",
      "reference": "../sd/09_이루겠네_SD_v2.png",
      "sheet": "sheets/getne-v1.png",
      "scale": 2.6906474820143886,
      "rowDetection": "alpha-gaps",
      "frames": [
        {
          "key": "move",
          "label": "충돌 접근",
          "pose": "forward running stride, torso leaned toward right, one leading foot near ground, coat trailing left",
          "src": "getne/move-v1.png",
          "review": "pending-visual-approval",
          "bounds": {
            "left": 24,
            "right": 270,
            "top": 42,
            "bottom": 301,
            "emptyFraction": 0.581424797502347
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "clash",
          "label": "충돌",
          "pose": "firm forward interception pose, braced front leg, tool or forearm raised to meet an incoming strike from the right",
          "src": "getne/clash-v1.png",
          "review": "pending-visual-approval",
          "bounds": {
            "left": 36,
            "right": 259,
            "top": 49,
            "bottom": 304,
            "emptyFraction": 0.5924846625766871
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "clash-loss",
          "label": "충돌 패배",
          "pose": "stagger backward toward left, torso recoiling, bent knees, equipment retained, pained but alive",
          "src": "getne/clash-loss-v1.png",
          "review": "pending-visual-approval",
          "bounds": {
            "left": 14,
            "right": 248,
            "top": 41,
            "bottom": 306,
            "emptyFraction": 0.5965875597668275
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "clash-win",
          "label": "충돌 승리",
          "pose": "confident forward follow-through, stable stance, tool or fist directed right, not a victory dance",
          "src": "getne/clash-win-v1.png",
          "review": "pending-visual-approval",
          "bounds": {
            "left": 3,
            "right": 263,
            "top": 51,
            "bottom": 306,
            "emptyFraction": 0.6120398773006135
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "hurt",
          "label": "피격",
          "pose": "distinct hit reaction: chest recoils, face winces, arms instinctively protect abdomen, no wounds or gore",
          "src": "getne/hurt-v1.png",
          "review": "pending-visual-approval",
          "bounds": {
            "left": 37,
            "right": 262,
            "top": 20,
            "bottom": 265,
            "emptyFraction": 0.5311293588018561
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "defense",
          "label": "성문양 방어",
          "pose": "broad braced guard, both forearms protect head and chest",
          "src": "getne/defense-v1.png",
          "review": "pending-visual-approval",
          "bounds": {
            "left": 40,
            "right": 259,
            "top": 20,
            "bottom": 265,
            "emptyFraction": 0.5707470974255426
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-1-hit-1",
          "label": "하얀 손짓 · 1타",
          "skillName": "하얀 손짓",
          "hit": 1,
          "pose": "Skill 1 named 하얀 손짓, 타격, hit 1 of 1: open-palm white light strike. Initiating committed motion, visibly different silhouette from adjacent attacks. ",
          "src": "getne/skill-1-hit-1-v1.png",
          "review": "pending-visual-approval",
          "bounds": {
            "left": 5,
            "right": 272,
            "top": 24,
            "bottom": 271,
            "emptyFraction": 0.4655382719464809
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-2-hit-1",
          "label": "성스러운 문양 · 1타",
          "skillName": "성스러운 문양",
          "hit": 1,
          "pose": "Skill 2 named 성스러운 문양, 타격, hit 1 of 1: open-palm white light strike. Initiating committed motion, visibly different silhouette from adjacent attacks. ",
          "src": "getne/skill-2-hit-1-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 0,
            "right": 265,
            "top": 28,
            "bottom": 276,
            "emptyFraction": 0.475
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-3-hit-1",
          "label": "히어로처럼! · 1타",
          "skillName": "히어로처럼!",
          "hit": 1,
          "pose": "Skill 3 named 히어로처럼!, 타격, hit 1 of 2: open-palm white light strike. Initiating committed motion, visibly different silhouette from adjacent attacks. ",
          "src": "getne/skill-3-hit-1-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 24,
            "right": 280,
            "top": 38,
            "bottom": 280,
            "emptyFraction": 0.8176392186076569
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-3-hit-2",
          "label": "히어로처럼! · 2타",
          "skillName": "히어로처럼!",
          "hit": 2,
          "pose": "Skill 3 named 히어로처럼!, 타격, hit 2 of 2: draw short sacred mark with fingertip. Decisive finishing follow-through, visibly different silhouette from adjacent attacks. ",
          "src": "getne/skill-3-hit-2-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 0,
            "right": 271,
            "top": 35,
            "bottom": 276,
            "emptyFraction": 0.8379120879120879
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "skill-4-hit-1",
          "label": "괜찮아요, 제가 할게요 · 1타",
          "skillName": "괜찮아요, 제가 할게요",
          "hit": 1,
          "pose": "Skill 4 named 괜찮아요, 제가 할게요, 타격, hit 1 of 1: open-palm white light strike. Initiating committed motion, visibly different silhouette from adjacent attacks. Strongest normal skill, wider stable stance and forceful extension.",
          "src": "getne/skill-4-hit-1-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 3,
            "right": 280,
            "top": 27,
            "bottom": 282,
            "emptyFraction": 0.7958740402005089
          },
          "pivotMethod": "silhouette-bottom approximation"
        },
        {
          "key": "overdrive-hit-1",
          "label": "하얀 성문양의 약속 · 1타",
          "skillName": "하얀 성문양의 약속",
          "hit": 1,
          "pose": "Special concept overdrive 하얀 성문양의 약속, hit 1: open-palm white light strike, dramatic but anatomically grounded extension, small character-specific concept accent only; keep the same outfit and body proportions",
          "src": "getne/overdrive-hit-1-v1.png",
          "review": "check-cell-edge",
          "bounds": {
            "left": 0,
            "right": 267,
            "top": 7,
            "bottom": 278,
            "emptyFraction": 0.7679517204107368
          },
          "pivotMethod": "silhouette-bottom approximation"
        }
      ]
    }
  ]
};
