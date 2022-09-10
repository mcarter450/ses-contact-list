import { Accordion } from 'react-bootstrap';

import React from 'react';

class ContactList extends React.Component {

  constructor(props) {

    super(props);

    this.state = { 
      prefs: null,
      show_prefs: false,
    };

    this.handleShowPrefsClick = this.handleShowPrefsClick.bind(this);
    this.handleCheckboxClick = this.handleCheckboxClick.bind(this);

  }

  /**
   * Event handler
   * 
   * @param {Object} Event object
   * @return void
   */
  handleCheckboxClick(e) {

    const target = e.target;

    // Notify parent
    this.props.handleCheckboxClick(target);

  }

  /**
   * Get checkbox state from parent
   * 
   * @param {Number} index of checkbox
   */
  getCheckBoxState(index) {

    let found = -1;

    for (let i = 0; i < this.props.selected_items.length; i++ ) {
      if (this.props.selected_items[i] == index) {
        found = 1;
        break;
      }
    }

    return found;

  }

  /**
   * Event handler
   * 
   * @param {Object} Event object
   * @return void
   */
  handleShowPrefsClick(e) {

    let index = e.target.value,
        email = this.props.items[index].EmailAddress;

    if (this.state.prefs && (email == this.state.prefs.EmailAddress)) {
      if (! this.state.show_prefs ) {
        this.setState({ show_prefs: true });
      } else {
        this.setState({ show_prefs: false });
      }
      return;
    }

    let params = {
      ContactListName: this.props.list_name, /* required */
      EmailAddress: email /* required */
    };

    this.props.sesv2.getContact(params, (err, data) => {

      if (err) {
        console.log(err); // an error occurred
      }
      else {

        this.setState({ 
          prefs: data,
          show_prefs: true
        });

      }

    });

  }

  render() {

    const topic_prefs = [],
          topic_default_prefs = [];

    if (this.state.prefs && this.state.prefs.TopicPreferences) {

      for (const [index, value] of this.state.prefs.TopicPreferences.entries()) {

        let status = value.SubscriptionStatus == 'OPT_IN' ? 'Opt-in' : 'Opt-out';
        topic_prefs.push(<li key={index}>{value.TopicName}: <strong>{status}</strong></li>);

      }

    }

    if (this.state.prefs && this.state.prefs.TopicDefaultPreferences) {

      for (const [index, value] of this.state.prefs.TopicDefaultPreferences.entries()) {

        let status = value.SubscriptionStatus == 'OPT_IN' ? 'Opt-in' : 'Opt-out';
        topic_default_prefs.push(<li key={index}>{value.TopicName}: <strong>{status}</strong></li>);

      }

    }

    const items = [];

    for (const [index, item] of this.props.items.entries()) {

      let class_name = 'row prefs',
          attr_data = '';

      if ( this.state.prefs && this.state.prefs.AttributesData ) {
        attr_data = (
          <div>
            <h4>Attributes</h4>
            <code>{ this.state.prefs.AttributesData }</code>
          </div>
        );
      }

      let unsubscribe_all = 'False';
      if (this.state.prefs && this.state.prefs.UnsubscribeAll) {
        unsubscribe_all = 'True';
      }

      let created = '';
      if (this.state.prefs && this.state.prefs.CreatedTimestamp) {
        created = this.state.prefs.CreatedTimestamp;
        created = created.toLocaleString('en-US');
      }

      let last_updated = '';
      if (this.state.prefs && this.state.prefs.LastUpdatedTimestamp) {
        last_updated = this.state.prefs.LastUpdatedTimestamp;
        last_updated = last_updated.toLocaleString('en-US');
      }

      let prefs = (
        <div className={class_name}>
          <div className="col">
            <h4>Topic Preferences</h4>
            <ul>
              {topic_prefs}
            </ul>
            <h4>Topic Default Preferences</h4>
            <ul>
              {topic_default_prefs}
            </ul>
            { attr_data }
          </div>
          <div className="col">
            <h4>Meta</h4>
            <dl>
              <dt>UnsubscribeAll</dt>
              <dd>{ unsubscribe_all }</dd>

              <dt>CreatedTimestamp</dt>
              <dd>{ created }</dd>

              <dt>LastUpdatedTimestamp</dt>
              <dd>{ last_updated }</dd>
            </dl>
          </div>
        </div>
      );

      let is_suppressed = '';

      let suppress_reason = this.props.suppressed_emails[item.EmailAddress];
      if (suppress_reason) {
        is_suppressed = <em className="supressed">Suppressed, Reason: {suppress_reason}</em>;
      }

      items.push(
        <Accordion.Item as="li" eventKey={index + this.props.next_token} key={index + this.props.next_token}>
          <h5 className="accordion-header">
            <label><input type="checkbox" value={index} onChange={this.handleCheckboxClick} checked={ this.getCheckBoxState(index) == 1 } /> {item.EmailAddress}</label>
            {is_suppressed}
            <Accordion.Button value={index} onClick={this.handleShowPrefsClick} />
          </h5>
          <Accordion.Body>
            { prefs }
          </Accordion.Body>
        </Accordion.Item>
      );
    }

    return (
      <div className="contact-list">
        <Accordion as="ul">
          {items}
        </Accordion>
      </div>
    );
  }
}

export default ContactList;
