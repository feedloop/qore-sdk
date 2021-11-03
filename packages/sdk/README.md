# Step

```
1. Jalankan qore engine
2. docker-compose -f docker-compose-standalone.yml up -d --build di qore-engine
3. ke packages/sdk, jalankan command:
   - sh generate-client.sh
   - yarn build
4. ke root: yarn lerna link(jika tidak bisa, jalankan :
   - yarn lerna add @feedloop/qore-sdk --scope=@feedloop/qore-cli)
5. ke packages/cli, jalankan masing-masing cli


```
