const playGameButton = document.getElementById('play-game-button');

playGameButton.addEventListener('click', () => {
  document.dispatchEvent(new Event('everbloom:start-game'));
});
