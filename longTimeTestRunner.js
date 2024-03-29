const {
    spawn
} = require('child_process');

const path = require('path');
const {
    write_log
} = require('./utils/misc_utils')


const req = async () => {
    return new Promise((resolve, reject) => {
        const ls = spawn('node', ['runTestTime.js'])

        ls.stdout.on('data', (data) => {
            write_log(data.toString(), 'result')

        })

        ls.on('messgae', (st) => {
            write_log(st)
        })

        ls.on('error', err => {
            write_log(err)
        })

        ls.on('close', () => {
            resolve()
        })

    });
}

const queue = []
let end
const delay = mili => new Promise(r => setTimeout(r, mili))
const main = async () => {
    const start = Date.now()
    const hours = 48
    end = new Date(start + (1000 * 60 * 60 * hours)).getTime()

    for (let i = 0; i < 3; i++) {
        queue.push(req())
    }

    let now = Date.now()
    while (now < end) {
        if (queue.length > 0) {
            let job
            job = queue.shift()

            job.then(() => {
                queue.push(req())
            })
        }
        await delay(100)
        now = Date.now()
    }
}




main()