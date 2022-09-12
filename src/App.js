import './App.css';

import { Container, Nav, Navbar } from 'react-bootstrap';

import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import ContactList from './ContactList';
import EmailTemplates from './EmailTemplates';
import ConfigurationSet from './ConfigurationSet';

const AWS = require('aws-sdk/dist/aws-sdk-react-native');

AWS.config = {
  region: 'us-west-2',
  accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY
};

const sesv2 = new AWS.SESV2({
  version: 'latest'
});

class App extends React.Component {

  render() {

    return (
      <BrowserRouter>
        <Navbar bg="dark" variant="dark">
          <Container>
            <Nav className="me-auto">
              <Nav.Link as={NavLink} to="/">Contact list</Nav.Link>
              <Nav.Link as={NavLink} to="/templates">Email templates</Nav.Link>
              <Nav.Link as={NavLink} to="/configuration">Configuration set</Nav.Link>
            </Nav>
          </Container>
        </Navbar>
        <div className="container">
          <Routes>
            <Route path="/" element={<ContactList sesv2={sesv2} />} />
            <Route path="/templates" element={<EmailTemplates sesv2={sesv2} />} />
            <Route path="/configuration" element={<ConfigurationSet sesv2={sesv2} />} />
          </Routes>
        </div>
      </BrowserRouter>
    );

  }

}

export default App;
