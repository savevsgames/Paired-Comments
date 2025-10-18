// This is a test markdown file that I will fill with example code snippets.

```javascript
import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Home from './components/Home';
import About from './components/About';
import Contact from './components/Contact'; 
import NotFound from './components/NotFound';
import './App.css';

function App() {    
    return (
        <Router>
            <div className="App">
                <Switch>
                    <Route exact path="/" component={Home} />
                    <Route path="/about" component={About} />
                    <Route path="/contact" component={Contact} />
                    <Route component={NotFound} />
                </Switch>
            </div>
        </Router>
    );
}

export default App;
```
``````css
.App {
    text-align: center;
    font-family: Arial, sans-serif;
}   
.App-header {
    background-color: #282c34;
    min-height: 100vh;  
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: calc(10px + 2vmin);
    color: white;
}
.App-link {
    color: #61dafb;
}   
.App-footer {
    background-color: #f1f1f1;
    padding: 10px;
}