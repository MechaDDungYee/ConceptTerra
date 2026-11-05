# Battle execution steps

`resolveBattleTurn()` runs the existing combat rules synchronously. It also creates
a plain-data execution timeline, available through `getLastBattleExecution()`.
Combat rules remain synchronous. `battle-playback.js` subsequently presents the
recorded timeline with close-up framing, waveform needles, broken hit icons,
and timed damage numbers. It never applies combat rules a second time.
The player reuses the original battlefield DOM in a side-view camera and dims
other units using brightness (not opacity). Participants normally stay at their
tile positions. For an overlapping, vertical, or far pair, the acting participant
anchors the pair while the other slides to a readable horizontal distance. These
are presentation coordinates only, never logical movement or range changes.
Damage numbers use a separate foreground layer above every participant.
`action-start` does not trigger
framing: only a confirmed `clash-start` or `attack-start` does. Skipped and
out-of-range actions never summon participants or display a roll. The planning
camera and logical positions remain unchanged by presentation.

## Timeline

- `turn-start`: ordered schedule, action slots, actions, and primary targets.
- `action-start`: begins one scheduled single action or paired clash.
- `action-used` / `action-skipped`: activation or failed activation with reason.
- `clash-start`: participating units and initial remaining hits.
- `clash-roll`: both rolls, including each hit's waveform and cumulative power.
- `clash-compare`: compared powers and winner; `null` means a tie and reroll.
- `hit-destroyed`: the losing action's last remaining hit is removed.
- `clash-end`: surviving hits and winner.
- `action-canceled`: only the defeated action slot is canceled.
- `attack-start`: surviving hits begin a fresh cumulative waveform chain.
- `attack-roll`: each surviving hit's waveform and power.
- `damage-applied`: actual damage after protection, HP before and after.
- `hit-effects-applied`: hit effects and whether the hit was evaded.
- `attack-end` / `action-end`: finishes the attack and scheduled action.
- `support-start` / `support-roll` / `support-applied` / `support-end`: approach
  the friendly primary, show each support hit and apply its actual recipients.
  Whole-team effects are applied once per hit, not once per recipient per team.
- `turn-end-effects` / `turn-complete`: periodic effects and next-turn preparation.

Defenses, counters, mentality changes, and defeated units have separate events.
After 128 tied clash rounds, `clash-stalemate` cancels both participating actions
without damage to prevent an infinite loop.

Every step has a sequential number, scheduled action order, unit snapshots, and
the filament value. Unit/plan IDs identify actors without retaining mutable unit
references. The getter returns a copy. Resetting combat clears the timeline.

## Presentation

The player consumes steps in order and displays their snapshots, not the already
advanced live battlefield. The first waveform per participating action spins
for 720ms and settles for 150ms; subsequent waveforms snap to their result and
hold for 180ms. Both contestants roll together. Damage pauses for 650ms per target and
its number fades over 1200ms. The static character images are not animated.
`turn-complete` hands back to live planning after playback cleanup. Other combat
controls are inert during playback. Tests can shorten delays through
`window.battlePlaybackTimingScale`; production defaults to 1.
