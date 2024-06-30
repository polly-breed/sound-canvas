document.addEventListener("DOMContentLoaded", function() {
    const canvas = document.getElementById('drawingCanvas');
    const ctx = canvas.getContext('2d');
    const colors = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'];
    const soundFiles = [
        'sounds/sound1.mp3',
        'sounds/sound2.mp3',
        'sounds/sound3.mp3',
        'sounds/sound4.mp3',
        'sounds/sound5.mp3',
        'sounds/sound6.mp3'
    ];
    const sounds = soundFiles.map(file => new Audio(file));
    const colorSounds = {
        '#000000': sounds[0],
        '#ff0000': sounds[1],
        '#00ff00': sounds[2],
        '#0000ff': sounds[3],
        '#ffff00': sounds[4],
        '#ff00ff': sounds[5]
    };
    let currentColor = colors[0];
    let drawing = false;
    let lastX, lastY;
    let playheadInterval;
    let isPlaying = false;
    let startTime = null;
    let pausedTime = 0;
    const playhead = document.getElementById('playhead');

    // Set canvas dimensions
    canvas.width = 800;
    canvas.height = 400;

    // Add event listeners for drawing
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);

    function startDrawing(event) {
        if (!isPlaying) { // Allow drawing only when not playing
            drawing = true;
            [lastX, lastY] = [event.offsetX, event.offsetY];
        }
    }

    function draw(event) {
        if (drawing) {
            ctx.strokeStyle = currentColor;
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(event.offsetX, event.offsetY);
            ctx.stroke();
            [lastX, lastY] = [event.offsetX, event.offsetY];
        }
    }

    function stopDrawing() {
        if (drawing) {
            drawing = false;
        }
    }

    // Color buttons
    document.getElementById('color1').addEventListener('click', () => { currentColor = colors[0]; });
    document.getElementById('color2').addEventListener('click', () => { currentColor = colors[1]; });
    document.getElementById('color3').addEventListener('click', () => { currentColor = colors[2]; });
    document.getElementById('color4').addEventListener('click', () => { currentColor = colors[3]; });
    document.getElementById('color5').addEventListener('click', () => { currentColor = colors[4]; });
    document.getElementById('color6').addEventListener('click', () => { currentColor = colors[5]; });

    // Play, pause, stop functionality
    document.getElementById('play').addEventListener('click', startPlayback);
    document.getElementById('pause').addEventListener('click', pausePlayback);
    document.getElementById('stop').addEventListener('click', stopPlayback);

    function startPlayback() {
        if (!isPlaying) {
            isPlaying = true;
            if (!startTime) {
                startTime = Date.now();
            }
            playhead.style.left = pausedTime ? `${pausedTime}px` : '0px';
            playheadInterval = requestAnimationFrame(movePlayhead);
        }
    }

    function pausePlayback() {
        if (isPlaying) {
            isPlaying = false;
            cancelAnimationFrame(playheadInterval);
            pausedTime = parseFloat(playhead.style.left);
            sounds.forEach(sound => {
                sound.pause();
            });
        }
    }

    function stopPlayback() {
        isPlaying = false;
        cancelAnimationFrame(playheadInterval);
        playhead.style.left = '0px';
        startTime = null;
        pausedTime = 0;
        sounds.forEach(sound => {
            sound.pause();
            sound.currentTime = 0;
        });
    }

    function movePlayhead() {
        if (!startTime) {
            startTime = Date.now();
        }
        let elapsedTime = Date.now() - startTime;
        let position = (elapsedTime / 1000) * (canvas.width / 60); // 60 seconds full canvas width
        playhead.style.left = `${position}px`;

        if (position >= canvas.width) {
            stopPlayback();
        } else {
            checkSound(position);
            playheadInterval = requestAnimationFrame(movePlayhead);
        }
    }

    function checkSound(position) {
        let imageData = ctx.getImageData(Math.floor(position), 0, 1, canvas.height).data;
        let playingSounds = new Set();

        for (let i = 0; i < imageData.length; i += 4) {
            let [r, g, b, a] = imageData.slice(i, i + 4);
            if (a === 255) { // fully opaque
                let foundColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
                let yPosition = Math.floor(i / 4); // Correctly calculate the Y position
                let volume = 2 * (1 - (yPosition / canvas.height)); // Normalize volume between 0 and 2 (200%)
                volume = Math.min(volume, 1); // Cap volume at 1 (100%)
                if (colorSounds[foundColor]) {
                    playingSounds.add(colorSounds[foundColor]);
                    if (colorSounds[foundColor].paused || colorSounds[foundColor].currentTime === 0) {
                        colorSounds[foundColor].volume = volume;
                        colorSounds[foundColor].currentTime = 0;
                        colorSounds[foundColor].play();
                    } else {
                        colorSounds[foundColor].volume = volume; // Adjust volume for ongoing sound
                    }
                }
            }
        }

        // Only pause sounds that are not playing and have not been set to play
        sounds.forEach(sound => {
            if (!playingSounds.has(sound) && !sound.paused) {
                sound.pause();
                sound.currentTime = 0;
            }
        });
    }

    // Clear canvas button
    document.getElementById('clear').addEventListener('click', clearCanvas);

    function clearCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        stopPlayback(); // Stop playback if it's running
    }
});
