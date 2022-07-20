var http = require('http')
var fs = require('fs')
var url = require('url')
var qs = require('querystring')
var template = require('./lib/template.js')
var path = require('path')
var sanitizeHtml = require('sanitize-html')

var app = http.createServer(function (req, res) {
  var _url = req.url
  var queryData = url.parse(_url, true).query
  var pathname = url.parse(_url, true).pathname
  if (pathname === '/') {
    if (queryData.id === undefined) {
      // home directory , id 없는 경우

      fs.readdir('./data', (err, filelist) => {
        var title = 'Welcome'
        var description = 'Hello, Node.js'
        var list = template.list(filelist)
        var html = template.HTML(
          title,
          list,
          `<h2>${title}</h2>${description}`,
          `<a href = "/create">create</a>`
        )
        res.writeHead(200)
        res.end(html)
      })
    } else {
      // id가 있는 경우
      fs.readdir('./data', (err, filelist) => {
        var filteredId = path.parse(queryData.id).base
        fs.readFile(`data/${filteredId}`, 'utf-8', (err, description) => {
          var title = queryData.id
          var sanitizedTitle = sanitizeHtml(title)
          var sanitizedDescription = sanitizeHtml(description)
          var list = template.list(filelist)
          var html = template.HTML(
            sanitizedTitle,
            list,
            `<h2>${sanitizedTitle}</h2>${sanitizedDescription}`,
            `<a href = "/create">create</a> 
             <a href = "/update?id=${sanitizedTitle}">update</a>
             <form action = "delete_process" method="post">
             <input type="hidden" name="id" value="${sanitizedTitle}">
             <input type="submit" value="delete">
             </form>
             `
          )
          res.writeHead(200)
          res.end(html)
        })
      })
    }
  } else if (pathname === '/create') {
    // 생성
    fs.readdir('./data', (err, filelist) => {
      var title = 'WEB - create'
      var list = template.list(filelist)
      var html = template.HTML(
        title,
        list,
        `<form action="/create_process" method="post">
        <p><input type="text" name="title" placeholder="title"></p>
        <p>
        <textarea name ="description" placeholder="description"></textarea>
        </p>
        <p>
        <input type="submit">
        </p>
        </form>`,
        ''
      )
      res.writeHead(200)
      res.end(html)
    })
  } else if (pathname === '/create_process') {
    var body = ''
    req.on('data', (data) => {
      body = body + data
    })
    req.on('end', (end) => {
      var post = qs.parse(body)
      var title = post.title
      var description = post.description
      fs.writeFile(`data/${title}`, description, 'utf-8', (err) => {
        res.writeHead(302, { Location: `/?id=${title}` })
        res.end()
      })
    })
  } else if (pathname === '/update') {
    fs.readdir('./data', (err, filelist) => {
      var filteredId = path.parse(queryData.id).base
      fs.readFile(`data/${filteredId}`, 'utf-8', (err, description) => {
        var title = queryData.id
        var list = template.list(filelist)
        var html = template.HTML(
          title,
          list,
          `<form action="/update_process" method="post">
          <input type="hidden" name="id" value="${title}">
          <p><input type="text" name="title" placeholder="title" value="${title}"></p>
          <p>
          <textarea name ="description" placeholder="description">${description}</textarea>
          </p>
          <p>
          <input type="submit">
          </p>
          </form>
          `,
          `<a href = "/create">create</a> <a href = "/update?id=${title}">update</a>`
        )
        res.writeHead(200)
        res.end(html)
      })
    })
  } else if (pathname === '/update_process') {
    var body = ''
    req.on('data', (data) => {
      body = body + data
    })
    req.on('end', (end) => {
      var post = qs.parse(body)
      var id = post.id
      var title = post.title
      var description = post.description
      fs.rename(`data/${id}`, `data/${title}`, (err) => {})
      fs.writeFile(`data/${title}`, description, 'utf-8', (err) => {
        res.writeHead(302, { Location: `/?id=${title}` })
        res.end()
      })
    })
  } else if (pathname === '/delete_process') {
    var body = ''
    req.on('data', (data) => {
      body = body + data
    })
    req.on('end', (end) => {
      var post = qs.parse(body)
      var id = post.id
      var filteredId = path.parse(id).base
      fs.unlink(`data/${filteredId}`, (err) => {
        res.writeHead(302, { Location: `/` })
        res.end()
      })
    })
  } else {
    res.writeHead(404)
    res.end('Not found')
  }
})
app.listen(3000)
