'use strict'

const dnsSocket = require('.')
const socket = dnsSocket()

socket.query({
  flags: dnsSocket.RECURSION_DESIRED,
  questions: [{
    type: 'ANY',
    name: 'www.dr.dk'
  }]
}, 53, '8.8.8.8', function (err, response) {
  console.log(err, response)
  socket.destroy()
})
