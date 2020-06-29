import _ from 'lodash';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import parseExpressions from '../selectors/parse_expressions';
import SplitPane from 'react-split-pane';
import { expr } from 'jquery';

class Viewer extends Component {
  evaluateExpressions(expressions) {
    const formattedExpressions = _.mapValues(expressions, expression => {
      let result;
      try {
        result = eval(expression);
      }catch(e){
        result = e;
      }
      // Looks bad, but ok for now until i figure out how to apply a context to ts compiler.
      if(result && typeof result == 'string' && result.indexOf('<console.log>') > 1){
        return result.split('<console.log>');
      }
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
     
    return _.map(formattedExpressions, (expression, index) =>{
      if(_.isArray(expression)){
        return expression.map((expression, innerIdx) => <div key={`index-${index}-${innerIdx}`}>
          <div>{expression}</div>
        </div>)
      }
      return <div key={`index-${index}`}>{expression}</div>
    });
  }

  renderExpressions(code) {
    return this.evaluateExpressions(this.props.expressions);
  }

  render() {
    const defaultHeight = window.innerHeight / 1.3;
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
