// adapted from https://github.com/mdn/web-dictaphone

import React, { Component, PropTypes } from 'react';
import Debug from 'debug';
import config from '../../../config/app';


class AudioRecorder extends React.Component {

  constructor(props) {
    super(props)
    var mr = new MediaRecorder(this.props.stream);
    mr.onstop = this.onMediaStop.bind(this);
    mr.ondataavailable = this.onDataAvailable.bind(this);
    this.state = {
      recording: false,
      chunks: [],
      mediaRecorder: mr,
      clips: [],
    }
  }

  onDataAvailable(e) {
    console.log("chunk");
    this.state.chunks.push(e.data);
  }

  onMediaStop(e) {
      console.log("data available after MediaRecorder.stop() called.");
      var blob = new Blob(this.state.chunks, { 'type' : 'audio/ogg; codecs=opus' });
      this.state.chunks = [];
      var newClip = {
        blob: blob,
        name: "my clip name",
      }
      this.state.clips.push(newClip);
      this.setState({recording: false})
  }

  onRecord() {
      this.state.mediaRecorder.start();
      console.log("mr state: ", this.state.mediaRecorder.state);
      console.log("recorder started");
      this.setState({recording: true})
  }

  onDeleteClip(i) {
    console.log("delete clip # ", i);
    var newClips = this.state.clips.slice();
    newClips.splice(i, 1);
    this.setState({clips: newClips})
  }

  onStopRecord() {
      this.state.mediaRecorder.stop();
      console.log("mr state: ", this.state.mediaRecorder.state);
      console.log("recorder stopped");
    }

  render () {

    var clips = [];
    console.log(this.state.clips.length);
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

    return <div className="wrapper">
      <header>
        <h1>{config.title}</h1>
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
  // state: React.PropTypes.object.isRequired,
};

export default AudioRecorder;
