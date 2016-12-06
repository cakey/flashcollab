import path from 'path';
import Express from 'express';

var uuid = require('uuid4');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('data/flash.sqllite');
var fs = require('fs');


var app = Express();
var server;

const PATH_STYLES = path.resolve(__dirname, '../client/styles');
const PATH_DIST = path.resolve(__dirname, '../../dist');

app.use('/styles', Express.static(PATH_STYLES));
app.use(Express.static(PATH_DIST));

app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../client/index.html'));
});

app.post('/api/clip/:clipName', (req, res) => {
    var id = uuid();
    console.log(req.params.clipName);
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
            var stmt = db.prepare("INSERT INTO clips VALUES (?, ?, ?)");
            stmt.run(req.params.clipName, id, 1);
            stmt.finalize();
            console.log("The file was saved!");
            res.end("looks good to me");
        });

    });
})

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
