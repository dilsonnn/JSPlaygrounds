import _ from 'lodash';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import parseExpressions from '../selectors/parse_expressions';
import SplitPane from 'react-split-pane';

class Viewer extends Component {
  evaluateExpressions(expressions) {
    const formattedExpressions = _.mapValues(expressions, expression => {
      const result = eval(expression);

      if (result && result.type) {
        return result;
      } else if (_.isFunction(result) && result.name) {
        return <i>Function {result.name}</i>;
      } else if (_.isBoolean(result)) {
        return result ? 'True' : 'False';
      } else if (_.isObject(result) || _.isArray(result)) {
        return JSON.stringify(result);
      }

      return result;
    });

    return _.map(formattedExpressions, (expression, index) =>
      <div key={`index-${index}`}>{expression}</div>
    );
  }

  renderExpressions(code) {
    return this.evaluateExpressions(this.props.expressions);
  }

  render() {
    const defaultHeight = window.innerHeight / 1.3;
    console.log(this.props);
    return (
      <SplitPane split="horizontal" defaultSize={defaultHeight} className="viewer">
        <div className="result">
          {_.isEmpty(this.props.errors) && this.renderExpressions(this.props.code)}
        </div>
        <div className="errors">
          {this.props.errors}
        </div>
      </SplitPane>
    );
  }
}

function mapStateToProps(state){
  let expressions, errors;

  try {
    const parsedExpression = parseExpressions(state);
    expressions = parsedExpression.expressions;
    errors = parsedExpression.errors;
  } catch (e) {
    errors = e.toString();
  }

  return { expressions, errors };
}

export default connect(mapStateToProps)(Viewer);
