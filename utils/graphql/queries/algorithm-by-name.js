
const { gql } = require('graphql-request')

const ALGORITHM_BY_NAME_QUERY = gql`
  query AlgorithmsByName($name: String!) {
    algorithmsByName(name: $name)
  }
`;


module.exports = ALGORITHM_BY_NAME_QUERY;
