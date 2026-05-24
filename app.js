// app.js — fetches /data/current.json, renders the meme, runs the countdown
// and the cheeky visitor counter. Vanilla JS, no dependencies. 2026 in spirit
// but 1998 in heart.

(() => {
  'use strict';

  // ─── DOM refs ───────────────────────────────────────────────────────────
  const $ = id => document.getElementById(id);
  const els = {
    title:     $('meme-title'),
    image:     $('meme-image'),
    subreddit: $('meme-subreddit'),
    author:    $('meme-author'),
    score:     $('meme-score'),
    velocity:  $('meme-velocity'),
    when:      $('meme-when'),
    link:      $('meme-reddit-link'),
    countdown: $('countdown'),
    counter:   $('visitor-counter'),
    fact:      $('fun-fact'),
  };

  // ─── RENDER THE CURRENT MEME ────────────────────────────────────────────
  async function loadCurrent() {
    try {
      // Cache-bust so we always get the latest file
      const res = await fetch('/data/current.json?t=' + Date.now());
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const m = await res.json();
      render(m);
    } catch (err) {
      console.error('Failed to load meme:', err);
      els.title.textContent = '⚠ The meme bot took a coffee break. Refresh in a sec.';
    }
  }

  function render(m) {
    els.title.textContent = m.title || '(no title)';
    els.image.src = m.image_url;
    els.image.alt = m.title || 'meme';

    els.subreddit.innerHTML = m.subreddit === 'hourlyhumor'
      ? '<i>(seed — first real meme arrives at the top of the hour)</i>'
      : `<a href="https://reddit.com/r/${m.subreddit}" target="_blank" rel="noopener noreferrer">r/${m.subreddit}</a>`;

    els.author.textContent = '/u/' + (m.author || 'unknown');
    els.score.textContent = (m.score || 0).toLocaleString() + ' 👍';
    els.velocity.textContent = (m.velocity || 0).toLocaleString();
    els.when.textContent = formatWhen(m.selected_at);
    els.link.href = m.reddit_url || '#';
  }

  function formatWhen(iso) {
    if (!iso) return '?';
    const d = new Date(iso);
    const ago = Math.floor((Date.now() - d.getTime()) / 60000);
    if (ago < 1) return 'just now';
    if (ago < 60) return `${ago} min ago`;
    if (ago < 1440) return `${Math.floor(ago/60)}h ago`;
    return d.toLocaleString();
  }

  // ─── COUNTDOWN TO NEXT HOUR ─────────────────────────────────────────────
  let lastMinuteSeen = null;
  function tickCountdown() {
    const now = new Date();
    const min = 59 - now.getMinutes();
    const sec = 59 - now.getSeconds();
    els.countdown.textContent =
      String(min).padStart(2, '0') + ':' + String(sec).padStart(2, '0');

    // When we cross into a new hour, quietly refetch the data file.
    // The cron just ran (or is about to), so a meme update is likely.
    const currentMinute = now.getMinutes();
    if (lastMinuteSeen !== null && currentMinute === 0 && lastMinuteSeen === 59) {
      // wait 90 seconds for GH Actions + Vercel redeploy to settle
      setTimeout(loadCurrent, 90_000);
    }
    lastMinuteSeen = currentMinute;
  }

  // ─── FAKE VISITOR COUNTER ────────────────────────────────────────────────
  // Persists per-visitor via localStorage, ticks up slowly so the page feels
  // alive. Not real analytics — see README for adding Plausible/etc. later.
  function visitorCounter() {
    const KEY = 'hh-visit-count';
    let n = parseInt(localStorage.getItem(KEY) || '0', 10);
    if (!n) {
      // Seed with a vaguely plausible "we exist" number
      n = 1337 + Math.floor(Math.random() * 200);
    }
    n += 1;
    localStorage.setItem(KEY, String(n));

    const padded = String(n).padStart(9, '0');
    els.counter.textContent = padded;

    // Slow trickle while the user lingers (just for the chaos)
    setInterval(() => {
      n += 1;
      localStorage.setItem(KEY, String(n));
      els.counter.textContent = String(n).padStart(9, '0');
    }, 30_000);
  }

  // ─── FUN FACT OF THE PAGELOAD ────────────────────────────────────────────
  const FACTS = [
    'The first meme to go viral was "Dancing Baby" in 1996.',
    'The word "meme" was coined by biologist Richard Dawkins in 1976.',
    'This entire site is automated. No humans were harmed (or employed).',
    'The bot polls 10 subreddits every hour and ranks by upvote velocity.',
    'NSFW posts are filtered out automatically. You\'re safe at work. Mostly.',
    'Comic Sans was created in 1994 by Vincent Connare. He has apologized.',
    'The <marquee> tag was introduced by Microsoft in 1996 and rules.',
    'The most upvoted post in Reddit history has over 480,000 upvotes.',
    'The phrase "meme" used to refer mostly to academic culture units. Lol.',
    'This domain has been parked since the 90s. It finally has a purpose.',
    'Internet Explorer 6 launched in 2001 and refused to die for 15 years.',
    'The visitor counter to your right is fake. Sorry. (Real metrics: phase 2.)'
  ];
  function pickFact() {
    els.fact.textContent = FACTS[Math.floor(Math.random() * FACTS.length)];
  }

  // ─── BOOT ────────────────────────────────────────────────────────────────
  loadCurrent();
  visitorCounter();
  pickFact();
  tickCountdown();
  setInterval(tickCountdown, 1000);

  // Refresh the meme data every 5 minutes too, in case GH Actions ran early
  setInterval(loadCurrent, 5 * 60 * 1000);
})();
