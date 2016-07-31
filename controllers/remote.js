const forever = require('forever');
const spawn = require('child_process').spawn;
const express = require('express');
const router = express.Router();

function parseProcesses(processes) {
    // la prima linea contiente l'intestazione dei campi
    return processes.split('\n').slice(1).map(line => {
        // i valori sono separati da spazi
        const values = line.split(/\s+/);
        return {
            "uid": values[1],
            "command": values[2],
            "script": values[3],
            "forever": values[4],
            "pid": values[5]
        };
    });
}

router.get('/list', (req, res) => {
    forever.list(true, (err, processes) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.json(parseProcesses(processes || ''));
        }
    });
});

router.get('/stop', (req, res) => {
    spawn('forever', ['stop', 'app.js']);
    res.status(200).send('ok');
});

router.get('/restart', (req, res) => {
    spawn('forever', ['restart', 'app.js']);
    res.status(200).send('ok');
});

router.get('/', (req, res) => {
    forever.list(true, (err, processes) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.render('remote.mustache', { "processes": parseProcesses(processes || '') });
        }
    });
});

module.exports = router;
