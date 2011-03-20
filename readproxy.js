#!/usr/bin/env node

var fs          = require('fs'),
    assert      = require('assert'),
    get         = require('node-get'),
    readability = require('readability'),
    spawn       = require('child_process').spawn;

try {
  var directory = process.argv[2];
  var url  = process.argv[3];
  var host = url.split("/")[3];

  assert.ok(directory);
  assert.ok(url);
  assert.ok(host);
} catch (err) {
  console.log("usage: readproxy directory url");
  return 1;
}

new get(url).asString(function (err, str) {
  readability.parse(str, url, function(result) {

    var header = 'Content-Type: text/html; charset="us-ascii"\n' +
      "MIME-Version: 1.0\n" +
      "Content-Transfer-Encoding: 8bit\n" +
      "Subject: "     + result.title + "\n" +
      "From: "        + host + " <readproxy@localhost>\n" +
      "Date: "        + (new Date).toUTCString() + "\n" +
      "X-Entry-URL: " + url + "\n\n";

    var tmpfile  = "/tmp/readproxy_" + Math.random();
    var filename = directory + url.replace(/\//g, "!");
    var content  = header + result.content;    
      
    fs.writeFile(tmpfile, content);

    var copy = spawn('scp', [tmpfile, filename]);

    copy.stderr.on('data', function (data) {
      console.error("Error: could not write remote file!");
      console.log(data.asciiSlice(0, data.length));

      fs.unlink(tmpfile);
      return 1;
    });

    copy.on('exit', function (code) {
      console.log("written to " + filename);

      fs.unlink(tmpfile);      
    });
  });
});
