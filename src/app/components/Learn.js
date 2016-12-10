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
    this.imageWidget = this.imageWidget.bind(this);
    this.audioWidget = this.audioWidget.bind(this);
    this.textWidget = this.textWidget.bind(this);
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

  onGuess(guess) {
    debug("guess: ", guess);
    var currentReview = this.state.availableReviews[0];

    var that = this;

    var data = {
        format: currentReview.format,
        wordID: currentReview.wordID,
        userID: this.props.userID,
      }
    fetch("/api/reviews", {method: "POST", body: JSON.stringify(data)})
    .then(json)
    .then(function(data){
      that.setState({
        availableReviews: _.tail(that.state.availableReviews),
        guessed: false,
      })
    })
  }


  imageWidget(review) {
    var images = this.getImages(review.wordID);
    var imgs = [];
    _(images).each((i, key) => {
      imgs.push(<img className="learn" key={key} src={i} />)
    });
    return <div className="images">
        {imgs}
      </div>
  }

  audioWidget(review) {
    return <div className="learn-wrapper">
        <audio controls autoPlay src={"/api/clip/" + review.clipID} />
    </div>
  }

  textWidget(review) {
    return <h1>{review.word}</h1>
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
      var questionWidget = null

      if (nextReview.format == 1) {
        questionWidget = this.imageWidget(nextReview);
      } else if (nextReview.format == 2) {
        questionWidget = this.audioWidget(nextReview);
      } else if (nextReview.format == 3) {
        questionWidget = this.textWidget(nextReview);
      } else{
        questionWidget = <div>Card cannot be displayed :(</div>
      }
      var answerWidget;
      if (this.state.guessed) {
        if (nextReview.format == 1) {
          answerWidget = <div className="learn-wrapper">
            {this.textWidget(nextReview)}
            {this.audioWidget(nextReview)}
          </div>
        } else if (nextReview.format == 2) {
          answerWidget = <div className="learn-wrapper">
            {this.textWidget(nextReview)}
            {this.imageWidget(nextReview)}
          </div>
        } else if (nextReview.format == 3) {
          answerWidget = <div className="learn-wrapper">
            {this.imageWidget(nextReview)}
            {this.audioWidget(nextReview)}
          </div>
        } else{
          answerWidget = <div>Answer cannot be displayed :(</div>
        }
      }

      var responseWidget;
      if (!this.state.guessed) {
        responseWidget = <button onClick={this.onShowAnswer} className="showAnswer">Show Answer</button>
      } else {
        responseWidget = <div className="learn-wrapper">
            <button onClick={this.onGuess.bind(this, 0)} className="guessResponse">
              Wrong (Again!)
            </button>
            <button onClick={this.onGuess.bind(this, 1)} className="guessResponse">
              Ok
            </button>
            <button onClick={this.onGuess.bind(this, 2)} className="guessResponse">
              Good
            </button>
            <button onClick={this.onGuess.bind(this, 3)} className="guessResponse">
              Easy
            </button>
        </div>
      }
        widget = <div className="learnwidget">
          <h1>What is...</h1>
          {questionWidget}
          {answerWidget}
          {responseWidget}
        </div>
    }
    return widget
  }
}

Learn.propTypes = {
  username: React.PropTypes.string.isRequired,
  userid: React.PropTypes.number.isRequired,
};

export default Learn;
