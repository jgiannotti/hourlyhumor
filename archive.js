// archive.js — renders the meme archive as a grid

(async () => {
  const root = document.getElementById('archive-root');

  let archive = [];
  try {
    const res = await fetch('/data/archive.json?t=' + Date.now());
    archive = await res.json();
  } catch (e) {
    console.error(e);
  }

  if (!archive || archive.length === 0) {
    root.innerHTML = `
      <div class="archive-empty">
        <h2>🦗 The archive is empty.</h2>
        <p>The robot hasn't picked any memes yet, OR the site just launched.</p>
        <p>Check back next hour!</p>
      </div>
    `;
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'archive-grid';

  for (const m of archive) {
    const card = document.createElement('div');
    card.className = 'archive-card';
    card.innerHTML = `
      <img loading="lazy" src="${escape(m.image_url)}" alt="${escape(m.title)}">
      <div class="a-title">${escape(m.title)}</div>
      <div class="a-meta">
        r/${escape(m.subreddit)} •
        ${Number(m.score || 0).toLocaleString()} 👍 •
        ${formatWhen(m.selected_at)}
        <br>
        <a href="${escape(m.reddit_url)}" target="_blank" rel="noopener noreferrer">view on reddit →</a>
      </div>
    `;
    grid.appendChild(card);
  }

  root.appendChild(grid);

  function escape(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatWhen(iso) {
    if (!iso) return '?';
    const d = new Date(iso);
    const ago = Math.floor((Date.now() - d.getTime()) / 60000);
    if (ago < 60) return `${ago}m ago`;
    if (ago < 1440) return `${Math.floor(ago/60)}h ago`;
    return `${Math.floor(ago/1440)}d ago`;
  }
})();
