import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient()

async function main() {
    // Create Admin
    const admin = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
            email: 'admin@example.com',
            username: 'Admin User',
            password: await bcrypt.hash('admin-password', 10),
            role: 'admin',
        },
    })

    // Create Therapist
    const therapist = await prisma.user.upsert({
        where: { email: 'user@example.com' },
        update: {},
        create: {
            email: 'user@example.com',
            username: 'Therapist User',
            password: await bcrypt.hash('password123', 10),
            role: 'therapist',
        },
    })

    // Create Sample Test
    const sampleTest = await prisma.test.findUnique({ where: { canonicalId: 'demo-personality-test' } }) || await prisma.test.create({
        data: {
            title: 'Test Osobowości (Demo)',
            canonicalId: 'demo-personality-test',
            description: 'To jest przykładowy test osobowości w celach demonstracyjnych.',
            instructions: 'Proszę odpowiedzieć szczerze na wszystkie pytania.',
            questionsPerPage: 2,
            sections: {
                create: [
                    {
                        title: 'Sekcja 1: Podstawy',
                        questions: {
                            create: [
                                {
                                    text: 'Czy lubisz spotkania towarzyskie?',
                                    type: 'single-select',
                                    options: JSON.stringify([
                                        { text: 'Tak', value: 1, id: 'opt1' },
                                        { text: 'Nie', value: 0, id: 'opt2' },
                                    ]),
                                    scoring: '{}'
                                },
                                {
                                    text: 'Jak często czujesz się zestresowany?',
                                    type: 'single-select',
                                    options: JSON.stringify([
                                        { text: 'Rzadko', value: 1, id: 'opt3' },
                                        { text: 'Często', value: 2, id: 'opt4' },
                                        { text: 'Bardzo często', value: 3, id: 'opt5' },
                                    ]),
                                    scoring: '{}'
                                },
                            ],
                        },
                    },
                ],
            },
        },
    })

    // Check if Big Five Test already exists
    let bigFiveTest = await prisma.test.findUnique({ where: { canonicalId: 'big-five-johnson-120' } });
    if (!bigFiveTest) {
        const bigFiveQuestions = require('./bigFiveQuestions.json');
        const likertOptions = JSON.stringify([
            { text: 'Bardzo nietrafne', value: 1, id: '1' },
            { text: 'Raczej nietrafne', value: 2, id: '2' },
            { text: 'Ani trafne, ani nietrafne', value: 3, id: '3' },
            { text: 'Raczej trafne', value: 4, id: '4' },
            { text: 'Bardzo trafne', value: 5, id: '5' }
        ]);

        const scoringPlus = (domain: string) => JSON.stringify({
            '1': [{ scaleId: domain, points: 1 }],
            '2': [{ scaleId: domain, points: 2 }],
            '3': [{ scaleId: domain, points: 3 }],
            '4': [{ scaleId: domain, points: 4 }],
            '5': [{ scaleId: domain, points: 5 }]
        });

        const scoringMinus = (domain: string) => JSON.stringify({
            '1': [{ scaleId: domain, points: 5 }],
            '2': [{ scaleId: domain, points: 4 }],
            '3': [{ scaleId: domain, points: 3 }],
            '4': [{ scaleId: domain, points: 2 }],
            '5': [{ scaleId: domain, points: 1 }]
        });

        const defaultLevels = JSON.stringify([
            { id: 'l1', name: 'Niski', minScore: 0, maxScore: 54, color: 'yellow' },
            { id: 'l2', name: 'Przeciętny', minScore: 55, maxScore: 87, color: 'blue' },
            { id: 'l3', name: 'Wysoki', minScore: 88, maxScore: 120, color: 'red' }
        ]);

        // Create the test
        bigFiveTest = await prisma.test.create({
            data: {
                title: 'Wielka Piątka (IPIP-NEO-PI-R 120)',
                canonicalId: 'big-five-johnson-120',
                description: 'Wielka Piątka (Big Five) to wszechstronny, zweryfikowany naukowo inwentarz osobowości mierzący pięć głównych wymiarów: Otwartość na doświadczenia, Sumienność, Ekstrawersję, Ugodowość oraz Neurotyczność. Wersja 120-pytaniowa.',
                instructions: 'Oceń, na ile poniższe stwierdzenia trafnie opisują Twoje zachowania i odczucia. Zaznacz odpowiedź, która najbardziej odpowiada prawdzie.',
                questionsPerPage: 24,
                status: 'PUBLISHED',
                scales: {
                    create: [
                        {
                            id: 'O',
                            name: 'Otwartość na doświadczenia',
                            type: 'standard',
                            maxScore: 120,
                            levels: defaultLevels,
                            description: '<strong>WYSOKI WYNIK OTWARTOŚCI NA DOŚWIADCZENIA</strong><br />Osoby otwarte na doświadczenia są ciekawe świata, doceniają sztukę i są wrażliwe na piękno. Często są świadome swoich uczuć lub opinii, wykazują zainteresowanie swoim "życiem wewnętrznym". Są skłonne do posiadania niekonwencjonalnych przekonań – płynie to z ich indywidualistycznego i niekonformistycznego myślenia. Często będą nazywane kreatywnymi lub wizjonerskimi. Mają skłonność do interesowania się różnymi rzeczami i zdobywania w życiu nowych umiejętności. Potrafią widzieć znane sobie rzeczy w zupełnie nowy sposób. Czasem dążą do zmiany dla samej zmiany.<br /><br /><strong>PRZECIĘTNA OTWARTOŚĆ NA DOŚWIADCZENIA</strong><br />Osoby o przeciętnych wynikach będą przejawiać czucie i myślenie znajdujące się „pomiędzy” tymi dwoma skrajnościami. Z jednej strony będą nastawione na praktyczne działanie, a z drugiej – jak najbardziej gotowe na niekonwencjonalne propozycje i szukanie nowych rozwiązań i możliwości.<br /><br /><strong>NISKA OTWARTOŚĆ NA DOŚWIADCZENIA</strong><br />Osoby z niskimi wynikami w otwartości na doświadczenia mają tendencję do posiadania wąskich zainteresowań lub kompetencji. Są pragmatyczne. Preferują to, co proste, jasne i oczywiste, niż to, co skomplikowane, dwuznaczne i subtelne. Zamknięte osoby preferują to, co znajome. Często są niechętne zmianom.'
                        },
                        {
                            id: 'C',
                            name: 'Sumienność',
                            type: 'standard',
                            maxScore: 120,
                            levels: defaultLevels,
                            description: '<strong>WYSOKA SUMIENNOŚĆ</strong><br />Osoba o wysokiej sumienności potrafi działać w zgodzie z długofalowym planem - nawet jeśli impulsy kuszą, by chwilowo zrobić coś innego. Sumienny człowiek wybierze odległy sukces kosztem krótkotrwałej przyjemności. Jest skłonny utrzymywać porządek. Będzie też spokojnie realizował różne postanowienia, nawet jeśli ich elementy mogą okazać się np. nudne albo żmudne. Wysoka sumienność sprzyja unikaniu problemów i budowaniu wiarygodności u innych, ma się opinię człowieka "godnego zaufania".<br /><br /><strong>PRZECIĘTNA SUMIENNOŚĆ</strong><br />Przeciętna sumienność oznacza skłonność do przemyślanego realizowania planów, ale z zapewnieniem sobie „marginesu na impulsywność”, by w razie nagłego pomysłu lub zainteresowania móc odejść od przewidzianego scenariusza.<br /><br /><strong>NISKA SUMIENNOŚĆ</strong><br />Osoba o niskiej sumienności będzie borykać się z trudnościami z realizowaniem długofalowych planów. Często w ogóle nie ma takich planów, może też nie mieć jasno określonych celów w życiu. Może regularnie musieć sobie radzić z konsekwencjami wcześniejszych, nieprzemyślanych zachowań.'
                        },
                        {
                            id: 'E',
                            name: 'Ekstrawersja',
                            type: 'standard',
                            maxScore: 120,
                            levels: defaultLevels,
                            description: '<strong>WYSOKA EKSTRAWERSJA (NISKA INTROWERSJA)</strong><br />Osoby cechujące się wysoką ekstrawersją zazwyczaj są entuzjastyczne, nastawione na działanie i skłonne mówić „Tak!” lub „Chodźmy!” na zaproponowane im sytuacje. Odnajdują się w grupach, w których cenią asertywne rozmowy i przyciąganie uwagi innych. Lubią planować przyjęcia, opowiadać historie i rozśmieszać innych. Czerpią energię z interakcji społecznych i potrzebują kontaktu społecznego, by czuć zadowolenie.<br /><br /><strong>PRZECIĘTNA EKSTRAWERSJA</strong><br />Znalezienie się blisko „środka” tego spektrum oznacza gotowość do obu form aktywności społecznej. Taki człowiek odnajdzie się zarówno na przyjęciu, jak i w samotności swojego mieszkania.<br /><br /><strong>NISKA EKSTRAWERSJA (WYSOKA INTROWERSJA)</strong><br />Osoby z niskimi wynikami na tej skali (czyli introwertycy) mają tendencję do bycia stonowanymi i rozważnymi ludźmi. Ich brak zaangażowania społecznego nie powinien być interpretowany jako nieśmiałość czy depresja: introwertyk po prostu potrzebuje mniej stymulacji niż ekstrawertyk i spędzanie czasu bez towarzystwa ma dla niego dużo wartości.'
                        },
                        {
                            id: 'A',
                            name: 'Ugodowość',
                            type: 'standard',
                            maxScore: 120,
                            levels: defaultLevels,
                            description: '<strong>WYNIK WYSOKI</strong><br />Osoby o wysokiej ugodowości często są uprzejme, przyjazne i gotowe do kompromisów w relacjach z innymi. Zależy im na pomaganiu innym i często bywają hojne oraz opiekuńcze. Łatwo ufają. Towarzyszy im optymistyczna wizja ludzkiej natury. Mają przekonanie, że inni są co do zasady uczciwi, porządni i godni zaufania. Przejawiają tendencję do unikania konfliktów.<br /><br /><strong>WYNIK PRZECIĘTNY</strong><br />Osoby o przeciętnej ugodowości są stosunkowo współpracujące i tolerancyjne, ale też potrafią postawić na swoim. Dostosowują się do sytuacji. Bywa, że wybiorą uległość i spokój. Bywa też, że wybiorą konflikt i dominację.<br /><br /><strong>WYNIK NISKI</strong><br />Osoby o niskiej ugodowości (nazywane też czasem antagonistycznymi) często stawiają własne interesy ponad dobre relacje z innymi. Mówiąc kolokwialnie: dowożą to, co trzeba, nawet jeśli kosztem utraty akceptacji społecznej. Ich sceptycyzm co do intencji innych może wywołać wrażenie, że są podejrzliwi, nieprzyjaźni i niechętni do współpracy.'
                        },
                        {
                            id: 'N',
                            name: 'Neurotyczność',
                            type: 'standard',
                            maxScore: 120,
                            levels: defaultLevels,
                            description: '<strong>WYSOKI WYNIK NEUROTYZMU</strong><br />Osoby wysoko neurotyczne są emocjonalnie reaktywne i podatne na stres. Przejawiają podwyższoną skłonność do przeżywania nie wyróżniających się sytuacji jako zagrożeń, albo drobnych frustracji jako beznadziejnie trudnych przeszkód. Mogą częściej doświadczać strachu, gniewu, albo smutku. Ich negatywne odczucia mają tendencję do utrzymywania się przez dłuższy czas, co oznacza, że często są w złym nastroju.<br /><br /><strong>PRZECIĘTNY NEUROTYZM</strong><br />Osoby o przeciętnych poziomach neurotyzmu znajdują się „pomiędzy” – towarzyszy im zrównoważony pogląd na emocje. Czasem są smutne i rozdrażnione, ale pewnie mają ku temu powód. Balansują pomiędzy bezpieczeństwem, a ryzykiem.<br /><br /><strong>NISKI NEUROTYZM</strong><br />Osoby o niskim poziomie neurotyczności są stabilniejsze emocjonalnie i mniej reaktywne. Presja czasu lub stresu nie powoduje u nich aż takiego podniesienia tętna. Często cechują się wytrzymałością psychiczną i zrównoważonym podejściem do własnych emocji.'
                        }
                    ]
                },
                sections: {
                    create: [
                        {
                            title: 'Część 1 (Pytania 1 - 24)',
                            questions: {
                                create: bigFiveQuestions.slice(0, 24).map((q: any) => ({
                                    text: q.text,
                                    type: 'likert-5',
                                    options: likertOptions,
                                    scoring: q.keyed === 'plus' ? scoringPlus(q.domain) : scoringMinus(q.domain)
                                }))
                            }
                        },
                        {
                            title: 'Część 2 (Pytania 25 - 48)',
                            questions: {
                                create: bigFiveQuestions.slice(24, 48).map((q: any) => ({
                                    text: q.text,
                                    type: 'likert-5',
                                    options: likertOptions,
                                    scoring: q.keyed === 'plus' ? scoringPlus(q.domain) : scoringMinus(q.domain)
                                }))
                            }
                        },
                        {
                            title: 'Część 3 (Pytania 49 - 72)',
                            questions: {
                                create: bigFiveQuestions.slice(48, 72).map((q: any) => ({
                                    text: q.text,
                                    type: 'likert-5',
                                    options: likertOptions,
                                    scoring: q.keyed === 'plus' ? scoringPlus(q.domain) : scoringMinus(q.domain)
                                }))
                            }
                        },
                        {
                            title: 'Część 4 (Pytania 73 - 96)',
                            questions: {
                                create: bigFiveQuestions.slice(72, 96).map((q: any) => ({
                                    text: q.text,
                                    type: 'likert-5',
                                    options: likertOptions,
                                    scoring: q.keyed === 'plus' ? scoringPlus(q.domain) : scoringMinus(q.domain)
                                }))
                            }
                        },
                        {
                            title: 'Część 5 (Pytania 97 - 120)',
                            questions: {
                                create: bigFiveQuestions.slice(96, 120).map((q: any) => ({
                                    text: q.text,
                                    type: 'likert-5',
                                    options: likertOptions,
                                    scoring: q.keyed === 'plus' ? scoringPlus(q.domain) : scoringMinus(q.domain)
                                }))
                            }
                        }
                    ]
                }
            }
        });
    }

    console.log({ admin, therapist, sampleTest, bigFiveTest })
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
