import React from 'react/addons';

import Debug from 'debug';

import AudioRecorder from './AudioRecorder';
import Learn from './Learn';

var debug = Debug('AppRoot');


class LoginForm extends React.Component {
  constructor(props) {
    super(props)
    this.state = {value: ''};

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    this.setState({value: event.target.value});
  }

  handleSubmit(event) {
    console.log('A name was submitted: ' + this.state.value);
    this.props.onSubmit(this.state.value)
    event.preventDefault();
  }

  render() {
    return (
      <div className="login">
        <h1> enter your login id </h1>
          <input className="login" type="text" value={this.state.value} onChange={this.handleChange} />
        <button onClick={this.handleSubmit}>Login</button>
      </div>
    );
  }
}

function json(response) {
  return response.json()
}

class AppRoot extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      // currentUserName: null,
      // currentUserID: 0,
      // mode: null,
      currentUserName: "ben",
      currentUserID: 47,
      mode: "learn",
    }
    this.onLogin = this.onLogin.bind(this);

  }

  onLogin(name) {
    var that = this;
    console.log("logging in: ", name);
    fetch("/api/user/name/"+name)
    .then(json)
    .then(function(data) {
      that.setState({
        currentUserName: data.name,
        currentUserID: data.id,
      });
    })
  }

  onSelectMode(mode) {
    console.log("selectMode: ", mode);
    this.setState({mode: mode});
  }

  render () {
    var widget = null;
    if (!this.state.currentUserName) {
      widget = <LoginForm onSubmit={this.onLogin}/>
    } else if (!this.state.mode) {
      widget = <div className="mode">
        <h1>Hello, {this.state.currentUserName} </h1>
        <button className="mode" onClick={this.onSelectMode.bind(this, "learn")}>Learn</button>
        <button className="mode" onClick={this.onSelectMode.bind(this, "contribute")}>Contribute</button>
      </div>;
    } else if (this.state.mode == "learn") {
      widget = <Learn
        stream={this.props.state.stream}
        username={this.state.currentUserName}
        userid={this.state.currentUserID}
      />;
    } else {
      widget = <AudioRecorder stream={this.props.state.stream} />;
    }
    return <div className="appRoot">
      <div className="user">{this.state.currentUserName} | {this.state.mode} </div>
      {widget}
    </div>;
  }
}

// Prop types validation
AppRoot.propTypes = {
  state: React.PropTypes.object.isRequired,
};

export default AppRoot;
