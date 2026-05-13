export default function TherapistDocsPage() {
    return (
        <div className="p-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-2">Instrukcja dla Terapeuty</h1>
            <p className="text-gray-500 mb-8">Przewodnik po korzystaniu z platformy MindCare.</p>

            <div className="space-y-8">

                <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                        <span className="text-2xl">1️⃣</span> Generowanie kodu dostępu
                    </h2>
                    <p className="text-gray-600 mb-3">
                        Aby zlecić klientowi wypełnienie testu, wygeneruj unikalny kod dostępu w <strong>Panelu Głównym</strong>.
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-gray-600 pl-2">
                        <li>Przejdź do <strong>Panelu Głównego</strong>.</li>
                        <li>Wybierz test z listy dostępnych testów.</li>
                        <li>Wpisz identyfikator klienta (np. inicjały lub numer przypadku).</li>
                        <li>Kliknij <strong>&bdquo;Generuj kod&rdquo;</strong> — kod zostanie wyświetlony na ekranie.</li>
                        <li>Przekaż kod klientowi (ustnie, e-mailem lub na kartce).</li>
                    </ol>
                </section>

                <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                        <span className="text-2xl">2️⃣</span> Wypełnienie testu przez klienta
                    </h2>
                    <p className="text-gray-600 mb-3">
                        Klient wchodzi na stronę platformy i wpisuje otrzymany kod dostępu. Następnie:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-gray-600 pl-2">
                        <li>Klient widzi ekran potwierdzenia z nazwą testu i liczbą pytań.</li>
                        <li>Klient wypełnia test we własnym tempie.</li>
                        <li>Po zakończeniu wyniki są automatycznie zapisywane w systemie.</li>
                        <li>Kod dostępu staje się nieaktywny — każdy kod można użyć tylko raz.</li>
                    </ol>
                </section>

                <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                        <span className="text-2xl">3️⃣</span> Przeglądanie wyników
                    </h2>
                    <p className="text-gray-600 mb-3">
                        Po wypełnieniu testu przez klienta, wyniki pojawią się na liście w <strong>Panelu Głównym</strong>.
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-gray-600 pl-2">
                        <li>Kliknij na wynik, aby zobaczyć szczegółowy raport.</li>
                        <li>Raport zawiera wyniki w poszczególnych skalach oraz wizualizacje.</li>
                        <li>Możesz pobrać raport jako plik PDF, klikając przycisk <strong>&bdquo;Generuj PDF&rdquo;</strong>.</li>
                    </ol>
                </section>

                <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                        <span className="text-2xl">4️⃣</span> Powiadomienia
                    </h2>
                    <p className="text-gray-600">
                        Ikona dzwonka w górnym rogu paska bocznego informuje o nowych wynikach.
                        Kliknij powiadomienie, aby przejść bezpośrednio do raportu.
                    </p>
                </section>

                <section className="bg-blue-50 rounded-xl border border-blue-100 p-6">
                    <h2 className="text-xl font-semibold mb-3 text-blue-800">💡 Wskazówki</h2>
                    <ul className="list-disc list-inside space-y-2 text-blue-700 pl-2">
                        <li>Kody dostępu są ważne przez <strong>30 dni</strong> od daty wygenerowania.</li>
                        <li>Jeden kod dostępu odpowiada jednemu klientowi i jednemu testowi.</li>
                        <li>Możesz wygenerować wiele kodów do tego samego testu dla różnych klientów.</li>
                        <li>Identyfikator klienta jest widoczny tylko dla Ciebie — nie jest pokazywany klientowi.</li>
                    </ul>
                </section>

            </div>
        </div>
    );
}
