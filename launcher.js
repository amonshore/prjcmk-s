/**
 * prjcmk-s launcher by narsenico
 * applicazione di lancio di prjcmk-s
 */
"use strict";

const fs = require('fs'),
    dateFormat = require('dateformat'),
    forever = require('forever'),
    spawn = require('child_process').spawn,
    chokidar = require('chokidar'),
    process = require('process');
// riferimento al processo node lanciato con 'startserver'
let prapp;

function log(...msgs) {
    console.log(dateFormat('[ HH:MM:ss.l ]'), ...msgs);
}

// se il file cambia eseguo i comandi in base al contenuto
// - updateall: eseguo npm i (solo se il server è stoppato)
// - stopserver: interrompo il server
// - startserver: avvio il server
function onparse(filename) {
    fs.readFile(filename, 'utf-8', (err, data) => {
        if (err) {
            console.error(err);
        } else {
            // parsing del contenuto
            data.split(/[\r\n]/).forEach((cmd) => {
                if (cmd === 'startserver' && !prapp) {
                    log('starting server (app.js)');
                    prapp = spawn('node', ['app.js']);
                    prapp.stdout.on('data', (data) => {
                        console.log(`[app.js] ${data}`);
                    });
                    prapp.stderr.on('data', (data) => {
                        console.log(`[app.js] ${data}`);
                    });
                } else if (cmd === 'stopserver' && prapp) {
                    log('stopping server (app.js)');
                    prapp.kill('SIGTERM');
                    prapp = null;
                } else if (cmd === 'updateall' && !prapp) {
                    log('starting npm i');
                    const prnpm = spawn('npm', ['i']);
                    prnpm.stdout.on('data', (data) => {
                        console.log(`[npm] ${data}`);
                    });
                    prnpm.stderr.on('data', (data) => {
                        console.log(`[npm] ${data}`);
                    });
                    prnpm.on('close', (code) => {
                        log('npm exit with code', code);
                    });
                } else if (cmd) {
                    log('command not valid: ', cmd);
                }
            });
        }
    });
}

// rilascio le risorse
function onexit() {
    if (prapp) {
        prapp.kill('SIGTERM');
        prapp = null;
    }
}

// il file viene creato in automatico durante il "prestart" (vedi package.json)
// alla cancellazione di un file viene scatenato l'evento rename
chokidar.watch('launcher.src')
    .on('add', filename => onparse(filename))
    .on('change', filename => onparse(filename));
// rilascio le risorse quando questo processo viene chiuso
// TODO: non funziona o funziona male: la porta TCP aperta da app.js rimane in uso
process
    .on('close', onexit)
    .on('exit', onexit)
    .on('stop', onexit)
    .on('SIGINT', onexit)
    .on('SIGTERM', onexit);
