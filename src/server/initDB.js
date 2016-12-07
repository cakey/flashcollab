var sqlite3 = require('sqlite3').verbose();
var fs = require('fs');
if (!fs.existsSync('data')){
    fs.mkdirSync('data');
}
if (!fs.existsSync('data/clips')){
    fs.mkdirSync('data/clips');
}
var db = new sqlite3.Database('data/flash.sqllite');

var words = [
  "Camel",
  "Cape buffalo",
  "Capybara",
  "Cardinal",
  "Caribou",
  "Carp",
  "Catshark",
  "Caterpillar",
  "Catfish",
  "Centipede",
  "Cephalopod",
  "Chameleon",
  "Cheetah",
  "Chickadee",
  "Chimpanzee",
  "Chinchilla",
  "Chipmunk",
  "Clam",
  "Clownfish",
  "Cobra",
  "Cockroach",
  "Cod",
  "Condor",
  "Constrictor",
  "Coral",
  "Cougar",
  "Cow",
  "Coyote",
  "Crab",
  "Crane",
  "Crane fly",
  "Crawdad",
  "Crayfish",
  "Cricket",
  "Crocodile",
  "Crow",
  "Cuckoo",
  "Cicada"
]

db.serialize(function() {
    db.run("CREATE TABLE clips (wordID int, clipID TEXT, userID int)");
    db.run("CREATE TABLE images (wordID int, url TEXT)");
    db.run("CREATE TABLE users (userID integer primary key autoincrement, name TEXT unique)");
    db.run("CREATE TABLE reviews (wordID int, userID int, firstSeenTime datetime, answerTime datetime, dueTime datetime)");
    db.run("CREATE TABLE words (wordID integer primary key autoincrement, word TEXT)");

    var stmt = db.prepare("INSERT INTO words VALUES (?, ?)");
    for (let w of words) {
        stmt.run(null, w);
    }
    stmt.finalize();

  // db.each("SELECT rowid AS id, word, clipID, userID FROM clips ORDER BY id desc", function(err, row) {
  //     console.log(row);
  // });
});

db.close();
