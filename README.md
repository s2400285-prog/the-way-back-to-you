# The Way Back to You

A Love Story That Doesn't End When the Movie Does.  
For Baby Julie, with love from James Traigo.

## Open the website

1. Extract the ZIP and open the `the-way-back-to-you` folder in Visual Studio Code.
2. Install **Live Server** if you don't already have it.
3. Right-click `index.html` and choose **Open with Live Server**.
4. Click **Enter our story** to begin. Scroll through the five scenes and wait for the final message to appear.

The website is static. GSAP, ScrollTrigger, Lenis, fonts, and media are included locally. It runs without npm, a build step, or internet access.

## Add your photo and music

- **Your photo** — Replace `assets/julie.jpg` with your personal photo. Save it as a JPEG with the exact same filename. The frame is landscape and crops around the center, so a wide photo works best. To adjust the crop, change `object-position` on `.photo-window img` in `css/style.css`. Update that photo's `alt` text in `index.html` to describe your picture.
- **Your music** — Replace `assets/music.mp3` with your MP3, keeping the exact same filename. Refresh the page and select **Enter our story** to hear it. The volume drops in the final scene. Use the floating music button to pause or resume at any time.

The included landscape JPEG and original instrumental are samples. The four scene backgrounds are separate files and do not need to be replaced.

## Edit or host the story

The letters and scene text are in `index.html`. Layout, type, and color are in `css/style.css`. Scene motion, music fades, particles, and replay are in `js/script.js`. Upload the contents of the project folder together when hosting your customized copy.

The site follows the device's reduced-motion preference. GSAP and ScrollTrigger 3.13.0 are distributed under the [GSAP Standard License](https://gsap.com/standard-license/). Lenis 1.3.17 uses the MIT License. Font licenses are included in `assets/fonts/`.
