import { gql } from '@apollo/client';

const ERROR_LOG_QUERY = gql`
  query ErrorLogs {
    errorLogs {
      type
      hostName
      uptime
      timestamp
      serviceName
      podName
      id
      level
      message
    }
  }
`;

module.exports = ERROR_LOG_QUERY;
