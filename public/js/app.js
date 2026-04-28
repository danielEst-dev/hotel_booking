/* ============================================================
   State
   ============================================================ */
const state = {
	selectedGuest: null,
	guestMode: 'new',
	bookingsPage: 1,
	bookingsStatus: '',
	bookingsPag: null,
	guestsPage: 1,
	roomsMgmtPage: 1,
	guestBkId: null,
	guestBkName: '',
	guestBkPage: 1,
};

/* ============================================================
   API
   ============================================================ */
function qs(params) {
	const clean = Object.fromEntries(
		Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
	);
	return new URLSearchParams(clean).toString();
}

async function http(url, opts = {}) {
	const res = await fetch(url, {
		headers: { 'Content-Type': 'application/json', ...opts.headers },
		...opts,
	});
	return res.json();
}

const api = {
	rooms: {
		getAll: (p = {}) => http(`/bookings/rooms?${qs(p)}`),
		getById: (id) => http(`/bookings/rooms/${id}`),
		create: (data) => http('/bookings/rooms', { method: 'POST', body: JSON.stringify(data) }),
		update: (id, data) => http(`/bookings/rooms/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
		delete: (id) => http(`/bookings/rooms/${id}`, { method: 'DELETE' }),
	},
	guests: {
		getAll: (p = {}) => http(`/bookings/guests?${qs(p)}`),
		getById: (id) => http(`/bookings/guests/${id}`),
		create: (data) => http('/bookings/guests', { method: 'POST', body: JSON.stringify(data) }),
		update: (id, data) => http(`/bookings/guests/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
	},
	bookings: {
		getAll: (p = {}) => http(`/bookings?${qs(p)}`),
		getById: (id) => http(`/bookings/${id}`),
		create: (data) => http('/bookings', { method: 'POST', body: JSON.stringify(data) }),
		update: (id, data) => http(`/bookings/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
		cancel: (id) => http(`/bookings/${id}`, { method: 'DELETE' }),
		getByGuest: (guestId, p = {}) => http(`/bookings/guest/${guestId}?${qs(p)}`),
	},
	weather: {
		today: async () => {
			const d = todayStr();
			try {
				const r = await fetch(
					`https://api.open-meteo.com/v1/forecast?latitude=51.5074&longitude=-0.1278` +
					`&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto` +
					`&start_date=${d}&end_date=${d}`
				);
				return r.json();
			} catch {
				return null;
			}
		},
	},
};

/* ============================================================
   Navigation
   ============================================================ */
function switchSection(name) {
	document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
	document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

	const sec = document.getElementById(name);
	const btn = document.querySelector(`.nav-btn[data-section="${name}"]`);
	if (sec) sec.classList.add('active');
	if (btn) btn.classList.add('active');

	if (name === 'dashboard') initDashboard();
	if (name === 'new-booking') initBookingForm();
	if (name === 'bookings') loadBookings(1);
	if (name === 'rooms-mgmt') loadRoomsManagement();
	if (name === 'guests-mgmt') loadGuests(1);
}

/* ============================================================
   Dashboard — Weather
   ============================================================ */
async function initDashboard() {
	loadWeather();
	loadRooms();
}

async function loadWeather() {
	const card = document.getElementById('weather-card');
	card.innerHTML = `<div class="loading-state"><div class="spinner"></div><span>Fetching London weather…</span></div>`;

	try {
		const data = await api.weather.today();
		if (!data?.daily) throw new Error('no data');

		const hi = data.daily.temperature_2m_max[0];
		const lo = data.daily.temperature_2m_min[0];
		const rain = data.daily.precipitation_sum[0];
		const avg = ((hi + lo) / 2).toFixed(1);
		const date = new Date().toLocaleDateString('en-GB', {
			weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
		});

		let icon, desc;
		if (rain >= 15) { icon = '⛈️'; desc = 'Thunderstorm'; }
		else if (rain >= 5) { icon = '🌧️'; desc = 'Rainy'; }
		else if (rain >= 1) { icon = '🌦️'; desc = 'Light Showers'; }
		else if (rain > 0) { icon = '⛅'; desc = 'Partly Cloudy'; }
		else { icon = '☀️'; desc = 'Clear'; }

		card.innerHTML = `
			<div class="weather-body">
				<div class="weather-icon">${icon}</div>
				<div class="weather-main">
					<div class="weather-temp">${avg}<sup>°C</sup></div>
					<div class="weather-desc">${desc}</div>
					<div class="weather-loc">London, UK &nbsp;·&nbsp; ${date}</div>
				</div>
				<div class="weather-stats">
					<div class="wstat">
						<div class="wstat-val">${hi}°</div>
						<div class="wstat-lbl">High</div>
					</div>
					<div class="wstat">
						<div class="wstat-val">${lo}°</div>
						<div class="wstat-lbl">Low</div>
					</div>
					<div class="wstat">
						<div class="wstat-val">${rain}mm</div>
						<div class="wstat-lbl">Rain</div>
					</div>
				</div>
			</div>
		`;
	} catch {
		card.innerHTML = `<div class="loading-state" style="color:var(--text-dim)">Weather data unavailable</div>`;
	}
}

/* ============================================================
   Dashboard — Rooms
   ============================================================ */
async function loadRooms() {
	const grid = document.getElementById('rooms-grid');
	grid.innerHTML = `<div class="loading-state"><div class="spinner"></div><span>Loading rooms…</span></div>`;

	const typeFilter = document.getElementById('filter-type').value;
	const minPrice = document.getElementById('filter-min-price').value;
	const maxPrice = document.getElementById('filter-max-price').value;
	try {
		const res = await api.rooms.getAll({
			is_available: 'true',
			room_type: typeFilter || undefined,
			min_price: minPrice || undefined,
			max_price: maxPrice || undefined,
		});
		if (!res.success) throw new Error(res.error || 'Request failed');

		const rooms = res.data || [];
		if (rooms.length === 0) {
			grid.innerHTML = `<div class="empty-state">No available rooms found.</div>`;
			return;
		}

		grid.innerHTML = rooms.map(r => `
			<div class="room-card">
				<div class="room-card-top">
					<div>
						<div class="room-num-lbl">Room</div>
						<div class="room-num">${h(r.room_number)}</div>
					</div>
					<span class="badge ${r.is_available ? 'badge--avail' : 'badge--unavail'}">
						${r.is_available ? 'Available' : 'Unavailable'}
					</span>
				</div>
				<div class="room-type">${h(r.room_type)}</div>
				<div class="room-desc">${h(r.description || 'No description.')}</div>
				<div class="room-price">
					£${parseFloat(r.price_per_night).toFixed(2)}
					<span class="room-price-unit">/ night</span>
				</div>
			</div>
		`).join('');
	} catch (err) {
		grid.innerHTML = `<div class="empty-state">Failed to load rooms: ${h(err.message)}</div>`;
	}
}

/* ============================================================
   Booking Form
   ============================================================ */
async function initBookingForm() {
	setGuestMode('new');
	resetForm();
	await populateRoomSelect();
	const today = todayStr();
	document.getElementById('check_in_date').min = today;
}

async function populateRoomSelect() {
	const sel = document.getElementById('room-select');
	sel.innerHTML = '<option value="">Loading…</option>';
	try {
		const res = await api.rooms.getAll({ is_available: 'true' });
		if (!res.success) throw new Error(res.error);
		const rooms = res.data || [];
		sel.innerHTML = '<option value="">Select a room…</option>' +
			rooms.map(r =>
				`<option value="${r.id}" data-price="${r.price_per_night}">` +
				`Room ${h(r.room_number)} — ${h(r.room_type)} — £${parseFloat(r.price_per_night).toFixed(2)}/night` +
				`</option>`
			).join('');
	} catch {
		sel.innerHTML = '<option value="">Failed to load rooms</option>';
	}
}


function setGuestMode(mode) {
	state.guestMode = mode;
	document.getElementById('mode-new').classList.toggle('active', mode === 'new');
	document.getElementById('mode-existing').classList.toggle('active', mode === 'existing');
	document.getElementById('new-guest-form').classList.toggle('hidden', mode !== 'new');
	document.getElementById('existing-guest-form').classList.toggle('hidden', mode !== 'existing');
	state.selectedGuest = null;
	document.getElementById('selected-guest').classList.add('hidden');
	document.getElementById('guest-results').classList.remove('open');
	document.getElementById('guest-search').value = '';
}

function resetForm() {
	['first_name', 'last_name', 'email', 'phone', 'check_in_date', 'check_out_date'].forEach(id => {
		const el = document.getElementById(id);
		if (el) el.value = '';
	});
	document.getElementById('room-select').value = '';
	document.getElementById('price-preview').classList.add('hidden');
	state.selectedGuest = null;
}

function updatePricePreview() {
	const sel = document.getElementById('room-select');
	const checkIn = document.getElementById('check_in_date').value;
	const checkOut = document.getElementById('check_out_date').value;
	const preview = document.getElementById('price-preview');
	const price = parseFloat(sel.options[sel.selectedIndex]?.dataset.price);

	if (!price || !checkIn || !checkOut) {
		preview.classList.add('hidden');
		return;
	}

	const nights = Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000);
	if (nights <= 0) { preview.classList.add('hidden'); return; }

	document.getElementById('rate-val').textContent = `£${price.toFixed(2)} / night`;
	document.getElementById('nights-val').textContent = `${nights} night${nights !== 1 ? 's' : ''}`;
	document.getElementById('total-val').textContent = `£${(price * nights).toFixed(2)}`;
	preview.classList.remove('hidden');
}

async function handleSubmitBooking() {
	const btn = document.getElementById('submit-booking');
	const text = document.getElementById('submit-text');
	btn.disabled = true;
	text.textContent = 'Processing…';

	try {
		let guest_id;

		if (state.guestMode === 'new') {
			const first_name = val('first_name') || undefined;
			const last_name = val('last_name') || undefined;
			const email = val('email') || undefined;
			const phone = val('phone') || undefined;

			const gRes = await api.guests.create({ first_name, last_name, email, phone });
			if (!gRes.success) {
				const msgs = gRes.errors?.length ? gRes.errors : [gRes.error || 'Could not create guest.'];
				showToast('Guest', msgs, 'error');
				return;
			}
			guest_id = gRes.data.id;
		} else {
			guest_id = state.selectedGuest?.id;
		}

		const roomVal = document.getElementById('room-select').value;
		const room_id = roomVal ? Number(roomVal) : undefined;
		const check_in_date = val('check_in_date') || undefined;
		const check_out_date = val('check_out_date') || undefined;

		const bRes = await api.bookings.create({ guest_id, room_id, check_in_date, check_out_date });

		if (!bRes.success) {
			const msgs = bRes.errors?.length ? bRes.errors : [bRes.error || 'Booking failed.'];
			showToast('Booking', msgs, 'error');
			return;
		}

		showToast('Success', [`Booking #${bRes.data.id} created successfully.`], 'success');
		resetForm();
		populateRoomSelect();

	} catch (err) {
		showToast('Error', [err.message], 'error');
	} finally {
		btn.disabled = false;
		text.textContent = 'Create Booking';
	}
}

/* ============================================================
   Guest Search
   ============================================================ */
let guestSearchTimer;

async function searchGuests(query) {
	const resultsEl = document.getElementById('guest-results');
	const q = query.trim();

	if (!q) { resultsEl.classList.remove('open'); return; }

	clearTimeout(guestSearchTimer);
	guestSearchTimer = setTimeout(async () => {
		try {
			const res = await api.guests.getAll({ search: q, limit: 8 });
			const hits = res.success ? (res.data || []) : [];

			resultsEl.classList.add('open');
			if (hits.length === 0) {
				resultsEl.innerHTML = `<div class="guest-item" style="color:var(--text-muted);cursor:default">No guests found</div>`;
				return;
			}

			resultsEl.innerHTML = hits.map(g => `
				<div class="guest-item"
					data-guest-id="${g.id}"
					data-guest-name="${h(g.first_name + ' ' + g.last_name)}"
					data-guest-email="${h(g.email)}">
					<div class="guest-item-name">${h(g.first_name)} ${h(g.last_name)}</div>
					<div class="guest-item-email">${h(g.email)}</div>
				</div>
			`).join('');
		} catch {
			resultsEl.classList.remove('open');
		}
	}, 250);
}

function selectGuest(id, name, email) {
	state.selectedGuest = { id, name, email };
	document.getElementById('guest-results').classList.remove('open');
	document.getElementById('guest-search').value = '';

	const el = document.getElementById('selected-guest');
	el.classList.remove('hidden');
	el.innerHTML = `
		<div class="sel-name">✓ &nbsp;${h(name)}</div>
		<div class="sel-email">${h(email)}</div>
		<button class="btn btn-change" data-clear-guest>Change</button>
	`;
}

function clearSelectedGuest() {
	state.selectedGuest = null;
	document.getElementById('selected-guest').classList.add('hidden');
}

/* ============================================================
   Bookings List
   ============================================================ */
async function loadBookings(page) {
	if (page !== undefined) state.bookingsPage = page;

	const container = document.getElementById('bookings-container');
	container.innerHTML = `<div class="loading-state"><div class="spinner"></div><span>Loading bookings…</span></div>`;

	try {
		const res = await api.bookings.getAll({
			page: state.bookingsPage,
			limit: 10,
			status: state.bookingsStatus || undefined,
		});

		if (!res.success) throw new Error(res.error || 'Request failed');

		state.bookingsPag = res.pagination;
		const rows = res.data || [];

		if (rows.length === 0) {
			container.innerHTML = `<div class="empty-state">No bookings found.</div>`;
			document.getElementById('pagination').innerHTML = '';
			return;
		}

		container.innerHTML = `
			<div class="table-wrap">
				<table>
					<thead>
						<tr>
							<th>#</th>
							<th>Guest</th>
							<th>Room</th>
							<th>Check-in</th>
							<th>Check-out</th>
							<th>Total</th>
							<th>Status</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						${rows.map(b => `
							<tr>
								<td><span class="td-id">${b.id}</span></td>
								<td>
									<div class="td-name">${h(b.first_name)} ${h(b.last_name)}</div>
									<div class="td-email">${h(b.email)}</div>
								</td>
								<td>
									${h(b.room_number)}
									<span class="td-type">${h(b.room_type)}</span>
								</td>
								<td>${fmtDate(b.check_in_date)}</td>
								<td>${fmtDate(b.check_out_date)}</td>
								<td>£${parseFloat(b.total_price).toFixed(2)}</td>
								<td><span class="status status-${b.status}">${b.status}</span></td>
								<td>
									<div class="td-actions">
										<button class="btn btn-ghost btn-sm" data-view-booking="${b.id}">View</button>
										${b.status === 'pending'
				? `<button class="btn btn-confirm btn-sm" data-confirm-booking="${b.id}">Confirm</button>`
				: ''}
										${(b.status === 'pending' || b.status === 'confirmed') && new Date(b.check_out_date) >= new Date(new Date().toISOString().slice(0, 10))
				? `<button class="btn btn-cancel" data-cancel-id="${b.id}">Cancel</button>`
				: ''}
									</div>
								</td>
							</tr>
						`).join('')}
					</tbody>
				</table>
			</div>
		`;

		renderPagination(res.pagination);

	} catch (err) {
		container.innerHTML = `<div class="empty-state">Failed to load bookings: ${h(err.message)}</div>`;
	}
}

function renderPagination(pag) {
	const el = document.getElementById('pagination');
	if (!pag || pag.totalPages <= 1) { el.innerHTML = ''; return; }

	const cur = pag.page;
	const total = pag.totalPages;
	const parts = [];

	parts.push(`<button class="pag-btn" data-page="${cur - 1}" ${cur === 1 ? 'disabled' : ''}>‹</button>`);

	for (let i = 1; i <= total; i++) {
		if (i === 1 || i === total || (i >= cur - 1 && i <= cur + 1)) {
			parts.push(`<button class="pag-btn ${i === cur ? 'active' : ''}" data-page="${i}">${i}</button>`);
		} else if (i === cur - 2 || i === cur + 2) {
			parts.push(`<span class="pag-ellipsis">…</span>`);
		}
	}

	parts.push(`<button class="pag-btn" data-page="${cur + 1}" ${cur === total ? 'disabled' : ''}>›</button>`);
	el.innerHTML = parts.join('');
}

async function cancelBooking(id) {
	if (!confirm(`Cancel booking #${id}? This cannot be undone.`)) return;
	try {
		const res = await api.bookings.cancel(id);
		if (!res.success) throw new Error(res.error || 'Could not cancel booking.');
		showToast('Cancelled', [`Booking #${id} has been cancelled.`], 'info');
		loadBookings();
	} catch (err) {
		showToast('Error', [err.message], 'error');
	}
}

/* ============================================================
   Modal
   ============================================================ */
function openModal(title, bodyHTML) {
	document.getElementById('modal-title').textContent = title;
	document.getElementById('modal-body').innerHTML = bodyHTML;
	document.getElementById('modal-overlay').classList.remove('hidden');
	document.body.style.overflow = 'hidden';
}

function closeModal() {
	document.getElementById('modal-overlay').classList.add('hidden');
	document.body.style.overflow = '';
}

/* ============================================================
   Rooms Management
   ============================================================ */
async function loadRoomsManagement(page) {
	if (page !== undefined) state.roomsMgmtPage = page;
	const container = document.getElementById('rooms-mgmt-container');
	container.innerHTML = `<div class="loading-state"><div class="spinner"></div><span>Loading…</span></div>`;

	const rmfType = document.getElementById('rmf-type')?.value;
	const rmfAvail = document.getElementById('rmf-available')?.value;
	const rmfMin = document.getElementById('rmf-min-price')?.value;
	const rmfMax = document.getElementById('rmf-max-price')?.value;

	try {
		const res = await api.rooms.getAll({
			page: state.roomsMgmtPage,
			limit: 10,
			room_type: rmfType || undefined,
			is_available: rmfAvail || undefined,
			min_price: rmfMin || undefined,
			max_price: rmfMax || undefined,
		});
		if (!res.success) throw new Error(res.error);
		const rooms = res.data || [];
		if (rooms.length === 0) {
			container.innerHTML = `<div class="empty-state">No rooms yet. Add one above.</div>`;
			return;
		}
		container.innerHTML = `
			<div class="table-wrap">
				<table>
					<thead>
						<tr>
							<th>Room</th>
							<th>Type</th>
							<th>Price / Night</th>
							<th>Available</th>
							<th>Description</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						${rooms.map(r => `
							<tr>
								<td><span class="td-id">${h(r.room_number)}</span></td>
								<td>${h(r.room_type)}</td>
								<td>£${parseFloat(r.price_per_night).toFixed(2)}</td>
								<td>
									<span class="badge ${r.is_available ? 'badge--avail' : 'badge--unavail'}">
										${r.is_available ? 'Yes' : 'No'}
									</span>
								</td>
								<td class="td-desc">${h(r.description || '—')}</td>
								<td>
									<div class="td-actions">
										<button class="btn btn-ghost btn-sm" data-edit-room="${r.id}">Edit</button>
										<button class="btn btn-cancel" data-delete-room="${r.id}">Delete</button>
									</div>
								</td>
							</tr>
						`).join('')}
					</tbody>
				</table>
			</div>
		`;
		renderRoomsMgmtPagination(res.pagination);
	} catch (err) {
		container.innerHTML = `<div class="empty-state">Failed to load rooms: ${h(err.message)}</div>`;
		document.getElementById('rooms-mgmt-pagination').innerHTML = '';
	}
}

function buildInlinePagination(pag, attr) {
	if (!pag || pag.totalPages <= 1) return '';
	const cur = pag.page, total = pag.totalPages;
	const parts = [];
	parts.push(`<button class="pag-btn" ${attr}="${cur - 1}" ${cur === 1 ? 'disabled' : ''}>‹</button>`);
	for (let i = 1; i <= total; i++) {
		if (i === 1 || i === total || (i >= cur - 1 && i <= cur + 1)) {
			parts.push(`<button class="pag-btn ${i === cur ? 'active' : ''}" ${attr}="${i}">${i}</button>`);
		} else if (i === cur - 2 || i === cur + 2) {
			parts.push(`<span class="pag-ellipsis">…</span>`);
		}
	}
	parts.push(`<button class="pag-btn" ${attr}="${cur + 1}" ${cur === total ? 'disabled' : ''}>›</button>`);
	return `<div class="pagination" style="margin-top:1rem">${parts.join('')}</div>`;
}

function renderRoomsMgmtPagination(pag) {
	const el = document.getElementById('rooms-mgmt-pagination');
	if (!pag || pag.totalPages <= 1) { el.innerHTML = ''; return; }
	const cur = pag.page, total = pag.totalPages;
	const parts = [];
	parts.push(`<button class="pag-btn" data-rooms-mgmt-page="${cur - 1}" ${cur === 1 ? 'disabled' : ''}>‹</button>`);
	for (let i = 1; i <= total; i++) {
		if (i === 1 || i === total || (i >= cur - 1 && i <= cur + 1)) {
			parts.push(`<button class="pag-btn ${i === cur ? 'active' : ''}" data-rooms-mgmt-page="${i}">${i}</button>`);
		} else if (i === cur - 2 || i === cur + 2) {
			parts.push(`<span class="pag-ellipsis">…</span>`);
		}
	}
	parts.push(`<button class="pag-btn" data-rooms-mgmt-page="${cur + 1}" ${cur === total ? 'disabled' : ''}>›</button>`);
	el.innerHTML = parts.join('');
}

function buildRoomFormHTML(room = null) {
	const types = ['single', 'double', 'suite', 'deluxe'];
	return `
		<form id="room-form">
			<div class="field-row">
				<div class="field">
					<label class="label">Room Number</label>
					<input class="input" type="text" id="rf-num" value="${room ? h(room.room_number) : ''}" placeholder="101">
				</div>
				<div class="field">
					<label class="label">Type</label>
					<select class="input" id="rf-type">
						${types.map(t => `<option value="${t}" ${room?.room_type === t ? 'selected' : ''}>${t[0].toUpperCase() + t.slice(1)}</option>`).join('')}
					</select>
				</div>
			</div>
			<div class="field-row">
				<div class="field">
					<label class="label">Price per Night (£)</label>
					<input class="input" type="number" id="rf-price" value="${room ? room.price_per_night : ''}" placeholder="150.00" step="0.01" min="0">
				</div>
				${room ? `
				<div class="field">
					<label class="label">Available</label>
					<select class="input" id="rf-avail">
						<option value="true"  ${room.is_available ? 'selected' : ''}>Yes</option>
						<option value="false" ${!room.is_available ? 'selected' : ''}>No</option>
					</select>
				</div>` : ''}
			</div>
			<div class="field">
				<label class="label">Description</label>
				<input class="input" type="text" id="rf-desc" value="${room ? h(room.description || '') : ''}" placeholder="Optional">
			</div>
			<button type="submit" class="btn btn-gold btn-full" style="margin-top:0.75rem">
				<span id="rf-btn-text">${room ? 'Save Changes' : 'Create Room'}</span>
			</button>
		</form>
	`;
}

function openRoomCreate() {
	openModal('Add Room', buildRoomFormHTML());
	document.getElementById('room-form').addEventListener('submit', async (e) => {
		e.preventDefault();
		const btnText = document.getElementById('rf-btn-text');
		e.submitter.disabled = true;
		btnText.textContent = 'Saving…';

		const data = {
			room_number: val('rf-num') || undefined,
			room_type: val('rf-type') || undefined,
			price_per_night: parseFloat(document.getElementById('rf-price').value) || undefined,
			description: val('rf-desc') || undefined,
		};

		const res = await api.rooms.create(data);
		if (!res.success) {
			const msgs = res.errors?.length ? res.errors : [res.error || 'Failed.'];
			showToast('Room', msgs, 'error');
			e.submitter.disabled = false;
			btnText.textContent = 'Create Room';
			return;
		}
		showToast('Created', [`Room ${res.data.room_number} created.`], 'success');
		closeModal();
		loadRoomsManagement();
	});
}

async function openRoomEdit(id) {
	openModal('Edit Room', `<div class="loading-state"><div class="spinner"></div><span>Loading…</span></div>`);
	const res = await api.rooms.getById(id);
	if (!res.success) {
		document.getElementById('modal-body').innerHTML = `<div class="empty-state">${h(res.error)}</div>`;
		return;
	}
	document.getElementById('modal-body').innerHTML = buildRoomFormHTML(res.data);
	document.getElementById('room-form').addEventListener('submit', async (e) => {
		e.preventDefault();
		const btnText = document.getElementById('rf-btn-text');
		e.submitter.disabled = true;
		btnText.textContent = 'Saving…';

		const data = {
			room_number: val('rf-num') || undefined,
			room_type: val('rf-type') || undefined,
			price_per_night: parseFloat(document.getElementById('rf-price').value) || undefined,
			description: val('rf-desc') || undefined,
			is_available: document.getElementById('rf-avail')?.value === 'true',
		};

		const pRes = await api.rooms.update(id, data);
		if (!pRes.success) {
			const msgs = pRes.errors?.length ? pRes.errors : [pRes.error || 'Failed.'];
			showToast('Room', msgs, 'error');
			e.submitter.disabled = false;
			btnText.textContent = 'Save Changes';
			return;
		}
		showToast('Saved', [`Room ${pRes.data.room_number} updated.`], 'success');
		closeModal();
		loadRoomsManagement();
	});
}

async function deleteRoom(id) {
	if (!confirm(`Delete room #${id}? This cannot be undone.`)) return;
	const res = await api.rooms.delete(id);
	if (!res.success) {
		showToast('Error', [res.error || 'Could not delete room.'], 'error');
		return;
	}
	const msg = res.deleted
		? 'Room permanently deleted.'
		: 'Room has booking history — marked inactive instead of deleted.';
	showToast('Done', [msg], 'info');
	loadRoomsManagement();
}

/* ============================================================
   Guests Management
   ============================================================ */
async function loadGuests(page = 1) {
	state.guestsPage = page;
	const container = document.getElementById('guests-container');
	container.innerHTML = `<div class="loading-state"><div class="spinner"></div><span>Loading…</span></div>`;
	try {
		const res = await api.guests.getAll({ page, limit: 10 });
		if (!res.success) throw new Error(res.error);
		const guests = res.data || [];
		if (guests.length === 0) {
			container.innerHTML = `<div class="empty-state">No guests found.</div>`;
			document.getElementById('guests-pagination').innerHTML = '';
			return;
		}
		container.innerHTML = `
			<div class="table-wrap">
				<table>
					<thead>
						<tr>
							<th>#</th>
							<th>Name</th>
							<th>Email</th>
							<th>Phone</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						${guests.map(g => `
							<tr>
								<td><span class="td-id">${g.id}</span></td>
								<td>${h(g.first_name)} ${h(g.last_name)}</td>
								<td>${h(g.email)}</td>
								<td>${h(g.phone || '—')}</td>
								<td>
									<div class="td-actions">
										<button class="btn btn-ghost btn-sm"
											data-view-guest-bookings="${g.id}"
											data-guest-name="${h(g.first_name + ' ' + g.last_name)}">
											Bookings
										</button>
										<button class="btn btn-ghost btn-sm" data-edit-guest="${g.id}">Edit</button>
									</div>
								</td>
							</tr>
						`).join('')}
					</tbody>
				</table>
			</div>
		`;
		renderGuestsPagination(res.pagination);
	} catch (err) {
		container.innerHTML = `<div class="empty-state">Failed to load guests: ${h(err.message)}</div>`;
	}
}

function renderGuestsPagination(pag) {
	const el = document.getElementById('guests-pagination');
	if (!pag || pag.totalPages <= 1) { el.innerHTML = ''; return; }
	const cur = pag.page, total = pag.totalPages;
	const parts = [];
	parts.push(`<button class="pag-btn" data-guests-page="${cur - 1}" ${cur === 1 ? 'disabled' : ''}>‹</button>`);
	for (let i = 1; i <= total; i++) {
		if (i === 1 || i === total || (i >= cur - 1 && i <= cur + 1)) {
			parts.push(`<button class="pag-btn ${i === cur ? 'active' : ''}" data-guests-page="${i}">${i}</button>`);
		} else if (i === cur - 2 || i === cur + 2) {
			parts.push(`<span class="pag-ellipsis">…</span>`);
		}
	}
	parts.push(`<button class="pag-btn" data-guests-page="${cur + 1}" ${cur === total ? 'disabled' : ''}>›</button>`);
	el.innerHTML = parts.join('');
}

async function openGuestEdit(id) {
	openModal('Edit Guest', `<div class="loading-state"><div class="spinner"></div><span>Loading…</span></div>`);
	const res = await api.guests.getById(id);
	if (!res.success) {
		document.getElementById('modal-body').innerHTML = `<div class="empty-state">${h(res.error)}</div>`;
		return;
	}
	const g = res.data;
	document.getElementById('modal-body').innerHTML = `
		<form id="guest-edit-form">
			<div class="field-row">
				<div class="field">
					<label class="label">First Name</label>
					<input class="input" type="text" id="gef-first" value="${h(g.first_name)}">
				</div>
				<div class="field">
					<label class="label">Last Name</label>
					<input class="input" type="text" id="gef-last" value="${h(g.last_name)}">
				</div>
			</div>
			<div class="field">
				<label class="label">Email</label>
				<input class="input" type="email" id="gef-email" value="${h(g.email)}">
			</div>
			<div class="field">
				<label class="label">Phone</label>
				<input class="input" type="tel" id="gef-phone" value="${h(g.phone || '')}">
			</div>
			<button type="submit" class="btn btn-gold btn-full" style="margin-top:0.75rem">
				<span id="gef-btn-text">Save Changes</span>
			</button>
		</form>
	`;
	document.getElementById('guest-edit-form').addEventListener('submit', async (e) => {
		e.preventDefault();
		const btnText = document.getElementById('gef-btn-text');
		e.submitter.disabled = true;
		btnText.textContent = 'Saving…';

		const data = {
			first_name: val('gef-first') || undefined,
			last_name: val('gef-last') || undefined,
			email: val('gef-email') || undefined,
			phone: val('gef-phone') || undefined,
		};

		const pRes = await api.guests.update(id, data);
		if (!pRes.success) {
			const msgs = pRes.errors?.length ? pRes.errors : [pRes.error || 'Failed.'];
			showToast('Guest', msgs, 'error');
			e.submitter.disabled = false;
			btnText.textContent = 'Save Changes';
			return;
		}
		showToast('Saved', [`${pRes.data.first_name} ${pRes.data.last_name} updated.`], 'success');
		closeModal();
		loadGuests(state.guestsPage);
	});
}

async function viewGuestBookings(guestId, guestName, page = 1) {
	state.guestBkId = guestId;
	state.guestBkName = guestName;
	state.guestBkPage = page;

	const bodyHtml = `<div class="loading-state"><div class="spinner"></div><span>Loading…</span></div>`;
	if (page === 1) openModal(`Bookings — ${guestName}`, bodyHtml);
	else document.getElementById('modal-body').innerHTML = bodyHtml;

	const res = await api.bookings.getByGuest(guestId, { page, limit: 10 });
	if (!res.success) {
		document.getElementById('modal-body').innerHTML = `<div class="empty-state">${h(res.error)}</div>`;
		return;
	}
	const bookings = res.data || [];
	if (bookings.length === 0) {
		document.getElementById('modal-body').innerHTML = `<div class="empty-state">No bookings for this guest.</div>`;
		return;
	}

	const pag = res.pagination;
	const pagHTML = buildInlinePagination(pag, 'data-guestbk-page');

	document.getElementById('modal-body').innerHTML = `
		<div class="table-wrap">
			<table>
				<thead>
					<tr><th>#</th><th>Room</th><th>Check-in</th><th>Check-out</th><th>Total</th><th>Status</th></tr>
				</thead>
				<tbody>
					${bookings.map(b => `
						<tr>
							<td><span class="td-id">${b.id}</span></td>
							<td>${h(b.room_number)} <span class="td-type">${h(b.room_type)}</span></td>
							<td>${fmtDate(b.check_in_date)}</td>
							<td>${fmtDate(b.check_out_date)}</td>
							<td>£${parseFloat(b.total_price).toFixed(2)}</td>
							<td><span class="status status-${b.status}">${b.status}</span></td>
						</tr>
					`).join('')}
				</tbody>
			</table>
		</div>
		${pagHTML}
	`;
}

/* ============================================================
   Booking Detail & Confirm
   ============================================================ */
async function viewBooking(id) {
	openModal(`Booking #${id}`, `<div class="loading-state"><div class="spinner"></div><span>Loading…</span></div>`);
	const res = await api.bookings.getById(id);
	if (!res.success) {
		document.getElementById('modal-body').innerHTML = `<div class="empty-state">${h(res.error)}</div>`;
		return;
	}
	const b = res.data;
	const weatherLine = b.weather_data?.daily
		? `${b.weather_data.daily.temperature_2m_max?.[0]}° high / ${b.weather_data.daily.temperature_2m_min?.[0]}° low, ${b.weather_data.daily.precipitation_sum?.[0]}mm rain`
		: 'Not recorded';

	document.getElementById('modal-body').innerHTML = `
		<div class="detail-grid">
			<div class="detail-row">
				<span class="detail-label">Guest</span>
				<span class="detail-value">${h(b.first_name)} ${h(b.last_name)}</span>
			</div>
			<div class="detail-row">
				<span class="detail-label">Email</span>
				<span class="detail-value">${h(b.email)}</span>
			</div>
			<div class="detail-row">
				<span class="detail-label">Room</span>
				<span class="detail-value">${h(b.room_number)} (${h(b.room_type)})</span>
			</div>
			<div class="detail-row">
				<span class="detail-label">Rate</span>
				<span class="detail-value">£${parseFloat(b.price_per_night).toFixed(2)} / night</span>
			</div>
			<div class="detail-row">
				<span class="detail-label">Check-in</span>
				<span class="detail-value">${fmtDate(b.check_in_date)}</span>
			</div>
			<div class="detail-row">
				<span class="detail-label">Check-out</span>
				<span class="detail-value">${fmtDate(b.check_out_date)}</span>
			</div>
			<div class="detail-row">
				<span class="detail-label">Total</span>
				<span class="detail-value detail-value--gold">£${parseFloat(b.total_price).toFixed(2)}</span>
			</div>
			<div class="detail-row">
				<span class="detail-label">Status</span>
				<span class="status status-${b.status}">${b.status}</span>
			</div>
			<div class="detail-row detail-row--full">
				<span class="detail-label">Weather at Check-in</span>
				<span class="detail-value">${weatherLine}</span>
			</div>
		</div>
	`;
}

async function confirmBooking(id) {
	if (!confirm(`Confirm booking #${id}?`)) return;
	const res = await api.bookings.update(id, { status: 'confirmed' });
	if (!res.success) {
		showToast('Error', [res.error || 'Could not confirm booking.'], 'error');
		return;
	}
	showToast('Confirmed', [`Booking #${id} confirmed.`], 'success');
	loadBookings();
}

/* ============================================================
   Helpers
   ============================================================ */
function h(str) {
	if (str == null) return '';
	return String(str)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

function val(id) {
	return (document.getElementById(id)?.value || '').trim();
}

function todayStr() {
	return new Date().toISOString().split('T')[0];
}

function fmtDate(str) {
	if (!str) return '—';
	return new Date(str).toLocaleDateString('en-GB', {
		day: 'numeric', month: 'short', year: 'numeric'
	});
}

function showToast(title, lines, type = 'error') {
	const container = document.getElementById('toast-container');
	const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
	const duration = type === 'success' ? 3500 : type === 'info' ? 3000 : 6000;

	const icons = { error: '!', success: '✓', info: '◆' };

	const bodyHtml = lines.length > 1
		? `<div class="toast-title">${h(title)}</div>
		   <ul class="toast-list">${lines.map(l => `<li>${h(l)}</li>`).join('')}</ul>`
		: `<div class="toast-title">${h(title)}</div>
		   <div style="color:var(--text-muted);font-size:0.8rem;margin-top:0.1rem">${h(lines[0] || '')}</div>`;

	const el = document.createElement('div');
	el.className = `toast toast--${type}`;
	el.id = id;
	el.innerHTML = `
		<div class="toast-icon">${icons[type] || '!'}</div>
		<div class="toast-body">${bodyHtml}</div>
		<button class="toast-close" aria-label="Dismiss">&times;</button>
	`;

	container.appendChild(el);
	requestAnimationFrame(() => el.classList.add('toast--visible'));

	const timer = setTimeout(() => dismissToast(id), duration);
	el.querySelector('.toast-close').addEventListener('click', () => {
		clearTimeout(timer);
		dismissToast(id);
	});
}

function dismissToast(id) {
	const el = document.getElementById(id);
	if (!el) return;
	el.classList.remove('toast--visible');
	el.classList.add('toast--hiding');
	setTimeout(() => el.remove(), 280);
}

/* ============================================================
   Init & Event Listeners
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {

	/* --- Navigation --- */
	document.getElementById('main-nav').addEventListener('click', (e) => {
		const btn = e.target.closest('.nav-btn[data-section]');
		if (btn) switchSection(btn.dataset.section);
	});

	/* --- Dashboard --- */
	document.getElementById('filter-type').addEventListener('change', loadRooms);
	document.getElementById('filter-min-price').addEventListener('change', loadRooms);
	document.getElementById('filter-max-price').addEventListener('change', loadRooms);
	document.getElementById('refresh-rooms').addEventListener('click', loadRooms);

	/* --- Guest mode toggle --- */
	document.querySelector('.toggle-group').addEventListener('click', (e) => {
		const btn = e.target.closest('.toggle-btn[data-mode]');
		if (btn) setGuestMode(btn.dataset.mode);
	});

	/* --- Guest search --- */
	document.getElementById('guest-search').addEventListener('input', (e) => {
		searchGuests(e.target.value);
	});

	document.getElementById('guest-results').addEventListener('click', (e) => {
		const item = e.target.closest('[data-guest-id]');
		if (!item) return;
		selectGuest(
			Number(item.dataset.guestId),
			item.dataset.guestName,
			item.dataset.guestEmail
		);
	});

	document.getElementById('selected-guest').addEventListener('click', (e) => {
		if (e.target.closest('[data-clear-guest]')) clearSelectedGuest();
	});

	/* --- Price preview triggers --- */
	document.getElementById('room-select').addEventListener('change', updatePricePreview);

	document.getElementById('check_in_date').addEventListener('change', (e) => {
		document.getElementById('check_out_date').min = e.target.value;
		updatePricePreview();
	});

	document.getElementById('check_out_date').addEventListener('change', updatePricePreview);

	/* --- Booking submit --- */
	document.getElementById('submit-booking').addEventListener('click', handleSubmitBooking);

	/* --- Status filter pills --- */
	document.getElementById('status-filters').addEventListener('click', (e) => {
		const pill = e.target.closest('.pill[data-status]');
		if (!pill) return;
		document.querySelectorAll('#status-filters .pill').forEach(p => p.classList.remove('active'));
		pill.classList.add('active');
		state.bookingsStatus = pill.dataset.status;
		loadBookings(1);
	});

	document.getElementById('refresh-bookings').addEventListener('click', () => loadBookings(1));

	/* --- Bookings table: view / confirm / cancel --- */
	document.getElementById('bookings-container').addEventListener('click', (e) => {
		const btn = e.target.closest('[data-cancel-id], [data-view-booking], [data-confirm-booking]');
		if (!btn) return;
		if (btn.dataset.cancelId) cancelBooking(Number(btn.dataset.cancelId));
		if (btn.dataset.viewBooking) viewBooking(Number(btn.dataset.viewBooking));
		if (btn.dataset.confirmBooking) confirmBooking(Number(btn.dataset.confirmBooking));
	});

	document.getElementById('pagination').addEventListener('click', (e) => {
		const btn = e.target.closest('.pag-btn[data-page]:not([disabled])');
		if (btn) loadBookings(Number(btn.dataset.page));
	});

	/* --- Rooms management --- */
	document.getElementById('add-room-btn').addEventListener('click', openRoomCreate);
	document.getElementById('refresh-rooms-mgmt').addEventListener('click', () => loadRoomsManagement(1));

	['rmf-type', 'rmf-available', 'rmf-min-price', 'rmf-max-price'].forEach(id => {
		document.getElementById(id).addEventListener('change', () => loadRoomsManagement(1));
	});

	document.getElementById('rooms-mgmt-pagination').addEventListener('click', (e) => {
		const btn = e.target.closest('.pag-btn[data-rooms-mgmt-page]:not([disabled])');
		if (btn) loadRoomsManagement(Number(btn.dataset.roomsMgmtPage));
	});

	document.getElementById('rooms-mgmt-container').addEventListener('click', (e) => {
		const btn = e.target.closest('[data-edit-room], [data-delete-room]');
		if (!btn) return;
		if (btn.dataset.editRoom) openRoomEdit(Number(btn.dataset.editRoom));
		if (btn.dataset.deleteRoom) deleteRoom(Number(btn.dataset.deleteRoom));
	});

	/* --- Guests management --- */
	document.getElementById('refresh-guests-btn').addEventListener('click', () => loadGuests(1));

	document.getElementById('guests-container').addEventListener('click', (e) => {
		const btn = e.target.closest('[data-edit-guest], [data-view-guest-bookings]');
		if (!btn) return;
		if (btn.dataset.editGuest)
			openGuestEdit(Number(btn.dataset.editGuest));
		if (btn.dataset.viewGuestBookings)
			viewGuestBookings(Number(btn.dataset.viewGuestBookings), btn.dataset.guestName);
	});

	document.getElementById('guests-pagination').addEventListener('click', (e) => {
		const btn = e.target.closest('.pag-btn[data-guests-page]:not([disabled])');
		if (btn) loadGuests(Number(btn.dataset.guestsPage));
	});

	/* --- Modal body: guest bookings pagination --- */
	document.getElementById('modal-body').addEventListener('click', (e) => {
		const btn = e.target.closest('.pag-btn[data-guestbk-page]:not([disabled])');
		if (btn) viewGuestBookings(state.guestBkId, state.guestBkName, Number(btn.dataset.guestbkPage));
	});

	/* --- Modal close --- */
	document.getElementById('modal-close').addEventListener('click', closeModal);
	document.getElementById('modal-overlay').addEventListener('click', (e) => {
		if (e.target === e.currentTarget) closeModal();
	});
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape') closeModal();
	});

	/* --- Boot --- */
	initDashboard();
});
