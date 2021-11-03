curl http://localhost:8080/documentation/yaml -o ./openapi.yaml && \
docker run --rm \
  -v ${PWD}:/local openapitools/openapi-generator-cli generate \
  -i /local/openapi.yaml \
  --skip-validate-spec \
  -g typescript-axios \
  -o /local/src/client