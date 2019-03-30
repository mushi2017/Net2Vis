import * as React from 'react';
import { HashRouter as Router, Route } from 'react-router-dom';

import Main from './components/MainComponent';

// AppRouter Calling other Components dependant on Route
class AppRouter extends React.Component {
  render() {
    return (
      <div className='content'>
        <Router>
          <div className='full'>
            <Route exact={true} path="/:id" component={Main} />
            <Route exact={true} path="" component={Main} />
          </div>
        </Router>>
      </div>
    );
  }    
}

export default AppRouter;
