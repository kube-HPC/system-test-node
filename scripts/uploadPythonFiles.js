const request = require('request');
// const rp = require('request-promise');
const fse = require('fs')
const config = require('../config/config')
const path = require('path');
const {
    write_log
} = require('../utils/misc_utils')

const {
    idGen
} = require('../utils/results')

const uploadFile = (code, algName, entry) => {

    const data = {
        name: algName,
        env: 'python',
        cpu: 0.5,
        gpu: 0,
        mem: '512Mi',
        entryPoint: entry,
        minHotWorkers: 0,
        version: idGen()
    }

    const codeCwd = path.join(process.cwd(), code)

    const file = fse.createReadStream(codeCwd)

    const options = {
        method: 'POST',
        uri: `${config.apiServerUrl}/store/algorithms/apply`,
        formData: {
            payload: JSON.stringify(data),
            file: file
        }
    }

    request(options, (err, res, body) => {
        if (err) {
            write_log(err)
        }
        write_log(body)
    })

}

const deleteAlg = (algo) => {
    const options = {
        method: 'DELETE',
        uri: `${config.apiServerUrl}/store/algorithms/${algo.name}`,
    }

    request(options, (err, res, body) => {
        if (err) {
            write_log(err, 'error')
        } else {
            uploadFile(algo.path, algo.name, algo.entry)

        }
    })
}


const main = () => {

    const algos = [{
        path: `additionalFiles/addpy.tar.gz`,
        name: 'addpy',
        entry: 'addpy.py'
    },
    {
        path: `additionalFiles/subpy.tar.gz`,
        name: 'subpy',
        entry: 'subpy.py'
    },
    {
        path: `additionalFiles/multpy.tar.gz`,
        name: 'multpy',
        entry: 'multpy.py'
    }
    ]

    for (let alg of algos) {
        deleteAlg(alg)
        // write_log(res.body)
    }

    // for (let alg of algos) {
    //     uploadFile(alg.path, alg.name, alg.entry)
    // }

}


main()