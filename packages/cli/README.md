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
$ npm install -g @qorebase/cli
$ qore COMMAND
running command...
$ qore (-v|--version|version)
@qorebase/cli/1.0.2 linux-x64 node-v16.14.2
$ qore --help [COMMAND]
USAGE
  $ qore COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`qore context`](#qore-context)
* [`qore help [COMMAND]`](#qore-help-command)
* [`qore login`](#qore-login)
* [`qore logout`](#qore-logout)
* [`qore open-dashboard`](#qore-open-dashboard)
* [`qore open-doc`](#qore-open-doc)
* [`qore ping`](#qore-ping)

## `qore context`

Set base url for project access

```
USAGE
  $ qore context

EXAMPLE
  $ qore set-url
```

_See code: [src/commands/context.ts](https://github.com/rrmdn/cli/blob/v1.0.2/src/commands/context.ts)_

## `qore help [COMMAND]`

display help for qore

```
USAGE
  $ qore help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.3.1/src/commands/help.ts)_

## `qore login`

Login to qore cli

```
USAGE
  $ qore login

OPTIONS
  --adminSecret=adminSecret  admin secret
  --url=url                  url

EXAMPLE
  $ qore login
```

_See code: [src/commands/login.ts](https://github.com/rrmdn/cli/blob/v1.0.2/src/commands/login.ts)_

## `qore logout`

Logout from qore cli

```
USAGE
  $ qore logout

EXAMPLE
  $ qore logout
```

_See code: [src/commands/logout.ts](https://github.com/rrmdn/cli/blob/v1.0.2/src/commands/logout.ts)_

## `qore open-dashboard`

Open project dashboard on browser

```
USAGE
  $ qore open-dashboard

EXAMPLE
  $ qore open-dashboard
```

_See code: [src/commands/open-dashboard.ts](https://github.com/rrmdn/cli/blob/v1.0.2/src/commands/open-dashboard.ts)_

## `qore open-doc`

Open project doc on browser

```
USAGE
  $ qore open-doc

EXAMPLE
  $ qore open-doc
```

_See code: [src/commands/open-doc.ts](https://github.com/rrmdn/cli/blob/v1.0.2/src/commands/open-doc.ts)_

## `qore ping`

Ping

```
USAGE
  $ qore ping

EXAMPLE
  $ qore ping
```

_See code: [src/commands/ping.ts](https://github.com/rrmdn/cli/blob/v1.0.2/src/commands/ping.ts)_
<!-- commandsstop -->
