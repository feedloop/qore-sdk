curl https://stg-qore-data.qore.one/documentation/yaml -o ./openapi.yaml && \
docker run --rm \
  -v ${PWD}:/local openapitools/openapi-generator-cli generate \
  -i /local/openapi.yaml \
  --skip-validate-spec \
  -g typescript-axios \
  -o /local/src/client