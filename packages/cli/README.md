@qore/cli
=========

qore cli

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@qore/cli.svg)](https://npmjs.org/package/@qore/cli)
[![Downloads/week](https://img.shields.io/npm/dw/@qore/cli.svg)](https://npmjs.org/package/@qore/cli)
[![License](https://img.shields.io/npm/l/@qore/cli.svg)](https://github.com/rrmdn/cli/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @feedloop/qore-cli
$ qore COMMAND
running command...
$ qore (-v|--version|version)
@feedloop/qore-cli/0.1.28 linux-x64 node-v14.8.0
$ qore --help [COMMAND]
USAGE
  $ qore COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`qore codegen`](#qore-codegen)
* [`qore create-project [NAME]`](#qore-create-project-name)
* [`qore export-schema [FILE]`](#qore-export-schema-file)
* [`qore help [COMMAND]`](#qore-help-command)
* [`qore login`](#qore-login)
* [`qore set-project`](#qore-set-project)

## `qore codegen`

```
USAGE
  $ qore codegen

OPTIONS
  --org=org          [default: mAQjA9ypixnsBDE] organization id
  --path=path        path
  --project=project  [default: U1tJvy7XhgOuVmI] project id
  --token=token      [default: 92864688-7d30-41b8-8a57-1ab8df0e77f3] organization id

EXAMPLE
  $ qore codegen --project projectId --org orgId
```

_See code: [src/commands/codegen.ts](https://github.com/rrmdn/cli/blob/v0.1.28/src/commands/codegen.ts)_

## `qore create-project [NAME]`

```
USAGE
  $ qore create-project [NAME]

OPTIONS
  -t, --template=template  [default: todo-list-typescript] qore project template
  --org=org                [default: mAQjA9ypixnsBDE] organization id
  --token=token            [default: 92864688-7d30-41b8-8a57-1ab8df0e77f3] organization id

EXAMPLE
  $ qore create-project --template todo-list-typescript your-project-name
```

_See code: [src/commands/create-project.ts](https://github.com/rrmdn/cli/blob/v0.1.28/src/commands/create-project.ts)_

## `qore export-schema [FILE]`

```
USAGE
  $ qore export-schema [FILE]

OPTIONS
  --org=org          [default: mAQjA9ypixnsBDE] organization id
  --path=path        path
  --project=project  [default: U1tJvy7XhgOuVmI] project id
  --token=token      [default: 92864688-7d30-41b8-8a57-1ab8df0e77f3] organization id

EXAMPLE
  $ qore export-schema
```

_See code: [src/commands/export-schema.ts](https://github.com/rrmdn/cli/blob/v0.1.28/src/commands/export-schema.ts)_

## `qore help [COMMAND]`

```
USAGE
  $ qore help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.0/src/commands/help.ts)_

## `qore login`

```
USAGE
  $ qore login

OPTIONS
  -p, --email=email  project id

EXAMPLE
  $ qore login
```

_See code: [src/commands/login.ts](https://github.com/rrmdn/cli/blob/v0.1.28/src/commands/login.ts)_

## `qore set-project`

```
USAGE
  $ qore set-project

OPTIONS
  --token=token  [default: 92864688-7d30-41b8-8a57-1ab8df0e77f3] organization id

EXAMPLE
  $ qore set-project
```

_See code: [src/commands/set-project.ts](https://github.com/rrmdn/cli/blob/v0.1.28/src/commands/set-project.ts)_
<!-- commandsstop -->
