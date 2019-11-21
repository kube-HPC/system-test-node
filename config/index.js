const index = {
    tid_10: {
        testData1: require('../pipelines/addmult'),
        testData2: require('../pipelines/multadd')
    },
    tid_30: {
        testData1: require('../pipelines/addmult'),
        testData2: require('../pipelines/multadd')
    },
    tid_31: {
        testData1: require('../pipelines/eval-dynamic')
    },
    tid_50: {
        testData1: require('../pipelines/eval-dynamic')
    },
    tid_51: {
        testData1: require('../pipelines/eval-dynamic'),
        testData2: require('../pipelines/primesPipeline')
    },
    tid_110: {
        testData1: require('../pipelines/eval-error')
    },
    gpu_tests: {
        testData1: require('../pipelines/gpuPipeline'),
        testData2: require('../pipelines/gpuPipeline-1')
    },
    buildAlgPipe: {
        testData1: require('../pipelines/pythonPipeline')
    },
    subPipeline: {
        testData1: require('../pipelines/mainPipeDist'),
        testData2: require('../pipelines/subPipelineDist')
    },
    swaggerCalls:{
        testData1: require('../pipelines/swaggerPipeLine')
    }
}




module.exports = index