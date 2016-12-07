// adapted from https://github.com/mdn/web-dictaphone

import React, { Component, PropTypes } from 'react';
import Debug from 'debug';
import config from '../../../config/app';
import keys from '../../../config/keys';

var debug = Debug('Audio');
var chunk = Debug('Audio/chunk')

var union = function(a, b) {
  return new Set([...a, ...b]);
}

var intersection = function(a, b) {
  return new Set([...a].filter(x => b.has(x)));
}

var difference = function(a, b) {
  return  new Set([...a].filter(x => !b.has(x)));
}

var mapKeystoSet = function(a) {
    var b = new Set();
    a.forEach(function(value, key) {
      b.add(key);
    });
    return b;
}

class AudioRecorder extends React.Component {

  constructor(props) {
    super(props)
    var mr = new MediaRecorder(this.props.stream);
    mr.onstop = this.onMediaStop.bind(this);
    mr.ondataavailable = this.onDataAvailable.bind(this);
    this.imageCache = new Map();
    this.submittedWords = new Set();
    this.availableWords = new Map();
    this.lastAvailableCount = 999;
    this.state = {
      recording: false,
      chunks: [],
      mediaRecorder: mr,
      clips: [],
      nextWord: null,
    }
  }

  componentDidMount() {
    this.nextWord();
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
        name: this.state.nextWord,
      }
      this.state.clips.push(newClip);
      this.nextWord()
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


  onSubmitClip(i) {
    var name = this.state.clips[i].name;
    var id = this.availableWords.get(name);
    debug("submit clip # ", name, id);
    // var newClips = this.state.clips.slice();
    // newClips.splice(i, 1);
    // this.setState({clips: newClips})

    //submit clip!
    var that = this;
    var oReq = new XMLHttpRequest();
    oReq.open("POST", "/api/clip/"+id, true);
    oReq.onload = function (oEvent) {
      // Uploaded.
        debug("submitted clip # ", name);
        that.submittedWords.add(name);
        that.onDeleteClip(i);
    };
    oReq.send(this.state.clips[i].blob);

  }

  onDeleteClip(i) {
    debug("delete clip # ", i);
    var justDeleted = this.state.clips[i].name
    var newClips = this.state.clips.slice();
    newClips.splice(i, 1);
    // reset nextWord as when user deletes a clip they will want to rerecord it!
    this.setState({clips: newClips, nextWord: justDeleted})
    this.nextWord()

  }

  onStopRecord() {
      this.state.mediaRecorder.stop();
      debug("recorder stopped");
      debug("mr state: ", this.state.mediaRecorder.state);
    }

  getPendingWords() {
    var pending = new Set();
    for (let w of this.state.clips) {
      pending.add(w.name);
    }
    debug("pending", pending)
    return pending;
  }

  getValidWords() {
    var availableWords = mapKeystoSet(this.availableWords);

    var validWords = difference(difference(availableWords, this.submittedWords), this.getPendingWords());
    return validWords;
  }

  updateAvailable() {
    var that = this;

    if (this.getValidWords().size < 5 && (this.lastAvailableCount >= 5 || this.getPendingWords().size == 0)) {
      fetch('/api/word')
        .then(function(response) {
          response.json().then(function(data){
            debug("update available", data)
            var newAvailableWords = new Map();
            for (var key in data) {
                newAvailableWords.set(data[key], key);
            }
            var availableSet = mapKeystoSet(newAvailableWords);

            that.lastAvailableCount = availableSet.size;
            var inBoth = intersection(availableSet, mapKeystoSet(that.availableWords));
            // call nextWord only if the list has changed!
            if (inBoth.size != availableSet.size || availableSet.size == 0) {
              that.availableWords = newAvailableWords;
              that.nextWord();
            }
          });
        })
    }
  }

  nextWord() {
    debug("check nextWord(), current: ", this.state.nextWord);
    if (this.lastAvailableCount != 0) {
      this.updateAvailable();
    }

    // if current word is valid then leave it.
    var validWords = this.getValidWords();
    debug("validWords", validWords);
    if (validWords.has(this.state.nextWord)) {
      debug("early return");
      return
    }

    // otherwise choose new nextWord and update state
    if (validWords.size == 0) {
      debug("size", validWords.size);
      this.setState({nextWord: null});
      return
    }
    var newNextWord = validWords.values().next().value;
    console.log(newNextWord)
    this.setState({nextWord: newNextWord});

    this.fetchImages.bind(this)(newNextWord);
  }

  render () {

    var clips = [];
    for (var i=0; i<this.state.clips.length; i++) {
      var url = window.URL.createObjectURL(this.state.clips[i].blob);
      clips.push(
        <article className="clip" key={i} >
          <audio controls src={url} />
          <p>{this.state.clips[i].name}</p>
          <button className="submit" onClick={this.onSubmitClip.bind(this, i)}>
            Submit
          </button>
          <button className="delete" onClick={this.onDeleteClip.bind(this, i)}>
            Delete
          </button>
        </article>
      )
    }

    var images = [];
    if (this.imageCache.has(this.state.nextWord)) {
      var urls = this.imageCache.get(this.state.nextWord);
      for (var i=0; i<6; i++){
        images.push(
          <image src={urls[i]} key={i} width="200" />
        )
      }
    }

    var nextWordSection = <h1>next word: {this.state.nextWord}</h1>
    if (!this.state.nextWord) {
      if (mapKeystoSet(this.availableWords).size > 0) {
        debug("avail", this.availableWords);
        nextWordSection = <h1>Word Limit reached, submit to see more.</h1>
      } else {
        nextWordSection = <h1>No words left :)</h1>
      }
    }

    return <div className="wrapper">
      <header>
        {nextWordSection}
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
};

export default AudioRecorder;
