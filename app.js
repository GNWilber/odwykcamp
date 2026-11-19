(() => {
  const {
    camp,
    meetingPoint,
    drivers = [],
    passengers = [],
    pois = [],
    contact,
    infoCards = [],
    directions = [],
    footerText
  } = CAMP_DATA;

  const DEFAULT_ROUTE_COLORS = ['#1d6b44', '#0e7490', '#6d28d9', '#be123c', '#0369a1', '#4d7c0f'];
  const POI_ICONS = {
    station: '🚆',
    shop: '🛒',
    bus: '🚌',
    other: '📍'
  };

  // Bezpieczne escapowanie HTML + automatyczna czcionka GrilledCheese dla "OdwykCamp"
  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function brandify(text, alreadyHtml = false) {
    const safe = alreadyHtml ? String(text ?? '') : escapeHtml(text);
    return safe.replace(/(OdwykCamp)/gi, '<span class="brand-font">$1</span>');
  }

  /* ════════════════ 1. RENDER BANNERU ════════════════ */
  function renderHero() {
    document.title = camp.pageTitle || 'OdwykCamp';
    const heroEl = document.getElementById('hero');

    const tilesHtml = (camp.tiles || [])
      .map(tile => {
        const val = tile.url
          ? `<a href="${escapeHtml(tile.url)}" target="_blank" rel="noopener">${brandify(tile.value)}</a>`
          : brandify(tile.value);
        return `
          <div class="hero-tile">
            <span class="hero-tile-ico">${escapeHtml(tile.icon)}</span>
            <div>
              <span class="hero-tile-label">${escapeHtml(tile.label)}</span>
              <span class="hero-tile-value">${val}</span>
            </div>
          </div>
        `;
      })
      .join('');

    heroEl.innerHTML = `
      <div class="hero-inner">
        <div class="hero-brand-row">
          <img src="favicon.png" alt="Logo OdwykCamp" class="hero-logo">
          <h1>${brandify(camp.bannerTitle)}</h1>
        </div>
        ${camp.subtitle ? `<p class="hero-subtitle">${brandify(camp.subtitle)}</p>` : ''}
        ${camp.description ? `<p class="hero-desc">${brandify(camp.description)}</p>` : ''}
        <div class="hero-tiles">${tilesHtml}</div>
      </div>
    `;
  }

  /* ════════════════ 2. MAPA + TRASY SAMOCHODOWE OSRM ════════════════ */
  const map = L.map('map', { scrollWheelZoom: true }).setView(meetingPoint.coords, 13);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
  }).addTo(map);

  // Rejestr warstw do podświetlania i filtrowania
  const entityLayers = new Map(); // id -> { markers: [], polyline: L.Polyline | null, bounds: L.LatLngBounds, category: string }
  const categoryLayers = {
    meeting: [],
    driver: [],
    passenger: [],
    station: [],
    shop: []
  };

  function createPinIcon(className, html, bgColor = '') {
    const size = className.includes('pin-meeting') ? 42 : className.includes('pin-stop') ? 24 : className.includes('pin-poi') ? 30 : 34;
    const style = bgColor ? `background:${bgColor};` : '';
    return L.divIcon({
      className: '',
      html: `<div class="custom-pin ${className}" style="${style}">${html}</div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2]
    });
  }

  // Pinezka miejsca spotkania
  const meetingMarker = L.marker(meetingPoint.coords, {
    icon: createPinIcon('pin-meeting', '🏕️'),
    zIndexOffset: 500
  })
    .addTo(map)
    .bindPopup(`
      <strong>${brandify(meetingPoint.name)}</strong><br>
      ${escapeHtml(meetingPoint.address)}<br>
      <a href="${escapeHtml(meetingPoint.url)}" target="_blank" rel="noopener">📍 Otwórz w Google Maps</a>
    `);

  categoryLayers.meeting.push(meetingMarker);

  // Punkty POI (stacje, sklepy)
  pois.forEach(poi => {
    const emoji = POI_ICONS[poi.type] || POI_ICONS.other;
    const marker = L.marker(poi.coords, {
      icon: createPinIcon('pin-poi', emoji)
    })
      .addTo(map)
      .bindPopup(`
        <strong>${emoji} ${escapeHtml(poi.name)}</strong> (${escapeHtml(poi.distance)})<br>
        ${poi.note ? `${escapeHtml(poi.note)}<br>` : ''}
        <a href="${escapeHtml(poi.url)}" target="_blank" rel="noopener">📍 Google Maps</a>
      `);

    const catKey = poi.type === 'station' ? 'station' : 'shop';
    categoryLayers[catKey].push(marker);
  });

  // Pobieranie trasy drogowej z darmowego OSRM (z pamięcią podręczną sesji i fallbackiem)
  async function getDrivingRoute(waypoints) {
    const cacheKey = 'odwyk_route_' + waypoints.map(c => c.join(',')).join('|');
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (_) {}
    }

    const coordString = waypoints.map(([lat, lng]) => `${lng},${lat}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('OSRM error');
      const data = await res.json();
      if (!data.routes || !data.routes.length) throw new Error('No route');

      const route = data.routes[0];
      const result = {
        latLngs: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
        distanceKm: Math.round(route.distance / 1000),
        durationMin: Math.round(route.duration / 60),
        isFallback: false
      };
      sessionStorage.setItem(cacheKey, JSON.stringify(result));
      return result;
    } catch (_) {
      return {
        latLngs: waypoints,
        distanceKm: null,
        durationMin: null,
        isFallback: true
      };
    }
  }

  function formatDuration(mins) {
    if (!mins) return '';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h} godz. ${m} min` : `${m} min`;
  }

  async function initParticipantsOnMap() {
    const allPoints = [meetingPoint.coords, ...pois.map(p => p.coords)];

    // 1. Kierowcy + trasy
    for (let i = 0; i < drivers.length; i++) {
      const drv = drivers[i];
      const color = drv.color || DEFAULT_ROUTE_COLORS[i % DEFAULT_ROUTE_COLORS.length];
      const stops = drv.stops || [];
      const waypoints = [drv.fromCoords, ...stops.map(s => s.coords), meetingPoint.coords];
      waypoints.forEach(pt => allPoints.push(pt));

      const markers = [];
      const startMarker = L.marker(drv.fromCoords, {
        icon: createPinIcon('pin-driver', '🚗', color)
      })
        .addTo(map)
        .bindPopup(`
          <strong>🚗 ${escapeHtml(drv.name)}</strong> (${escapeHtml(drv.from)})<br>
          Wolne miejsca: <b>${drv.seatsFree}/${drv.seatsTotal}</b><br>
          ${drv.dates ? `Termin: ${escapeHtml(drv.dates)}<br>` : ''}
          ${drv.googleMapsUrl ? `<a href="${escapeHtml(drv.googleMapsUrl)}" target="_blank" rel="noopener">📍 Google Maps</a>` : ''}
        `);

      markers.push(startMarker);
      categoryLayers.driver.push(startMarker);

      stops.forEach((stop, idx) => {
        const stopMarker = L.marker(stop.coords, {
          icon: createPinIcon('pin-stop', `${idx + 1}`, color)
        })
          .addTo(map)
          .bindPopup(`<strong>Przystanek (${escapeHtml(drv.name)}):</strong><br>${escapeHtml(stop.name)}`);
        markers.push(stopMarker);
        categoryLayers.driver.push(stopMarker);
      });

      const routeInfo = await getDrivingRoute(waypoints);
      const polyline = L.polyline(routeInfo.latLngs, {
        color,
        weight: 4.5,
        opacity: 0.78,
        dashArray: routeInfo.isFallback ? '8, 8' : null
      }).addTo(map);

      const routeSummary = routeInfo.distanceKm
        ? `Trasa: ~${routeInfo.distanceKm} km (${formatDuration(routeInfo.durationMin)})`
        : 'Trasa poglądowa';

      polyline.bindTooltip(`🚗 <b>${escapeHtml(drv.name)}</b> • ${routeSummary}`, { sticky: true });
      categoryLayers.driver.push(polyline);

      const bounds = L.latLngBounds(routeInfo.latLngs);
      entityLayers.set(drv.id, { markers, polyline, bounds, category: 'driver' });

      // Synchronizacja najechania z mapy na tabelę
      const bindHover = target => {
        target.on('mouseover', () => highlightEntity(drv.id));
        target.on('mouseout', () => clearHighlight());
      };
      markers.forEach(bindHover);
      bindHover(polyline);
    }

    // 2. Szukający podwózki
    passengers.forEach(pax => {
      allPoints.push(pax.fromCoords);
      const marker = L.marker(pax.fromCoords, {
        icon: createPinIcon('pin-passenger', '🙋')
      })
        .addTo(map)
        .bindPopup(`
          <strong>🙋 ${escapeHtml(pax.name)}</strong> (szuka podwózki)<br>
          Skąd: ${escapeHtml(pax.from)}<br>
          ${pax.dates ? `Kiedy: ${escapeHtml(pax.dates)}<br>` : ''}
          ${pax.note ? `<em>${escapeHtml(pax.note)}</em><br>` : ''}
          ${pax.googleMapsUrl ? `<a href="${escapeHtml(pax.googleMapsUrl)}" target="_blank" rel="noopener">📍 Google Maps</a>` : ''}
        `);

      categoryLayers.passenger.push(marker);
      const bounds = L.latLngBounds([pax.fromCoords, meetingPoint.coords]);
      entityLayers.set(pax.id, { markers: [marker], polyline: null, bounds, category: 'passenger' });

      marker.on('mouseover', () => highlightEntity(pax.id));
      marker.on('mouseout', () => clearHighlight());
    });

    const fullBounds = L.latLngBounds(allPoints).pad(0.12);
    map.fitBounds(fullBounds);

    document.getElementById('btn-fit-all').addEventListener('click', () => {
      map.fitBounds(fullBounds);
    });

    document.getElementById('btn-fit-camp').addEventListener('click', () => {
      const localPoints = [meetingPoint.coords, ...pois.map(p => p.coords)];
      map.fitBounds(L.latLngBounds(localPoints).pad(0.22));
      meetingMarker.openPopup();
    });
  }

  /* ════════════════ PODŚWIETLANIE TABELA ↔ MAPA ↔ LEGENDA ════════════════ */
  function highlightEntity(activeId) {
    entityLayers.forEach((entry, id) => {
      const isMatch = id === activeId;
      entry.markers.forEach(m => {
        const el = m.getElement()?.querySelector('.custom-pin');
        if (!el) return;
        el.classList.toggle('is-highlighted', isMatch);
        el.classList.toggle('is-dimmed', !isMatch);
      });

      if (entry.polyline) {
        if (isMatch) {
          entry.polyline.setStyle({ weight: 7.5, opacity: 1 });
          entry.polyline.bringToFront();
        } else {
          entry.polyline.setStyle({ weight: 3.5, opacity: 0.22 });
        }
      }
    });

    document.querySelectorAll('.person-row').forEach(row => {
      row.classList.toggle('is-highlighted', row.dataset.id === activeId);
    });
  }

  function clearHighlight() {
    entityLayers.forEach(entry => {
      entry.markers.forEach(m => {
        const el = m.getElement()?.querySelector('.custom-pin');
        if (!el) return;
        el.classList.remove('is-highlighted', 'is-dimmed');
      });
      if (entry.polyline) {
        entry.polyline.setStyle({ weight: 4.5, opacity: 0.78 });
      }
    });

    document.querySelectorAll('.person-row').forEach(row => {
      row.classList.remove('is-highlighted');
    });
  }

  function focusEntityOnMap(id) {
    const entry = entityLayers.get(id);
    if (!entry) return;
    document.getElementById('map').scrollIntoView({ behavior: 'smooth', block: 'center' });
    map.fitBounds(entry.bounds.pad(0.25), { maxZoom: 13 });
    highlightEntity(id);
    if (entry.markers[0]) {
      entry.markers[0].openPopup();
    }
  }

  /* ════════════════ LEGENDA MAPY ════════════════ */
  function renderLegend() {
    const legendEl = document.getElementById('map-legend');
    const items = [
      { key: 'meeting', label: '🏕️ Cel spotkania', color: '#1d4f37' },
      { key: 'driver', label: '🚗 Kierowcy i trasy', color: '#1d6b44' },
      { key: 'passenger', label: '🙋 Szukający podwózki', color: '#b45309' },
      { key: 'station', label: '🚆 Stacje kolejowe', color: '#266748' },
      { key: 'shop', label: '🛒 Sklepy i inne', color: '#4b6658' }
    ];

    legendEl.innerHTML = items
      .map(
        item => `
        <button type="button" class="legend-item" data-cat="${item.key}" title="Najedź aby podświetlić, kliknij aby ukryć/pokazać">
          <span class="legend-dot" style="background:${item.color}"></span>
          <span>${item.label}</span>
        </button>
      `
      )
      .join('');

    legendEl.querySelectorAll('.legend-item').forEach(btn => {
      const cat = btn.dataset.cat;

      btn.addEventListener('mouseenter', () => {
        Object.entries(categoryLayers).forEach(([key, layers]) => {
          layers.forEach(layer => {
            if (layer.setStyle) {
              layer.setStyle({ opacity: key === cat ? 1 : 0.18 });
            } else if (layer.getElement) {
              const el = layer.getElement()?.querySelector('.custom-pin');
              if (el) {
                el.classList.toggle('is-highlighted', key === cat);
                el.classList.toggle('is-dimmed', key !== cat);
              }
            }
          });
        });
      });

      btn.addEventListener('mouseleave', () => clearHighlight());

      btn.addEventListener('click', () => {
        const hidden = btn.classList.toggle('is-hidden');
        (categoryLayers[cat] || []).forEach(layer => {
          if (hidden) {
            map.removeLayer(layer);
          } else {
            layer.addTo(map);
          }
        });
      });
    });
  }

  /* ════════════════ 3. TABELA UCZESTNIKÓW ════════════════ */
  function renderPeople() {
    document.getElementById('drivers-count').textContent = drivers.length;
    document.getElementById('passengers-count').textContent = passengers.length;

    const driversList = document.getElementById('drivers-list');
    const passengersList = document.getElementById('passengers-list');

    driversList.innerHTML = `
      <div class="table-head">
        <div>Kierowca</div>
        <div>Skąd jedzie / przystanki</div>
        <div>Miejsca i termin</div>
        <div>Uwagi</div>
        <div style="text-align:right">Mapa</div>
      </div>
      ${drivers
        .map((drv, idx) => {
          const color = drv.color || DEFAULT_ROUTE_COLORS[idx % DEFAULT_ROUTE_COLORS.length];
          const stopsText =
            drv.stops && drv.stops.length
              ? `Przystanki: ${drv.stops.map(s => escapeHtml(s.name)).join(' → ')}`
              : 'Trasa bezpośrednia';
          const seatsClass = drv.seatsFree === 0 ? 'seats-pill seats-full' : 'seats-pill';
          const seatsText =
            drv.seatsFree === 0
              ? `Brak miejsc (0/${drv.seatsTotal})`
              : `Wolne miejsca: ${drv.seatsFree}/${drv.seatsTotal}`;

          return `
            <div class="person-row" data-id="${escapeHtml(drv.id)}">
              <div class="person-cell" data-label="Kierowca">
                <div class="person-name">
                  <span class="route-swatch" style="background:${color}"></span>
                  <span>${escapeHtml(drv.name)}</span>
                </div>
                ${drv.contact ? `<span class="person-contact">${escapeHtml(drv.contact)}</span>` : ''}
              </div>
              <div class="person-cell" data-label="Skąd / Przystanki">
                <strong>${escapeHtml(drv.from)}</strong>
                <span class="stops-list">${stopsText}</span>
              </div>
              <div class="person-cell" data-label="Miejsca i termin">
                <span class="${seatsClass}">${seatsText}</span>
                ${drv.dates ? `<span class="dates-small">📅 ${escapeHtml(drv.dates)}</span>` : ''}
              </div>
              <div class="person-cell" data-label="Uwagi">
                ${escapeHtml(drv.note || '—')}
              </div>
              <div class="row-actions">
                <button type="button" class="btn-mini js-focus-map" data-id="${escapeHtml(drv.id)}">🗺️ Trasa</button>
                ${
                  drv.googleMapsUrl
                    ? `<a class="btn-mini" href="${escapeHtml(drv.googleMapsUrl)}" target="_blank" rel="noopener">📍 G.Maps</a>`
                    : ''
                }
              </div>
            </div>
          `;
        })
        .join('')}
    `;

    passengersList.innerHTML = `
      <div class="table-head">
        <div>Osoba</div>
        <div>Skąd szuka transportu</div>
        <div>Status / Termin</div>
        <div>Uwagi</div>
        <div style="text-align:right">Mapa</div>
      </div>
      ${passengers
        .map(
          pax => `
          <div class="person-row row-passenger" data-id="${escapeHtml(pax.id)}">
            <div class="person-cell" data-label="Osoba">
              <div class="person-name">
                <span class="route-swatch" style="background:#b45309"></span>
                <span>${escapeHtml(pax.name)}</span>
              </div>
              ${pax.contact ? `<span class="person-contact">${escapeHtml(pax.contact)}</span>` : ''}
            </div>
            <div class="person-cell" data-label="Skąd">
              <strong>${escapeHtml(pax.from)}</strong>
            </div>
            <div class="person-cell" data-label="Status i termin">
              <span class="seats-pill seats-need">Szuka podwózki</span>
              ${pax.dates ? `<span class="dates-small">📅 ${escapeHtml(pax.dates)}</span>` : ''}
            </div>
            <div class="person-cell" data-label="Uwagi">
              ${escapeHtml(pax.note || '—')}
            </div>
            <div class="row-actions">
              <button type="button" class="btn-mini js-focus-map" data-id="${escapeHtml(pax.id)}">🗺️ Pokaż</button>
              ${
                pax.googleMapsUrl
                  ? `<a class="btn-mini" href="${escapeHtml(pax.googleMapsUrl)}" target="_blank" rel="noopener">📍 G.Maps</a>`
                  : ''
              }
            </div>
          </div>
        `
        )
        .join('')}
    `;

    document.querySelectorAll('.person-row').forEach(row => {
      const id = row.dataset.id;
      row.addEventListener('mouseenter', () => highlightEntity(id));
      row.addEventListener('mouseleave', () => clearHighlight());
    });

    document.querySelectorAll('.js-focus-map').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        focusEntityOnMap(btn.dataset.id);
      });
    });
  }

  /* ════════════════ 4. KAFELKI KONTAKT + DISCORD ════════════════ */
  function renderCTA() {
    document.getElementById('cta-row').innerHTML = `
      <div class="cta-card cta-host">
        <div class="cta-ico">✉️</div>
        <div>
          <h3>${brandify(contact.hostTitle)}</h3>
          <p>${brandify(contact.hostText)}</p>
        </div>
        <a class="btn-cta" href="mailto:${escapeHtml(contact.hostEmail)}">
          📩 ${escapeHtml(contact.hostButtonLabel)}
        </a>
      </div>

      <div class="cta-card cta-discord">
        <div class="cta-ico">💬</div>
        <div>
          <h3>${brandify(contact.discordTitle)}</h3>
          <p>${brandify(contact.discordText)}</p>
        </div>
        <a class="btn-cta" href="${escapeHtml(contact.discordUrl)}" target="_blank" rel="noopener">
          🚀 ${escapeHtml(contact.discordButtonLabel)}
        </a>
      </div>
    `;
  }

  /* ════════════════ 5. INFORMACJE O MIEJSCU ════════════════ */
  function renderInfo() {
    const infoCardsHtml = infoCards
      .map(
        card => `
        <div class="info-box">
          <h3>${brandify(card.title)}</h3>
          ${card.intro ? `<p>${brandify(card.intro, true)}</p>` : ''}
          ${
            card.bullets && card.bullets.length
              ? `<ul>${card.bullets.map(b => `<li>${brandify(b, true)}</li>`).join('')}</ul>`
              : ''
          }
        </div>
      `
      )
      .join('');

    const poisHtml = pois
      .map(poi => {
        const emoji = POI_ICONS[poi.type] || POI_ICONS.other;
        return `
          <li class="poi-row">
            <div class="poi-left">
              <span class="poi-emoji">${emoji}</span>
              <div>
                <a class="poi-link" href="${escapeHtml(poi.url)}" target="_blank" rel="noopener">${escapeHtml(poi.name)}</a>
                ${poi.badge ? `<span class="poi-badge">${escapeHtml(poi.badge)}</span>` : ''}
                ${poi.note ? `<div class="poi-note">${escapeHtml(poi.note)}</div>` : ''}
              </div>
            </div>
            <span class="dist-pill">${escapeHtml(poi.distance)}</span>
          </li>
        `;
      })
      .join('');

    const dirsHtml = directions
      .map(
        dir => `
        <div class="dir-card">
          <strong>${escapeHtml(dir.title)}</strong>
          <p>${brandify(dir.text)}</p>
        </div>
      `
      )
      .join('');

    document.getElementById('info-section').innerHTML = `
      <div class="section-header">
        <h2><span class="ico">ℹ️</span> Informacje o miejscu i warunkach</h2>
      </div>
      <div class="info-grid">${infoCardsHtml}</div>

      <div class="section-header">
        <h2><span class="ico">🚉</span> Stacje kolejowe i sklepy w pobliżu</h2>
      </div>
      <ul class="poi-list">${poisHtml}</ul>

      <div class="section-header">
        <h2><span class="ico">🧭</span> Wskazówki dojazdu</h2>
      </div>
      <div class="directions-grid">${dirsHtml}</div>
    `;

    document.getElementById('footer').innerHTML = brandify(footerText);
  }

  // Start aplikacji
  renderHero();
  renderLegend();
  renderPeople();
  renderCTA();
  renderInfo();
  initParticipantsOnMap();
})();