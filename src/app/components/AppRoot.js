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

class AppRoot extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      currentUser: "ben",
      mode: null,
    }
    this.onLogin = this.onLogin.bind(this);

  }

  onLogin(name) {
    console.log("logging in: ", name);
    this.setState({currentUser: name});
  }

  onSelectMode(mode) {
    console.log("selectMode: ", mode);
    this.setState({mode: mode});
  }

  render () {
    var widget = null;
    if (!this.state.currentUser) {
      widget = <LoginForm onSubmit={this.onLogin}/>
    } else if (!this.state.mode) {
      widget = <div className="mode">
        <h1>Hello, {this.state.currentUser} </h1>
        <button className="mode" onClick={this.onSelectMode.bind(this, "learn")}>Learn</button>
        <button className="mode" onClick={this.onSelectMode.bind(this, "contribute")}>Contribute</button>
      </div>;
    } else if (this.state.mode == "learn") {
      widget = <Learn stream={this.props.state.stream} user={this.state.currentUser} />;
    } else {
      widget = <AudioRecorder stream={this.props.state.stream} />;
    }
    return <div className="appRoot">
      <div className="user">{this.state.currentUser} | {this.state.mode} </div>
      {widget}
    </div>;
  }
}

// Prop types validation
AppRoot.propTypes = {
  state: React.PropTypes.object.isRequired,
};

export default AppRoot;
