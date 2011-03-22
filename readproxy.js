#!/usr/bin/env node

var fs          = require('fs'),
    assert      = require('assert'),
    get         = require('node-get'),
    readability = require('readability'),
    spawn       = require('child_process').spawn;

try {
  var directory = process.argv[2];
  var url  = process.argv[3];
  var host = url.split("/")[2];

  assert.ok(directory);
  assert.ok(url);
  assert.ok(host);
} catch (err) {
  console.log("usage: readproxy directory url");
  return 1;
}

if (directory[directory.length -1] != "/") {
  directory += "/";
}

var get_me = {uri: url,
              headers: { 'Accept-encoding': 'none',
                          'Connection': 'close',
                          'User-Agent': 'Readproxy/0.1'}};


new get(get_me).asString(function (err, str) {
  readability.parse(str, url, function(result) {

    var header = 'Content-Type: text/html; charset="us-ascii"\n' +
      "MIME-Version: 1.0\n" +
      "Content-Transfer-Encoding: 8bit\n" +
      "Subject: "     + result.title + "\n" +
      "From: "        + host + " <readproxy@localhost>\n" +
      "Date: "        + (new Date).toUTCString() + "\n" +
      "X-Entry-URL: " + url + "\n\n";

    var filename = directory + url.replace(/\//g, "!");
    var content  = header + result.content;    
    
    if (directory.indexOf(":") == -1) {
      // It's not a scp link -- write directly.
      fs.writeFile(filename, content);
      console.log("Witten to " + filename + " directly.")
    } else {
      // Use scp.
      var tmpfile  = "/tmp/readproxy_" + Math.random();

      fs.writeFile(tmpfile, content);
      spawn('scp', [tmpfile, filename]).on('exit', function (code) {

        if (code == 0) {
	  console.log("written (using scp) to " + filename + ".");
        } else {
	  console.error("Error: could not write file!");
        }

        fs.unlink(tmpfile);      
      });
    }
  });
});
