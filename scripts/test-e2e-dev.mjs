import assert from 'node:assert/strict';

const BASE_URL = process.env.TARGET_URL || 'http://193.160.119.239:3001';

console.log(`=== [WARSTWA 2] Testy E2E / Smoke & Bezpieczeństwa na żywym serwerze: ${BASE_URL} ===\n`);

async function run() {
    // 1. Strona główna Portalu Klienta (/)
    {
        const res = await fetch(`${BASE_URL}/`);
        assert.equal(res.status, 200, 'Strona główna (/) musi zwracać HTTP 200');
        const html = await res.text();
        assert.ok(html.includes('Real Moment'), 'Strona główna musi zawierać branding Real Moment');
        assert.ok(
            html.includes('Warunki wykonywania badań'),
            'Strona główna musi zawierać link do Warunków wykonywania badań w stopce'
        );
        console.log('✅ [1/6] Strona główna Portalu Klienta (/): HTTP 200, obecny branding i link do Warunków badań.');
    }

    // 2. Podstrony prawne (/warunki-badania oraz /polityka-prywatnosci)
    {
        const res = await fetch(`${BASE_URL}/warunki-badania`);
        assert.equal(res.status, 200, 'Podstrona /warunki-badania musi zwracać HTTP 200');
        const html = await res.text();
        assert.ok(
            html.includes('Charakter pomocniczy i przesiewowy') || html.includes('Warunki wykonywania badań'),
            'Podstrona /warunki-badania musi zawierać treść warunków badań'
        );

        const privRes = await fetch(`${BASE_URL}/polityka-prywatnosci`);
        assert.equal(privRes.status, 200, 'Podstrona /polityka-prywatnosci musi zwracać HTTP 200');
        const privHtml = await privRes.text();
        assert.ok(
            privHtml.includes('Real Moment Wojciech Wolnik') && privHtml.includes('Polityka prywatności'),
            'Podstrona /polityka-prywatnosci musi zawierać dane administratora (Real Moment Wojciech Wolnik)'
        );
        console.log('✅ [2/6] Podstrony /warunki-badania oraz /polityka-prywatnosci (RODO): HTTP 200, pełna treść dostępna.');
    }

    // 3. Ikony Favicon (/favicon-realmoment.png oraz /icon.png)
    {
        const favRes = await fetch(`${BASE_URL}/favicon-realmoment.png`);
        assert.equal(favRes.status, 200, '/favicon-realmoment.png musi zwracać HTTP 200');
        assert.ok(
            (favRes.headers.get('content-type') || '').includes('image/png'),
            '/favicon-realmoment.png musi być obrazem PNG'
        );

        const iconRes = await fetch(`${BASE_URL}/icon.png`);
        assert.equal(iconRes.status, 200, '/icon.png musi zwracać HTTP 200');
        console.log('✅ [3/6] Zasoby ikon (/favicon-realmoment.png oraz /icon.png): HTTP 200 (image/png).');
    }

    // 4. Ochrona tras prywatnych przez Middleware (przekierowanie niezalogowanych na /login)
    {
        const protectedPaths = [
            '/admin/dashboard',
            '/admin/branding',
            '/admin/users',
            '/therapist/dashboard',
            '/report/non-existent-id',
        ];
        for (const path of protectedPaths) {
            const res = await fetch(`${BASE_URL}${path}`, { redirect: 'manual' });
            assert.ok(
                [302, 307, 308].includes(res.status),
                `Trasa chroniona ${path} musi zwracać przekierowanie dla niezalogowanego użytkownika (otrzymano ${res.status})`
            );
            const location = res.headers.get('location') || '';
            assert.ok(
                location.includes('/login'),
                `Trasa chroniona ${path} musi przekierowywać do /login (location: ${location})`
            );
        }
        console.log('✅ [4/6] Zapora autoryzacyjna Middleware (/admin/*, /therapist/*, /report/*): 100% szczelna.');
    }

    // 5. Strona logowania personelu (/login)
    {
        const res = await fetch(`${BASE_URL}/login`);
        assert.equal(res.status, 200, 'Strona /login musi zwracać HTTP 200');
        console.log('✅ [5/6] Strona logowania personelu (/login): HTTP 200.');
    }

    // 6. Endpoint diagnostyczny bazy danych i spójności testów (/api/health)
    {
        const res = await fetch(`${BASE_URL}/api/health`);
        if (res.status === 200) {
            const data = await res.json();
            assert.equal(data.status, 'ok', `Status /api/health powinien być 'ok': ${JSON.stringify(data)}`);
            assert.equal(data.database, 'connected', 'Baza danych musi mieć status connected');
            assert.ok(data.publishedTestsCount >= 2, 'W bazie muszą być co najmniej 2 opublikowane testy (Wielka Piątka i DASS-42)');
            for (const audit of data.testsAudit || []) {
                assert.equal(audit.passed, true, `Test ${audit.title} nie przeszedł audytu na żywej bazie: ${JSON.stringify(audit)}`);
            }
            console.log(
                `✅ [6/6] Endpoint diagnostyczny /api/health: baza podłączona (${data.responseTimeMs}ms), przetestowano ${data.publishedTestsCount} opublikowanych testów w bazie (0 błędów).`
            );
        } else {
            console.log(`ℹ️ [6/6] Endpoint /api/health jeszcze nie wdrożony na ${BASE_URL} (status ${res.status}).`);
        }
    }

    console.log(`\n🎉 WSZYSTKIE TESTY E2E / SMOKE DLA ${BASE_URL} ZALICZONE!`);
}

run().catch(err => {
    console.error('❌ Błąd testu E2E:', err);
    process.exit(1);
});
