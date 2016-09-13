Sincronizzazione - WebSocket API
================================

* server: web server
* client: web app, android app
* url: ws://**&lt;host&gt;**:**&lt;port&gt;**/wsh/**&lt;sid&gt;**
* formato messaggi: { "message": **message**, "data": **data** }

processo
--------
1. la pagina web richiede un nuovo sid
2. la pagina web renderizza il sid sottoforma di qrcode
3. la pagina web invia il messaggio "wait for sync" al server
4. il server inizia il conto alla rovescia in attesa dell'attivazione
5. l'app scansione il qrcode
6. l'app apre una connessione con il server
7. l'app invia il messaggio "hello" con tutti i dati
8. il server invia il messaggio "sync start" alla pagina web e all'app
9. la pagina web carica la nuova pagina con l'elenco dei comics

W => S conn
W => S wait for sync
A => S conn
A => S hello (data)
S => * sync start

9. all'uscita della pagina web invia il messaggio "stop sync" per segnalare che l'attività è terminata

client => server
----------------

### wait for sync
* inviato dalla web app, indica che è in attesa che la sincronizzaione venga attivata, il server risponderà con il messaggio "sync start" o "sync timeout"
* data: *nessuno*

### hello
* messaggio di presentazione dal parte dell'app android che invia tutti i dati in suo possesso e altre informazioni
* contrariamente a "put comics" insieme ai comics vengono invate anche le release
* data: [{ appVersion, sdkVersion, comics: [{ cid, name, ..., releases: [] }] }]

### put comics
* aggiunge o modifica uno o più comics (verranno modificati solo gli attributi effettivamente passati in "data")
* non vengono aggiornate le release
* data: [{ cid, name, ... }]

### remove comics
* elimina uno o più comics (oppure tutti con data = "*")
* data: [cid]
* data: "*"

### put releases
* aggiunge o modifica uno o più release (verranno modificati solo gli attributi effettivamente passati in "data"), se il comics di riferimento non esiste la release viene scartata
* data: [{ cid, number, ... }]

### remove releases
* elimina uno o più releases (oppure tutti con data = "*")
* data: [{ cid, number }]
* data: "*"

### stop sync
* interrompe la sincronizzazione
* data: *nessuno*

server => client
----------------

### sync start
* avverte i client che la sincronizzazione è attiva
* data: *nessuno*

### sync timeout
* avverte i client che è passato troppo tempo dall'ultimo invio di dati da uno dei client
* data: *nessuno*

### sync end
* avverte i client che la sincronizzazione è terminata
* data: *nessuno*

### comics updated
* avverte i client che uno o più comics sono stati modificati
* data: [{ cid, name, ... }]

### comics removed
* avverte i client che uno o più cocmis sono stati rimossi
* data: [number]

### releases updated
* avverte i client che uno o più release sono state modificate
* data: [{ cid, number, ... }]

### releases removed
* avverte i client che uno o più release sono state rimosse
* data: [{ cid, number }]