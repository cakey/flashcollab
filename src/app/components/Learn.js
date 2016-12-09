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
    this.removeImage = this.removeImage.bind(this);
  }

  componentDidMount() {
    this.getAvailableReviews();
  }
  onStart() {
    this.setState({started: true});
  }

  removeImage(wordID, url) {
    // TODO and feed the 404/401 back to the server ;)
    debug("removeImage", url)
    var newMap = new Map(that.state.imageCache);
    newMap[wordID] = newMap[wordID].filter((k) => k != url);
    this.setState({"imageCache": newMap});
  }

  getImages(wordID) {
    var that = this;
    if (this.state.imageCache.has(wordID)) {
      return this.state.imageCache.get(wordID);
    }
    debug("fetching images")
    fetch("/api/images/"+wordID)
    .then(json)
    .then(function(data) {
      debug("fetched images: ", data)
      var newMap = new Map(that.state.imageCache);
      if (data.images) {
        newMap.set(wordID, data.images)
      } else {
        newMap.set(wordID, false)
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
        debug("images: ", images);
        var imgs = [];
        _(images).shuffle().take(4).each((i, key) => {
          imgs.push(<img className="learn" key={key} src={i} onerror={this.removeImage.bind(this, nextReview.wordID, i)} />)
        });
        widget = <div className="images">
          {imgs}
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
