/* Keyboard policy for the play screen. Form fields keep native editing. */
function setupGameChatKeyboard() {
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || event.isComposing || event.keyCode === 229) return;
    if (el.game?.hidden || el.stageFloor?.classList.contains("is-editing")) return;
    const target = event.target;
    if (target instanceof Element && target.closest("input, textarea, select, [contenteditable]:not([contenteditable='false'])")) return;

    // Capture before a previously focused button can synthesize another click.
    event.preventDefault();
    event.stopImmediatePropagation();
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    if (document.querySelector(".modal-overlay:not([hidden]), [role='alertdialog']:not([hidden])") || minigame
        || !document.getElementById("game-selector")?.hidden || housingEditing || debugSnapshot) return;

    if (!el.roomChatPanel?.hidden) {
      const conversation = document.getElementById("room-chat-conversation");
      if (conversation && !conversation.hidden && !el.roomChatInput?.disabled) el.roomChatInput.focus();
      return;
    }
    if (el.roomQuickChat && !el.roomQuickChat.hidden && !el.roomQuickChatInput?.disabled) {
      setQuickChatActive(true);
    }
  }, true);
}
