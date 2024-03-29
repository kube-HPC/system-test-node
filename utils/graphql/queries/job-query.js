
const { gql } = require('graphql-request')
const JOB_QUERY = gql`
  query jobsAggregatedList(
    $experimentName: String
    $pipelineName: String
    $algorithmName: String
    $pipelineStatus: String
    $datesRange: Range
    $cursor: String
    $limit: Int
  ) {
    jobsAggregated(
      experimentName: $experimentName
      pipelineName: $pipelineName
      algorithmName: $algorithmName
      pipelineStatus: $pipelineStatus
      datesRange: $datesRange
      cursor: $cursor
      limit: $limit
    ) {
      jobs {
        key
        status {
          pipeline
          level

          status
          data {
            progress
            details
            states {
              succeed
              failed
              stopped
              active
              creating
              preschedule
              pending
              skipped
              stalled
              warning
            }
          }
        }
        cursor
        timeTook
        results {
          startTime
          pipeline
          status
          timestamp
          timeTook
          data {
            progress
            details
            states {
              succeed
            }
            storageInfo {
              path
              size
            }
          }
          name
        }
        pipeline {
          name
          experimentName
          kind
          priority
          startTime
          types
          triggers{cron{enabled}}
        }
      }
      cursor
    }
  }
`;


module.exports = JOB_QUERY;
