# kappa-view

> Base for creating kappa-core views over LevelDB.

## Example

This is a view for a very simple single-value key-value store, that maps log
entries like `{ key: 'foo', value: 'bar' }` to an API that allows `get(key)`
queries.

```js
var kappa = require('kappa-core')
var makeView = require('kappa-view')
var ram = require('random-access-memory')
var memdb = require('memdb')

var core = kappa(ram, { valueEncoding: 'json' })
var lvl = memdb()

var view = makeView(lvl, function (db) {
  return {
    map: function (entries, next) {
      var batch = entries.map(function (entry) {
        return {
          type: 'put',
          key: entry.value.key,
          value: entry.value.value
        }
      })
      db.batch(batch, next)
    },
    
    api: {
      get: function (core, key, cb) {
        core.ready(function () {
          db.get(key, cb)
        })
      }
    }
  }
})

core.use('kv', view)

core.writer(function (err, log) {
  log.append({key: 'foo', value: 'bar'})
  log.append({key: 'bax', value: 'baz'})

  core.api.kv.get('foo', console.log)
  core.api.kv.get('bax', console.log)
  core.api.kv.get('nix', console.log)
})
```

outputs

```
null 'bar'
null 'baz'
NotFoundError: Key not found in database [nix]
```

## API

```js
var makeView = require('kappa-view')
```

### var view = makeView(level, setupFunction)

Create a new view, backed by LevelDB.

Expects a LevelUP or LevelDOWN instance `level`.

`setupFunction` is a function that is given parameters `db` (LevelDB instance)
and `core` (kappa-core instance). It is called exactly once. A kappa view must
be returned, which is an object with the keys

- `map: function (entries, next)`: receives an array of log entries. Once
  you've persisted whatever changes you'd like to `db`, call `next()` to signal
  the view is ready for the next batch of log entries.
- `api: {}`: an object that defines API functions that the view exposes. These
  can have whatever names you want, be sync or async, and return whatever you'd
  like.

## Install

With [npm](https://npmjs.org/) installed, run

```
$ npm install kappa-view
```

## License

ISC
