// Create and style the main container
const mainContainer = document.createElement('div');
mainContainer.style.position = 'fixed';
mainContainer.style.bottom = '8px';
mainContainer.style.left = '8px';
mainContainer.style.width = '35px';
mainContainer.style.height = '35px';
mainContainer.style.zIndex = '9999';
mainContainer.style.borderRadius = '50%';
mainContainer.style.overflow = 'hidden'; // Important for border-radius on children
document.body.appendChild(mainContainer);

// Wrapper for the video player
const videoWrapper = document.createElement('div');
videoWrapper.id = 'player-container'; // The YT API will target this ID
videoWrapper.style.position = 'absolute';
videoWrapper.style.top = '0';
videoWrapper.style.left = '0';
videoWrapper.style.width = '100%';
videoWrapper.style.height = '100%';
videoWrapper.style.pointerEvents = 'none';
videoWrapper.style.zIndex = '1'; // Behind the image
mainContainer.appendChild(videoWrapper);

// Wrapper for the background image
const imageWrapper = document.createElement('div');
imageWrapper.style.position = 'absolute';
imageWrapper.style.top = '0';
imageWrapper.style.left = '0';
imageWrapper.style.width = '100%';
imageWrapper.style.height = '100%';
imageWrapper.style.backgroundColor = 'black';
imageWrapper.style.zIndex = '2'; // In front of the video
imageWrapper.style.pointerEvents = 'none'; // Allow clicks to go through to the player
mainContainer.appendChild(imageWrapper);

const backgroundImage = document.createElement('img');
backgroundImage.src = 'https://shahid.is-a.dev/profile.png';
backgroundImage.style.width = '100%';
backgroundImage.style.height = '100%';
imageWrapper.appendChild(backgroundImage);

// 2. This code loads the IFrame Player API code asynchronously.
var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

let player;
let videoIds = [];
let playedVideos = [];
let currentVideoId;
let progressTrackerInterval;
let startTime = 0;

// Function to get a random video ID that hasn't been played yet
function getRandomVideoId() {
    let availableVideos = videoIds.filter(videoId => !playedVideos.includes(videoId));

    if (availableVideos.length === 0) {
        // All videos have been played, reset the played videos list
        playedVideos = [];
        availableVideos = videoIds;
    }

    const randomIndex = Math.floor(Math.random() * availableVideos.length);
    const videoId = availableVideos[randomIndex];
    return videoId;
}

// Function to fetch video IDs from the JSON file
async function loadVideoIds() {
    try {
        const response = await fetch(`https://shahidadev.github.io/cdn/yt-ads/v-id.json?_=${new Date().getTime()}`);
        videoIds = await response.json();
    } catch (error) {
        console.error('Error loading video IDs:', error);
    }
}

// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
async function onYouTubeIframeAPIReady() {
    await loadVideoIds();
    if (videoIds.length > 0) {
        const savedState = JSON.parse(localStorage.getItem('videoState'));
        if (savedState && savedState.videoId && videoIds.includes(savedState.videoId)) {
            currentVideoId = savedState.videoId;
            startTime = savedState.time;
        } else {
            currentVideoId = getRandomVideoId();
        }

        player = new YT.Player('player-container', {
            height: '100%',
            width: '100%',
            videoId: currentVideoId,
            playerVars: {
                'autoplay': 1,
                'controls': 1,
                'rel': 0,
                'showinfo': 0,
                'modestbranding': 1,
                'loop': 0,
                'fs': 0,
                'iv_load_policy': 3,
                'autohide': 1,
                'wmode': 'opaque',
                'mute': 0 // To mute the video, change this to 1
            },
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange,
                'onError': onPlayerError
            }
        });
    } else {
        console.log("No video IDs found in videos.json");
    }
}

// 4. The API will call this function when the video player is ready.
function onPlayerReady(event) {
    if (startTime > 0) {
        event.target.seekTo(startTime, true);
    }
    event.target.setPlaybackQuality('small');
    event.target.playVideo();
}

// 5. The API calls this function when the player's state changes.
function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
        event.target.setPlaybackQuality('small');
        // Start tracking progress
        progressTrackerInterval = setInterval(() => {
            localStorage.setItem('videoState', JSON.stringify({
                videoId: currentVideoId,
                time: player.getCurrentTime()
            }));
        }, 1000);
    } else {
        // Stop tracking progress if not playing
        clearInterval(progressTrackerInterval);
    }
    
    if (event.data === YT.PlayerState.ENDED) {
        // Clear saved state and play next video
        localStorage.removeItem('videoState');
        playedVideos.push(currentVideoId);
        currentVideoId = getRandomVideoId();
        player.loadVideoById(currentVideoId);
    }
}

function onPlayerError(event) {
    console.error('Player Error:', event.data);
    // Try to play the next random video on error
    localStorage.removeItem('videoState');
    currentVideoId = getRandomVideoId();
    player.loadVideoById(currentVideoId);
}
