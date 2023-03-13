
const { gql } = require('graphql-request')

const ALGORITHM_BY_VERSION_QUERY = gql`
  query AlgorithmsByVersion($name: String!, $version: String!) {
    algorithmsByVersion(name: $name, version: $version)
  }
`;


module.exports = ALGORITHM_BY_VERSION_QUERY;
