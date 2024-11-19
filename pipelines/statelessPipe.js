const descriptor =
{
  name: "statelessPipe",
  kind: "stream",
  flowInput: {
    msgPerSec: 80,
    delay: 0.03,
    rate: 100
  },
  streaming: {
    flows: {
      analyze: "A >> B"
    },
    defaultFlow: "analyze"
  },
  options: {
    batchTolerance: 80,
    concurrentPipelines: {
      amount: 10,
      rejectOnFailure: true
    },
    ttl: 3600,
    progressVerbosityLevel: "info"
  },
  priority: 3,
  nodes: [
    {
      kind: "algorithm",
      stateType: "stateful",
      nodeName: "A",
      algorithmName: "stayuptestalg",
      input: [
        {
          totalMsg: 1000000,
          rng: 10,
          burst: 2,
          burstDuration: 30,
          burstTime: 160,
          sleepTime: [
            7,
            60
          ],
          error: false,
          size: 1,
          ping: 30
        }
      ],
      retry: {
        policy: "OnCrash",
        limit: 3
      },
      ttl: 0
    },
    {
      kind: "algorithm",
      stateType: "stateless",
      nodeName: "B",
      algorithmName: "yellow-alg",
      minStatelessCount: 3,
      input: [],
      retry: {
        policy: "OnCrash",
        limit: 3
      },
      ttl: 0
    }
  ]
}


const input = {
  flowInput: {

  }
}

module.exports = { descriptor, input }