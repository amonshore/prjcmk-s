const forever = require('forever'),
    spawn = require('child_process').spawn,
    process = require('process'),
    express = require('express'),
    router = express.Router();

/**
 * Elabora il risultato di forever.list()
 *
 * @param      {string}  processes  risultato di forever.list()
 * @return     {array}  array di oggetti processo
 */
function parseProcesses(processes) {
    // la prima linea contiente l'intestazione dei campi
    return processes.split('\n').slice(1).map(line => {
        // <index> <uid> <command> <script> <forever> <pid>
        // [0] L2sH "C:\xxx\node.exe" C:\xxx\prjcmk-s\app.js 5136    7204
        const values = /(\[(\d+)\])\s+([^\s]+)\s+((\"(.+)\")|([^\s]+))\s+((\"(.+)\")|([^\s]+))\s+(\d+)\s+(\d+)/.exec(line);
        return {
            "index": +values[2],
            "uid": values[3],
            "command": values[4] || values[5],
            "script": values[10] || values[11],
            "forever": values[12],
            "pid": values[13]
        };
    });
}

/**
 * Restituisce l'elenco dei processi in esecuzione tramite forever.
 * 
 * @return     {array} array di oggetti process
 */
router.get('/list', (req, res) => {
    forever.list(true, (err, processes) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.json(parseProcesses(processes || ''));
        }
    });
});

/**
 * Termina un processo eseguito con forever tramite il suo pid.
 * 
 * @param      {string} pid identificativo del processo da terminare, 
 *                          se non specificato verrà considerato il 
 *                          processo corrente
 */
router.get('/stop', (req, res) => {
    const pid = req.params.pid || process.pid;
    console.log('*** try stop', pid);
    // carico tutti i processi gestiti da forever
    forever.list(true, (err, processes) => {
        if (err) {
            res.status(500).send(err);
        } else {
            // cerco il processo con il pid richiesto (serve l'indice del processo)
            const proc = parseProcesses(processes || '').find(p => p.pid == pid);
            console.log('*** found', JSON.stringify(proc));
            if (proc) {
                forever.stop(proc.index);
                res.status(200).send('ok');
            } else {
                res.status(404).send('Process not found');
            }
        }
    });
});

/**
 * Riavvia un processo eseguito con forever tramite il suo pid. 
 * 
 * @param      {string} pid identificativo del processo da terminare, 
 *                          se non specificato verrà considerato il 
 *                          processo corrente
 */
router.get('/restart', (req, res) => {
    const pid = req.params.pid || process.pid;
    console.log('*** forevere restart', pid);
    spawn('forever', ['restart', pid]);
    res.status(200).send('ok');
});

/**
 * Restituisce il pid del processo corrente.
 */
router.get('/pid', (req, res) => {
    res.json({ "pid": process.pid });
});

/**
 * Restituisce la pagina "remote" renderizzata.
 */
router.get('/', (req, res) => {
    res.render('remote.mustache', { "pid": process.pid });
});

module.exports = router;
