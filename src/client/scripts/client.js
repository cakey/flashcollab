import Debug from 'debug';
import App from '../../app';

var attachElement = document.getElementById('app');

var app;

Debug.enable('myApp*');

// fork getUserMedia for multiple browser versions, for the future
// when more browsers support MediaRecorder

navigator.getUserMedia = ( navigator.getUserMedia ||
                       navigator.webkitGetUserMedia ||
                       navigator.mozGetUserMedia ||
                       navigator.msGetUserMedia);

var onError = function(err) {
  console.log('The following error occured: ' + err);
}

var onSuccess = function(stream) {
// Create new app and attach to element
  console.log("found stream: ", stream)
  app = new App({
    state: {
      stream: stream,
    }
  });
  app.renderToDOM(attachElement);
}


if (navigator.getUserMedia) {
  navigator.getUserMedia({ audio: true }, onSuccess, onError);
} else {
   console.log('getUserMedia not supported on your browser!');
}


