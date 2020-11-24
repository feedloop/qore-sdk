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
$ npm install -g @qore/cli
$ qore COMMAND
running command...
$ qore (-v|--version|version)
@qore/cli/0.0.0 linux-x64 node-v14.8.0
$ qore --help [COMMAND]
USAGE
  $ qore COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`qore hello [FILE]`](#qore-hello-file)
* [`qore help [COMMAND]`](#qore-help-command)

## `qore hello [FILE]`

```
USAGE
  $ qore hello [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print

EXAMPLE
  $ qore hello
  hello world from ./src/hello.ts!
```

_See code: [src/commands/hello.ts](https://github.com/rrmdn/cli/blob/v0.0.0/src/commands/hello.ts)_

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
<!-- commandsstop -->
