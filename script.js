/* ============================================
   Акт приема-передачи — Script
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

    // ── Date Setup ──────────────────────────────
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const monthsGenitive = [
        'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];

    function setDates() {
        // Header date: yesterday
        setText('docDay', yesterday.getDate());
        setText('docMonth', monthsGenitive[yesterday.getMonth()]);
        document.getElementById('docYear').textContent = yesterday.getFullYear();

        // Surrender date: yesterday
        setText('sigSurrDay', yesterday.getDate());
        setText('sigSurrMonth', monthsGenitive[yesterday.getMonth()]);
        document.getElementById('sigSurrYear').textContent = yesterday.getFullYear();

        // Accept date: today
        setText('sigAccDay', today.getDate());
        setText('sigAccMonth', monthsGenitive[today.getMonth()]);
        document.getElementById('sigAccYear').textContent = today.getFullYear();
    }

    // ── Helper: Set text content ────────────────
    function setText(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    // ── Number Formatting (thousand separator) ──
    function formatNumber(n) {
        return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }

    // ── Parse Amount (rubles.kopecks) ───────────
    function parseAmount(str) {
        if (!str || str.trim() === '') return { rubles: 0, kopecks: 0 };
        const cleaned = str.replace(',', '.').replace(/\s/g, '');
        const parts = cleaned.split('.');
        const rubles = parseInt(parts[0]) || 0;
        let kopecks = 0;
        if (parts[1]) {
            const kopStr = parts[1].padEnd(2, '0').substring(0, 2);
            kopecks = parseInt(kopStr) || 0;
        }
        return { rubles, kopecks };
    }

    // ── Number To Words (Russian) ───────────────
    function numberToWordsRu(amount) {
        const units   = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
        const unitsF  = ['', 'одна', 'две', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
        const teens   = ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать',
                         'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'];
        const tens    = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят',
                         'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];
        const hundreds = ['', 'сто', 'двести', 'триста', 'четыреста',
                          'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'];

        function declension(n, forms) {
            // forms: [1, 2-4, 5-20+]
            const abs = Math.abs(n) % 100;
            const last = abs % 10;
            if (abs > 10 && abs < 20) return forms[2];
            if (last === 1) return forms[0];
            if (last >= 2 && last <= 4) return forms[1];
            return forms[2];
        }

        function convertGroup(n, feminine) {
            if (n === 0) return '';
            const h = Math.floor(n / 100);
            const remainder = n % 100;
            const t = Math.floor(remainder / 10);
            const u = remainder % 10;
            const parts = [];
            if (h > 0) parts.push(hundreds[h]);
            if (t === 1) {
                parts.push(teens[u]);
            } else {
                if (t > 1) parts.push(tens[t]);
                if (u > 0) parts.push(feminine ? unitsF[u] : units[u]);
            }
            return parts.join(' ');
        }

        const { rubles, kopecks } = parseAmount(amount.toString());

        if (rubles === 0) {
            const kopStr = kopecks.toString().padStart(2, '0');
            return 'Ноль рублей ' + kopStr + ' ' + declension(kopecks, ['копейка', 'копейки', 'копеек']);
        }

        const scaleNames = [
            null, // ones — no scale word
            ['тысяча', 'тысячи', 'тысяч'],
            ['миллион', 'миллиона', 'миллионов'],
            ['миллиард', 'миллиарда', 'миллиардов']
        ];
        const scaleFeminine = [false, true, false, false];

        // Break number into groups of 3 digits
        const groups = [];
        let n = rubles;
        while (n > 0) {
            groups.push(n % 1000);
            n = Math.floor(n / 1000);
        }

        const resultParts = [];
        for (let i = groups.length - 1; i >= 0; i--) {
            const g = groups[i];
            if (g === 0) continue;
            const groupStr = convertGroup(g, scaleFeminine[i] || false);
            if (groupStr) resultParts.push(groupStr);
            if (i > 0 && scaleNames[i]) {
                resultParts.push(declension(g, scaleNames[i]));
            }
        }

        let text = resultParts.join(' ');
        text += ' ' + declension(rubles, ['рубль', 'рубля', 'рублей']);
        const kopStr = kopecks.toString().padStart(2, '0');
        text += ' ' + kopStr + ' ' + declension(kopecks, ['копейка', 'копейки', 'копеек']);

        // Capitalize first letter
        return text.charAt(0).toUpperCase() + text.slice(1);
    }

    // ── Update Document from Form ───────────────
    function updateDocument() {
        // --- Section 1: Cash ---
        const cashVal = document.getElementById('cashInput').value;
        const cash = parseAmount(cashVal);
        const cashRubStr = cash.rubles > 0 ? formatNumber(cash.rubles) : '';
        const cashKopStr = cash.rubles > 0 || cash.kopecks > 0 ? cash.kopecks.toString().padStart(2, '0') : '';

        // 3 identical placements
        ['cashRub1', 'cashRub2', 'cashRub3'].forEach(id => setText(id, cashRubStr));
        ['cashKop1', 'cashKop2', 'cashKop3'].forEach(id => setText(id, cashKopStr));

        // Words (3 identical)
        const cashWordsStr = (cash.rubles > 0 || cash.kopecks > 0) ? numberToWordsRu(cashVal) : '';
        ['cashWords1', 'cashWords2', 'cashWords3'].forEach(id => setText(id, cashWordsStr));

        // --- Section 2: Precious metals ---
        const pQty = document.getElementById('preciousQty').value;
        const pSum = parseAmount(document.getElementById('preciousSum').value);

        setText('s2Qty', pQty || '');
        setText('s2Rub', pSum.rubles > 0 ? formatNumber(pSum.rubles) : '');
        setText('s2Kop', pSum.rubles > 0 || pSum.kopecks > 0 ? pSum.kopecks.toString().padStart(2, '0') : '');

        // --- Section 3: Other (Apparatura + Textile) ---
        const aQty = parseInt(document.getElementById('apparaturaQty').value) || 0;
        const tQty = parseInt(document.getElementById('textileQty').value) || 0;
        const aSum = parseAmount(document.getElementById('apparaturaSum').value);
        const tSum = parseAmount(document.getElementById('textileSum').value);

        const totalOtherQty = aQty + tQty;
        const totalOtherSumKop = (aSum.rubles * 100 + aSum.kopecks) + (tSum.rubles * 100 + tSum.kopecks);
        const totalOtherRub = Math.floor(totalOtherSumKop / 100);
        const totalOtherKop = totalOtherSumKop % 100;

        setText('s3Qty', totalOtherQty > 0 ? totalOtherQty : '');
        setText('s3Rub', totalOtherRub > 0 ? formatNumber(totalOtherRub) : '');
        setText('s3Kop', totalOtherRub > 0 || totalOtherKop > 0 ? totalOtherKop.toString().padStart(2, '0') : '');

        // --- Section 6: Showcase ---
        updateShowcaseRow('vitDragQty', 'vitDragSum', 'v6dQty', 'v6dRub', 'v6dKop');
        updateShowcaseRow('vitFurQty',  'vitFurSum',  'v6fQty', 'v6fRub', 'v6fKop');
        updateShowcaseRow('vitTechQty', 'vitTechSum', 'v6tQty', 'v6tRub', 'v6tKop');
        updateShowcaseRow('vitOtherQty','vitOtherSum','v6oQty', 'v6oRub', 'v6oKop');

        // --- Signatures ---
        setText('sigSurrName', document.getElementById('surrSelect').value);
        setText('sigAccName', document.getElementById('accSelect').value);

        const sH = document.getElementById('surrH').value;
        const sM = document.getElementById('surrM').value;
        setText('sigSurrH', sH !== '' ? sH : '');
        setText('sigSurrM', sM !== '' ? sM.toString().padStart(2, '0') : '');

        const aH = document.getElementById('accH').value;
        const aM = document.getElementById('accM').value;
        setText('sigAccH', aH !== '' ? aH : '');
        setText('sigAccM', aM !== '' ? aM.toString().padStart(2, '0') : '');
    }

    function updateShowcaseRow(qtyInputId, sumInputId, qtyDocId, rubDocId, kopDocId) {
        const qty = document.getElementById(qtyInputId).value;
        const sum = parseAmount(document.getElementById(sumInputId).value);
        setText(qtyDocId, qty || '');
        setText(rubDocId, sum.rubles > 0 ? formatNumber(sum.rubles) : '');
        setText(kopDocId, sum.rubles > 0 || sum.kopecks > 0 ? sum.kopecks.toString().padStart(2, '0') : '');
    }

    // ── Bind All Inputs ─────────────────────────
    const allInputs = document.querySelectorAll('.panel .form-input');
    allInputs.forEach(input => {
        input.addEventListener('input', updateDocument);
        input.addEventListener('change', updateDocument);
    });

    // ── Print Button ────────────────────────────
    document.getElementById('btnPrint').addEventListener('click', () => {
        window.print();
    });

    // ── Initialize ──────────────────────────────
    setDates();
    updateDocument();

});
