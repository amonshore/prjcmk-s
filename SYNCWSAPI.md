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
7. il server invia il messaggio "sync start" alla pagina web e all'app
8. l'app invia tutti i dati memorizzati sul dispositivo tramite i messaggi "put comics" e "put releases"
9. il server avvisa la pagina web dei nuovi dati con il messaggio "comics updated" e "releases updated"

client => server
----------------

### wait for sync
* inviato dalla web app, indica che è in attesa che la sincronizzaione venga attivata, il server risponderà con il messaggio "sync start" o "sync timeout"
* data: *nessuno*

### put comics
* aggiunge o modifica uno o più comics (verranno modificati solo gli attributi effettivamente passati in "data")
* non vengono aggiornate le release
* data: [{ cid, name, ... }]

### remove comics
* elimina uno o più comics
* data: [cid]

### put releases
* aggiunge o modifica uno o più release (verranno modificati solo gli attributi effettivamente passati in "data"), se il comics di riferimento non esiste la release viene scartata
* data: [{ cid, number, ... }]

### remove releases
* elimina uno o più releases
* data: [{ cid, number }]

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