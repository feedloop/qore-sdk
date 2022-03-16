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
@qorebase/cli/1.0.1 linux-x64 node-v16.10.0
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
* [`qore create-column`](#qore-create-column)
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
* [`qore open-doc`](#qore-open-doc)
* [`qore ping`](#qore-ping)
* [`qore read-migrations`](#qore-read-migrations)
* [`qore rollback [STEPS]`](#qore-rollback-steps)
* [`qore select [TABLENAME]`](#qore-select-tablename)

## `qore alter-column [FORMERNAME] [NEWNAME]`

Rename column from specific table

```
USAGE
  $ qore alter-column [FORMERNAME] [NEWNAME]

OPTIONS
  --table=table  (required) tableName

EXAMPLES
  $ qore alter-column formerName newName --table tableName
```

_See code: [src/commands/alter-column.ts](https://github.com/rrmdn/cli/blob/v1.0.1/src/commands/alter-column.ts)_

## `qore alter-permission`

Change condition in permissions table for specific role

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

_See code: [src/commands/alter-permission.ts](https://github.com/rrmdn/cli/blob/v1.0.1/src/commands/alter-permission.ts)_

## `qore alter-role [FORMERNAME] [NEWNAME]`

Rename specific role

```
USAGE
  $ qore alter-role [FORMERNAME] [NEWNAME]

EXAMPLE
  $ qore alter-role formerName newName
```

_See code: [src/commands/alter-role.ts](https://github.com/rrmdn/cli/blob/v1.0.1/src/commands/alter-role.ts)_

## `qore alter-table [FORMERNAME] [NEWNAME]`

Rename specific table

```
USAGE
  $ qore alter-table [FORMERNAME] [NEWNAME]

EXAMPLE
  $ qore alter-table formerName newName
```

_See code: [src/commands/alter-table.ts](https://github.com/rrmdn/cli/blob/v1.0.1/src/commands/alter-table.ts)_

## `qore context`

Set base url for project access

```
USAGE
  $ qore context

EXAMPLE
  $ qore set-url
```

_See code: [src/commands/context.ts](https://github.com/rrmdn/cli/blob/v1.0.1/src/commands/context.ts)_

## `qore create-column`

Create new columns in specific table

```
USAGE
  $ qore create-column

EXAMPLE
  $ qore create-column
```

_See code: [src/commands/create-column.ts](https://github.com/rrmdn/cli/blob/v1.0.1/src/commands/create-column.ts)_

## `qore create-permission`

Create permission for specific role in specific tables

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

_See code: [src/commands/create-permission.ts](https://github.com/rrmdn/cli/blob/v1.0.1/src/commands/create-permission.ts)_

## `qore create-relation [RELATIONTYPE] [TABLEORIGIN] [TABLETARGET]`

Create relation 1:m for one-to-many or m:n for many-to-many relation

```
USAGE
  $ qore create-relation [RELATIONTYPE] [TABLEORIGIN] [TABLETARGET]

OPTIONS
  --relation=relation  relationName

EXAMPLE
  $ qore create-relation relationType tableOrigin tableTarget --relation personTodo
```

_See code: [src/commands/create-relation.ts](https://github.com/rrmdn/cli/blob/v1.0.1/src/commands/create-relation.ts)_

## `qore create-roles [ROLES]`

Create new roles

```
USAGE
  $ qore create-roles [ROLES]

EXAMPLE
  $ qore create-roles user,engineer
```

_See code: [src/commands/create-roles.ts](https://github.com/rrmdn/cli/blob/v1.0.1/src/commands/create-roles.ts)_

## `qore create-tables [TABLESNAME]`

Create tables

```
USAGE
  $ qore create-tables [TABLESNAME]

ARGUMENTS
  TABLESNAME  list of table name

EXAMPLES
  $ qore create-tables todos
  $ qore create-tables todos,projects
```

_See code: [src/commands/create-tables.ts](https://github.com/rrmdn/cli/blob/v1.0.1/src/commands/create-tables.ts)_

## `qore drop-columns [COLUMNSNAME]`

Drop columns from specific table

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

_See code: [src/commands/drop-columns.ts](https://github.com/rrmdn/cli/blob/v1.0.1/src/commands/drop-columns.ts)_

## `qore drop-permission [ACTION]`

Drop action permission for role in tables

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

_See code: [src/commands/drop-permission.ts](https://github.com/rrmdn/cli/blob/v1.0.1/src/commands/drop-permission.ts)_

## `qore drop-relation [RELATIONTYPE] [TABLEORIGIN/TABLEONE] [TABLETARGET/TABLEMANY]`

Drop relation column in 1:m or drop junction table if m:n relation

```
USAGE
  $ qore drop-relation [RELATIONTYPE] [TABLEORIGIN/TABLEONE] [TABLETARGET/TABLEMANY]

OPTIONS
  --relation=relation  (required) relationName

EXAMPLES
  $ qore drop-relation 1:m tableOrigin/tableOne tableTarget/tableMany --relation personTodo
  $ qore drop-relation m:n tableOrigin/tableOne tableTarget/tableMany --relation personProject
```

_See code: [src/commands/drop-relation.ts](https://github.com/rrmdn/cli/blob/v1.0.1/src/commands/drop-relation.ts)_

## `qore drop-roles [ROLES]`

Drop some roles

```
USAGE
  $ qore drop-roles [ROLES]

ARGUMENTS
  ROLES  list role name

EXAMPLES
  $ qore drop-roles users,engineer
  $ qore drop-roles developer
```

_See code: [src/commands/drop-roles.ts](https://github.com/rrmdn/cli/blob/v1.0.1/src/commands/drop-roles.ts)_

## `qore drop-tables [TABLESNAME]`

Drop specific table

```
USAGE
  $ qore drop-tables [TABLESNAME]

ARGUMENTS
  TABLESNAME  list of table name

EXAMPLES
  $ qore drop-tables todos
  $ qore drop-tables todos,projects
```

_See code: [src/commands/drop-tables.ts](https://github.com/rrmdn/cli/blob/v1.0.1/src/commands/drop-tables.ts)_

## `qore export-schema`

Populate json file for all migrations process

```
USAGE
  $ qore export-schema

OPTIONS
  --location=location  [default: migrations] fileLocation

EXAMPLE
  $ qore export-schema --location migrations
```

_See code: [src/commands/export-schema.ts](https://github.com/rrmdn/cli/blob/v1.0.1/src/commands/export-schema.ts)_

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

## `qore import-schema`

Import-schema in specific folder for other database architecture

```
USAGE
  $ qore import-schema

OPTIONS
  -l, --location=location  [default: migrations] fileLocation

EXAMPLE
  $ qore import-schema --location
```

_See code: [src/commands/import-schema.ts](https://github.com/rrmdn/cli/blob/v1.0.1/src/commands/import-schema.ts)_

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

_See code: [src/commands/login.ts](https://github.com/rrmdn/cli/blob/v1.0.1/src/commands/login.ts)_

## `qore logout`

Logout from qore cli

```
USAGE
  $ qore logout

EXAMPLE
  $ qore logout
```

_See code: [src/commands/logout.ts](https://github.com/rrmdn/cli/blob/v1.0.1/src/commands/logout.ts)_

## `qore open-dashboard`

Open project dashboard on browser

```
USAGE
  $ qore open-dashboard

EXAMPLE
  $ qore open-dashboard
```

_See code: [src/commands/open-dashboard.ts](https://github.com/rrmdn/cli/blob/v1.0.1/src/commands/open-dashboard.ts)_

## `qore open-doc`

Open project doc on browser

```
USAGE
  $ qore open-doc

EXAMPLE
  $ qore open-doc
```

_See code: [src/commands/open-doc.ts](https://github.com/rrmdn/cli/blob/v1.0.1/src/commands/open-doc.ts)_

## `qore ping`

Ping

```
USAGE
  $ qore ping

EXAMPLE
  $ qore ping
```

_See code: [src/commands/ping.ts](https://github.com/rrmdn/cli/blob/v1.0.1/src/commands/ping.ts)_

## `qore read-migrations`

Read/see migrations histories

```
USAGE
  $ qore read-migrations

OPTIONS
  --limit=limit    limit
  --offset=offset  offset

EXAMPLE
  $ qore read-migrations --limit 0 --offset 0
```

_See code: [src/commands/read-migrations.ts](https://github.com/rrmdn/cli/blob/v1.0.1/src/commands/read-migrations.ts)_

## `qore rollback [STEPS]`

Rollback to previous migration

```
USAGE
  $ qore rollback [STEPS]

ARGUMENTS
  STEPS  Number of Rollbacks

EXAMPLE
  $ qore rollback 10
```

_See code: [src/commands/rollback.ts](https://github.com/rrmdn/cli/blob/v1.0.1/src/commands/rollback.ts)_

## `qore select [TABLENAME]`

Get all rows from specific table

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

_See code: [src/commands/select.ts](https://github.com/rrmdn/cli/blob/v1.0.1/src/commands/select.ts)_
<!-- commandsstop -->
