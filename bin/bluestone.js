#!/usr/bin/env node


const startService = require('./www')
const cli = require('../cli/cli')
const path = require('path')
const fs = require('fs').promises
const fsSync = require('fs')
const axios = require('axios').default
const config = require('../config')
function getPidPath() {
    return path.join(__dirname, 'bluestone.pid')
}

function getRuntimeInfo() {
    let runTime = {}
    let runtimePath = getPidPath()
    try {
        let runTimeInfo = fsSync.readFileSync(runtimePath)
        runTime = JSON.parse(runTimeInfo)
    } catch (error) {

    }
    return runTime
}
function serverAt(options) {
    async function start(port) {
        // Set in case npm dependencies do anything with this
        if (!process.env.NODE_ENV) {
            process.env.NODE_ENV = 'production';
        }
        let pidPath = getPidPath()
        let runtime = {
            pid: process.pid,
            port: port
        }
        startService(port)
        fs.writeFile(pidPath, JSON.stringify(runtime))

    }
    return { start }
}
try {
    const server = serverAt(cli.args);
    let bluestoneUrl = ''
    let runTime = getRuntimeInfo()
    switch (cli.command) {

        case 'start':
            process.env.port = cli.args.port
            server.start(process.env.port);
            bluestoneUrl = `http://localhost:${cli.args.port}`
            axios.get(`${bluestoneUrl}/spy`)
            //update port information based on current input
            config.app.port = process.env.port
            break;
        case 'record':
            let port = runTime.port
            bluestoneUrl = `http://localhost:${port}`
            axios.post(`${bluestoneUrl}/api/record`, { url: cli.args.url })
            break;
        case 'help':
            cli.help();
            break;
        default:
            cli.error(`Invalid command '${cli.command}'.`);
            break;
    }
}
catch (err) {
    cli.error(err.message);
}
