import { Button, Form } from 'react-bootstrap';

import React from 'react';

class AddContact extends React.Component {

  constructor(props) {

    super(props);

    this.state = { 
      name: '',
      email: ''
    };

    this.handleSave = this.handleSave.bind(this);

    this.handleChangeName = this.handleChangeName.bind(this);
    this.handleChangeEmail = this.handleChangeEmail.bind(this);

  }

  /**
   * @param {Object} e
   */
  handleChangeName(e) {
    this.setState({'name': e.target.value});
  }

  /**
   * @param {Object} e
   */
  handleChangeEmail(e) {
    this.setState({'email': e.target.value});
  }

  /**
   * @param {Object} e
   */
  handleSave(e) {

    this.props.handleSaveContact({
      name: this.state.name,
      email: this.state.email
    });

    this.setState({
      name: '',
      email: ''
    });

  }

  render() {
    return (
      <Form onSubmit={this.handleSave}>
        <div className="row">
          <div className="col-3">
            <Form.Group className="mb-3">
              <Form.Control type="text" id="new-contact-name" placeholder="Name" aria-label="Name" onChange={this.handleChangeName} value={this.state.name} />
            </Form.Group>
          </div>
          <div className="col-3">
            <Form.Group className="mb-3">
              <Form.Control type="text" id="new-contact-email" placeholder="Email" aria-label="Email" onChange={this.handleChangeEmail} value={this.state.email} />
            </Form.Group>
          </div>
          <div className="col">
            <Button type="submit">
              Add contact
            </Button>
          </div>
        </div>
      </Form>
    );
  }

}

export default AddContact;
