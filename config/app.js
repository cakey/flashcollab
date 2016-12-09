var config = {};

config.title = 'Flash Crowd';

// set to false to save on api calls to bing during dev
config.imagesOn = true;

// number of new cards to bring in daily by default
config.defaultDailyNew = 10;

/*
    1 - image -> text/sound
    2 - sound -> text/image
    3 - text -> image/sound
*/
config.defaultFormats = [1,2,3];


module.exports = config;
