var tape = require('tape')
var dgram = require('dgram')
var dns = require('./')

tape('query + response', function (t) {
  var socket = dns()

  socket.on('query', function (query, port, host) {
    socket.response(query, {
      answers: [{
        type: 'A',
        name: 'test',
        data: '1.1.1.1'
      }]
    }, port, host)
  })

  socket.bind(0, function () {
    socket.query({
      questions: [{
        type: 'A',
        name: 'test'
      }]
    }, socket.address().port, function (err, res) {
      socket.destroy()
      t.error(err)
      t.same(res.answers.length, 1)
      t.same(res.answers[0].type, 'A')
      t.same(res.answers[0].name, 'test')
      t.same(res.answers[0].data, '1.1.1.1')
      t.end()
    })
  })
})

tape('pass socket + query + response', function (t) {
  var udp = dgram.createSocket('udp4')

  udp.bind(0, function () {
    var socket = dns({socket: udp})

    socket.on('query', function (query, port, host) {
      socket.response(query, {
        answers: [{
          type: 'A',
          name: 'test',
          data: '1.1.1.1'
        }]
      }, port, host)
    })

    socket.query({
      questions: [{
        type: 'A',
        name: 'test'
      }]
    }, socket.address().port, function (err, res) {
      socket.destroy()
      t.error(err)
      t.same(res.answers.length, 1)
      t.same(res.answers[0].type, 'A')
      t.same(res.answers[0].name, 'test')
      t.same(res.answers[0].data, '1.1.1.1')
      t.end()
    })
  })
})

tape('timeout', function (t) {
  var dummy = dgram.createSocket('udp4')

  dummy.bind(0, function () {
    var done = false
    var timeout = setTimeout(function () {
      done = true
      socket.destroy()
      dummy.close()
      t.fail('should timeout before 10s')
      t.end()
    }, 10000)

    var socket = dns()

    var id = socket.query({
      questions: [{type: 'A', name: 'test'}]
    }, dummy.address().port, function (err) {
      if (done) return
      clearTimeout(timeout)
      socket.destroy()
      dummy.close()
      t.ok(err, 'should error')
      t.end()
    })

    socket.setRetries(id, 0)
  })
})

tape('pass socket + timeout', function (t) {
  var udp = dgram.createSocket('udp4')
  var dummy = dgram.createSocket('udp4')

  dummy.bind(0, function () {
    udp.bind(0, function () {
      var done = false
      var timeout = setTimeout(function () {
        done = true
        socket.destroy()
        dummy.close()
        t.fail('should timeout before 10s')
        t.end()
      }, 10000)

      var socket = dns({socket: udp})

      var id = socket.query({
        questions: [{type: 'A', name: 'test'}]
      }, dummy.address().port, function (err) {
        if (done) return
        clearTimeout(timeout)
        socket.destroy()
        dummy.close()
        t.ok(err, 'should error')
        t.end()
      })

      socket.setRetries(id, 0)
    })
  })
})

tape('two queries + response', function (t) {
  var socket = dns()
  var missing = 2

  socket.on('query', function (query, port, host) {
    socket.response(query, {
      answers: [{
        type: 'A',
        name: query.questions[0].name,
        data: '1.1.1.1'
      }]
    }, port, host)
  })

  socket.bind(0, function () {
    socket.query({
      questions: [{
        type: 'A',
        name: 'test1'
      }]
    }, socket.address().port, function (err, res) {
      t.error(err)
      t.same(res.answers.length, 1)
      t.same(res.answers[0].type, 'A')
      t.same(res.answers[0].name, 'test1')
      t.same(res.answers[0].data, '1.1.1.1')
      done()
    })

    socket.query({
      questions: [{
        type: 'A',
        name: 'test2'
      }]
    }, socket.address().port, function (err, res) {
      t.error(err)
      t.same(res.answers.length, 1)
      t.same(res.answers[0].type, 'A')
      t.same(res.answers[0].name, 'test2')
      t.same(res.answers[0].data, '1.1.1.1')
      done()
    })

    function done () {
      if (--missing) return
      socket.destroy()
      t.end()
    }
  })
})
