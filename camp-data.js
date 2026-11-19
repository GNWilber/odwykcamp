/* ============================================================================
   TEMPLATKA KONFIGURACJI OBOZU ODWYKCAMP (SKOPIUJ I WYPEŁNIJ PRZED NOWYM OBOZEM)
   ============================================================================
   Współrzędne [szerokość_lat, długość_lng] skopiujesz klikając prawym przyciskiem
   myszy na dowolny punkt w Google Maps (pierwsza pozycja w menu to np. 49.7101, 18.8204).

   --- WZÓR POJEDYNCZEGO KIEROWCY (do tablicy `drivers`) ---
   {
     id: "kierowca-unikalne-id",
     name: "Imię / Nick",
     contact: "Discord: @nick",
     from: "Miasto startowe",
     fromCoords: [52.2297, 21.0122],
     stops: [
       // Opcjonalne przystanki po drodze (zostaw [] jeśli jedzie bezpośrednio):
       { name: "Katowice (dworzec)", coords: [50.2584, 19.0175] }
     ],
     seatsTotal: 4,
     seatsFree: 2,
     dates: "7.11 rano – 11.11 wieczór",
     note: "Biorę bagaże do bagażnika, zrzutka na paliwo",
     googleMapsUrl: "https://maps.app.goo.gl/...",
     color: "#1d6b44" // Opcjonalny kolor trasy na mapie
   },

   --- WZÓR OSOBY SZUKAJĄCEJ PODWÓZKI (do tablicy `passengers`) ---
   {
     id: "pasazer-unikalne-id",
     name: "Imię / Nick",
     contact: "Discord: @nick",
     from: "Miasto / stacja",
     fromCoords: [52.4064, 16.9252],
     dates: "7.11 po 15:00 – 11.11",
     note: "Mogę podjechać pociągiem do Katowic lub Wrocławia",
     googleMapsUrl: "https://maps.app.goo.gl/..."
   },

   --- WZÓR PUNKTU W POBLIŻU (stacja / sklep / przystanek do `pois`) ---
   {
     type: "station", // "station" (🚆), "shop" (🛒), "bus" (🚌), "other" (📍)
     name: "Nazwa miejsca",
     distance: "300 m",
     badge: "Najbliżej!", // Opcjonalna złota etykieta (możesz usunąć)
     note: "Krótka wskazówka dojścia",
     coords: [49.7098, 18.8212],
     url: "https://maps.app.goo.gl/..."
   }
============================================================================ */

const CAMP_DATA = {
  // 1. GŁÓWNE INFORMACJE DO BANNERU
  camp: {
    pageTitle: "OdwykCamp — Muzeum Biblii w Ustroniu",
    bannerTitle: "OdwykCamp",
    subtitle: "Zgromadzenie w Muzeum Biblii — Ustroń (DEMO)",
    description:
      "Doroczny zjazd znajomych na rozmowy, wspólny czas, spacery po Beskidach i zero pośpiechu. Poniżej sprawdzisz kto skąd jedzie, wolne miejsca w autach oraz dojazd pociągiem.",
    tiles: [
      {
        icon: "📅",
        label: "Termin",
        value: "7–15 listopada (demo)"
      },
      {
        icon: "📍",
        label: "Miejsce",
        value: "ul. 3 Maja 49, Ustroń",
        url: "https://maps.app.goo.gl/KCVVpaCDDtjHfSYz5"
      },
      {
        icon: "🛏️",
        label: "Noclegi",
        value: "9 pokoi (22+ miejsca)"
      },
      {
        icon: "💰",
        label: "Koszt orientacyjny",
        value: "od 200 zł + 30–40 zł/dzień"
      }
    ]
  },

  // 2. CEL PODRÓŻY (PINEZKA GŁÓWNA NA MAPIE)
  meetingPoint: {
    name: "Muzeum Biblii (OdwykCamp)",
    address: "ul. 3 Maja 49, 43-450 Ustroń",
    coords: [49.710108, 18.820437],
    url: "https://maps.app.goo.gl/KCVVpaCDDtjHfSYz5"
  },

  // 3. KIEROWCY (WYŚWIETLANI PIERWSI W TABELI + TRASA SAMOCHODOWA NA MAPIE)
  drivers: [
    {
      id: "drv-marek",
      name: "Marek",
      contact: "Discord: @marek_wawa",
      from: "Warszawa (Centrum)",
      fromCoords: [52.2297, 21.0122],
      stops: [
        { name: "Katowice (Dworzec PKP)", coords: [50.2584, 19.0175] }
      ],
      seatsTotal: 4,
      seatsFree: 2,
      dates: "7.11 (8:00) – 11.11 (16:00)",
      note: "Jadę S8 i A1, mogę zgarnąć kogoś z Katowic.",
      googleMapsUrl: "https://maps.app.goo.gl/KCVVpaCDDtjHfSYz5",
      color: "#1d6b44"
    },
    {
      id: "drv-kasia",
      name: "Kasia i Tomek",
      contact: "Discord: @kasia_krk",
      from: "Kraków (Główny)",
      fromCoords: [50.0677, 19.9449],
      stops: [],
      seatsTotal: 3,
      seatsFree: 1,
      dates: "7.11 (15:30) – 10.11 (18:00)",
      note: "Jedziemy przez Bielsko-Białą, jedno miejsce z tyłu.",
      googleMapsUrl: "https://maps.app.goo.gl/KCVVpaCDDtjHfSYz5",
      color: "#0e7490"
    },
    {
      id: "drv-piotr",
      name: "Piotr",
      contact: "Discord: @piotr_wro",
      from: "Wrocław",
      fromCoords: [51.1079, 17.0385],
      stops: [
        { name: "Bielsko-Biała", coords: [49.8224, 19.0584] }
      ],
      seatsTotal: 4,
      seatsFree: 0,
      dates: "8.11 – 12.11",
      note: "Komplet w aucie, ale chętnie pojadę w kolumnie.",
      googleMapsUrl: "https://maps.app.goo.gl/KCVVpaCDDtjHfSYz5",
      color: "#6d28d9"
    }
  ],

  // 4. SZUKAJĄCY PODWÓZKI (WYŚWIETLANI POD KIEROWCAMI + INNY ZNACZNIK NA MAPIE)
  passengers: [
    {
      id: "pax-ania",
      name: "Ania",
      contact: "Discord: @ania_poznan",
      from: "Poznań",
      fromCoords: [52.4064, 16.9252],
      dates: "7.11 – 11.11",
      note: "Szukam auta z Poznania albo mogę podjechać pociągiem do Katowic / Wrocławia.",
      googleMapsUrl: "https://maps.app.goo.gl/5p7u79fQdbxqG8SH6"
    },
    {
      id: "pax-michal",
      name: "Michał",
      contact: "Discord: @michal_ldz",
      from: "Łódź (Fabryczna)",
      fromCoords: [51.7687, 19.4812],
      dates: "7.11 po 10:00 – 11.11",
      note: "Mam mały plecak, dorzucam się do paliwa.",
      googleMapsUrl: "https://maps.app.goo.gl/9EkTJ2MWAeFiSeNy7"
    }
  ],

  // 5. POBLISKIE STACJE, SKLEPY I PUNKTY (NA MAPIE + LISTA POD SPODEM)
  pois: [
    {
      type: "station",
      name: "Stacja Ustroń Brzegi",
      distance: "~300 m",
      badge: "Najbliżej!",
      note: "Z peronu w prawo, w prawo i jeszcze raz w prawo.",
      coords: [49.709818, 18.821219],
      url: "https://maps.app.goo.gl/9EkTJ2MWAeFiSeNy7"
    },
    {
      type: "shop",
      name: "Sklep spożywczy (centrum / okolica)",
      distance: "~750 m",
      note: "Podstawowe zakupy spożywcze w zasięgu 10 minut spacerem.",
      coords: [49.7165, 18.8168],
      url: "https://maps.app.goo.gl/KCVVpaCDDtjHfSYz5"
    },
    {
      type: "station",
      name: "Stacja Ustroń Zdrój",
      distance: "~1,5 km",
      note: "Zatrzymują się tu pociągi dalekobieżne z głębi kraju.",
      coords: [49.721228, 18.815631],
      url: "https://maps.app.goo.gl/5p7u79fQdbxqG8SH6"
    },
    {
      type: "station",
      name: "Stacja Ustroń Polana",
      distance: "~1,7 km",
      note: "Kolejny przystanek kolejowy w kierunku Wisły.",
      coords: [49.696631, 18.829846],
      url: "https://maps.app.goo.gl/Lwf4GzTxte3RvhJL6"
    },
    {
      type: "station",
      name: "Stacja Ustroń",
      distance: "~2,5 km",
      note: "Główna stacja w centrum Ustronia.",
      coords: [49.727909, 18.803010],
      url: "https://maps.app.goo.gl/vhWEwLNY78LSpvSN7"
    }
  ],

  // 6. KONTAKT DO GOSPODARZA I DISCORD
  contact: {
    hostTitle: "Chcesz przyjechać lub zapytać? Napisz do Wojtka!",
    hostText: "Daj znać ile osób planuje przyjazd i w jakich dniach będziecie.",
    hostButtonLabel: "Napisz maila do gospodarza",
    hostEmail: "wojtek@pp.org.pl",
    discordTitle: "Rozmowy o OdwykCamp i umawianie podwózek",
    discordText: "Wpadnij na kanał #obozy na Discordzie, żeby dogadać transport i szczegóły.",
    discordButtonLabel: "Dołącz na #obozy (Discord)",
    discordUrl: "https://discord.gg/PBTQbRYrj6"
  },

  // 7. INFORMACJE O MIEJSCU I WARUNKACH
  infoCards: [
    {
      title: "🛏️ „Książka do poduszki” — noclegi",
      intro: "Na piętrze Muzeum znajduje się <strong>9 wygodnych pokoi</strong> (co najmniej 22 miejsca łącznie):",
      bullets: [
        "<strong>7 pokoi dwuosobowych:</strong> prywatna łazienka, aneks kuchenny, książki i TV.",
        "<strong>2 pokoje rodzinne:</strong> główna sypialnia + dodatkowy pokój."
      ]
    },
    {
      title: "💰 Koszty pobytu i zrzutka",
      intro: "Ceny zaczynają się od <strong>200–300 zł</strong> (za wejście do pokoju) + <strong>30–40 zł</strong> za każdy dzień pobytu.",
      bullets: [
        "<strong>Mniejszy budżet?</strong> Śmiało napisz — nikt nie zostanie z tyłu z powodu kasy.",
        "<strong>Większy budżet?</strong> Hojne wsparcie pomaga wykańczać dużą salę Muzeum Biblii."
      ]
    }
  ],

  directions: [
    {
      title: "🚶 Pieszo z Rynku / centrum",
      text: "Około 1,3 km (ok. 15 minut spacerem). Z rynku kieruj się główną ulicą na południe."
    },
    {
      title: "🚶 Z dzielnicy uzdrowiskowej",
      text: "Około 2,4 km (ok. 33 minuty) wzdłuż Wisły na południe, przez park i ok. 300 m za komisariatem."
    },
    {
      title: "🚘 Samochodem (DW 941)",
      text: "Z obwodnicy za Ustroniem-Polaną zjedź na centrum na północ. Ok. 150 m za stacją UNIWAR skręć w prawo na parking."
    },
    {
      title: "🅿️ Parking i autobus",
      text: "Przed budynkiem jest duży, darmowy parking. Przystanek autobusowy Ustroń-Brzegi znajduje się tuż pod wejściem."
    }
  ],

  footerText: "OdwykCamp • Muzeum Biblii w Ustroniu • ul. 3 Maja 49"
};