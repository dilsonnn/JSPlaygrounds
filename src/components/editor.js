import _ from 'lodash';
import React, { Component } from 'react';
import CodeMirror from 'react-codemirror';
import 'codemirror/mode/jsx/jsx';
import * as actions from '../actions';
import { connect } from 'react-redux';


class Editor extends Component {


  onCodeChange(code) {
    this.props.updateCode(code);
  }

  render() {
    return (
      <div>
        <CodeMirror
          defaultValue={this.props.code}
          value={this.props.code}
          onChange={this.onCodeChange.bind(this)}
          options={{ mode: 'application/typescript', lineNumbers: true, tabSize: 2 }} />
      </div>
    );
  }
}

function mapStateToProps({code}) {
  return { code };
}

export default connect(mapStateToProps, actions)(Editor);
