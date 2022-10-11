var kappa = require('kappa-core')
var View = require('..')
var ram = require('random-access-memory')
var memdb = require('memdb')
var test = require('tape')

test('options', function (t) {
  t.test('maxBatch default override', function (t) {
    t.plan(1)
    var lvl = memdb()

    const maxBatchOption = 1337
    var view = View(lvl, { maxBatch: maxBatchOption }, function (db) {})
    t.same(view.maxBatch, maxBatchOption)
  })
})

test('mapper', function (t) {
  t.plan(7)

  var core = kappa(ram, { valueEncoding: 'json' })
  var lvl = memdb()

  var view = View(lvl, function (db) {
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

  core.use('mapper', view)

  core.writer(function (err, feed) {
    t.error(err)

    feed.append({key: 'foo', value: 'bar'})
    feed.append({key: 'bax', value: 'baz'})

    core.ready('mapper', function () {
      core.api.mapper.get('foo', function (err, res) {
        t.error(err)
        t.same(res, 'bar')
      })
      core.api.mapper.get('bax', function (err, res) {
        t.error(err)
        t.same(res, 'baz')
      })
      core.api.mapper.get('nix', function (err, res) {
        t.ok(err)
        t.ok(err.notFound)
      })
    })
  })
})
