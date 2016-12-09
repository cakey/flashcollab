import React from 'react/addons';
import Debug from 'debug';

var _ = require('lodash');


var debug = Debug('Learn');

function json(response) {
  return response.json()
}

class Learn extends React.Component {

  constructor(props) {
    super(props)
    this.availableReviews = [];
    this.state = {
      availableReviews: [],
      imageCache: new Map(),
      started: false,
      guessed: false,
    };
    this.getAvailableReviews = this.getAvailableReviews.bind(this);
    this.onStart = this.onStart.bind(this);
    this.getImages = this.getImages.bind(this);
    this.onShowAnswer = this.onShowAnswer.bind(this);
  }

  componentDidMount() {
    this.getAvailableReviews();
  }

  onStart() {
    this.setState({started: true});
  }

  onShowAnswer() {
    this.setState({guessed: true});
  }

  getImages(wordID) {
    var that = this;
    if (this.state.imageCache.has(wordID)) {
      debug(wordID, " found in cache");
      var returnee = this.state.imageCache.get(wordID);
      debug(returnee);
      return returnee
    }
    debug(wordID, " not in cache");
    debug("fetching images")
    fetch("/api/images/"+wordID)
    .then(json)
    .then(function(data) {
      debug("fetched images: ", data)
      var newMap = new Map(that.state.imageCache);
      if (data.images) {
        // randomise set, but can't randomise within a session!!
        newMap.set(wordID, _(data.images).shuffle().take(2).value());
      } else {
        newMap.set(wordID, false);
      }
      that.setState({"imageCache": newMap});
    })
  }

  getAvailableReviews() {
    var that = this;
    fetch("/api/reviews/"+this.props.userid)
    .then(json)
    .then(function(data) {
      that.setState({
        availableReviews: data
      })
    })
  }

  render () {

    var widget;
    if (!this.state.started) {
      widget =  <div className="mode">
        <button className="mode" onClick={this.onStart}>
          Start {this.state.availableReviews.length} reviews? <br />
        </button>
        </div>
    } else {
      var nextReview = this.state.availableReviews[0];
      debug("next review: ", nextReview);
      if (nextReview.format == 1) {
        var images = this.getImages(nextReview.wordID);
        var imgs = [];
        _(images).each((i, key) => {
          imgs.push(<img className="learn" key={key} src={i} />)
        });

        var answerWidget;
        if (!this.state.guessed) {
          answerWidget = <button onClick={this.onShowAnswer} className="showAnswer">(Show Answer)</button>
        } else {
          answerWidget = <div className="learn-wrapper">
            <h1>{this.state.availableReviews[0].word}</h1>
              <audio controls autoPlay src={"/api/clip/" + this.state.availableReviews[0].clipID} />
          </div>
        }

        widget = <div className="learnwidget">
          <h1>What is...</h1>
          <div className="images">
            {imgs}
          </div>
          {answerWidget}
        </div>
      }
    }
    return widget
  }
}

Learn.propTypes = {
  username: React.PropTypes.string.isRequired,
  userid: React.PropTypes.number.isRequired,
};

export default Learn;
