# qore-sdk

[![Gitter](https://badges.gitter.im/feedloop/qore-sdk.svg)](https://gitter.im/feedloop/qore-sdk?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

## Contributing

### Getting Started

On root directory, run the following commands:

1. run yarn install
2. run yarn lerna bootstrap
3. run yarn lerna run build
4. run yarn lerna link

### Publishing

To publish packages, run the following commands:

1. Make sure your changes is already committed to the main branch
2. Login to npm as ajudan by running npm login. ask the admin for credentials
3. On root directory, run yarn lerna publish patch
4. Push the main branch to the remote origin
