var Writable = require('readable-stream').Writable
var pump = require('pump')
var sub = require('subleveldown')

module.exports = createIndex

function createIndex (ldb, makeFn) {
  var stateDb = sub(ldb, 's')
  var dataDb = sub(ldb, 'd')

  var basic = {
    maxBatch: 100 || opts.maxBatch,

    storeState: function (state, cb) {
      state = state.toString('base64')
      stateDb.put('state', state, cb)
    },

    fetchState: function (cb) {
      stateDb.get('state', function (err, state) {
        if (err && err.notFound) cb()
        else if (err) cb(err)
        else cb(null, Buffer.from(state, 'base64'))
      })
    },

    clearIndex: function (cb) {
      var batch = []
      var maxSize = 5000
      pump(dataDb.createKeyStream(), new Writable({
        objectMode: true,
        write: function (key, enc, next) {
          batch.push({ type: 'del', key })
          if (batch.length >= maxSize) {
            dataDb.batch(batch, next)
          } else next()
        },
        final: function (next) {
          if (batch.length > 0) dataDb.batch(batch, next)
          else next()
        }
      }), ondone)
      function ondone (err) {
        if (err) cb(err)
        else cb()
      }
    }
  }

  return Object.assign({}, basic, makeFn(dataDb))
}
