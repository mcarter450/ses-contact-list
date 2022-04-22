import { Button, ButtonGroup, Dropdown, Modal, Form } from 'react-bootstrap';

import React from 'react';

class EditList extends React.Component {

  constructor(props) {

    super(props);

    this.state = { 
      list: structuredClone(props.list), 
      showEditListName: false,
      showEditListNewsTopic: false, 
      showEditListNewProductsTopic: false 
    };

    this.handleCancel = this.handleCancel.bind(this);
    this.handleSave = this.handleSave.bind(this);
    this.handleEditListName = this.handleEditListName.bind(this);
    this.handleEditListTopic = this.handleEditListTopic.bind(this);
    this.handleChangeDescription = this.handleChangeDescription.bind(this);
    this.handleChangeTopicName = this.handleChangeTopicName.bind(this);
    this.handleChangeTopicDescription = this.handleChangeTopicDescription.bind(this);
    this.handleChangeDefaultSubscription = this.handleChangeDefaultSubscription.bind(this);

  }

  /**
   * @param {Object} e
   */
  handleEditListName(e) {
    this.setState({ showEditListName: true });
  }

  /**
   * @param {Object} e
   */
  handleEditListTopic(topic) {

    let key = 'showEditList'+ topic +'Topic';
    this.setState({[key]: true });

  }

  /**
   * @param {Object} e
   */
  handleChangeDescription(e) {

    this.state.list.Description = e.target.value;

    this.setState({ list: this.state.list });

  }

  /**
   * @param {String} name
   * @param {Number} Index of topic
   */
  parseIndex(name) {

    let matches = name.match(/_([0-9]+)$/);
    
    return parseInt(matches[1]);

  }

  /**
   * @param {Object} e
   */
  handleChangeTopicName(e) {

    const index = this.parseIndex(e.target.name);

    this.state.list.Topics[index].DisplayName = e.target.value;

    this.setState({ list: this.state.list });

  }

  /**
   * @param {Object} e
   */
  handleChangeTopicDescription(e) {

    const index = this.parseIndex(e.target.name);

    this.state.list.Topics[index].Description = e.target.value;

    this.setState({ list: this.state.list });

  }

  /**
   * @param {Object} e
   */
  handleChangeDefaultSubscription(e) {

    const index = this.parseIndex(e.target.name);

    this.state.list.Topics[index].DefaultSubscriptionStatus = e.target.value;

    this.setState({ list: this.state.list });

  }

  /**
   * @param {Object} e
   */
  handleCancel(e) {

    this.setState({ 
      showEditListName: false,
      showEditListNewsTopic: false, 
      showEditListNewProductsTopic: false, 
      list: structuredClone(this.props.list)
    });

  }

  /**
   * @param {Object} e
   */
  handleSave(e) {

    this.props.handleListUpdate(this.state.list);

    this.setState({
      showEditListName: false,
      showEditListNewsTopic: false, 
      showEditListNewProductsTopic: false 
    });

  }

  render() {

    let topics = [],
        topics_menu = [],
        widget = '';

      if (this.state.list) {
        
        for (let index in this.state.list.Topics) {
          let topic = this.state.list.Topics[index];

          topics_menu.push(
            <Dropdown.Item key={index} eventKey={topic.TopicName}>Edit {topic.TopicName}</Dropdown.Item>
          );

          topics.push(
            <Modal key={index} show={this.state['showEditList'+ topic.TopicName +'Topic']} onHide={this.handleCancel}>
              <Modal.Header closeButton>
                <Modal.Title>Edit {topic.TopicName}</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Form className="edit-list-form">
                  <Form.Group className="mb-3">
                    <Form.Label>Name</Form.Label>
                    <Form.Control type="text" name={'topic_display_name_' + index} onChange={this.handleChangeTopicName} value={topic.DisplayName} />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Description</Form.Label>
                    <Form.Control name={'topic_description_' + index} onChange={this.handleChangeTopicDescription} as="textarea" rows={3} value={topic.Description} />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label className="inline-label">Default</Form.Label>
                    <Form.Check
                      inline
                      label="Opt in"
                      name={'default_subscription_' + index}
                      type="radio" 
                      id={`default_subscription_${index}-1`}
                      checked={topic.DefaultSubscriptionStatus == 'OPT_IN'} onChange={this.handleChangeDefaultSubscription} value="OPT_IN" 
                    />
                    <Form.Check
                      inline
                      label="Opt out"
                      name={'default_subscription_' + index}
                      type="radio" 
                      id={`default_subscription_${index}-2`}
                      checked={topic.DefaultSubscriptionStatus == 'OPT_OUT'} onChange={this.handleChangeDefaultSubscription} value="OPT_OUT" 
                    />
                  </Form.Group>
                </Form>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={this.handleCancel}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={this.handleSave}>
                  Save Changes
                </Button>
              </Modal.Footer>
            </Modal>
          );
        }

      }

      widget = (
        <>
          <Dropdown as={ButtonGroup} onSelect={this.handleEditListTopic}>
            <Button variant="dark" onClick={this.handleEditListName}>Edit list name</Button>

            <Dropdown.Toggle split variant="dark" id="dropdown-split-basic" />

            <Dropdown.Menu>
              {topics_menu}
            </Dropdown.Menu>
          </Dropdown>

          <Modal show={this.state.showEditListName} onHide={this.handleCancel}>
            <Modal.Header closeButton>
              <Modal.Title>Edit list name</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form className="edit-list-form">
                <Form.Group className="mb-3">
                  <Form.Label>List name</Form.Label>
                  <Form.Control type="text" id="edit-listname" onChange={this.handleChangeDescription} value={this.state.list.Description} />
                </Form.Group>  
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={this.handleCancel}>
                Cancel
              </Button>
              <Button variant="primary" onClick={this.handleSave}>
                Save Changes
              </Button>
            </Modal.Footer>
          </Modal>

          {topics}
        </>
      );

    //}

    return (
      <div className="edit-list">
        {widget}
      </div>
    );

  }

}

export default EditList;
