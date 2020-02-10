require('dotenv').config()


const getDriverIdByJobId = async (jobId) => {

    return (new Promise((resolve, reject) => {
        const url = process.env.BASE_URL

        var socket = require('socket.io-client')(url, {
            transports: ['websocket'],
            // secure: true,
            path: '/hkube/monitor-server/socket.io',  
            reconnect: true,
            rejectUnauthorized: false
        })

        socket.on('connect', function () {
            socket.emit('experiment-register', { name: 'experiment:main', lastRoom: null });
        });
        socket.on('PROGRESS', async function (data) {
            // fs.writeFileSync('data.json', JSON.stringify(data))
            const d = (JSON.stringify(data))

            const drivers = data.discovery['pipeline-driver']
            const result = drivers.filter(driver => driver.jobId === jobId)
            socket.disconnect()

            resolve(result)
        });



        socket.on('reconnect', function () {
            console.log('disconnected')
        });

        socket.on('connect_error', (err) => {
            console.log(err)
        })

    }))
}



module.exports = {
    getDriverIdByJobId
}