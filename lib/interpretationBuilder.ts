import type { Scale, ScaleLevel, Section } from '@/components/types';

export interface BigFiveScaleDef {
    id: string;
    name: string;
    abbreviation: string;
    maxScore: number;
    parentDomain?: string;
    description: string;
    levels: ScaleLevel[];
}

function createDomainLevels(
    lowDesc: string,
    midDesc: string,
    highDesc: string,
    lowColor: string = 'yellow',
    midColor: string = 'blue',
    highColor: string = 'red'
): ScaleLevel[] {
    // 24 items per domain, 1..5 Likert => raw range 24..120 (span 96).
    // Following bigfive-open / IPIP-NEO thresholds: Low <= 58, Medium 59..86, High 87..120
    return [
        {
            id: 'l1',
            name: 'Niski',
            minScore: 0,
            maxScore: 58,
            color: lowColor,
            description: lowDesc,
        },
        {
            id: 'l2',
            name: 'Przeciętny',
            minScore: 59,
            maxScore: 86,
            color: midColor,
            description: midDesc,
        },
        {
            id: 'l3',
            name: 'Wysoki',
            minScore: 87,
            maxScore: 120,
            color: highColor,
            description: highDesc,
        },
    ];
}

function createFacetLevels(
    lowDesc: string,
    midDesc: string,
    highDesc: string,
    lowColor: string = 'yellow',
    midColor: string = 'blue',
    highColor: string = 'red'
): ScaleLevel[] {
    // 4 items per facet, 1..5 Likert => raw range 4..20 (midpoint 12).
    // Low: 0..9, Medium: 10..14, High: 15..20
    return [
        {
            id: 'f1',
            name: 'Niski',
            minScore: 0,
            maxScore: 9,
            color: lowColor,
            description: lowDesc,
        },
        {
            id: 'f2',
            name: 'Przeciętny',
            minScore: 10,
            maxScore: 14,
            color: midColor,
            description: midDesc,
        },
        {
            id: 'f3',
            name: 'Wysoki',
            minScore: 15,
            maxScore: 20,
            color: highColor,
            description: highDesc,
        },
    ];
}

export const BIG_FIVE_DOMAIN_ORDER = ['O', 'C', 'E', 'A', 'N'] as const;

export const BIG_FIVE_SCALE_DEFINITIONS: Record<string, BigFiveScaleDef> = {
    // =========================================================================
    // 5 GŁÓWNYCH WYMIARÓW (DOMAINS: O, C, E, A, N)
    // =========================================================================
    O: {
        id: 'O',
        name: 'Otwartość na doświadczenia',
        abbreviation: 'O',
        maxScore: 120,
        description:
            'Otwartość na doświadczenia opisuje wymiar stylu poznawczego, który odróżnia osoby obdarzone bogatą wyobraźnią, twórcze i ciekawe świata od osób twardo stąpających po ziemi, praktycznych i przywiązanych do konwencji. Obejmuje ciekawość intelektualną, wrażliwość estetyczną, świadomość własnych emocji oraz gotowość do kwestionowania utartych schematów.',
        levels: createDomainLevels(
            'Twój wynik w wymiarze Otwartości na doświadczenia jest niski, co wskazuje, że preferujesz myślenie w kategoriach prostych, konkretnych i praktycznych. Otoczenie postrzega Cię jako osobę twardo stąpającą po ziemi, pragmatyczną i konserwatywną. Wolisz to, co sprawdzone i znajome, od abstrakcyjnych eksperymentów i gwałtownych zmian.',
            'Twój wynik w wymiarze Otwartości na doświadczenia jest przeciętny, co oznacza, że cenisz tradycję i sprawdzone rozwiązania, ale jednocześnie jesteś osobą gotową spróbować nowych rzeczy, gdy sytuacja tego wymaga. Łączysz zdrowy pragmatyzm z otwartością na nowe perspektywy.',
            'Twój wynik w wymiarze Otwartości na doświadczenia jest wysoki, co wskazuje, że cenisz nowość, różnorodność i zmianę. Jesteś osobą ciekawą świata, obdarzoną bogatą wyobraźnią i kreatywną — chętnie eksplorujesz abstrakcyjne idee, sztukę oraz nieszablonowe rozwiązania.'
        ),
    },
    C: {
        id: 'C',
        name: 'Sumienność',
        abbreviation: 'C',
        maxScore: 120,
        description:
            'Sumienność dotyczy sposobu, w jaki kontrolujemy, regulujemy i ukierunkowujemy nasze impulsy oraz dążymy do długofalowych celów. Obejmuje zorganizowanie, wytrwałość, obowiązkowość, samodyscyplinę oraz skłonność do namysłu przed podjęciem działania.',
        levels: createDomainLevels(
            'Twój wynik w wymiarze Sumienności jest niski, co oznacza, że wolisz żyć chwilą i robić to, co w danym momencie sprawia Ci satysfakcję, zamiast podporządkowywać się sztywnym harmonogramom. Twoja praca i otoczenie mogą być mniej zorganizowane, a odkładanie zadań na później bywa wyzwaniem, choć zyskujesz dzięki temu większą spontaniczność.',
            'Twój wynik w wymiarze Sumienności jest przeciętny. Oznacza to, że jesteś osobą w rozsądnym stopniu rzetelną, zorganizowaną i panującą nad sobą — potrafisz realizować plany i dotrzymywać zobowiązań, zachowując jednocześnie margines na elastyczność i spontaniczność.',
            'Twój wynik w wymiarze Sumienności jest wysoki. Oznacza to, że wyznaczasz sobie jasne cele i dążysz do nich z determinacją oraz konsekwencją. Otoczenie postrzega Cię jako osobę bardzo rzetelną, pracowitą, zdyscyplinowaną i godną zaufania.'
        ),
    },
    E: {
        id: 'E',
        name: 'Ekstrawersja',
        abbreviation: 'E',
        maxScore: 120,
        description:
            'Ekstrawersja charakteryzuje się wyraźnym zaangażowaniem w świat zewnętrzny i relacje społeczne. Określa zapotrzebowanie na stymulację, poziom energii w kontaktach z ludźmi, towarzyskość, asertywność oraz skłonność do odczuwania pozytywnych emocji.',
        levels: createDomainLevels(
            'Twój wynik w wymiarze Ekstrawersji jest niski, co wskazuje na introwertywność, powściągliwość i spokój. Lubisz samotność oraz zajęcia indywidualne, a Twoje kontakty towarzyskie ograniczają się zazwyczaj do wąskiego grona bliskich osób. Mniejsze zaangażowanie społeczne nie oznacza nieśmiałości — po prostu potrzebujesz mniej zewnętrznej stymulacji.',
            'Twój wynik w wymiarze Ekstrawersji jest przeciętny (ambiwertywny), co oznacza, że nie jesteś ani wycofanym samotnikiem, ani duszą każdego towarzystwa. Czerpiesz satysfakcję zarówno z czasu spędzanego z ludźmi, jak i ze spokojnej przestrzeni tylko dla siebie.',
            'Twój wynik w wymiarze Ekstrawersji jest wysoki, co wskazuje, że jesteś osobą towarzyską, otwartą na ludzi, energiczną i pełną życia. Dobrze czujesz się w grupach, chętnie przejmujesz inicjatywę i przez większość czasu wolisz przebywać wśród ludzi.'
        ),
    },
    A: {
        id: 'A',
        name: 'Ugodowość',
        abbreviation: 'A',
        maxScore: 120,
        description:
            'Ugodowość odzwierciedla indywidualne różnice w trosce o współpracę i harmonię społeczną. Określa nastawienie do innych ludzi na kontinuum od zaufania, altruizmu, szczerości i empatii po sceptycyzm, rywalizację i twardą obronę własnego interesu.',
        levels: createDomainLevels(
            'Twój wynik w wymiarze Ugodowości jest niski, co wskazuje na mniejsze skupienie na potrzebach innych niż na własnych celach i niezależności sądów. Ludzie mogą postrzegać Cię jako osobę twardą, krytyczną i bezkompromisową — dobrze sprawdzasz się tam, gdzie potrzebne są obiektywne, chłodne decyzje i twarde negocjacje.',
            'Twój poziom Ugodowości jest przeciętny, co oznacza, że wykazujesz troskę o potrzeby innych i chętnie współpracujesz, ale jednocześnie nie masz skłonności do nadmiernego poświęcania własnego interesu. Potrafisz łączyć życzliwość z asertywnym stawianiem granic.',
            'Twój wysoki poziom Ugodowości wskazuje na silne zainteresowanie potrzebami i dobrem innych ludzi. Jesteś osobą życzliwą, empatyczną, pomocną i skłonną do współpracy — wierzysz w dobre intencje ludzi i cenisz zgodę ponad rywalizację.'
        ),
    },
    N: {
        id: 'N',
        name: 'Neurotyczność',
        abbreviation: 'N',
        maxScore: 120,
        description:
            'Neurotyczność odnosi się do podatności na doświadczanie trudnych, negatywnych emocji (takich jak lęk, gniew, przygnębienie czy skrępowanie) oraz określa reaktywność układu nerwowego na stresory w przeciwieństwie do stabilności emocjonalnej.',
        levels: createDomainLevels(
            'Twój wynik w wymiarze Neurotyczności jest niski, co wskazuje, że jesteś osobą wyjątkowo spokojną, opanowaną i odporną emocjonalnie. Nie reagujesz gwałtownymi emocjami nawet w sytuacjach, które większość ludzi uznałaby za silnie stresujące.',
            'Twój wynik w wymiarze Neurotyczności jest przeciętny, co oznacza, że Twój poziom reaktywności emocjonalnej jest typowy dla ogólnej populacji. Sytuacje stresujące i frustrujące bywają dla Ciebie obciążające, ale zazwyczaj potrafisz sobie z nimi poradzić i odzyskać równowagę.',
            'Twój wynik w wymiarze Neurotyczności jest wysoki, co wskazuje, że łatwo ulegasz wzburzeniu lub napięciu, nawet pod wpływem codziennych wyzwań. Otoczenie postrzega Cię jako osobę bardzo wrażliwą i silnie przeżywającą emocje.',
            'green',
            'blue',
            'red'
        ),
    },

    // =========================================================================
    // 30 PODSKAL / ASPEKTÓW (FACETS: O1..O6, C1..C6, E1..E6, A1..A6, N1..N6)
    // =========================================================================

    // --- OTWARTOŚĆ NA DOŚWIADCZENIA (O1–O6) ---
    O1: {
        id: 'O1',
        name: 'O1: Wyobraźnia',
        abbreviation: 'O1',
        maxScore: 20,
        parentDomain: 'O',
        description:
            'Określa skłonność do kreowania bogatego świata wewnętrznego, marzeń i fantazji w porównaniu do koncentracji wyłącznie na twardych faktach.',
        levels: createFacetLevels(
            'Koncentrujesz się przede wszystkim na faktach, konkretach i realnym świecie, rzadko uciekając w marzenia na jawie.',
            'Zachowujesz równowagę między twardym stąpaniem po ziemi a korzystaniem z wyobraźni i twórczych wizji.',
            'Świat rzeczywisty bywa dla Ciebie zbyt zwyczajny — chętnie używasz bogatej wyobraźni i fantazji do tworzenia ciekawszego, pełniejszego świata wewnętrznego.'
        ),
    },
    O2: {
        id: 'O2',
        name: 'O2: Zainteresowania artystyczne',
        abbreviation: 'O2',
        maxScore: 20,
        parentDomain: 'O',
        description:
            'Mierzy wrażliwość na piękno w sztuce oraz w naturze, a także zdolność do głębokiego przeżywania doznań estetycznych.',
        levels: createFacetLevels(
            'Wykazujesz mniejsze zainteresowanie sztuką, poezją czy wydarzeniami artystycznymi, przedkładając nad nie użyteczność praktyczną.',
            'Doceniasz estetykę i sztukę w umiarkowanym stopniu, ciesząc się nimi przy okazji, choć nie stanowią one głównej osi Twoich zainteresowań.',
            'Kochasz piękno zarówno w sztuce, jak i w naturze. Łatwo angażujesz się w przeżycia estetyczne i dostrzegasz piękno tam, gdzie inni mogą go nie zauważać.'
        ),
    },
    O3: {
        id: 'O3',
        name: 'O3: Emocjonalność (wrażliwość na uczucia)',
        abbreviation: 'O3',
        maxScore: 20,
        parentDomain: 'O',
        description:
            'Określa dobry dostęp do własnych stanów emocjonalnych, uważność na uczucia (zarówno własne, jak i cudze) oraz otwartość w ich wyrażaniu.',
        levels: createFacetLevels(
            'Rzadziej zwracasz uwagę na subtelne niuanse własnych reakcji emocjonalnych i niechętnie wyrażasz uczucia otwarcie.',
            'Posiadasz dobrą, zrównoważoną świadomość własnych emocji, nie pozwalając im jednak całkowicie zdominować chłodnego osądu.',
            'Masz bardzo dobry dostęp do swoich uczuć i wysoką świadomość emocjonalną — głęboko przeżywasz emocje własne oraz rezonujesz z emocjami innych.'
        ),
    },
    O4: {
        id: 'O4',
        name: 'O4: Zamiłowanie do przygód (różnorodność)',
        abbreviation: 'O4',
        maxScore: 20,
        parentDomain: 'O',
        description:
            'Mierzy chęć próbowania nowych aktywności, odwiedzania nowych miejsc i wychodzenia poza znaną rutynę.',
        levels: createFacetLevels(
            'Czujesz się niekomfortowo w obliczu ciągłych zmian i zdecydowanie preferujesz sprawdzone, znajome rutyny oraz przewidywalność.',
            'Lubisz mieć bezpieczną bazę i rutynę, ale od czasu do czasu chętnie urozmaicasz ją nowymi aktywnościami lub zmianą otoczenia.',
            'Chętnie próbujesz nowych zajęć, podróży i doświadczeń. Znajoma rutyna szybko Cię nudzi — wybierasz różnorodność i eksperymentowanie.'
        ),
    },
    O5: {
        id: 'O5',
        name: 'O5: Intelekt (ciekawość intelektualna)',
        abbreviation: 'O5',
        maxScore: 20,
        parentDomain: 'O',
        description:
            'Opisuje zamiłowanie do obcowania z abstrakcyjnymi ideami, dyskusji filozoficznych, wymagających lektur i łamigłówek umysłowych.',
        levels: createFacetLevels(
            'Wolisz zajmować się konkretnymi ludźmi lub praktycznymi rzeczami niż abstrakcyjnymi teoriami; rozważania czysto teoretyczne uważasz za stratę czasu.',
            'Potrafisz angażować się w bardziej złożone koncepcje i dyskusje, gdy mają one sensowne przełożenie na rzeczywistość.',
            'Uwielbiasz „bawić się” ideami, czytać wymagające teksty i prowadzić dyskusje filozoficzne lub teoretyczne. Jesteś osobą otwartą na nietypowe koncepcje.'
        ),
    },
    O6: {
        id: 'O6',
        name: 'O6: Liberalizm psychologiczny (otwartość na wartości)',
        abbreviation: 'O6',
        maxScore: 20,
        parentDomain: 'O',
        description:
            'Oznacza gotowość do poddawania w wątpliwość autorytetów, konwencji i tradycyjnych dogmatów oraz dostrzeganie złożoności ocen moralnych.',
        levels: createFacetLevels(
            'Preferujesz poczucie bezpieczeństwa, porządek i stabilność wynikające z poszanowania tradycji, jasnych reguł oraz sprawdzonych norm społecznych.',
            'Szanujesz sprawdzone normy społeczne, ale dopuszczasz ich ewolucję i rozumiesz, że nie każda sytuacja daje się ocenić czarno-biało.',
            'Cechuje Cię gotowość do kwestionowania zastanych konwencji i tradycyjnych schematów; uważasz, że rzadko istnieją wyłącznie jedne słuszne, sztywne odpowiedzi.'
        ),
    },

    // --- SUMIENNOŚĆ (C1–C6) ---
    C1: {
        id: 'C1',
        name: 'C1: Poczucie własnej skuteczności',
        abbreviation: 'C1',
        maxScore: 20,
        parentDomain: 'C',
        description:
            'Opisuje wiarę we własną zdolność do skutecznego doprowadzania spraw do końca, radzenia sobie z zadaniami i osiągania zamierzonych rezultatów.',
        levels: createFacetLevels(
            'Możesz czasem wątpić w swoją skuteczność lub mieć poczucie mniejszego wpływu na bieg spraw w obliczu trudniejszych wyzwań.',
            'Masz realistyczne poczucie własnych kompetencji — w większości codziennych zadań czujesz się pewnie i sprawnie sobie z nimi radzisz.',
            'Wierzysz, że posiadasz zdrowy rozsądek, napęd i samokontrolę niezbędne do osiągania sukcesu. Sprawnie załatwiasz sprawy i wyróżniasz się w tym, co robisz.'
        ),
    },
    C2: {
        id: 'C2',
        name: 'C2: Zamiłowanie do porządku',
        abbreviation: 'C2',
        maxScore: 20,
        parentDomain: 'C',
        description:
            'Określa potrzebę ładu w otoczeniu, odkładania rzeczy na miejsce oraz funkcjonowania według przejrzystej organizacji.',
        levels: createFacetLevels(
            'Masz tendencję do mniejszej dbałości o formalny ład i zdarza Ci się zostawiać rzeczy w nieładzie lub odkładać sprzątanie na później.',
            'Utrzymujesz funkcjonalny porządek tam, gdzie jest to ważne, nie popadając jednocześnie w przesadny pedantyzm.',
            'Jesteś osobą dobrze zorganizowaną — lubisz ład w swoim otoczeniu, odkładasz rzeczy na miejsce i dobrze czujesz się w uporządkowanej przestrzeni.'
        ),
    },
    C3: {
        id: 'C3',
        name: 'C3: Obowiązkowość (poczucie obowiązku)',
        abbreviation: 'C3',
        maxScore: 20,
        parentDomain: 'C',
        description:
            'Odzwierciedla siłę poczucia moralnego zobowiązania, dotrzymywania obietnic, mówienia prawdy oraz przestrzegania ustalonych zasad.',
        levels: createFacetLevels(
            'Sztywne regulaminy, kontrakty i odgórne zasady bywają dla Ciebie zbyt ograniczające, przez co możesz traktować je z większą swobodą.',
            'Traktujesz swoje obietnice i zasady poważnie, zachowując jednak zdroworozsądkową elastyczność w wyjątkowych sytuacjach.',
            'Masz bardzo silne poczucie obowiązku i odpowiedzialności — dotrzymujesz danego słowa, mówisz prawdę i rzetelnie wywiązujesz się z umów.'
        ),
    },
    C4: {
        id: 'C4',
        name: 'C4: Dążenie do osiągnięć',
        abbreviation: 'C4',
        maxScore: 20,
        parentDomain: 'C',
        description:
            'Mierzy wewnętrzną potrzebę doskonałości, ciężkiej pracy i wykraczania ponad minimalne wymagania w drodze do wyznaczonych celów.',
        levels: createFacetLevels(
            'Nie odczuwasz wewnętrznego przymusu ciągłego ścigania się o wyniki; często wystarcza Ci wykonanie niezbędnego minimum bez nadmiernego przeciążania się pracą.',
            'Potrafisz solidnie zaangażować się w pracę nad ważnymi celami, dbając jednocześnie o równowagę między pracą a odpoczynkiem.',
            'Ciężko pracujesz i dążysz do doskonałości. Masz silne poczucie kierunku w życiu i często robisz więcej, niż się od Ciebie oczekuje.'
        ),
    },
    C5: {
        id: 'C5',
        name: 'C5: Samodyscyplina',
        abbreviation: 'C5',
        maxScore: 20,
        parentDomain: 'C',
        description:
            'Określa siłę woli — zdolność do rozpoczynania zadań bez zwłoki i wytrwałego dążenia do ich ukończenia pomimo rozproszeń czy znużenia.',
        levels: createFacetLevels(
            'Bywa, że odkładasz rozpoczęcie zadań na później (prokrastynacja) lub łatwo tracisz zapał, gdy zadanie staje się żmudne.',
            'Zazwyczaj potrafisz zmobilizować się do działania i doprowadzić plany do końca, choć przy mniej ciekawych zadaniach potrzebujesz czasem dodatkowej motywacji.',
            'Posiadasz wysoką samodyscyplinę — łatwo przełamujesz opór przed rozpoczęciem pracy i konsekwentnie urzeczywistniasz swoje plany mimo rozproszeń.'
        ),
    },
    C6: {
        id: 'C6',
        name: 'C6: Rozwaga (ostrożność decyzyjna)',
        abbreviation: 'C6',
        maxScore: 20,
        parentDomain: 'C',
        description:
            'Opisuje skłonność do dokładnego przemyślenia możliwości i konsekwencji przed podjęciem decyzji lub działania.',
        levels: createFacetLevels(
            'Często działasz spontanicznie i podejmujesz szybkie, czasem pochopne decyzje pod wpływem pierwszego impulsu, bez długiego analizowania alternatyw.',
            'Łączysz umiejętność sprawnego podejmowania decyzji w prostych sprawach z głębszym namysłem wtedy, gdy stawka jest wysoka.',
            'Dajesz sobie czas na namysł przy podejmowaniu decyzji — rozważasz alternatywy i możliwe konsekwencje, zanim przejdziesz do działania.'
        ),
    },

    // --- EKSTRAWERSJA (E1–E6) ---
    E1: {
        id: 'E1',
        name: 'E1: Serdeczność (przyjacielskość)',
        abbreviation: 'E1',
        maxScore: 20,
        parentDomain: 'E',
        description:
            'Mierzy otwartość i ciepło w kontaktach z ludźmi, łatwość nawiązywania znajomości oraz budowania bliskich relacji.',
        levels: createFacetLevels(
            'Nie szukasz aktywnie nowych znajomości i trzymasz nieznajomych na pewien dystans, przez co otoczenie może postrzegać Cię jako osobę powściągliwą.',
            'Potrafisz swobodnie i życzliwie rozmawiać z ludźmi, ale nowe bliższe znajomości budujesz we własnym, spokojnym tempie.',
            'Szczerze lubisz ludzi i otwarcie okazujesz im pozytywne nastawienie. Łatwo nawiązujesz znajomości i czujesz się swobodnie wśród innych.'
        ),
    },
    E2: {
        id: 'E2',
        name: 'E2: Towarzyskość',
        abbreviation: 'E2',
        maxScore: 20,
        parentDomain: 'E',
        description:
            'Określa upodobanie do przebywania w większych grupach, na spotkaniach i imprezach w przeciwieństwie do potrzeby prywatności i samotności.',
        levels: createFacetLevels(
            'Duże tłumy i głośne imprezy bywają dla Ciebie męczące — zdecydowanie bardziej cenisz prywatność, spokój lub spotkania w bardzo kameralnym gronie.',
            'Od czasu do czasu chętnie uczestniczysz w większych spotkaniach, ale równie mocno cenisz spokojne wieczory spędzane samodzielnie.',
            'Towarzystwo wielu osób jest dla Ciebie przyjemnie stymulujące — lubisz duże spotkania, gwar i rozmowy z wieloma osobami.'
        ),
    },
    E3: {
        id: 'E3',
        name: 'E3: Asertywność (przywództwo)',
        abbreviation: 'E3',
        maxScore: 20,
        parentDomain: 'E',
        description:
            'Mierzy skłonność do zabierania głosu, przejmowania inicjatywy i kierowania działaniami grupy.',
        levels: createFacetLevels(
            'Wolisz pozostawać w tle i pozwalać innym przejmować ster w grupie, zamiast narzucać własne kierownictwo.',
            'Potrafisz przejąć inicjatywę i wyrazić swoje zdanie, gdy sytuacja tego wymaga, ale nie masz potrzeby dominowania w każdej grupie.',
            'Chętnie zabierasz głos, przejmujesz inicjatywę oraz dowodzenie. W grupach naturalnie wchodzisz w rolę lidera nadającego kierunek działaniom.'
        ),
    },
    E4: {
        id: 'E4',
        name: 'E4: Poziom aktywności',
        abbreviation: 'E4',
        maxScore: 20,
        parentDomain: 'E',
        description:
            'Określa tempo życia, poziom energii i potrzebę bycia w ciągłym ruchu oraz angażowania się w liczne zajęcia.',
        levels: createFacetLevels(
            'Preferujesz spokojniejsze, bardziej zrelaksowane tempo życia i nie odczuwasz potrzeby ciągłego wypełniania czasu wolnego pośpiechem.',
            'Utrzymujesz zrównoważone tempo — potrafisz działać bardzo dynamicznie, ale dbasz też o czas na spokojny wypoczynek.',
            'Prowadzisz szybkie, intensywne życie — jesteś osobą stale zajętą, pełną wigoru i zaangażowaną w wiele aktywności również w czasie wolnym.'
        ),
    },
    E5: {
        id: 'E5',
        name: 'E5: Poszukiwanie doznań (ekscytacji)',
        abbreviation: 'E5',
        maxScore: 20,
        parentDomain: 'E',
        description:
            'Mierzy zapotrzebowanie na silne bodźce, przygodę, dreszczyk emocji i podejmowanie ryzyka.',
        levels: createFacetLevels(
            'Hałas, zamieszanie i ryzykowne przygody nie są tym, czego szukasz — wolisz bezpieczne, przewidywalne i spokojne otoczenie.',
            'Lubisz umiarkowaną dawkę emocji i urozmaicenia, ale unikasz skrajnej brawury i niepotrzebnego ryzyka.',
            'Bez wysokiego poziomu stymulacji szybko się nudzisz — poszukujesz przygód, intensywnych wrażeń i ekscytacji.'
        ),
    },
    E6: {
        id: 'E6',
        name: 'E6: Pogoda ducha (radość)',
        abbreviation: 'E6',
        maxScore: 20,
        parentDomain: 'E',
        description:
            'Mierzy skłonność do doświadczania pozytywnego nastroju — radości, entuzjazmu, optymizmu i cieszenia się życiem.',
        levels: createFacetLevels(
            'Twój nastrój jest zazwyczaj bardziej stonowany i poważny — rzadziej okazujesz spontaniczny, wybuchowy entuzjazm.',
            'Cechuje Cię pogodny, zrównoważony nastrój i umiarkowany optymizm w codziennym życiu.',
            'Zazwyczaj tryskasz radością, entuzjazmem i optymizmem — łatwo dostrzegasz pozytywną stronę życia i dobrze się bawisz.'
        ),
    },

    // --- UGODOWOŚĆ (A1–A6) ---
    A1: {
        id: 'A1',
        name: 'A1: Zaufanie',
        abbreviation: 'A1',
        maxScore: 20,
        parentDomain: 'A',
        description:
            'Określa przekonanie, że inni ludzie są z natury uczciwi, sprawiedliwi i mają dobre intencje, w przeciwieństwie do podejrzliwości i sceptycyzmu.',
        levels: createFacetLevels(
            'Podchodzisz do ludzi z dużą ostrożnością i sceptycyzmem, zakładając, że inni mogą kierować się głównie własnym interesem.',
            'Obdarzasz ludzi kredytem zaufania, zachowując jednocześnie zdrową czujność wobec osób, których jeszcze dobrze nie znasz.',
            'Zakładasz, że większość ludzi jest uczciwa i ma dobre intencje — łatwo obdarzasz innych zaufaniem.'
        ),
    },
    A2: {
        id: 'A2',
        name: 'A2: Prostolinijność (moralność w relacjach)',
        abbreviation: 'A2',
        maxScore: 20,
        parentDomain: 'A',
        description:
            'Mierzy szczerość, otwartość i brak potrzeby manipulowania czy wykorzystywania innych w relacjach społecznych.',
        levels: createFacetLevels(
            'Uważasz, że w relacjach społecznych lub negocjacjach pewna doza dyplomacji, przebiegłości lub nieodkrywania wszystkich kart bywa konieczna.',
            'Jesteś osobą co do zasady szczerą i uczciwą, choć w trudnych sytuacjach potrafisz zachować ostrożność i dyplomatyczny dystans.',
            'Nie widzisz potrzeby udawania ani manipulacji w kontaktach z ludźmi — cechuje Cię szczerość, prostolinijność i uczciwość.'
        ),
    },
    A3: {
        id: 'A3',
        name: 'A3: Altruizm',
        abbreviation: 'A3',
        maxScore: 20,
        parentDomain: 'A',
        description:
            'Określa bezinteresowną gotowość do pomagania innym i troskę o cudzą pomyślność.',
        levels: createFacetLevels(
            'Niechętnie angażujesz swój czas w cudze problemy; prośby o pomoc możesz czasem odbierać jako obciążenie lub naruszenie Twojej przestrzeni.',
            'Chętnie pomagasz bliskim i współpracownikom, dbając jednocześnie o to, by nie działo się to kosztem Twoich własnych obowiązków.',
            'Pomaganie innym daje Ci autentyczną satysfakcję — troszczysz się o ludzi i chętnie wspierasz tych, którzy znajdują się w potrzebie.'
        ),
    },
    A4: {
        id: 'A4',
        name: 'A4: Ustępliwość (współpraca)',
        abbreviation: 'A4',
        maxScore: 20,
        parentDomain: 'A',
        description:
            'Opisuje stosunek do konfliktów interpersonalnych — od gotowości do kompromisu i łagodzenia sporów po konfrontacyjność.',
        levels: createFacetLevels(
            'Nie unikasz ostrych sporów ani konfrontacji — gdy trzeba, potrafisz twardo i bezpardonowo przeforsować swoje zdanie.',
            'Preferujesz polubowne rozwiązywanie spraw, ale w kluczowych kwestiach potrafisz wejść w spór i obronić swoje stanowisko.',
            'Nie lubisz kłótni ani otwartych konfrontacji — chętnie szukasz kompromisu i zgody, aby utrzymać dobre relacje z otoczeniem.'
        ),
    },
    A5: {
        id: 'A5',
        name: 'A5: Skromność',
        abbreviation: 'A5',
        maxScore: 20,
        parentDomain: 'A',
        description:
            'Określa powściągliwość w podkreślaniu własnej wyższości i sukcesów w kontaktach z innymi.',
        levels: createFacetLevels(
            'Masz wysokie mniemanie o sobie i otwarcie mówisz o swoich atutach oraz przewadze, co część otoczenia może odbierać jako pewność siebie graniczącą z wyniosłością.',
            'Znasz swoją wartość i potrafisz mówić o swoich mocnych stronach bez wywyższania się nad innymi.',
            'Nie lubisz wywyższać się ani twierdzić, że jesteś lepszy od innych — cechuje Cię naturalna skromność i pokora.'
        ),
    },
    A6: {
        id: 'A6',
        name: 'A6: Wrażliwość społeczna (empatia / współczucie)',
        abbreviation: 'A6',
        maxScore: 20,
        parentDomain: 'A',
        description:
            'Mierzy zdolność do wzruszania się losem innych ludzi, współczucia osobom w trudnym położeniu oraz kierowania się miłosierdziem.',
        levels: createFacetLevels(
            'W ocenach kierujesz się raczej chłodnym rozumem i obiektywnymi faktami niż litością czy wzruszeniem nad cudzym losem.',
            'Potrafisz okazać współczucie osobom w trudnej sytuacji, łącząc empatię z trzeźwą oceną rzeczywistości.',
            'Jesteś osobą niezwykle czułą i współczującą — mocno porusza Cię cierpienie innych ludzi oraz los osób znajdujących się w gorszej sytuacji.'
        ),
    },

    // --- NEUROTYCZNOŚĆ (N1–N6) ---
    N1: {
        id: 'N1',
        name: 'N1: Lęk',
        abbreviation: 'N1',
        maxScore: 20,
        parentDomain: 'N',
        description:
            'Mierzy skłonność do zamartwiania się, odczuwania napięcia, niepokoju oraz obaw, że wydarzy się coś złego.',
        levels: createFacetLevels(
            'Zazwyczaj zachowujesz spokój i rzadko zamartwiasz się na zapas lub ulegasz nieuzasadnionym obawom.',
            'Odczuwasz umiarkowany niepokój w obliczu realnych wyzwań, ale nie przeradza się on w przewlekłe zamartwianie się.',
            'Często zamartwiasz się i obawiasz najgorszego — łatwo odczuwasz wewnętrzne napięcie, stres oraz niepokój.',
            'green',
            'blue',
            'red'
        ),
    },
    N2: {
        id: 'N2',
        name: 'N2: Gniew i wrogość',
        abbreviation: 'N2',
        maxScore: 20,
        parentDomain: 'N',
        description:
            'Określa podatność na odczuwanie irytacji, frustracji i złości, gdy sprawy nie idą po Twojej myśli.',
        levels: createFacetLevels(
            'Niełatwo wyprowadzić Cię z równowagi — rzadko ulegasz irytacji lub wybuchom złości.',
            'Odczuwasz złość lub irytację w sytuacjach wyraźnie frustrujących, ale na co dzień zachowujesz równowagę.',
            'Łatwo ulegasz irytacji i złości, gdy napotykasz przeszkody lub czujesz, że coś idzie nie po Twojej myśli.',
            'green',
            'blue',
            'red'
        ),
    },
    N3: {
        id: 'N3',
        name: 'N3: Depresyjność (przygnębienie)',
        abbreviation: 'N3',
        maxScore: 20,
        parentDomain: 'N',
        description:
            'Mierzy skłonność do doświadczania smutku, przygnębienia, zniechęcenia oraz obniżonej samooceny.',
        levels: createFacetLevels(
            'Czujesz się dobrze ze sobą i rzadko doświadczasz stanów bezsilnego smutku, chandry czy zniechęcenia.',
            'Czasem doświadczasz gorszego nastroju lub spadku energii w odpowiedzi na trudności, ale dobrze czujesz się ze sobą na co dzień.',
            'Częściej doświadczasz przygnębienia, chandry lub surowej oceny samego siebie, co może obniżać Twój poziom energii i motywacji.',
            'green',
            'blue',
            'red'
        ),
    },
    N4: {
        id: 'N4',
        name: 'N4: Nieśmiałość (skrępowanie społeczne)',
        abbreviation: 'N4',
        maxScore: 20,
        parentDomain: 'N',
        description:
            'Określa wrażliwość na ocenę społeczną, lęk przed zwracaniem na siebie uwagi oraz poczucie dyskomfortu wśród obcych osób.',
        levels: createFacetLevels(
            'Nie przejmujesz się nadmiernie trudnymi sytuacjami społecznymi i nie masz poczucia, że wszyscy wokół nieustannie Cię oceniają.',
            'W nowym otoczeniu możesz początkowo czuć lekką rezerwę, ale szybko odzyskujesz swobodę.',
            'Jesteś osobą wrażliwą na to, co pomyślą o Tobie inni — niełatwo zbliżasz się do obcych ludzi i wolisz unikać zwracania na siebie uwagi.',
            'green',
            'blue',
            'red'
        ),
    },
    N5: {
        id: 'N5',
        name: 'N5: Impulsywność (brak umiaru)',
        abbreviation: 'N5',
        maxScore: 20,
        parentDomain: 'N',
        description:
            'Mierzy trudność w opieraniu się zachciankom i pokusom przynoszącym natychmiastową ulgę lub przyjemność.',
        levels: createFacetLevels(
            'Łatwo opierasz się pokusom i zachciankom — potrafisz bez trudu zachować umiar i samokontrolę.',
            'Zazwyczaj dobrze kontrolujesz swoje zachcianki, pozwalając sobie czasem na drobne ustępstwa bez utraty umiaru.',
            'Odczuwasz silne zachcianki i pokusy, którym trudniej Ci się oprzeć (np. trudno Ci przerwać angażującą czynność lub odmówić sobie natychmiastowej przyjemności).',
            'green',
            'blue',
            'red'
        ),
    },
    N6: {
        id: 'N6',
        name: 'N6: Podatność na stres (nadwrażliwość)',
        abbreviation: 'N6',
        maxScore: 20,
        parentDomain: 'N',
        description:
            'Określa zdolność do zachowania zimnej krwi pod presją w przeciwieństwie do poczucia przytłoczenia, paniki i bezradności w obliczu silnego stresu.',
        levels: createFacetLevels(
            'Pomimo presji czasu lub trudnych okoliczności pozostajesz osobą spokojną, opanowaną i zdolną do jasnego myślenia.',
            'W większości sytuacji radzisz sobie z presją, choć wyjątkowo silne nagromadzenie stresu może Cię chwilowo przytłoczyć.',
            'W sytuacjach silnej presji lub przeciążenia łatwo czujesz przytłoczenie, bezradność lub panikę, dlatego potrzebujesz więcej wsparcia i spokoju.',
            'green',
            'blue',
            'red'
        ),
    },
};

export const BIG_FIVE_ALL_SCALE_IDS = [
    'O',
    'C',
    'E',
    'A',
    'N',
    'O1',
    'O2',
    'O3',
    'O4',
    'O5',
    'O6',
    'C1',
    'C2',
    'C3',
    'C4',
    'C5',
    'C6',
    'E1',
    'E2',
    'E3',
    'E4',
    'E5',
    'E6',
    'A1',
    'A2',
    'A3',
    'A4',
    'A5',
    'A6',
    'N1',
    'N2',
    'N3',
    'N4',
    'N5',
    'N6',
] as const;

const BIG_FIVE_NAME_MAP: Record<string, string> = {
    'otwartość na doświadczenia': 'O',
    sumienność: 'C',
    ekstrawersja: 'E',
    ugodowość: 'A',
    neurotyczność: 'N',
};

export function isBigFiveFacetScale(scale: { id?: string; name?: string }): boolean {
    if (scale.id && /(?:^|-)([OCEAN][1-6])$/.test(scale.id)) return true;
    if (scale.name && /^[OCEAN][1-6]:/.test(scale.name.trim())) return true;
    return false;
}

export function getBigFiveFacetParentDomain(scale: { id?: string; name?: string }): string | null {
    const idMatch = (scale.id || '').match(/(?:^|-)([OCEAN])[1-6]$/);
    if (idMatch) {
        return idMatch[1];
    }
    if (scale.name && /^[OCEAN][1-6]:/.test(scale.name.trim())) {
        return scale.name.trim().charAt(0);
    }
    return null;
}

export function getBigFiveDomainCode(scale: {
    id?: string;
    name?: string;
    abbreviation?: string;
}): string | null {
    const idMatch = (scale.id || '').trim().match(/(?:^|-)([OCEAN])$/);
    if (idMatch) return idMatch[1];
    const abbrUpper = (scale.abbreviation || '').trim().toUpperCase();
    if (['O', 'C', 'E', 'A', 'N'].includes(abbrUpper)) return abbrUpper;
    const lowerName = (scale.name || '').trim().toLowerCase();
    if (BIG_FIVE_NAME_MAP[lowerName]) return BIG_FIVE_NAME_MAP[lowerName];
    return null;
}

/**
 * Checks if a scale belongs to Big Five (domain or facet) and returns normalized description + levels.
 */
export function getNormalizedBigFiveScaleData(scale: {
    id: string;
    name: string;
    description?: string | null;
    levels?: ScaleLevel[] | string | null;
}): { needsUpdate: boolean; description: string; levels: ScaleLevel[] } | null {
    const trimmedName = (scale.name || '').trim();
    const prefixMatch = trimmedName.match(/^([OCEAN][1-6]):/);
    const key = BIG_FIVE_SCALE_DEFINITIONS[scale.id]
        ? scale.id
        : prefixMatch && BIG_FIVE_SCALE_DEFINITIONS[prefixMatch[1]]
          ? prefixMatch[1]
          : BIG_FIVE_NAME_MAP[trimmedName.toLowerCase()];

    if (!key || !BIG_FIVE_SCALE_DEFINITIONS[key]) return null;

    let parsedLevels: ScaleLevel[] = [];
    if (Array.isArray(scale.levels)) {
        parsedLevels = scale.levels;
    } else if (typeof scale.levels === 'string' && scale.levels.trim()) {
        try {
            parsedLevels = JSON.parse(scale.levels);
        } catch {
            parsedLevels = [];
        }
    }

    const hasPerLevelDescriptions =
        parsedLevels.length > 0 && parsedLevels.some(l => Boolean(l.description && l.description.trim()));

    const desc = scale.description || '';
    const hasLegacyConcatenatedDescription =
        desc.includes('PRZECIĘTN') && desc.includes('NISK');

    if (hasPerLevelDescriptions && !hasLegacyConcatenatedDescription) {
        return {
            needsUpdate: false,
            description: desc,
            levels: parsedLevels,
        };
    }

    const def = BIG_FIVE_SCALE_DEFINITIONS[key];
    return {
        needsUpdate: true,
        description: def.description,
        levels: def.levels,
    };
}

export interface ResolvedLevelInfo {
    label: string;
    color: string;
    textColor: string;
    description: string | null;
    minScore?: number;
    maxScore?: number;
    rankIndex: number;
    totalLevels: number;
}

function resolveColorAndContrast(rawColor?: string): { color: string; textColor: string } {
    let hexColor = rawColor || '#314293';
    let textColor = '#ffffff';

    if (hexColor === 'red') hexColor = '#ef4444';
    else if (hexColor === 'yellow') {
        hexColor = '#fef08a';
        textColor = '#854d0e';
    } else if (hexColor === 'green') hexColor = '#4e9054';
    else if (hexColor === 'purple') hexColor = '#a855f7';
    else if (hexColor === 'blue') hexColor = '#314293';
    else if (hexColor === 'orange') hexColor = '#f97316';
    else if (hexColor.startsWith('#') && hexColor.length >= 7) {
        const r = parseInt(hexColor.slice(1, 3), 16) || 0;
        const g = parseInt(hexColor.slice(3, 5), 16) || 0;
        const b = parseInt(hexColor.slice(5, 7), 16) || 0;
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        if (luminance > 0.55) textColor = '#14161d';
    }

    return { color: hexColor, textColor };
}

/**
 * Matches a numeric score against a scale's configured `levels` (supporting ANY number of thresholds: 1, 2, 3, 4, 5, 10, etc.).
 * Falls back to percentage-based thresholds only if the scale has no levels defined.
 */
export function resolveScaleLevel(
    val: number,
    scale?: { maxScore?: number | null; levels?: ScaleLevel[] | string | null } | null
): ResolvedLevelInfo {
    if (!scale) {
        return {
            label: 'Brak danych',
            color: '#313647',
            textColor: '#fbfaf7',
            description: null,
            rankIndex: 0,
            totalLevels: 0,
        };
    }

    let parsedLevels: ScaleLevel[] = [];
    if (Array.isArray(scale.levels)) {
        parsedLevels = scale.levels;
    } else if (typeof scale.levels === 'string' && scale.levels.trim()) {
        try {
            const parsed = JSON.parse(scale.levels);
            if (Array.isArray(parsed)) parsedLevels = parsed;
        } catch {
            parsedLevels = [];
        }
    }

    if (parsedLevels.length > 0) {
        const sorted = [...parsedLevels].sort((a, b) => (a.minScore ?? 0) - (b.minScore ?? 0));
        let matchedIdx = sorted.findIndex(l => val >= l.minScore && val <= l.maxScore);

        if (matchedIdx === -1) {
            if (val < sorted[0].minScore) {
                matchedIdx = 0;
            } else {
                matchedIdx = sorted.length - 1;
            }
        }

        const matched = sorted[matchedIdx];
        const { color, textColor } = resolveColorAndContrast(matched.color);

        return {
            label: matched.name || `Poziom ${matchedIdx + 1}`,
            color,
            textColor,
            description: matched.description ? matched.description.trim() : null,
            minScore: matched.minScore,
            maxScore: matched.maxScore,
            rankIndex: matchedIdx,
            totalLevels: sorted.length,
        };
    }

    if (!scale.maxScore) {
        return {
            label: 'Wynik surowy',
            color: '#313647',
            textColor: '#fbfaf7',
            description: null,
            rankIndex: 0,
            totalLevels: 1,
        };
    }

    const ratio = val / scale.maxScore;
    if (ratio > 0.72) {
        return {
            label: 'Wysoki',
            color: '#e89183',
            textColor: '#14161d',
            description: null,
            rankIndex: 2,
            totalLevels: 3,
        };
    }
    if (ratio >= 0.48) {
        return {
            label: 'Przeciętny',
            color: '#314293',
            textColor: '#ffffff',
            description: null,
            rankIndex: 1,
            totalLevels: 3,
        };
    }
    return {
        label: 'Niski',
        color: '#4e9054',
        textColor: '#ffffff',
        description: null,
        rankIndex: 0,
        totalLevels: 3,
    };
}

/**
 * Deterministically builds a full, structured HTML baseline interpretation from the test key (`klucz testu`),
 * supporting ANY number of thresholds (`N` levels) per scale AND hierarchical facet subscales (e.g. Big Five O1..N6).
 */
export function buildKeyInterpretation(
    test: { title: string; scales: Scale[] },
    scores: Record<string, number>
): string {
    if (!test.scales || test.scales.length === 0) {
        return '';
    }

    interface EvaluatedScale {
        scale: Scale;
        score: number;
        maxScore?: number;
        percentage: number | null;
        level: ResolvedLevelInfo;
        relativeRank: number;
        isFacet: boolean;
        parentDomain: string | null;
    }

    const evaluated: EvaluatedScale[] = [];

    for (const scale of test.scales) {
        const score = scores[scale.id];
        if (score === undefined) continue;

        const maxScore = scale.maxScore && scale.maxScore > 0 ? scale.maxScore : undefined;
        const percentage = maxScore ? Math.min(100, Math.max(0, Math.round((score / maxScore) * 100))) : null;
        const level = resolveScaleLevel(score, scale);
        const relativeRank =
            level.totalLevels > 1
                ? level.rankIndex / (level.totalLevels - 1)
                : percentage !== null
                  ? percentage / 100
                  : 0.5;

        evaluated.push({
            scale,
            score,
            maxScore,
            percentage,
            level,
            relativeRank,
            isFacet: isBigFiveFacetScale(scale),
            parentDomain: getBigFiveFacetParentDomain(scale),
        });
    }

    if (evaluated.length === 0) return '';

    const primaryScales = evaluated.filter(e => !e.isFacet);
    const facetScales = evaluated.filter(e => e.isFacet);
    const summaryTargets = primaryScales.length > 0 ? primaryScales : evaluated;

    // 1. Group primary scales dynamically by their achieved level label (works for 2, 3, 4, 5, 10... levels)
    const groupsMap = new Map<
        string,
        { label: string; maxRelativeRank: number; items: EvaluatedScale[] }
    >();

    for (const item of summaryTargets) {
        const key = item.level.label.trim();
        const existing = groupsMap.get(key);
        if (existing) {
            existing.items.push(item);
            if (item.relativeRank > existing.maxRelativeRank) {
                existing.maxRelativeRank = item.relativeRank;
            }
        } else {
            groupsMap.set(key, {
                label: item.level.label,
                maxRelativeRank: item.relativeRank,
                items: [item],
            });
        }
    }

    const sortedGroups = Array.from(groupsMap.values()).sort(
        (a, b) => b.maxRelativeRank - a.maxRelativeRank
    );

    let html = `<p><strong>PODSUMOWANIE PROFILU WYNIKÓW (${test.title})</strong></p><ul>`;
    for (const group of sortedGroups) {
        const formattedItems = group.items
            .map(it => {
                const scorePart = it.maxScore
                    ? `${it.score}/${it.maxScore} pkt (${it.percentage}%)`
                    : `${it.score} pkt`;
                return `${it.scale.name} (${scorePart})`;
            })
            .join(', ');
        html += `<li><strong>Poziom: ${group.label}</strong> — ${formattedItems}</li>`;
    }
    html += `</ul><p><br></p>`;

    // 2. Detailed per-scale key interpretation (with nested facets if present)
    html += `<p><strong>SZCZEGÓŁOWA INTERPRETACJA WYMIARÓW WG KLUCZA TESTU</strong></p>`;

    for (const item of summaryTargets) {
        const scorePart = item.maxScore
            ? `${item.score} / ${item.maxScore} pkt (${item.percentage}%)`
            : `${item.score} pkt`;
        const rangePart =
            item.level.minScore !== undefined && item.level.maxScore !== undefined
                ? ` [przedział klucza: ${item.level.minScore}–${item.level.maxScore} pkt]`
                : '';

        html += `<p><strong>${item.scale.name} — wynik: ${scorePart} | Poziom: ${item.level.label}</strong>${rangePart}</p>`;

        const scaleGeneralDesc = (item.scale.description || '').trim();
        const levelSpecificDesc = (item.level.description || '').trim();

        if (levelSpecificDesc) {
            if (scaleGeneralDesc && scaleGeneralDesc !== levelSpecificDesc) {
                html += `<p><em>${scaleGeneralDesc}</em></p>`;
            }
            html += `<p>${levelSpecificDesc}</p>`;
        } else if (scaleGeneralDesc) {
            html += `<p>${scaleGeneralDesc}</p>`;
        } else {
            html += `<p>Brak szczegółowego opisu tekstowego dla tego progu w kluczu testu.</p>`;
        }

        // Render child facets if this primary scale has facets (e.g. O -> O1..O6)
        const domainCode = getBigFiveDomainCode(item.scale);
        const childFacets = domainCode
            ? facetScales.filter(f => f.parentDomain === domainCode)
            : [];

        if (childFacets.length > 0) {
            html += `<p><strong>Podskale (aspekty wymiaru ${item.scale.name}):</strong></p><ul>`;
            for (const facet of childFacets) {
                const fScorePart = facet.maxScore
                    ? `${facet.score}/${facet.maxScore} pkt (${facet.percentage}%)`
                    : `${facet.score} pkt`;
                const fDesc = (facet.level.description || facet.scale.description || '').trim();
                html += `<li><strong>${facet.scale.name}</strong> — ${fScorePart}, poziom: <strong>${facet.level.label}</strong>.${fDesc ? ` ${fDesc}` : ''}</li>`;
            }
            html += `</ul>`;
        }
    }

    return html;
}

/**
 * Generates `count` (N >= 2) contiguous, non-overlapping score intervals covering [minPossible .. maxPossible].
 * Adapts default labels and colors automatically to any N (2, 3, 4, 5, 6, ... 10+).
 */
export function generateEqualThresholds(
    count: number,
    maxPossible: number,
    minPossible: number = 0
): ScaleLevel[] {
    const n = Math.max(2, Math.min(20, Math.floor(count || 3)));
    const safeMin = Math.max(0, Math.floor(minPossible || 0));
    const safeMax = Math.max(safeMin + n - 1, Math.floor(maxPossible || 100));

    const presetsByCount: Record<number, { names: string[]; colors: string[] }> = {
        2: {
            names: ['Niski / Norma', 'Wysoki / Podwyższony'],
            colors: ['#4e9054', '#ef4444'],
        },
        3: {
            names: ['Niski', 'Przeciętny', 'Wysoki'],
            colors: ['#fef08a', '#314293', '#ef4444'],
        },
        4: {
            names: ['Niski', 'Umiarkowanie niski', 'Umiarkowanie wysoki', 'Wysoki'],
            colors: ['#4e9054', '#314293', '#f97316', '#ef4444'],
        },
        5: {
            names: ['Bardzo niski', 'Niski', 'Przeciętny', 'Wysoki', 'Bardzo wysoki'],
            colors: ['#4e9054', '#3b82f6', '#314293', '#f97316', '#ef4444'],
        },
        6: {
            names: [
                'Bardzo niski',
                'Niski',
                'Nieco obniżony',
                'Nieco podwyższony',
                'Wysoki',
                'Bardzo wysoki',
            ],
            colors: ['#4e9054', '#0ea5e9', '#314293', '#a855f7', '#f97316', '#ef4444'],
        },
        10: {
            names: [
                'Sten 1 (bardzo niski)',
                'Sten 2 (bardzo niski)',
                'Sten 3 (niski)',
                'Sten 4 (niski)',
                'Sten 5 (przeciętny)',
                'Sten 6 (przeciętny)',
                'Sten 7 (wysoki)',
                'Sten 8 (wysoki)',
                'Sten 9 (bardzo wysoki)',
                'Sten 10 (bardzo wysoki)',
            ],
            colors: [
                '#4e9054',
                '#4e9054',
                '#0ea5e9',
                '#0ea5e9',
                '#314293',
                '#314293',
                '#f97316',
                '#f97316',
                '#ef4444',
                '#dc2626',
            ],
        },
    };

    const totalSpan = safeMax - safeMin + 1;
    const levels: ScaleLevel[] = [];

    const palette = ['#4e9054', '#0ea5e9', '#314293', '#a855f7', '#f97316', '#ef4444'];

    for (let i = 0; i < n; i++) {
        const rangeStart = safeMin + Math.floor((i * totalSpan) / n);
        const rangeEnd =
            i === n - 1
                ? safeMax
                : safeMin + Math.floor(((i + 1) * totalSpan) / n) - 1;

        const preset = presetsByCount[n];
        const name = preset
            ? preset.names[i]
            : i === 0
              ? `Poziom 1 (najniższy)`
              : i === n - 1
                ? `Poziom ${n} (najwyższy)`
                : `Poziom ${i + 1}`;

        const color = preset
            ? preset.colors[i]
            : palette[Math.min(palette.length - 1, Math.floor((i / Math.max(1, n - 1)) * (palette.length - 1)))];

        levels.push({
            id: `lvl-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
            name,
            minScore: rangeStart,
            maxScore: Math.max(rangeStart, rangeEnd),
            color,
            description: '',
        });
    }

    return levels;
}

/**
 * Computes theoretical minimum and maximum possible points for a given scale based on all questions in the test.
 */
export function calculateScaleScoreBounds(
    sections: Section[],
    scaleId: string
): { minPossible: number; maxPossible: number; questionCount: number } {
    let minPossible = 0;
    let maxPossible = 0;
    let questionCount = 0;

    for (const sec of sections || []) {
        for (const q of sec.questions || []) {
            if (!q.scoring) continue;
            const optionPoints: number[] = [];

            for (const opt of q.options || []) {
                const rules = q.scoring[opt.id] || [];
                const matchingRules = rules.filter(r => r.scaleId === scaleId);
                if (matchingRules.length > 0) {
                    const sum = matchingRules.reduce((acc, r) => acc + (Number(r.points) || 0), 0);
                    optionPoints.push(sum);
                } else {
                    optionPoints.push(0);
                }
            }

            const hasNonZeroRule = optionPoints.some(p => p !== 0);
            if (!hasNonZeroRule) continue;

            questionCount++;
            if (q.type === 'multiple-select') {
                const positiveSum = optionPoints.filter(p => p > 0).reduce((a, b) => a + b, 0);
                const negativeSum = optionPoints.filter(p => p < 0).reduce((a, b) => a + b, 0);
                minPossible += negativeSum;
                maxPossible += positiveSum;
            } else {
                minPossible += Math.min(...optionPoints);
                maxPossible += Math.max(...optionPoints);
            }
        }
    }

    return { minPossible, maxPossible, questionCount };
}
