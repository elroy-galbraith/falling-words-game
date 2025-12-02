// DOM ELEMENTS
const menuSound = document.getElementById('MenuSound');
const buttons = document.querySelectorAll('button');

buttons.forEach((button) => {
  button.addEventListener('mouseover', () => {
    // Only try to play if the user has interacted with the page
    // (mouseover counts as interaction in some contexts, but usually click is needed first for audio context)
    // We catch the error to prevent console spam if it fails
    const playPromise = menuSound.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        // Auto-play was prevented
        // console.log("Audio play prevented:", error);
      });
    }
  });

  button.addEventListener('mouseout', () => {
    menuSound.pause();
    menuSound.currentTime = 0;
  });
});
