- #remember DecorationManager and CodeLens must use LIVE ghost markers from GhostMarkerManager.getMarkers(), NOT from commentFile.ghostMarkers (which is stale file data). This was the root cause of invisible/non-tracking gutter icons.
- #remember When debugging invisible gutter icons, check: 1) resources/comment-default.svg exists, 2) DecorationManager uses live markers, 3) Console shows "Applying N decorations" logs
- #remember Ghost marker tracking flow: GhostMarkerManager (live positions) → DecorationManager (gutter icons) + CodeLens (click links). Both UI components need
  ghostMarkerManager.setGhostMarkerManager() wired in extension.ts
- #remember Test file location: test-samples/ast-test.js with matching .comments file. Pre-existing comments at lines 13 (calculateTotal/NOTE), 18(formatCurrency/TODO), 30(addItem/STAR)
- #remember Copy/paste detection in GhostMarkerManager.detectAndHandleCopiedMarkers() - warns user that comments aren't duplicated on copy, only moved on cut/paste
- #remember Debug console: View → Debug Console (not terminal). Shows [GhostMarkerManager], [AST], [DecorationManager], [CodeLens] prefixed logs