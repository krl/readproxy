#!/usr/bin/env node

var fs     = require('fs'),
    util   = require('util'),
    assert = require('assert'),
    get    = require('node-get'),
    spawn  = require('child_process').spawn;

var directory, url, host

try {
  if (process.argv.length == 3) {
    
    // hack to stop readability spewing stuff into stdout
    var oldlog = console.log;
    console.log = function () {}
    util.log = function () {}

    url  = process.argv[2];
    host = url.split("/")[2];    
  } 
  else if (process.argv.length == 4) {
    directory = process.argv[2];
    url  = process.argv[3];
    host = url.split("/")[2];
    assert.ok(directory);

  } else {
    assert.ok(false);
  }

  assert.ok(url);
  assert.ok(host);
} catch (err) {
  console.log("usage:");
  console.log("readproxy url");
  console.log(" - writes to stdout");
  console.log("readproxy directory url");
  console.log(" - writes to directory (scp or local)");
  return 1;
}

var readability = require('readability')


if (directory && directory[directory.length -1] != "/") {
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
      "Message-ID: "  + url + "\n" +
      "X-Entry-URL: " + url + "\n\n";

    var filename = directory + url.replace(/\//g, "!");
    var content  = header + result.content;    
    
    if (!directory) {
      oldlog(content)
    }
    else if (directory.indexOf(":") == -1) {
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
