import dass42Questions from '@/prisma/dass42Questions.json';
import type { ScaleLevel } from '@/components/types';

export const DASS_42_CANONICAL_ID = 'dass-42-pl';

export const DASS_42_OPTIONS = JSON.stringify([
    { id: '0', text: '0 – Nie odnosiło się to do mnie w ogóle', value: 0 },
    { id: '1', text: '1 – Odnosiło się to do mnie w pewnym stopniu lub przez pewien czas', value: 1 },
    { id: '2', text: '2 – Odnosiło się to do mnie w dużym stopniu lub przez długi czas', value: 2 },
    { id: '3', text: '3 – Odnosiło się to do mnie w bardzo dużym stopniu lub przez większość czasu', value: 3 },
]);

export interface Dass42ScaleDef {
    id: 'DASS_D' | 'DASS_A' | 'DASS_S' | 'DASS_TOTAL';
    code: 'D' | 'A' | 'S' | 'TOTAL';
    name: string;
    abbreviation: string;
    maxScore: number;
    description: string;
    levels: ScaleLevel[];
}

export const DASS_42_SCALE_DEFINITIONS: Record<'D' | 'A' | 'S' | 'TOTAL', Dass42ScaleDef> = {
    D: {
        id: 'DASS_D',
        code: 'D',
        name: 'Skala depresji',
        abbreviation: 'D',
        maxScore: 42,
        description:
            'Skala depresji (14 pozycji: 3, 5, 10, 13, 16, 17, 21, 24, 26, 31, 34, 37, 38, 42; zakres 0–42 pkt) bada nasilenie objawów depresyjnych w ciągu ostatniego tygodnia zgodnie z trójczynnikowym modelem Clarka i Watsona oraz ujęciem P.F. i S.H. Lovibondów. Obejmuje: dysforię (obniżony, smutny nastrój), brak nadziei na przyszłość, dewaluowanie siebie i poczucie bezwartościowości, utratę zainteresowań i zaangażowania, anhedonię (niezdolność do odczuwania przyjemności i satysfakcji) oraz apatię/inercję (trudności z zainicjowaniem działania). W polskiej próbie normalizacyjnej (Makara-Studzińska i wsp., 2024; N = 1021) średni wynik wyniósł M = 9,22 pkt (SD = 8,46; kobiety: M = 9,86, mężczyźni: M = 8,21), natomiast w grupie klinicznej pacjentów psychiatrycznych M = 18,22 pkt (SD = 11,17).',
        levels: [
            {
                id: 'dass-d-1',
                name: 'Niski (1.–3. sten)',
                minScore: 0,
                maxScore: 1,
                color: '#4e9054',
                description:
                    'Wynik w skali depresji jest bardzo niski / niski (0–1 pkt). Oznacza całkowity brak lub jedynie śladowe występowanie objawów obniżonego nastroju, anhedonii czy spadku napędu w ostatnim tygodniu. Osoba badana zachowuje zdolność do odczuwania satysfakcji, zainteresowania otoczeniem oraz pozytywnego patrzenia w przyszłość. Odniesienie do polskich norm stenowych (Makara-Studzińska i wsp., 2024, Tabela 4): u kobiet 0–1 pkt odpowiada 3. stenowi; u mężczyzn 0–1 pkt mieści się w dolnej granicy 4. stenu (0–4 pkt).',
            },
            {
                id: 'dass-d-2',
                name: 'Obniżony (4. sten)',
                minScore: 2,
                maxScore: 5,
                color: '#0ea5e9',
                description:
                    'Wynik w skali depresji jest obniżony (2–5 pkt), czyli niższy niż średnia w polskiej populacji ogólnej (M = 9,22 pkt). Wskazuje na dobrą kondycję nastroju oraz brak istotnych klinicznie objawów dysforii, poczucia beznadziejności czy utraty zainteresowań; ewentualne wahania samopoczucia mają charakter przejściowy i sytuacyjny. Odniesienie do polskich norm stenowych (Tabela 4): u kobiet 2–5 pkt = 4. sten; u mężczyzn 0–4 pkt = 4. sten (5 pkt otwiera 5. sten).',
            },
            {
                id: 'dass-d-3',
                name: 'Przeciętny (5.–6. sten)',
                minScore: 6,
                maxScore: 13,
                color: '#314293',
                description:
                    'Wynik w skali depresji mieści się w przedziale przeciętnym (6–13 pkt), odpowiadającym normie populacyjnej w polskiej adaptacji DASS-42. Osoba badana mogła w ostatnim tygodniu doświadczać okresowego spadku energii, chwilowego zniechęcenia, smutku lub trudności z zebraniem się do działania, jednak objawy te nie odbiegają od typowych doświadczeń osób zdrowych. Odniesienie do polskich norm stenowych (Tabela 4): u kobiet 5. sten = 6–9 pkt, 6. sten = 10–14 pkt; u mężczyzn 5. sten = 5–8 pkt, 6. sten = 9–12 pkt (13 pkt u mężczyzn to początek 7. stenu).',
            },
            {
                id: 'dass-d-4',
                name: 'Podwyższony (7. sten)',
                minScore: 14,
                maxScore: 17,
                color: '#f97316',
                description:
                    'Wynik w skali depresji jest podwyższony (14–17 pkt — obszar 7. stenu). Wskazuje na wyraźnie odczuwalne w ostatnim tygodniu obniżenie nastroju, mniejszą zdolność do czerpania radości z codziennych aktywności (anhedonia), poczucie zniechęcenia, samokrytycyzm lub trudności z inicjowaniem działań. Jest to sygnał ostrzegawczy wymagający uważnego omówienia podczas wywiadu i monitorowania dynamiki objawów. Odniesienie do polskich norm stenowych (Tabela 4): u kobiet 7. sten = 15–18 pkt (14 pkt to górna granica 6. stenu); u mężczyzn 7. sten = 13–16 pkt (17 pkt to początek 8. stenu).',
            },
            {
                id: 'dass-d-5',
                name: 'Wysoki (8.–9. sten)',
                minScore: 18,
                maxScore: 25,
                color: '#ef4444',
                description:
                    'Wynik w skali depresji jest wysoki (18–25 pkt — obszar 8.–9. stenu) i osiąga lub przekracza średni poziom obserwowany w polskiej grupie klinicznej pacjentów psychiatrycznych (M = 18,22 pkt). Świadczy o znacznym nasileniu dysforii, utraty zainteresowań, poczucia bezwartościowości, braku nadziei na przyszłość oraz wyraźnym spadku napędu psychoruchowego. Zalecana jest pogłębiona konsultacja psychologiczna lub psychiatryczna. Odniesienie do polskich norm stenowych (Tabela 4): u kobiet 8. sten = 19–22 pkt, 9. sten = 23–26 pkt; u mężczyzn 8. sten = 17–20 pkt, 9. sten = 21–24 pkt (25 pkt u mężczyzn to już 10. sten).',
            },
            {
                id: 'dass-d-6',
                name: 'Bardzo wysoki (10. sten)',
                minScore: 26,
                maxScore: 42,
                color: '#b91c1c',
                description:
                    'Wynik w skali depresji jest bardzo wysoki (26–42 pkt — 10. sten). Wskazuje na głębokie i utrzymujące się przez większość ostatniego tygodnia nasilenie objawów depresyjnych: silne przygnębienie, poczucie bezsensu i bezwartościowości, głęboką anhedonię, brak nadziei oraz zahamowanie aktywności. Wynik ten stanowi pilne wskazanie do specjalistycznej diagnostyki klinicznej (psychiatrycznej/psychoterapeutycznej), ze szczególnym uwzględnieniem oceny pozycji dotyczących poczucia wartości życia (poz. 21, 37, 38). Odniesienie do polskich norm stenowych (Tabela 4): 10. sten obejmuje u kobiet wyniki 27–40+ pkt, a u mężczyzn 25–41+ pkt.',
            },
        ],
    },
    A: {
        id: 'DASS_A',
        code: 'A',
        name: 'Skala lęku',
        abbreviation: 'A',
        maxScore: 42,
        description:
            'Skala lęku (14 pozycji: 2, 4, 7, 9, 15, 19, 20, 23, 25, 28, 30, 36, 40, 41; zakres 0–42 pkt) mierzy nasilenie objawów lękowych w ciągu ostatniego tygodnia. Koncentruje się na czterech komponentach: pobudzeniu układu autonomicznego/wegetatywnego (suchość w ustach, trudności w oddychaniu, nadmierna potliwość bez wysiłku, kołatanie serca, trudności w połykaniu, uczucie omdlewania), napięciu mięśni szkieletowych (drżenie rąk, osłabienie), lęku sytuacyjnym oraz subiektywnym przeżywaniu lęku uogólnionego i obawy przed utratą kontroli (paniką). W polskiej próbie normalizacyjnej (Makara-Studzińska i wsp., 2024; N = 1021) średni wynik wyniósł M = 8,78 pkt (SD = 7,48; kobiety: M = 9,48, mężczyźni: M = 7,68), a w grupie klinicznej M = 17,86 pkt (SD = 10,89).',
        levels: [
            {
                id: 'dass-a-1',
                name: 'Niski (1.–3. sten)',
                minScore: 0,
                maxScore: 1,
                color: '#4e9054',
                description:
                    'Wynik w skali lęku jest bardzo niski / niski (0–1 pkt — 3. sten). Wskazuje na brak wegetatywnych i subiektywnych objawów lęku w ciągu ostatniego tygodnia. Osoba badana zachowuje spokój psychofizyczny i nie zgłasza somatycznych oznak wzmożonego pobudzenia lękowego. Odniesienie do polskich norm stenowych (Makara-Studzińska i wsp., 2024, Tabela 4): u kobiet 0–1 pkt = 3. sten; u mężczyzn 0 pkt = 3. sten (1 pkt wchodzi w 4. sten).',
            },
            {
                id: 'dass-a-2',
                name: 'Obniżony (4. sten)',
                minScore: 2,
                maxScore: 4,
                color: '#0ea5e9',
                description:
                    'Wynik w skali lęku jest obniżony (2–4 pkt — 4. sten), wyraźnie poniżej średniej w polskiej populacji ogólnej (M = 8,78 pkt). Świadczy o niskim poziomie reaktywności lękowej oraz sporadycznym, łagodnym występowaniu doznań somatycznych lub obaw sytuacyjnych. Odniesienie do polskich norm stenowych (Tabela 4): u kobiet 4. sten = 2–5 pkt; u mężczyzn 4. sten = 1–4 pkt.',
            },
            {
                id: 'dass-a-3',
                name: 'Przeciętny (5.–6. sten)',
                minScore: 5,
                maxScore: 12,
                color: '#314293',
                description:
                    'Wynik w skali lęku mieści się w przedziale przeciętnym (5–12 pkt — 5.–6. sten), odpowiadającym normie w polskiej populacji nieklinicznej. Osoba badana mogła w ostatnim tygodniu doświadczać umiarkowanego niepokoju w nowych lub wymagających sytuacjach oraz pojedynczych objawów wegetatywnych (np. suchości w ustach czy szybszego bicia serca), które mieszczą się w granicach typowych reakcji adaptacyjnych. Odniesienie do polskich norm stenowych (Tabela 4): u kobiet 5. sten = 6–9 pkt, 6. sten = 10–13 pkt; u mężczyzn 5. sten = 5–7 pkt, 6. sten = 8–11 pkt (12 pkt u mężczyzn otwiera 7. sten).',
            },
            {
                id: 'dass-a-4',
                name: 'Podwyższony (7. sten)',
                minScore: 13,
                maxScore: 16,
                color: '#f97316',
                description:
                    'Wynik w skali lęku jest podwyższony (13–16 pkt — obszar 7. stenu). Wskazuje na nasilone w ostatnim tygodniu odczuwanie niepokoju, obaw sytuacyjnych oraz wyraźne objawy somatyczne pobudzenia autonomicznego (np. kołatanie serca, trudności z oddechem, drżenie rąk, potliwość). Zalecane jest omówienie źródeł lęku oraz strategii regulacji napięcia psychofizycznego. Odniesienie do polskich norm stenowych (Tabela 4): u kobiet 7. sten = 14–17 pkt (13 pkt to górna granica 6. stenu); u mężczyzn 7. sten = 12–14 pkt (15–16 pkt u mężczyzn wchodzi już w 8. sten).',
            },
            {
                id: 'dass-a-5',
                name: 'Wysoki (8.–9. sten)',
                minScore: 17,
                maxScore: 23,
                color: '#ef4444',
                description:
                    'Wynik w skali lęku jest wysoki (17–23 pkt — obszar 8.–9. stenu) i odpowiada poziomowi obserwowanemu w polskiej grupie klinicznej pacjentów z zaburzeniami psychicznymi (M = 17,86 pkt). Świadczy o silnym pobudzeniu wegetatywnym, częstym doświadczaniu lęku bez wyraźnej przyczyny, obawach przed wpadnięciem w panikę oraz znacznym dyskomforcie somatycznym. Wskazana jest konsultacja psychologiczna lub lekarska. Odniesienie do polskich norm stenowych (Tabela 4): u kobiet 8. sten = 18–21 pkt, 9. sten = 22–24 pkt; u mężczyzn 8. sten = 15–18 pkt, 9. sten = 19–21 pkt (22–23 pkt u mężczyzn to już 10. sten).',
            },
            {
                id: 'dass-a-6',
                name: 'Bardzo wysoki (10. sten)',
                minScore: 24,
                maxScore: 42,
                color: '#b91c1c',
                description:
                    'Wynik w skali lęku jest bardzo wysoki (24–42 pkt — 10. sten). Oznacza bardzo silne, niemal ciągłe nasilenie objawów lękowych i panicznych w ciągu ostatniego tygodnia, z dominującym pobudzeniem wegetatywnym (duszność, przyśpieszona akcja serca, uczucie omdlewania, drżenia mięśniowe) oraz silnym lękiem antycypacyjnym. Stanowi wyraźne wskazanie do pilnej konsultacji specjalistycznej (psychiatrycznej/psychoterapeutycznej). Odniesienie do polskich norm stenowych (Tabela 4): 10. sten obejmuje u kobiet wyniki od 25 pkt wzwyż (24 pkt to górna granica 9. stenu), a u mężczyzn od 22 pkt wzwyż.',
            },
        ],
    },
    S: {
        id: 'DASS_S',
        code: 'S',
        name: 'Skala stresu',
        abbreviation: 'S',
        maxScore: 42,
        description:
            'Skala stresu (14 pozycji: 1, 6, 8, 11, 12, 14, 18, 22, 27, 29, 32, 33, 35, 39; zakres 0–42 pkt) bada nasilenie przewlekłego, niespecyficznego pobudzenia i napięcia nerwowego w ciągu ostatniego tygodnia. Obejmuje: trudności w relaksacji i odprężeniu się, utrzymujące się napięcie nerwowe, pobudliwość i agitację (łatwość wytrącenia z równowagi), drażliwość i nadmierną reaktywność emocjonalną oraz zniecierpliwienie w obliczu przeszkód i opóźnień. W polskiej próbie normalizacyjnej (Makara-Studzińska i wsp., 2024; N = 1021) średni wynik wyniósł M = 15,08 pkt (SD = 9,07; kobiety: M = 15,93, mężczyźni: M = 13,74), a w grupie klinicznej M = 20,94 pkt (SD = 10,85).',
        levels: [
            {
                id: 'dass-s-1',
                name: 'Niski (1.–3. sten)',
                minScore: 0,
                maxScore: 5,
                color: '#4e9054',
                description:
                    'Wynik w skali stresu jest niski (0–5 pkt — 2.–3. sten). Wskazuje na wysoką odporność na codzienne frustracje w ostatnim tygodniu, łatwość wchodzenia w stan odprężenia oraz niską drażliwość i reaktywność nerwową. Odniesienie do polskich norm stenowych (Makara-Studzińska i wsp., 2024, Tabela 4): u kobiet 2. sten = 0–2 pkt, 3. sten = 3–6 pkt; u mężczyzn 2. sten = 0 pkt, 3. sten = 1–4 pkt (5 pkt u mężczyzn otwiera 4. sten).',
            },
            {
                id: 'dass-s-2',
                name: 'Obniżony (4. sten)',
                minScore: 6,
                maxScore: 10,
                color: '#0ea5e9',
                description:
                    'Wynik w skali stresu jest obniżony (6–10 pkt — 4. sten), poniżej średniej w polskiej populacji ogólnej (M = 15,08 pkt). Osoba badana zachowuje dobrą równowagę emocjonalną, potrafi skutecznie redukować napięcie po sytuacjach trudnych i rzadko reaguje zniecierpliwieniem czy rozdrażnieniem. Odniesienie do polskich norm stenowych (Tabela 4): u kobiet 4. sten = 7–11 pkt (6 pkt to górna granica 3. stenu); u mężczyzn 4. sten = 5–9 pkt (10 pkt u mężczyzn otwiera 5. sten).',
            },
            {
                id: 'dass-s-3',
                name: 'Przeciętny (5.–6. sten)',
                minScore: 11,
                maxScore: 19,
                color: '#314293',
                description:
                    'Wynik w skali stresu mieści się w przedziale przeciętnym (11–19 pkt — 5.–6. sten), odpowiadającym normie populacyjnej w Polsce. Wskazuje na typowy dla codziennego funkcjonowania poziom napięcia, okresowe zniecierpliwienie przy opóźnieniach lub przejściowe trudności z natychmiastowym odprężeniem się po intensywnym dniu. Odniesienie do polskich norm stenowych (Tabela 4): u kobiet 5. sten = 12–15 pkt, 6. sten = 16–20 pkt; u mężczyzn 5. sten = 10–13 pkt, 6. sten = 14–18 pkt (19 pkt u mężczyzn otwiera 7. sten).',
            },
            {
                id: 'dass-s-4',
                name: 'Podwyższony (7. sten)',
                minScore: 20,
                maxScore: 23,
                color: '#f97316',
                description:
                    'Wynik w skali stresu jest podwyższony (20–23 pkt — obszar 7. stenu) i zbliża się do średniej obserwowanej w grupie klinicznej (M = 20,94 pkt). Świadczy o utrzymującym się w ostatnim tygodniu wzmożonym napięciu nerwowym, trudnościach z relaksacją, podwyższonej drażliwości oraz niskiej tolerancji na przeszkody i przerwy w działaniu. Warto przyjrzeć się bieżącym obciążeniom środowiskowym i zawodowym oraz metodom regeneracji. Odniesienie do polskich norm stenowych (Tabela 4): u kobiet 7. sten = 21–24 pkt (20 pkt to górna granica 6. stenu); u mężczyzn 7. sten = 19–22 pkt (23 pkt u mężczyzn otwiera 8. sten).',
            },
            {
                id: 'dass-s-5',
                name: 'Wysoki (8.–9. sten)',
                minScore: 24,
                maxScore: 32,
                color: '#ef4444',
                description:
                    'Wynik w skali stresu jest wysoki (24–32 pkt — obszar 8.–9. stenu). Oznacza silne przeciążenie układu nerwowego w ostatnim tygodniu: wyraźną niemożność odprężenia się, stan ciągłego podminowania, nadmierną reaktywność na drobne bodźce, wybuchowość lub wyczerpanie nerwowe. Wskazane jest wsparcie psychologiczne ukierunkowane na redukcję napięcia i pracę ze stresem. Odniesienie do polskich norm stenowych (Tabela 4): u kobiet 8. sten = 25–29 pkt, 9. sten = 30–33 pkt; u mężczyzn 8. sten = 23–27 pkt, 9. sten = 28–31 pkt (32 pkt u mężczyzn to już 10. sten).',
            },
            {
                id: 'dass-s-6',
                name: 'Bardzo wysoki (10. sten)',
                minScore: 33,
                maxScore: 42,
                color: '#b91c1c',
                description:
                    'Wynik w skali stresu jest bardzo wysoki (33–42 pkt — 10. sten). Świadczy o skrajnym nasileniu napięcia nerwowego, agitacji, przewrażliwienia i niemożności uspokojenia się przez większość czasu w ostatnim tygodniu. Tak wysoki poziom przewlekłego pobudzenia istotnie zwiększa ryzyko dekompensacji emocjonalnej i somatycznej — zalecana jest pilna konsultacja specjalistyczna. Odniesienie do polskich norm stenowych (Tabela 4): 10. sten obejmuje u kobiet wyniki od 34 pkt wzwyż (33 pkt to górna granica 9. stenu), a u mężczyzn od 32 pkt wzwyż.',
            },
        ],
    },
    TOTAL: {
        id: 'DASS_TOTAL',
        code: 'TOTAL',
        name: 'Wynik ogólny DASS-42',
        abbreviation: ' W.O.',
        maxScore: 126,
        description:
            'Wynik ogólny DASS-42 (suma wszystkich 42 pozycji; zakres 0–126 pkt) stanowi syntetyczny wskaźnik ogólnego nasilenia negatywnych stanów emocjonalnych (dystresu psychicznego łączącego objawy depresji, lęku i stresu) w okresie ostatniego tygodnia. W polskiej próbie normalizacyjnej (Makara-Studzińska i wsp., 2024; N = 1021, alfa Cronbacha = 0,96) średni wynik ogólny wyniósł M = 33,08 pkt (SD = 22,68; kobiety: M = 35,27, mężczyźni: M = 29,62), natomiast w grupie pacjentów psychiatrycznych M = 57,02 pkt (SD = 30,14).',
        levels: [
            {
                id: 'dass-t-1',
                name: 'Niski (1.–3. sten)',
                minScore: 0,
                maxScore: 10,
                color: '#4e9054',
                description:
                    'Ogólny wskaźnik dystresu emocjonalnego jest niski (0–10 pkt — 2.–3. sten). Świadczy o bardzo dobrym samopoczuciu psychicznym w ciągu ostatniego tygodnia oraz znikomym nasileniu objawów depresyjnych, lękowych i stresowych. Odniesienie do polskich norm stenowych (Makara-Studzińska i wsp., 2024, Tabela 4): u kobiet 2. sten = 0–1 pkt, 3. sten = 2–12 pkt; u mężczyzn 3. sten = 0–7 pkt (8–10 pkt u mężczyzn wchodzi w 4. sten).',
            },
            {
                id: 'dass-t-2',
                name: 'Obniżony (4. sten)',
                minScore: 11,
                maxScore: 20,
                color: '#0ea5e9',
                description:
                    'Wynik ogólny DASS-42 jest obniżony (11–20 pkt — 4. sten), wyraźnie niższy od średniej w populacji osób zdrowych (M = 33,08 pkt). Wskazuje na niskie ogólne obciążenie emocjonalne i skuteczne radzenie sobie z wymaganiami codzienności. Odniesienie do polskich norm stenowych (Tabela 4): u kobiet 4. sten = 13–23 pkt; u mężczyzn 4. sten = 8–18 pkt.',
            },
            {
                id: 'dass-t-3',
                name: 'Przeciętny (5.–6. sten)',
                minScore: 21,
                maxScore: 43,
                color: '#314293',
                description:
                    'Wynik ogólny DASS-42 mieści się w przedziale przeciętnym (21–43 pkt — 5.–6. sten), typowym dla polskiej populacji nieklinicznej. Oznacza umiarkowane, adekwatne do codziennych wyzwań natężenie przeżyć emocjonalnych, przy czym szczegółowej informacji dostarcza rozkład wyników w trzech podskalach (Depresja, Lęk, Stres). Odniesienie do polskich norm stenowych (Tabela 4): u kobiet 5. sten = 24–35 pkt, 6. sten = 36–46 pkt; u mężczyzn 5. sten = 19–29 pkt, 6. sten = 30–40 pkt (41–43 pkt u mężczyzn to początek 7. stenu).',
            },
            {
                id: 'dass-t-4',
                name: 'Podwyższony (7. sten)',
                minScore: 44,
                maxScore: 55,
                color: '#f97316',
                description:
                    'Wynik ogólny DASS-42 jest podwyższony (44–55 pkt — obszar 7. stenu). Sygnalizuje wyraźnie zwiększone w ostatnim tygodniu ogólne obciążenie psychiczne i emocjonalne. Wskazana jest analiza poszczególnych podskal w celu ustalenia, czy w obrazie dominują objawy napięcia stresowego, pobudzenia lękowego czy obniżenia nastroju. Odniesienie do polskich norm stenowych (Tabela 4): u kobiet 7. sten = 47–58 pkt (44–46 pkt to górna granica 6. stenu); u mężczyzn 7. sten = 41–51 pkt (52–55 pkt u mężczyzn wchodzi w 8. sten).',
            },
            {
                id: 'dass-t-5',
                name: 'Wysoki (8.–9. sten)',
                minScore: 56,
                maxScore: 76,
                color: '#ef4444',
                description:
                    'Wynik ogólny DASS-42 jest wysoki (56–76 pkt — obszar 8.–9. stenu) i osiąga lub przekracza średni poziom obserwowany w grupie pacjentów leczonych psychiatrycznie (M = 57,02 pkt). Wskazuje na silny, uogólniony dystres psychiczny istotnie rzutujący na codzienne funkcjonowanie i samopoczucie. Zalecana jest konsultacja psychologiczna lub lekarska. Odniesienie do polskich norm stenowych (Tabela 4): u kobiet 8. sten = 59–69 pkt, 9. sten = 70–79 pkt; u mężczyzn 8. sten = 52–62 pkt, 9. sten = 63–72 pkt (75–76 pkt u mężczyzn to już 10. sten).',
            },
            {
                id: 'dass-t-6',
                name: 'Bardzo wysoki (10. sten)',
                minScore: 77,
                maxScore: 126,
                color: '#b91c1c',
                description:
                    'Wynik ogólny DASS-42 jest bardzo wysoki (77–126 pkt — 10. sten). Świadczy o bardzo głębokim kryzysie emocjonalnym i współwystępowaniu nasilonych objawów depresyjnych, lękowych oraz stresowych przez większość ostatniego tygodnia. Wynik ten stanowi pilne wskazanie do specjalistycznej diagnostyki psychiatrycznej i objęcia osoby badanej wsparciem klinicznym. Odniesienie do polskich norm stenowych (Tabela 4): 10. sten obejmuje u kobiet wyniki 80–119+ pkt, a u mężczyzn 75–115+ pkt.',
            },
        ],
    },
};

export const DASS_42_ALL_SCALE_CODES = ['D', 'A', 'S', 'TOTAL'] as const;

export function buildDass42QuestionScoring(
    scaleCode: 'D' | 'A' | 'S',
    scaleIdPrefix: string = ''
): string {
    const subScaleId = `${scaleIdPrefix}DASS_${scaleCode}`;
    const totalScaleId = `${scaleIdPrefix}DASS_TOTAL`;

    return JSON.stringify({
        '0': [
            { scaleId: subScaleId, points: 0 },
            { scaleId: totalScaleId, points: 0 },
        ],
        '1': [
            { scaleId: subScaleId, points: 1 },
            { scaleId: totalScaleId, points: 1 },
        ],
        '2': [
            { scaleId: subScaleId, points: 2 },
            { scaleId: totalScaleId, points: 2 },
        ],
        '3': [
            { scaleId: subScaleId, points: 3 },
            { scaleId: totalScaleId, points: 3 },
        ],
    });
}

export function getDass42SeedScales(scaleIdPrefix: string = '') {
    return DASS_42_ALL_SCALE_CODES.map(code => {
        const def = DASS_42_SCALE_DEFINITIONS[code];
        return {
            id: `${scaleIdPrefix}${def.id}`,
            name: def.name,
            type: 'standard',
            maxScore: def.maxScore,
            levels: JSON.stringify(def.levels),
            description: def.description,
        };
    });
}

export function getDass42SeedSections(scaleIdPrefix: string = '') {
    const slices = [
        { title: 'Część 1 (Stwierdzenia 1 – 14)', items: dass42Questions.slice(0, 14) },
        { title: 'Część 2 (Stwierdzenia 15 – 28)', items: dass42Questions.slice(14, 28) },
        { title: 'Część 3 (Stwierdzenia 29 – 42)', items: dass42Questions.slice(28, 42) },
    ];

    return slices.map(s => ({
        title: s.title,
        questions: {
            create: s.items.map((q: any) => ({
                text: `${q.num}. ${(q.text || '').trim()}`,
                type: 'multiple-choice',
                isReversed: false,
                options: DASS_42_OPTIONS,
                scoring: buildDass42QuestionScoring(q.scale as 'D' | 'A' | 'S', scaleIdPrefix),
            })),
        },
    }));
}

export function getDass42TestCreateData(scaleIdPrefix: string = '') {
    return {
        title: 'Skala Depresji, Lęku i Stresu (DASS-42)',
        canonicalId: DASS_42_CANONICAL_ID,
        description:
            'Polska adaptacja i normalizacja Skali Depresji, Lęku i Stresu wersja 42 (DASS-42; P.F. Lovibond, S.H. Lovibond; adaptacja: M. Makara-Studzińska, M. Załuski, K. Adamczyk, E. Tyburski, Psychiatr. Pol. 2024; 58(1): 63–78). Kwestionariusz samoopisowy złożony z 42 stwierdzeń mierzących nasilenie objawów depresji, lęku i stresu w okresie ostatniego tygodnia oraz ogólny wskaźnik dystresu emocjonalnego, z odniesieniem do polskich norm stenowych (1–10) dla kobiet i mężczyzn.',
        instructions:
            'Proszę przeczytać każde stwierdzenie i zaznaczyć odpowiedź (0, 1, 2 lub 3), która wskazuje, jak bardzo dane stwierdzenie odnosiło się do Ciebie w okresie ostatniego tygodnia. Nie ma dobrych lub złych odpowiedzi, dlatego nie zastanawiaj się zbyt długo.\n\nCyfry oznaczają:\n0 – Nie odnosiło się to do mnie w ogóle\n1 – Odnosiło się to do mnie w pewnym stopniu lub przez pewien czas\n2 – Odnosiło się to do mnie w dużym stopniu lub przez długi czas\n3 – Odnosiło się to do mnie w bardzo dużym stopniu lub przez większość czasu',
        questionsPerPage: 14,
        status: 'PUBLISHED',
        scales: {
            create: getDass42SeedScales(scaleIdPrefix),
        },
        sections: {
            create: getDass42SeedSections(scaleIdPrefix),
        },
    };
}

let dass42EnsuredInMemory = false;

/**
 * Ensures the Polish DASS-42 test (`dass-42-pl`) exists in PostgreSQL.
 * If missing, creates it automatically as PUBLISHED with all 42 questions, 4 scales (D, A, S, TOTAL), and 6 sten-based thresholds.
 */
export async function ensureDass42TestExists(prisma: any): Promise<any | null> {
    try {
        const existing = await prisma.test.findFirst({
            where: { canonicalId: DASS_42_CANONICAL_ID },
            include: {
                scales: true,
                sections: {
                    include: {
                        questions: true,
                    },
                },
            },
        });

        if (existing) {
            dass42EnsuredInMemory = true;
            return existing;
        }

        // Check if any scale IDs collide
        const collision = await prisma.scale.findUnique({
            where: { id: 'DASS_D' },
            select: { id: true },
        });
        const prefix = collision ? `d42-${Date.now().toString(36).slice(-4)}-` : '';

        const created = await prisma.test.create({
            data: getDass42TestCreateData(prefix),
            include: {
                scales: true,
                sections: {
                    include: {
                        questions: true,
                    },
                },
            },
        });

        dass42EnsuredInMemory = true;
        return created;
    } catch (err) {
        console.error('Non-fatal error ensuring DASS-42 test exists:', err);
        return null;
    }
}

export function isDass42EnsuredInMemory(): boolean {
    return dass42EnsuredInMemory;
}
