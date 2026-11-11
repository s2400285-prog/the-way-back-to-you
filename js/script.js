(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const intro = $("#opening");
  const story = $("#story");
  const first = $("#first-shot");
  const finale = $("#finale");
  const finaleReveal = $("#finale-reveal");
  const scenes = [...document.querySelectorAll(".scene")];
  const sceneNav = $(".scene-nav");
  const links = [...sceneNav.querySelectorAll("a")];
  const soundControls = $(".sound-controls");
  const audio = $("#soundtrack");
  const soundToggle = $("#sound-toggle");
  const soundStatus = $("#sound-status");
  const wipe = $(".wipe");
  const revealTargets = [...document.querySelectorAll("[data-reveal]")];
  let reveals;
  const { gsap, ScrollTrigger } = window;

  let lenis;
  let activeScene;
  let updateFrame = 0;
  let finaleTimer = 0;
  let playing = false;
  let changingScene = false;
  let finalePlayed = false;
  let opened = false;
  let soundVersion = 0;
  let fadeFrame = 0;
  let statusTimer = 0;
  let audioContext;
  let gain;
  let volume = 0;
  let scrollEffects;

  function jumpTo(target, immediate = false) {
    if (lenis) {
      lenis.scrollTo(target, { immediate, force: true, duration: 1.15 });
      return;
    }
    target.scrollIntoView({ behavior: immediate || motion.matches ? "instant" : "smooth" });
  }

  function setVolume(value) {
    volume = value;
    if (gain) gain.gain.value = value;
    else audio.volume = value;
  }

  function fadeTo(target, duration, onComplete) {
    cancelAnimationFrame(fadeFrame);
    const start = performance.now();
    const initialVolume = volume;
    function step(now) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = progress * progress * (3 - 2 * progress);
      setVolume(initialVolume + (target - initialVolume) * eased);
      if (progress < 1) fadeFrame = requestAnimationFrame(step);
      else onComplete?.();
    }
    fadeFrame = requestAnimationFrame(step);
  }

  function updateSoundButton() {
    const label = playing ? "Pause music" : "Play music";
    soundToggle.setAttribute("aria-label", label);
    $("#sound-label").textContent = label;
    $("#sound-icon").setAttribute("href", playing ? "#pause" : "#play");
  }

  function showSoundMessage(message) {
    clearTimeout(statusTimer);
    soundStatus.textContent = message;
    statusTimer = window.setTimeout(() => { soundStatus.textContent = ""; }, 4500);
  }

  function connectAudio() {
    if (audioContext || location.protocol === "file:") return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    try {
      audioContext = new AudioContext();
      gain = audioContext.createGain();
      gain.gain.value = 0;
      gain.connect(audioContext.destination);
      audioContext.createMediaElementSource(audio).connect(gain);
    } catch {
      audioContext?.close().catch(() => {});
      audioContext = undefined;
      gain = undefined;
    }
  }

  function sceneVolume() {
    return activeScene === finale ? .23 : .6;
  }

  async function startMusic() {
    const version = ++soundVersion;
    connectAudio();
    audioContext?.resume().catch(() => {});
    cancelAnimationFrame(fadeFrame);
    if (audio.paused) setVolume(0);
    playing = true;
    updateSoundButton();
    try {
      await audio.play();
      if (version === soundVersion) fadeTo(sceneVolume(), 1350);
    } catch {
      if (version !== soundVersion) return;
      playing = false;
      updateSoundButton();
      showSoundMessage(audio.error ? "Add your track at assets/music.mp3." : "Tap Play music to try again.");
    }
  }

  function stopMusic(restart = false) {
    ++soundVersion;
    playing = false;
    updateSoundButton();
    fadeTo(0, restart ? 850 : 420, () => {
      audio.pause();
      if (restart) audio.currentTime = 0;
    });
  }

  soundToggle.addEventListener("click", () => {
    if (playing) stopMusic();
    else startMusic();
  });

  const typedLine = $("#typed-line");
  const characters = [];
  for (const node of [...typedLine.childNodes]) {
    const text = node.textContent;
    const fragment = document.createDocumentFragment();
    for (const letter of text) {
      if (letter === " ") {
        fragment.append(" ");
      } else {
        const span = document.createElement("span");
        span.className = "type-character";
        span.textContent = letter;
        characters.push(span);
        fragment.append(span);
      }
    }
    if (node.nodeType === Node.TEXT_NODE) node.replaceWith(fragment);
    else node.replaceChildren(fragment);
  }

  let typed = false;
  function playTypewriter() {
    if (typed || changingScene || !opened) return;
    typed = true;
    if (motion.matches) return;
    typedLine.classList.add("is-typing");
    for (const [index, letter] of characters.entries()) {
      letter.style.animationDelay = `${180 + index * 24}ms`;
    }
  }

  function showFinale() {
    if (finalePlayed) return;
    finalePlayed = true;
    finaleReveal.removeAttribute("data-waiting");
    finaleReveal.classList.add("is-revealed");
  }

  function setActiveScene(scene) {
    if (scene === activeScene) return;
    activeScene = scene;
    for (const link of links) {
      if (link.hash === `#${scene?.id}`) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    }
    if (playing) fadeTo(sceneVolume(), 1250);
    clearTimeout(finaleTimer);
    if (scene === finale && !finalePlayed) {
      if (motion.matches) showFinale();
      else finaleTimer = window.setTimeout(showFinale, 2400);
    }
  }

  function updateScene() {
    updateFrame = 0;
    if (!opened) return;
    const center = window.innerHeight * .55;
    const scene = scenes.find((section) => {
      const rect = section.getBoundingClientRect();
      return rect.top <= center && rect.bottom > center;
    });
    setActiveScene(scene);
    sceneNav.hidden = !scene;
    if (scene === first) playTypewriter();
  }

  function queueSceneUpdate() {
    if (!updateFrame) updateFrame = requestAnimationFrame(updateScene);
  }

  function createScrollEffects() {
    if (motion.matches) return;
    if (window.Lenis) {
      lenis = new window.Lenis({ anchors: false, duration: 1.15, smoothWheel: true, autoRaf: true });
      lenis.on("scroll", () => {
        ScrollTrigger?.update();
        queueSceneUpdate();
      });
      if (!opened) lenis.stop();
    }
    if (!gsap || !ScrollTrigger) return;

    gsap.registerPlugin(ScrollTrigger);
    scrollEffects = gsap.matchMedia();
    scrollEffects.add({
      all: "(min-width: 0px)",
      desktop: "(min-width: 761px) and (min-height: 640px)",
    }, ({ conditions }) => {
      const stage = $(".scene-stage");
      const openingImage = $(".first-shot .backdrop");

      if (conditions.desktop) {
        const openingCamera = gsap.timeline({
          scrollTrigger: {
            trigger: first,
            start: "top top",
            end: "+=55%",
            pin: stage,
            scrub: true,
            anticipatePin: 1,
          },
        });
        openingCamera.fromTo(openingImage, { scale: 1.03 }, { scale: 1.21, yPercent: 3, ease: "none" });
        openingCamera.to(".first-content", { y: -28, ease: "none" }, 0);
      } else {
        gsap.fromTo(openingImage, { scale: 1.04 }, {
          scale: 1.18, yPercent: 4, ease: "none",
          scrollTrigger: { trigger: first, start: "top top", end: "bottom top", scrub: true },
        });
      }

      for (const selector of [".memory", ".night", ".promise"]) {
        const section = $(selector);
        gsap.fromTo(section.querySelector(".backdrop"), { scale: 1.14, yPercent: -3 }, {
          scale: 1.09, yPercent: 3, ease: "none",
          scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: true },
        });
      }

      gsap.fromTo(".film-frame", { rotateX: 7, rotateY: -5, scale: .96 }, {
        rotateX: 0, rotateY: 0, scale: 1, ease: "none",
        scrollTrigger: { trigger: ".photo-perspective", start: "top 95%", end: "center center", scrub: true },
      });
      gsap.fromTo(".photo-window img", { scale: 1 }, {
        scale: 1.075, ease: "none",
        scrollTrigger: { trigger: ".photo-perspective", start: "top 92%", end: "bottom 22%", scrub: true },
      });
    });
  }

  function lockIntro(locked) {
    document.body.classList.toggle("intro-locked", locked);
    story.inert = locked;
    if (locked) lenis?.stop();
    else lenis?.start();
  }

  function resetFinale() {
    clearTimeout(finaleTimer);
    finalePlayed = false;
    finaleReveal.classList.remove("is-revealed");
    if (!motion.matches) finaleReveal.setAttribute("data-waiting", "");
  }

  function playWipe(atMidpoint, onComplete) {
    if (motion.matches) {
      atMidpoint();
      onComplete();
      return;
    }
    wipe.classList.add("is-playing");
    window.setTimeout(atMidpoint, 430);
    window.setTimeout(() => {
      wipe.classList.remove("is-playing");
      onComplete();
    }, 950);
  }

  $("#enter-story").addEventListener("click", (event) => {
    event.preventDefault();
    if (changingScene) return;
    if (opened) {
      jumpTo(first);
      return;
    }
    changingScene = true;
    opened = true;
    lockIntro(false);
    soundControls.hidden = false;
    startMusic();
    playWipe(() => {
      ScrollTrigger?.refresh();
      jumpTo(first, true);
      first.classList.add("camera-arrival");
      $("#first-title").focus({ preventScroll: true });
    }, () => {
      changingScene = false;
      playTypewriter();
      queueSceneUpdate();
    });
  });

  $("#replay-story").addEventListener("click", (event) => {
    event.preventDefault();
    if (changingScene) return;
    changingScene = true;
    stopMusic(true);
    playWipe(() => {
      opened = false;
      jumpTo(intro, true);
      if (location.hash) history.replaceState(null, "", location.pathname + location.search);
      setActiveScene(undefined);
      soundControls.hidden = true;
      sceneNav.hidden = true;
      lockIntro(true);
      resetFinale();
      typed = false;
      typedLine.classList.remove("is-typing");
      first.classList.remove("camera-arrival");
      for (const element of revealTargets) {
        element.classList.remove("scene-reveal");
        reveals?.observe(element);
      }
      $("#enter-story").focus({ preventScroll: true });
    }, () => { changingScene = false; });
  });

  for (const link of [...links, $(".scroll-cue"), $(".wordmark")]) {
    link.addEventListener("click", (event) => {
      if (changingScene) {
        event.preventDefault();
        return;
      }
      const target = document.getElementById(link.hash.slice(1));
      if (!target) return;
      event.preventDefault();
      jumpTo(target);
    });
  }

  if ("IntersectionObserver" in window) {
    reveals = new IntersectionObserver((entries, observer) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        if (!motion.matches) entry.target.classList.add("scene-reveal");
        observer.unobserve(entry.target);
      }
    }, { threshold: .08 });
    revealTargets.forEach((element) => reveals.observe(element));
  }

  motion.addEventListener("change", () => {
    scrollEffects?.revert();
    lenis?.destroy();
    lenis = undefined;
    if (motion.matches) {
      typedLine.classList.remove("is-typing");
      if (activeScene === finale) showFinale();
    } else {
      if (!finalePlayed && activeScene !== finale) resetFinale();
      createScrollEffects();
    }
  });

  const deepLink = scenes.find((scene) => location.hash === `#${scene.id}`);
  opened = Boolean(deepLink);
  soundControls.hidden = !opened;
  resetFinale();
  lockIntro(!opened);
  createScrollEffects();
  if (deepLink) {
    window.addEventListener("load", () => {
      ScrollTrigger?.refresh();
      jumpTo(deepLink, true);
      queueSceneUpdate();
    }, { once: true });
  }
  window.addEventListener("scroll", queueSceneUpdate, { passive: true });
  window.addEventListener("resize", queueSceneUpdate);
  queueSceneUpdate();
  setVolume(0);

  const canvas = $("#particles");
  const context = canvas.getContext("2d");
  if (!context) return;
  const dust = [];
  let width = 0;
  let height = 0;
  let lastFrame = 0;

  function sizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, 1.65);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    dust.length = 0;
    const count = width < 700 ? 25 : 54;
    for (let index = 0; index < count; index++) {
      dust.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: .35 + Math.random() * 1.7,
        velocity: 4 + Math.random() * 12,
        phase: Math.random() * Math.PI * 2,
        heart: index % 18 === 0,
      });
    }
  }

  function drawHeart(x, y, radius) {
    context.beginPath();
    context.moveTo(x, y + radius);
    context.bezierCurveTo(x - radius * 2, y - radius, x - radius, y - radius * 1.9, x, y - radius * .62);
    context.bezierCurveTo(x + radius, y - radius * 1.9, x + radius * 2, y - radius, x, y + radius);
    context.fill();
  }

  function drawDust(now) {
    requestAnimationFrame(drawDust);
    if (!opened || !activeScene || motion.matches || document.hidden) {
      if (lastFrame) context.clearRect(0, 0, width, height);
      lastFrame = 0;
      return;
    }
    const delta = lastFrame ? Math.min(.06, (now - lastFrame) / 1000) : 0;
    lastFrame = now;
    context.clearRect(0, 0, width, height);
    const night = activeScene.id === "goodbye";
    const hearts = activeScene.id === "today" || activeScene.id === "one-frame";
    context.fillStyle = night ? "#d8d9f6" : "#ffce91";
    for (const speck of dust) {
      speck.x += Math.sin(now / 2600 + speck.phase) * 8 * delta;
      speck.y -= speck.velocity * delta;
      if (speck.y < -8) speck.y = height + 8;
      if (speck.x < -8) speck.x = width + 8;
      if (speck.x > width + 8) speck.x = -8;
      context.globalAlpha = (.26 + Math.sin(now / 1250 + speck.phase) * .18) * (activeScene === finale ? 1.4 : 1);
      if (hearts && speck.heart) drawHeart(speck.x, speck.y, 2.2);
      else {
        context.beginPath();
        context.arc(speck.x, speck.y, speck.radius, 0, Math.PI * 2);
        context.fill();
      }
    }
    context.globalAlpha = 1;
  }

  sizeCanvas();
  window.addEventListener("resize", sizeCanvas, { passive: true });
  requestAnimationFrame(drawDust);
})();
