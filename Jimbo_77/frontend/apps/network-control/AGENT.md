Temat: Integracja projektu Jimbo\_net\_cntrl z Apex Agent (MCP)



Działaj jako ekspert od systemów agentowych i protokołu MCP (Model Context Protocol). Moim celem jest połączenie mojej aplikacji Jimbo\_net\_cntrl (służącej do kontroli sieci lokalnej) z narzędziem Apex Agent.



Wymagania techniczne:



Architektura: Stwórz serwer MCP w Pythonie lub Node.js, który będzie pośredniczył między logiką kontroli sieci Jimbo\_net\_cntrl a API Apex Agenta.



Integracja Tools: Wykorzystaj 69+ narzędzi Apex Agenta (nawigacja, DOM, zrzuty ekranu, dostęp do DevTools), aby agent mógł wizualizować stan sieci w przeglądarce i reagować na błędy w konsoli.



Automatyzacja: Napisz kod serwera MCP, który wystawi funkcję control\_network\_via\_browser, pozwalającą agentowi na otwieranie lokalnych paneli administracyjnych routera/urządzeń i wykonywanie na nich akcji (klikanie, wpisywanie danych) przez Apex Agenta.



Bezpieczeństwo: Upewnij się, że komunikacja odbywa się lokalnie, zgodnie z architekturą "Privacy First" Apex Agenta.



Zadanie:



Zaprojektuj strukturę pliku mcp.json do konfiguracji połączenia.



Napisz szkielet serwera MCP (np. przy użyciu biblioteki @modelcontextprotocol/sdk), który integruje specyficzne funkcje Apex Agenta.



Wyjaśnij, jak zarejestrować ten serwer, aby był widoczny w panelu Apex Agent w Chrome.

