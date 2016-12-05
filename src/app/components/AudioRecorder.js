// adapted from https://github.com/mdn/web-dictaphone

import React, { Component, PropTypes } from 'react';
import Debug from 'debug';
import config from '../../../config/app';
import keys from '../../../config/keys';


var debug = Debug('Audio');
var chunk = Debug('Audio/chunk')

class AudioRecorder extends React.Component {

  constructor(props) {
    super(props)
    var mr = new MediaRecorder(this.props.stream);
    mr.onstop = this.onMediaStop.bind(this);
    mr.ondataavailable = this.onDataAvailable.bind(this);
    this.imageCache = new Map();
    this.state = {
      recording: false,
      chunks: [],
      mediaRecorder: mr,
      clips: [],
    }
  }

  onDataAvailable(e) {
    chunk(e.data.size);
    this.state.chunks.push(e.data);
  }

  onMediaStop(e) {
      debug("data available after MediaRecorder.stop() called.");
      var blob = new Blob(this.state.chunks, { 'type' : 'audio/ogg; codecs=opus' });
      this.state.chunks = [];
      var newClip = {
        blob: blob,
        name: this.nextWord.bind(this)(),
      }
      this.state.clips.push(newClip);
      this.setState({recording: false})
  }

  fetchImages(term) {
    if (!config.imagesOn) {
      return
    }
    var that = this;
    if (this.imageCache.has(term)) {
      return
    }
    var headers = new Headers({
      "Ocp-Apim-Subscription-Key": keys.bingsearch
    });

  var myInit = { method: 'GET',
                 headers: headers,
                 mode: 'cors',
                 cache: 'default' };

   fetch('https://api.cognitive.microsoft.com/bing/v5.0/images/search?q='+term+'&count=10&offset=0&safeSearch=Moderate', myInit)
   .then(function(response){
    response.json().then(function(json){
      debug(json);
      var urls = []
      for (let v of json.value) {
        urls.push(v.contentUrl)
        that.imageCache.set(term, urls);
        that.forceUpdate();
      }
    })
   })
   return null
  }

  onRecord() {
      this.state.mediaRecorder.start();
      debug("recorder started");
      debug("mr state: ", this.state.mediaRecorder.state);
      this.setState({recording: true})
  }

  onDeleteClip(i) {
    debug("delete clip # ", i);
    var newClips = this.state.clips.slice();
    newClips.splice(i, 1);
    this.setState({clips: newClips})
  }

  onStopRecord() {
      this.state.mediaRecorder.stop();
      debug("recorder stopped");
      debug("mr state: ", this.state.mediaRecorder.state);
    }

  nextWord() {
    var doneWords = new Set();
    for (let w of this.state.clips) {
      doneWords.add(w.name);
    }
    var nextWord = null;
    for (let w of this.props.words) {
      if (!doneWords.has(w)) {
        nextWord = w;
        break
      }
    }

    this.fetchImages.bind(this)(nextWord);
    return nextWord;
  }

  render () {

    var clips = [];
    for (var i=0; i<this.state.clips.length; i++) {
      var url = window.URL.createObjectURL(this.state.clips[i].blob);
      clips.push(
        <article className="clip" key={i} >
          <audio controls src={url} />
          <p>{this.state.clips[i].name}</p>
          <button className="delete" onClick={this.onDeleteClip.bind(this, i)}>
            Delete
          </button>
        </article>
      )
    }

    var images = [];
    var nextWord = this.nextWord.bind(this)();
    if (this.imageCache.has(nextWord)) {
      var urls = this.imageCache.get(nextWord);
      for (var i=0; i<6; i++){
        images.push(
          <image src={urls[i]} key={i} width="200" />
        )
      }
    }

    return <div className="wrapper">
      <header>
        <h1>next word: {nextWord}</h1>
        <div className="images">{images}</div>
      </header>
      <section className="main-controls">
        <div className="buttons">
          <button
            className="record"
            disabled={this.state.recording}
            onClick={this.onRecord.bind(this)}
          >
              Record
          </button>
          <button
            className="stop"
            disabled={!this.state.recording}
            onClick={this.onStopRecord.bind(this)}
          >
            Stop
          </button>
        </div>
      </section>

      <section className="sound-clips">
        {clips}
      </section>
    </div>;
  }
}

// Prop types validation
AudioRecorder.propTypes = {
  stream: React.PropTypes.any.isRequired,
  words: React.PropTypes.array.isRequired,
};

export default AudioRecorder;
