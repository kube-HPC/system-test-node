const {
    spawn
} = require('child_process');
const logger = require('./utils/logger')


const req = async () => {
    return new Promise(async (resolve, reject) => {
        const ls = spawn('node', ['runTestTime.js'])
        ls.stdout.on('data', (data) => {
            logger.info(data.toString())
            console.log(data.toString())
        })

        ls.on('close', () => {
            resolve()
        })

    });
}


const main = async () => {
    const start = Date.now()
    const hours = 12
    let end = new Date(start + (1000 * 60 * 60 * hours)).getTime()

    const promiseHandler = () => {
        const now = Date.now()

        if (now < end) {
            const p1 = req()
            const p2 = req()

            p1.then(promiseHandler)
            p2.then(promiseHandler)
        }

    }

    const p1 = req()
    const p2 = req()

    p1.then(promiseHandler)
    p2.then(promiseHandler)

    // do {
    //     await r()
    //     now = Date.now()
    // } while (now < end)


}



main()