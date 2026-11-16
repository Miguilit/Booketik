export const starterVenue = {
    id: 'demo-venue-1', name: 'Salle de démonstration', address: 'Bruxelles',
    manager: 'Gestionnaire de salle', visibility: 'private', verification: 'draft',
    access: [
        { organizer_id: 'demo-org-1', organizer_name: 'Association culturelle', role: 'use_layout', status: 'granted' },
    ],
};

export const starterPlan = {
    schema: 'booketik.seating.v1', canvas: { width: 1200, height: 780 },
    stage: { label: 'SCÈNE', x: 350, y: 55, width: 500, height: 105 },
    zones: [
        { id: 'vip', label: 'VIP', color: '#DAA942' },
        { id: 'standard', label: 'Standard', color: '#387FC4' },
        { id: 'economy', label: 'Économique', color: '#3A9E78' },
    ],
    seats: Array.from({ length: 7 }, (_, row) =>
        Array.from({ length: 10 }, (_, n) => ({
            id: `${String.fromCharCode(65 + row)}-${String(n + 1).padStart(2, '0')}`,
            row: String.fromCharCode(65 + row), number: String(n + 1),
            x: 180 + n * 93 + (n >= 5 ? 32 : 0), y: 238 + row * 67,
            zone_id: row < 2 ? 'vip' : row < 4 ? 'standard' : 'economy', accessible: row === 6 && (n === 0 || n === 9),
        })),
    ).flat(),
};

export const starterTicket = {
    schema: 'booketik.ticket-design.v1', layout: 'poster', heading: 'Votre billet',
    accent: '#0C5A52', background: '#FFFFFF', foreground: '#13201F',
    show_gate: true, show_seat: true, logo_media_id: null,
};

export const starterTypes = [
    { id: 'type-vip', name: 'VIP', amount: 8000, currency: 'EUR' },
    { id: 'type-std', name: 'Standard', amount: 5000, currency: 'EUR' },
    { id: 'type-eco', name: 'Économique', amount: 2500, currency: 'EUR' },
];

export function generateRows(rowCount, seatsPerRow, zones) {
    const count = Math.max(1, Math.min(30, Number(rowCount) || 1));
    const seats = Math.max(1, Math.min(35, Number(seatsPerRow) || 1));
    const width = Math.max(1200, 160 + seats * 55);
    const height = Math.max(780, 310 + count * 50);
    return {
        schema: 'booketik.seating.v1', canvas: { width, height },
        stage: { label: 'SCÈNE', x: width * .29, y: 40, width: width * .42, height: 95 }, zones,
        seats: Array.from({ length: count }, (_, row) => Array.from({ length: seats }, (_, n) => ({
            id: `${row + 1}-${n + 1}`, row: `R${row + 1}`, number: String(n + 1),
            x: 80 + (n + .5) * ((width - 160) / seats), y: 215 + row * 50,
            zone_id: zones[Math.min(zones.length - 1, Math.floor(row / Math.max(1, count / zones.length)))].id,
            accessible: false,
        }))).flat(),
    };
}

export function planErrors(plan) {
    const errors = [];
    if (plan?.schema !== 'booketik.seating.v1') errors.push('Schéma de plan invalide');
    const w = plan?.canvas?.width, h = plan?.canvas?.height;
    if (!(w >= 200 && w <= 12000 && h >= 200 && h <= 12000)) errors.push('Dimensions de salle invalides');
    if (!plan?.stage || [plan.stage.x, plan.stage.y, plan.stage.width, plan.stage.height].some(v => !Number.isFinite(v))) errors.push('Scène invalide');
    if (!plan?.zones?.length) errors.push('Au moins une zone nécessaire');
    const zones = new Set((plan?.zones || []).map(z => z.id));
    if (zones.size !== plan?.zones?.length) errors.push('Identifiants de zones répétés');
    const ids = new Set();
    for (const seat of plan?.seats || []) {
        if (ids.has(seat.id)) errors.push(`Siège dupliqué : ${seat.id}`);
        ids.add(seat.id);
        if (!zones.has(seat.zone_id)) errors.push(`Zone inconnue : ${seat.id}`);
        if (!Number.isFinite(seat.x) || !Number.isFinite(seat.y) || seat.x < 0 || seat.y < 0 || seat.x > w || seat.y > h) errors.push(`Position invalide : ${seat.id}`);
    }
    return errors.slice(0, 20);
}

export function downloadDraft(filename, data) {
    if (typeof document === 'undefined') return;
    const file = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url; link.download = filename; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function asEuro(minor, currency = 'EUR') {
    return new Intl.NumberFormat('fr-BE', { style: 'currency', currency }).format((Number(minor) || 0) / 100);
}

export function contrast(a, b) {
    const lum = hex => {
        if (!/^#[0-9a-fA-F]{6}$/.test(hex || '')) return 0;
        const c = [1,3,5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
        return c[0] * .2126 + c[1] * .7152 + c[2] * .0722;
    };
    const x = lum(a), y = lum(b);
    return (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
}
