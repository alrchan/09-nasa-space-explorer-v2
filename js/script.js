// Use this URL to fetch NASA APOD JSON data.
const apodData = 'https://cdn.jsdelivr.net/gh/GCA-Classroom/apod/data.json';

// Grab elements from the DOM
const getImageBtn = document.getElementById('getImageBtn');
const gallery = document.getElementById('gallery');
const useNasaCheckbox = document.getElementById('useNasa');
const apiKeyInput = document.getElementById('apiKey');
const countInput = document.getElementById('count');

// Helper: create an element with optional classes and text
function el(tag, classNames = [], text) {
	const e = document.createElement(tag);
	if (classNames.length) e.classList.add(...classNames);
	if (text) e.textContent = text;
	return e;
}

// Render a single APOD item card into the gallery
function renderCard(item) {
	const card = el('article', ['card']);

	const mediaWrap = el('div', ['media']);

	if (item.media_type === 'image') {
		const img = document.createElement('img');
		img.src = item.url;
		img.alt = item.title || 'Astronomy image';
		mediaWrap.appendChild(img);
	} else if (item.media_type === 'video') {
		// If there's a thumbnail, show that; otherwise embed iframe
		if (item.thumbnail_url) {
			const thumb = document.createElement('img');
			thumb.src = item.thumbnail_url;
			thumb.alt = item.title || 'Video thumbnail';
			mediaWrap.appendChild(thumb);
		} else if (item.url && item.url.includes('youtube')) {
			const iframe = document.createElement('iframe');
			iframe.src = item.url;
			iframe.setAttribute('frameborder', '0');
			iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
			iframe.setAttribute('allowfullscreen', '');
			mediaWrap.appendChild(iframe);
		} else {
			// Fallback: link to the video
			const link = document.createElement('a');
			link.href = item.url || '#';
			link.target = '_blank';
			link.rel = 'noopener noreferrer';
			link.textContent = 'Watch video';
			mediaWrap.appendChild(link);
		}
	}

	const info = el('div', ['info']);
	const title = el('h3', ['title'], item.title || 'Untitled');
	const date = el('p', ['date'], item.date || '');

	info.appendChild(title);
	info.appendChild(date);

		// Make card keyboard accessible and open modal on click or Enter/Space
		card.tabIndex = 0;
		card.setAttribute('role', 'button');
		card.addEventListener('click', () => openModal(item));
		card.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				openModal(item);
			}
		});

	card.appendChild(mediaWrap);
	card.appendChild(info);

	return card;
}

// Create and show a modal with the item details
function openModal(item) {
	// Remove existing modal if present
	const existing = document.getElementById('apodModal');
	if (existing) existing.remove();

	const modal = el('dialog');
	modal.id = 'apodModal';
	modal.classList.add('apod-modal');

	const content = el('div', ['modal-content']);
		const closeBtn = el('button', ['modal-close'], 'Close');
	closeBtn.setAttribute('aria-label', 'Close details');
	closeBtn.addEventListener('click', () => modal.close());

	const title = el('h2', [], item.title || 'No title');
	const date = el('p', ['modal-date'], item.date || '');

	// Media
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
			const link = document.createElement('a');
			link.href = item.url || '#';
			link.target = '_blank';
			link.rel = 'noopener noreferrer';
			link.textContent = item.url || 'Open video';
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

		// Save currently focused element and append modal
		const prevFocus = document.activeElement;
		document.body.appendChild(modal);
	// Show dialog (use showModal if available)
	if (typeof modal.showModal === 'function') modal.showModal(); else modal.style.display = 'block';

		// Focus the close button for accessibility
		closeBtn.focus();

		// Close modal on Esc
	const onKey = (e) => {
		if (e.key === 'Escape') modal.close();
	};
	document.addEventListener('keydown', onKey);

	modal.addEventListener('close', () => {
		document.removeEventListener('keydown', onKey);
		modal.remove();
			// Restore previous focus if possible
			try {
				if (prevFocus && typeof prevFocus.focus === 'function') prevFocus.focus();
			} catch (e) {
				// ignore
			}
	});
}

// Fetch the APOD JSON and render the gallery
async function fetchAndRender() {
	// Clear gallery and show a loading state
	gallery.innerHTML = '';
	const loading = el('div', ['placeholder']);
	loading.innerHTML = '<div class="placeholder-icon">⏳</div><p>Loading...</p>';
	gallery.appendChild(loading);

		try {
			// Decide source: NASA APOD API (if checked) or CDN feed
			let url = apodData;
			if (useNasaCheckbox && useNasaCheckbox.checked) {
				const key = (apiKeyInput && apiKeyInput.value) ? apiKeyInput.value.trim() : 'DEMO_KEY';
				const count = countInput && countInput.value ? Number(countInput.value) : 10;
				// NASA APOD supports `count` to return an array of random images, or `start_date`/`end_date`.
				// We'll use count for simplicity.
				const params = new URLSearchParams({ api_key: key });
				if (count && count > 1) params.append('count', String(Math.min(Math.max(count, 1), 100)));
				url = `https://api.nasa.gov/planetary/apod?${params.toString()}`;
			}

			const res = await fetch(url);
			if (!res.ok) throw new Error(`Network response was not ok (${res.status})`);
			const data = await res.json();

			gallery.innerHTML = '';

			// NASA API may return a single object (when asked for a specific date) or an array (when count provided or CDN feed)
			const items = Array.isArray(data) ? data : [data];

			items.forEach((item) => {
				const card = renderCard(item);
				gallery.appendChild(card);
			});

			if (items.length === 0) {
				gallery.innerHTML = '<div class="placeholder"><p>No items found.</p></div>';
			}
		} catch (err) {
			console.error(err);
			gallery.innerHTML = '';
			const errEl = el('div', ['placeholder']);
			errEl.innerHTML = `<p>Failed to load data: ${err.message}</p>`;
			gallery.appendChild(errEl);
		}
}

// Wire button
getImageBtn.addEventListener('click', fetchAndRender);

// Optionally fetch on load (commented out for explicit button control)
// window.addEventListener('load', fetchAndRender);