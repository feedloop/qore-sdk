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
@feedloop/qore-cli/2.0.0-alpha.1 darwin-x64 node-v14.15.4
$ qore --help [COMMAND]
USAGE
  $ qore COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`qore alter-column [FORMERNAME] [NEWNAME]`](#qore-alter-column-formername-newname)
* [`qore alter-permission`](#qore-alter-permission)
* [`qore alter-role [FORMERNAME] [NEWNAME]`](#qore-alter-role-formername-newname)
* [`qore alter-table [FORMERNAME] [NEWNAME]`](#qore-alter-table-formername-newname)
* [`qore context`](#qore-context)
* [`qore create-columns`](#qore-create-columns)
* [`qore create-permission`](#qore-create-permission)
* [`qore create-relation [RELATIONTYPE] [TABLEORIGIN] [TABLETARGET]`](#qore-create-relation-relationtype-tableorigin-tabletarget)
* [`qore create-roles [ROLES]`](#qore-create-roles-roles)
* [`qore create-tables [TABLESNAME]`](#qore-create-tables-tablesname)
* [`qore drop-columns [COLUMNSNAME]`](#qore-drop-columns-columnsname)
* [`qore drop-permission [ACTION]`](#qore-drop-permission-action)
* [`qore drop-relation [RELATIONTYPE] [TABLEORIGIN/TABLEONE] [TABLETARGET/TABLEMANY]`](#qore-drop-relation-relationtype-tableorigintableone-tabletargettablemany)
* [`qore drop-roles [ROLES]`](#qore-drop-roles-roles)
* [`qore drop-tables [TABLESNAME]`](#qore-drop-tables-tablesname)
* [`qore export-schema`](#qore-export-schema)
* [`qore help [COMMAND]`](#qore-help-command)
* [`qore import-schema`](#qore-import-schema)
* [`qore login`](#qore-login)
* [`qore logout`](#qore-logout)
* [`qore open-dashboard`](#qore-open-dashboard)
* [`qore ping`](#qore-ping)
* [`qore read-migrations`](#qore-read-migrations)
* [`qore rollback`](#qore-rollback)
* [`qore select [TABLENAME]`](#qore-select-tablename)
* [`qore set-url`](#qore-set-url)

## `qore alter-column [FORMERNAME] [NEWNAME]`

```
USAGE
  $ qore alter-column [FORMERNAME] [NEWNAME]

OPTIONS
  --table=table  (required) tableName

EXAMPLES
  $ qore alter-column formerName newName --table tableName
```

_See code: [src/commands/alter-column.ts](https://github.com/rrmdn/cli/blob/v2.0.0-alpha.1/src/commands/alter-column.ts)_

## `qore alter-permission`

```
USAGE
  $ qore alter-permission

OPTIONS
  --action=action        (required) action
  --condition=condition  (required) condition
  --role=role            (required) roleName
  --tables=tables        (required) tables

EXAMPLES
  $ qore alter-permission --role users --action select --condition '{"$and": [ { "title": { "$eq": "sleeping" } } ]}' 
  --tables all
  $ qore alter-permission --role users --action delete --condition  '{"$and": [ { "title": { "$eq": "add fitur login" } 
  } ]}' --tables todos,projects
```

_See code: [src/commands/alter-permission.ts](https://github.com/rrmdn/cli/blob/v2.0.0-alpha.1/src/commands/alter-permission.ts)_

## `qore alter-role [FORMERNAME] [NEWNAME]`

```
USAGE
  $ qore alter-role [FORMERNAME] [NEWNAME]

EXAMPLE
  $ qore alter-role formerName newName
```

_See code: [src/commands/alter-role.ts](https://github.com/rrmdn/cli/blob/v2.0.0-alpha.1/src/commands/alter-role.ts)_

## `qore alter-table [FORMERNAME] [NEWNAME]`

```
USAGE
  $ qore alter-table [FORMERNAME] [NEWNAME]

EXAMPLE
  $ qore alter-table formerName newName
```

_See code: [src/commands/alter-table.ts](https://github.com/rrmdn/cli/blob/v2.0.0-alpha.1/src/commands/alter-table.ts)_

## `qore context`

```
USAGE
  $ qore context

EXAMPLE
  $ qore set-url
```

_See code: [src/commands/context.ts](https://github.com/rrmdn/cli/blob/v2.0.0-alpha.1/src/commands/context.ts)_

## `qore create-columns`

```
USAGE
  $ qore create-columns

OPTIONS
  --columns=columns  (required) columnName:type
  --table=table      (required) tableName

EXAMPLE
  $ qore create-columns --table todo --columns title:text,status:boolean
```

_See code: [src/commands/create-columns.ts](https://github.com/rrmdn/cli/blob/v2.0.0-alpha.1/src/commands/create-columns.ts)_

## `qore create-permission`

```
USAGE
  $ qore create-permission

OPTIONS
  --actions=actions      (required) actions
  --condition=condition  condition
  --role=role            (required) roleName
  --tables=tables        (required) tables

EXAMPLE
  $ qore create-permission --role users --tables todos,projects --actions select,delete --condition '{"$and": []}'
```

_See code: [src/commands/create-permission.ts](https://github.com/rrmdn/cli/blob/v2.0.0-alpha.1/src/commands/create-permission.ts)_

## `qore create-relation [RELATIONTYPE] [TABLEORIGIN] [TABLETARGET]`

```
USAGE
  $ qore create-relation [RELATIONTYPE] [TABLEORIGIN] [TABLETARGET]

OPTIONS
  --relation=relation  relationName

EXAMPLE
  $ qore create-relation relationType tableOrigin tableTarget --relation personTodo
```

_See code: [src/commands/create-relation.ts](https://github.com/rrmdn/cli/blob/v2.0.0-alpha.1/src/commands/create-relation.ts)_

## `qore create-roles [ROLES]`

```
USAGE
  $ qore create-roles [ROLES]

EXAMPLE
  $ qore create-roles user,engineer
```

_See code: [src/commands/create-roles.ts](https://github.com/rrmdn/cli/blob/v2.0.0-alpha.1/src/commands/create-roles.ts)_

## `qore create-tables [TABLESNAME]`

```
USAGE
  $ qore create-tables [TABLESNAME]

ARGUMENTS
  TABLESNAME  list of table name

EXAMPLES
  $ qore create-tables todos
  $ qore create-tables todos,projects
```

_See code: [src/commands/create-tables.ts](https://github.com/rrmdn/cli/blob/v2.0.0-alpha.1/src/commands/create-tables.ts)_

## `qore drop-columns [COLUMNSNAME]`

```
USAGE
  $ qore drop-columns [COLUMNSNAME]

ARGUMENTS
  COLUMNSNAME  list of column name

OPTIONS
  --table=table  (required) tableName

EXAMPLE
  $ qore drop-columns title,status --table todos
```

_See code: [src/commands/drop-columns.ts](https://github.com/rrmdn/cli/blob/v2.0.0-alpha.1/src/commands/drop-columns.ts)_

## `qore drop-permission [ACTION]`

```
USAGE
  $ qore drop-permission [ACTION]

ARGUMENTS
  ACTION  actionName

OPTIONS
  --role=role      (required) roleName
  --tables=tables  (required) tables

EXAMPLES
  $ qore drop-permission select --role user --tables all
  $ qore drop-permission delete --role user --tables todos,projects
```

_See code: [src/commands/drop-permission.ts](https://github.com/rrmdn/cli/blob/v2.0.0-alpha.1/src/commands/drop-permission.ts)_

## `qore drop-relation [RELATIONTYPE] [TABLEORIGIN/TABLEONE] [TABLETARGET/TABLEMANY]`

```
USAGE
  $ qore drop-relation [RELATIONTYPE] [TABLEORIGIN/TABLEONE] [TABLETARGET/TABLEMANY]

OPTIONS
  --relation=relation  (required) relationName

EXAMPLES
  $ qore drop-relation 1:m tableOrigin/tableOne tableTarget/tableMany --relation personTodo
  $ qore drop-relation m:n tableOrigin/tableOne tableTarget/tableMany --relation personProject
```

_See code: [src/commands/drop-relation.ts](https://github.com/rrmdn/cli/blob/v2.0.0-alpha.1/src/commands/drop-relation.ts)_

## `qore drop-roles [ROLES]`

```
USAGE
  $ qore drop-roles [ROLES]

ARGUMENTS
  ROLES  list role name

EXAMPLES
  $ qore drop-roles users,engineer
  $ qore drop-roles developer
```

_See code: [src/commands/drop-roles.ts](https://github.com/rrmdn/cli/blob/v2.0.0-alpha.1/src/commands/drop-roles.ts)_

## `qore drop-tables [TABLESNAME]`

```
USAGE
  $ qore drop-tables [TABLESNAME]

ARGUMENTS
  TABLESNAME  list of table name

EXAMPLES
  $ qore drop-tables todos
  $ qore drop-tables todos,projects
```

_See code: [src/commands/drop-tables.ts](https://github.com/rrmdn/cli/blob/v2.0.0-alpha.1/src/commands/drop-tables.ts)_

## `qore export-schema`

```
USAGE
  $ qore export-schema

OPTIONS
  --location=location  [default: migrations] fileLocation

EXAMPLE
  $ qore export-schema --location migrations
```

_See code: [src/commands/export-schema.ts](https://github.com/rrmdn/cli/blob/v2.0.0-alpha.1/src/commands/export-schema.ts)_

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

## `qore import-schema`

```
USAGE
  $ qore import-schema

OPTIONS
  -l, --location=location  [default: migrations] fileLocation

EXAMPLE
  $ qore import-schema --location
```

_See code: [src/commands/import-schema.ts](https://github.com/rrmdn/cli/blob/v2.0.0-alpha.1/src/commands/import-schema.ts)_

## `qore login`

```
USAGE
  $ qore login

EXAMPLE
  $ qore login
```

_See code: [src/commands/login.ts](https://github.com/rrmdn/cli/blob/v2.0.0-alpha.1/src/commands/login.ts)_

## `qore logout`

```
USAGE
  $ qore logout

EXAMPLE
  $ qore logout
```

_See code: [src/commands/logout.ts](https://github.com/rrmdn/cli/blob/v2.0.0-alpha.1/src/commands/logout.ts)_

## `qore open-dashboard`

```
USAGE
  $ qore open-dashboard

EXAMPLE
  $ qore open-dashboard
```

_See code: [src/commands/open-dashboard.ts](https://github.com/rrmdn/cli/blob/v2.0.0-alpha.1/src/commands/open-dashboard.ts)_

## `qore ping`

```
USAGE
  $ qore ping

EXAMPLE
  $ qore ping
```

_See code: [src/commands/ping.ts](https://github.com/rrmdn/cli/blob/v2.0.0-alpha.1/src/commands/ping.ts)_

## `qore read-migrations`

```
USAGE
  $ qore read-migrations

EXAMPLE
  $ qore read-migrations
```

_See code: [src/commands/read-migrations.ts](https://github.com/rrmdn/cli/blob/v2.0.0-alpha.1/src/commands/read-migrations.ts)_

## `qore rollback`

```
USAGE
  $ qore rollback

EXAMPLE
  $ qore rollback
```

_See code: [src/commands/rollback.ts](https://github.com/rrmdn/cli/blob/v2.0.0-alpha.1/src/commands/rollback.ts)_

## `qore select [TABLENAME]`

```
USAGE
  $ qore select [TABLENAME]

OPTIONS
  -x, --extended          show extra columns
  --columns=columns       only show provided columns (comma-separated)
  --csv                   output is csv format [alias: --output=csv]
  --filter=filter         filter property by partial string matching, ex: name=foo
  --no-header             hide table header from output
  --no-truncate           do not truncate output to fit screen
  --output=csv|json|yaml  output in a more machine friendly format
  --sort=sort             property to sort by (prepend '-' for descending)

EXAMPLE
  $ qore select tableName
```

_See code: [src/commands/select.ts](https://github.com/rrmdn/cli/blob/v2.0.0-alpha.1/src/commands/select.ts)_

## `qore set-url`

```
USAGE
  $ qore set-url

EXAMPLE
  $ qore set-url
```

_See code: [src/commands/set-url.ts](https://github.com/rrmdn/cli/blob/v2.0.0-alpha.1/src/commands/set-url.ts)_
<!-- commandsstop -->
