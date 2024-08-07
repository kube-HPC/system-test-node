const { gql } = require('graphql-request')

const WORKERS_ALL_QUERY = gql`
  query Worker {
    discovery {
      taskExecutor {
        actual {
          total
          stats {
            algorithmName
            count
            status
          }
        }
      }

      worker {
        workerStatus
        isMaster
        workerStartingTime
        jobCurrentTime
        workerPaused
        hotWorker
        error
        workerId
        algorithmName
        podName
        streamingDiscovery {
          host
          port
        }
      }
    }
  }
`;

module.exports = { WORKERS_ALL_QUERY };
