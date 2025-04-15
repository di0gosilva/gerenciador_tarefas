const fs = require('fs')
const path = require('path')

const logPath = path.join(__dirname, '../logs.txt')

function log(msg) {
    const timestamp = new Date().toISOString()
    fs.appendFileSync(logPath, `[${timestamp}] ${msg}\n`)
}

module.exports = log