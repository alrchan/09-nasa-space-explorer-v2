// Use this URL to fetch NASA APOD JSON data.
const apodData = 'https://cdn.jsdelivr.net/gh/GCA-Classroom/apod/data.json';

// DOM refs
const getImageBtn = document.getElementById('getImageBtn');
const gallery = document.getElementById('gallery');

// small helper to create elements
function el(tag, classNames = [], text) {
	const e = document.createElement(tag);
	if (classNames.length) e.classList.add(...classNames);
	if (text) e.textContent = text;
	return e;
}

// Render card that matches .gallery-item
function renderCard(item) {
	const card = el('article', ['gallery-item']);

	const imgWrap = el('div', ['media']);
	if (item.media_type === 'image') {
		const img = document.createElement('img');
		img.src = item.url;
		img.alt = item.title || 'Astronomy image';
		imgWrap.appendChild(img);
	} else if (item.media_type === 'video') {
		// show thumbnail if available
		if (item.thumbnail_url) {
			const img = document.createElement('img');
			img.src = item.thumbnail_url;
			img.alt = item.title || 'Video thumbnail';
			imgWrap.appendChild(img);
		} else {
			const placeholder = el('div', ['video-placeholder'], 'Video');
			imgWrap.appendChild(placeholder);
		}
	}

	const info = el('div', ['info']);
	const title = el('h3', [], item.title || 'Untitled');
	const date = el('p', [], item.date || '');
	info.appendChild(title);
	info.appendChild(date);

	card.appendChild(imgWrap);
	card.appendChild(info);

	// accessibility
	card.tabIndex = 0;
	card.setAttribute('role', 'button');
	card.addEventListener('click', () => openModal(item));
	card.addEventListener('keydown', (e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			openModal(item);
		}
	});

	return card;
}

// modal
function openModal(item) {
	const existing = document.getElementById('apodModal');
	if (existing) existing.remove();

	const modal = el('dialog');
	modal.id = 'apodModal';
	const content = el('div', ['modal-content']);
	const closeBtn = el('button', ['modal-close'], 'Close');
	closeBtn.addEventListener('click', () => modal.close());

	const title = el('h2', [], item.title || 'No title');
	const date = el('p', [], item.date || '');

	const mediaWrap = el('div', ['modal-media']);
	if (item.media_type === 'image') {
		const img = document.createElement('img');
		img.src = item.hdurl || item.url;
		img.alt = item.title || 'Astronomy image';
		mediaWrap.appendChild(img);
	} else if (item.media_type === 'video') {
		if (item.url && item.url.includes('youtube')) {
			const iframe = document.createElement('iframe');
			iframe.src = item.url;
			iframe.setAttribute('frameborder', '0');
			iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
			iframe.setAttribute('allowfullscreen', '');
			mediaWrap.appendChild(iframe);
		} else {
			const link = el('a', [], 'Open video');
			link.href = item.url || '#';
			link.target = '_blank';
			mediaWrap.appendChild(link);
		}
	}

	const explanation = el('p', ['explanation'], item.explanation || '');

	content.appendChild(closeBtn);
	content.appendChild(title);
	content.appendChild(date);
	content.appendChild(mediaWrap);
	content.appendChild(explanation);

	modal.appendChild(content);
	document.body.appendChild(modal);
	if (typeof modal.showModal === 'function') modal.showModal();

	const onKey = (e) => { if (e.key === 'Escape') modal.close(); };
	document.addEventListener('keydown', onKey);
	modal.addEventListener('close', () => {
		document.removeEventListener('keydown', onKey);
		modal.remove();
	});
}

// fetch and render
async function fetchAndRender() {
	gallery.innerHTML = '';
	const loading = el('div', ['placeholder']);
	loading.innerHTML = '<div class="placeholder-icon">⏳</div><p>Loading...</p>';
	gallery.appendChild(loading);

	try {
		const res = await fetch(apodData);
		if (!res.ok) throw new Error(`Network response was not ok (${res.status})`);
		const data = await res.json();
		const items = Array.isArray(data) ? data : [data];

		gallery.innerHTML = '';
		items.forEach(item => gallery.appendChild(renderCard(item)));

		if (items.length === 0) gallery.innerHTML = '<div class="placeholder"><p>No items found.</p></div>';
	} catch (err) {
		console.error(err);
		gallery.innerHTML = '';
		const errEl = el('div', ['placeholder']);
		errEl.innerHTML = `<p>Failed to load data: ${err.message}</p>`;
		gallery.appendChild(errEl);
	}
}

getImageBtn.addEventListener('click', fetchAndRender);

// Optionally fetch on load (commented out for explicit button control)
// window.addEventListener('load', fetchAndRender);