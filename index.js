const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000

const querystring = require('querystring')
const request = require('request')

express()
  .use(express.static(path.join(__dirname, 'public')))
  .disable('etag')
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
  .get('/login', (req, res) => {
    const query = querystring.stringify({
      response_type: 'code',
      client_id: process.env.LINECORP_PLATFORM_CHANNEL_CHANNELID,
      redirect_uri: 'https://line-note2.herokuapp.com/callback',
      state: 'hoge', // TODO: must generate random string
      scope: 'profile',
    })
    res.redirect(301, 'https://access.line.me/oauth2/v2.1/authorize?' + query)
  })
  .get('/callback', (req, res) => {
    request
      .post({
        url: `https://api.line.me/oauth2/v2.1/token`,
        form: {
          grant_type: "authorization_code",
          code: req.query.code,
          redirect_uri: 'https://line-note2.herokuapp.com/callback',
          client_id: process.env.LINECORP_PLATFORM_CHANNEL_CHANNELID,
          client_secret: process.env.LINECORP_PLATFORM_CHANNEL_CHANNELSECRET,
        }
      }, (error, response, body) => {
        if (response.statusCode != 200) {
          res.send(error)
          return
        }
        request
          .get({
            url: 'https://api.line.me/v2/profile',
            headers: {
              'Authorization': 'Bearer ' + JSON.parse(body).access_token
            }
          }, (error, response, body) => {
            if (response.statusCode != 200) {
              res.send(error)
              return
            }
            res.send(body)
          })
      })
  })
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))
