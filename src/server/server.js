import path from 'path';
import Express from 'express';

var request = require('request');
var uuid = require('uuid4');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('data/flash.sqllite');
var fs = require('fs');

import config from '../../config/app';
import keys from '../../config/keys';

var app = Express();
var server;

const PATH_STYLES = path.resolve(__dirname, '../client/styles');
const PATH_DIST = path.resolve(__dirname, '../../dist');

app.use('/styles', Express.static(PATH_STYLES));
app.use(Express.static(PATH_DIST));

app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../client/index.html'));
});

function json(response) {
  return response.json()
}

app.get('/api/user/name/:userName', (req, res) => {
    db.map("INSERT OR IGNORE INTO users (name) VALUES (?)", [req.params.userName], function(err, map) {
            db.map("SELECT name, userID from users where name=? ", [req.params.userName], function(err, map) {
                console.log(req.params.userName,": ", map[req.params.userName])
                res.json({name: req.params.userName, id: map[req.params.userName]});
            });
    });
});

app.get('/api/images/:wordID', (req, res) => {
    console.log("checking for images, wordID", req.params.wordID);
    //first check db for images
    // using a left join on words table so we don't have to do a separate db call to get word name to lookup
    db.all("SELECT a.word, a.wordID, b.url FROM words a NATURAL LEFT OUTER JOIN images b WHERE a.wordID=?", [req.params.wordID], function(err, urls) {
            if (urls.length == 0) {
                console.log("wordID not found");

                res.json({error: "no word with ID: " + req.params.wordID})
            } else if (urls.length == 1 && !urls[0].url) {
                // found word, but no images, collect from bing
                console.log("no images cached");
                if (!config.imagesOn) {
                    console.log("images off");
                    res.json({word: urls[0].word, wordID: req.params.wordID, urls: []})
                    return
                }

                // fetch from bing
                var options = {
                  url: 'https://api.cognitive.microsoft.com/bing/v5.0/images/search?q='+urls[0].word+'&count=10&offset=0&safeSearch=Moderate',
                  headers: {
                    'Ocp-Apim-Subscription-Key': keys.bingsearch
                  }
                };

                var callback = (error, response, body) => {
                  if (!error && response.statusCode == 200) {
                    var data = JSON.parse(body);
                    console.log(data.value[0]);
                    var urls = [];
                    for (let v of data.value) {
                        // thumbnail urls are shorter, but also avoid 404/403s etc
                        urls.push(v.thumbnailUrl)
                    }
                    console.log(urls)
                    res.json({"images": urls})
                  }
                }

                request(options, callback);

            } else {
                console.log("images cached");
            }
        console.log(err);
    })
    // if no images in db, then fetch from bing, and insert into DB
})


// Which reviews are ready for the user?
app.get('/api/reviews/:userID', (req, res) => {
    console.log("reviews");
    db.map("SELECT wordID, firstSeenTime, format FROM reviews WHERE userID=? AND dueTime < date('now');", [req.params.userID], function(err, reviewMap) {
        db.map("SELECT a.wordID, a.word, b.clipID FROM words a NATURAL INNER JOIN clips b where b.wordID is NOT NULL", function(err, newMap) {
            var w = 0;
            var startf = 0;
            var f = 0;
            var words = [];
            Object.keys(newMap).forEach(function (key) {
              let obj = newMap[key];
              words.push(obj);
            });
            var reviews = [];
            while (reviews.length < config.defaultDailyNew) {
                var review = {
                    wordID: words[w].wordID,
                    word: words[w].word,
                    clipID: words[w].clipID,
                    format: config.defaultFormats[f],
                };
                reviews.push(review);
                w = (w+1)%words.length;
                if (w == 0) {
                    startf = startf + 1
                    f = startf;
                    if (startf == config.defaultFormats.length) {
                        break;
                    }
                } else {
                    f = (f+1)%config.defaultFormats.length
                }
            }
            res.json(reviews);
        });
    });
});

app.get('/api/word', (req, res) => {
  db.map("SELECT a.* FROM words a NATURAL LEFT JOIN clips b WHERE b.wordID is NULL limit 50;", function(err, map) {
      res.json(map)
  });
})

app.post('/api/clip/:clipID', (req, res) => {
    var id = uuid();
    console.log(req.params.clipID);
    var size = 0;

    var data = new Buffer('');
    req.on('data', function(chunk) {
        data = Buffer.concat([data, chunk]);
        console.log("chunk");
    });
    req.on('end', function() {
        console.log(size);
        req.rawBody = data;
        fs.writeFile("data/clips/"+id, data, function(err) {
            if(err) {
                return console.log(err);
            }
            var getId
            var stmt = db.prepare("INSERT INTO clips VALUES (?, ?, ?)");
            stmt.run(req.params.clipID, id, 1);
            stmt.finalize();
            console.log("The file was saved!");
            res.end("looks good to me");
        });

    });
});

server = app.listen(process.env.PORT || 3000, () => {
  var port = server.address().port;

  console.log('Server is listening at %s', port);


// db.serialize(function() {

//   db.each("SELECT rowid AS id, word, clipID, userID FROM clips ORDER BY id desc", function(err, row) {
//       console.log(1, row);
//   });
// });

// db.close();



});
