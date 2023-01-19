const { gql } = require('graphql-request')

const PIPELINE_DRIVER_QUERY = gql`
query PipelineDriver {
  discovery {
    pipelineDriver {
      driverId
      podName
      idle
      paused
      status
      max
      capacity
      jobs {
        jobId
        active
        pipelineName
      }
    }
  }
}
`;

module.exports = PIPELINE_DRIVER_QUERY;
