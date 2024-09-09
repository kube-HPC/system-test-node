const { gql } = require('graphql-request')

const ALL_ALGORITHMS_QUERY = gql`
query Algorithms {
  algorithms {
    list {
      name
      unscheduledReason
      cpu
      created
      entryPoint
      env
      gpu
      mem
      minHotWorkers
      modified
      reservedMemory
      type
      algorithmImage
      version
      debugUrl
      errors
      options {
        debug
        pending
        batchTolerance
        progressVerbosityLevel
        ttl
        concurrentPipelines {
          amount
          rejectOnFailure
        }
      }
      gitRepository {
        gitKind
        url
        branchName
        webUrl
        cloneUrl
        commit {
          id
          timestamp
          message
        }
      }
      buildStats {
        total
        pending
        creating
        active
        completed
        failed
        stopped
      }
    }
    algorithmsCount
  }
}
`;

module.exports = ALL_ALGORITHMS_QUERY;
