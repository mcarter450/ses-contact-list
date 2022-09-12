import { Accordion, Form,  ButtonGroup, Dropdown, DropdownButton } from 'react-bootstrap';

import React from 'react';
import EditList from './EditList';
import AddContact from './AddContact';

import fakeEmails from './fakeEmails';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck, faCoffee } from '@fortawesome/fontawesome-free-solid'

class ContactList extends React.Component {

  constructor(props) {

    super(props);

    this.state = {
      list: null, 
      list_name: 'KahoyCraftsMailingList', 
      prefs: null,
      show_prefs: false,
      contacts: [], 
      suppressed_emails: {},
      pagesize: 10, 
      next_token: '',
      selected_items: [],
      bulk_action: 'remove'
    };
    
    this.handleSetPageSize = this.handleSetPageSize.bind(this);
    this.handleSaveContact = this.handleSaveContact.bind(this);
    this.handleListUpdate = this.handleListUpdate.bind(this);
    this.handleGoToFirstPageClick = this.handleGoToFirstPageClick.bind(this);
    this.handleNextClick = this.handleNextClick.bind(this);
    this.handleCheckboxClick = this.handleCheckboxClick.bind(this);
    this.handleSetBulkAction = this.handleSetBulkAction.bind(this);
    this.handleApplyBulkAction = this.handleApplyBulkAction.bind(this);
    this.handleShowPrefsClick = this.handleShowPrefsClick.bind(this);

  }

  /**
   * Load contact and suppression lists
   *
   * @return void
   */
  componentDidMount() {

    this.getContactList();
    this.getSuppressedDestinations();
    
  }

  /**
   * Event handler
   * 
   * @param {Object} Event object
   * @return void
   */
  handleShowPrefsClick(e) {

    let index = e.target.value,
        email = this.state.contacts[index].EmailAddress;

    if (this.state.prefs && (email == this.state.prefs.EmailAddress)) {
      if (! this.state.show_prefs ) {
        this.setState({ show_prefs: true });
      } else {
        this.setState({ show_prefs: false });
      }
      return;
    }

    let params = {
      ContactListName: this.state.list_name, /* required */
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

    /**
   * Load contact list
   *
   * @return void
   */
  getContactList() {

    let params = {
      ContactListName: this.state.list_name /* required */
    };

    this.props.sesv2.getContactList(params, (err, data) => {

      if (err) {
        console.log(err); // an error occurred
      }
      else {

        this.setState({ list: data });        // successful response

        let params = {
          'ContactListName': data.ContactListName,
          // 'Filter': {
          //   'FilteredStatus': 'OPT_OUT',
          //   "TopicFilter": { 
          //     "TopicName": "News",
          //     "UseDefaultIfPreferenceUnavailable": false
          //   }
          // },
          'PageSize': this.state.pagesize
        };

        if (this.state.next_token) {
          params.NextToken = this.state.next_token;
        }

        this.props.sesv2.listContacts(params, (err, data) => {
          if (! err ) {
            this.setState({ contacts: data.Contacts });
            this.setState({ next_token: data.NextToken });
          }
        });

      }

    });

  }

  /**
   * Get global suppression list
   *
   * @return void
   */
  getSuppressedDestinations() {

    this.props.sesv2.listSuppressedDestinations({}, (err, data) => {
      if (! err ) {

        const suppressed_emails = {};

        for (const [index, item] of data.SuppressedDestinationSummaries.entries()) {
          suppressed_emails[item.EmailAddress] = item.Reason;
        }

        this.setState({ suppressed_emails: suppressed_emails });
      }
    });

  }

  /**
   * Set page size and load contact list
   *
   * @param {Number} eventKey   Page size
   * @return void
   */
  handleSetPageSize(eventKey) {

    this.setState({ pagesize: eventKey, next_token: '' });
    this.getContactList();

  }

  /**
   * Go to first page in results
   *
   * @param {Object} e
   * @return void
   */
  handleGoToFirstPageClick(e) {

      e.preventDefault();

      this.setState({ selected_items: [], next_token: '' });
      this.getContactList();

  }

  /**
   * Get next page of results
   *
   * @param {Object} e
   * @return void
   */
  handleNextClick(e) {

    e.preventDefault();

    if (this.state.next_token) {
      this.setState({ selected_items: [] });
      this.getContactList();
    }

  }

  /**
   * Get checkbox state from parent
   * 
   * @param {Number} index of checkbox
   */
  getCheckBoxState(index) {

    let found = -1;

    for ( let i = 0; i < this.state.selected_items.length; i++ ) {
      if ( this.state.selected_items[i] == index ) {
        found = i;
        break;
      }
    }

    return found;

  }

  /**
   * Go to first page in results
   *
   * @param {Object} e
   * @return void
   */
  handleCheckboxClick(e) {

    let index = e.target.value,
        found = this.getCheckBoxState(index);

    if (found == -1) {
      // add index
      this.state.selected_items.push(index);

    }
    else {
      // remove index
      this.state.selected_items.splice(found, 1);

    }

    this.setState({ selected_items: this.state.selected_items });

  }

  /**
   * Set bulk action
   *
   * @param {Object} e
   * @return void
   */
  handleSetBulkAction(e) {

    this.setState({ bulk_action: e.target.value });

  }

  /**
   * Apply bulk action
   *
   * @param {Object} e
   * @return void
   */
  async handleApplyBulkAction(e) {

    e.preventDefault();

    if (! this.state.selected_items.length ) {
      // no items selected
      return;
    }

    let action = this.state.bulk_action;

    for (let i = 0; i < this.state.selected_items.length; i++) {
      let item = this.state.selected_items[i],
          email = this.state.contacts[item].EmailAddress;

      if (action == 'remove') {

        let params = {
          ContactListName: this.state.list.ContactListName, /* required */
          EmailAddress: email /* required */
        };

        await this.props.sesv2.deleteContact(params, (err, data) => {

          if (err) {
            console.log(err); // an error occurred
          }

        });

      } else {

        let params = {
          EmailAddress: email, /* required */
          Reason: 'BOUNCE' /* BOUNCE | COMPLAINT */
        };

        const result = await this.props.sesv2.putSuppressedDestination(params, function(err, data) {
        
          if (err) {
            console.log(err); // an error occurred
          }

        });

        if (! result.response.err ) {
          this.state.suppressed_emails[email] = params.Reason;
        }

      }
      

    }

    // refresh contact list
    this.setState({ selected_items: [], next_token: '', suppressed_emails: this.state.suppressed_emails });
    this.getContactList();

  }

  /**
   * Refresh list after update
   *
   * @param {Object} list
   * @return void
   */
  handleListUpdate(list) {

    if (! list.ContactListName ) {
      return;
    }

    let params = {
      ContactListName: list.ContactListName, // REQUIRED
      Description: list.Description, // REQUIRED,
      Topics: list.Topics
    };

    this.state.list.ContactListName = list.ContactListName;
    this.state.list.Description = list.Description;
    this.state.list.Topics = list.Topics;

    this.props.sesv2.updateContactList(params, (err, data) => {

      if (err) {
        console.log(err); // an error occurred
      } 
      else { // successful response
        this.setState({list: this.state.list});
      }

    });

  }

  /**
   * Load fake email contacts
   *
   * @param {Object} e
   * @return void
   */
  handleAddFakeContacts(e) {

    const fake_emails = fakeEmails();

    for (let i = 0; i < fake_emails.length; i++) {
      let email = fake_emails[i];

      let contact = {
        //'AttributesData' => '{"Name": "'. $name .'"}',
        ContactListName: 'KahoyCraftsMailingList', // REQUIRED
        EmailAddress: email, // REQUIRED
        TopicPreferences: [
          {
            SubscriptionStatus: 'OPT_IN', // REQUIRED
            TopicName: 'News' // REQUIRED
          },
          // ...
        ],
        UnsubscribeAll: false
      };

      this.props.sesv2.createContact(contact, (err, data) => {

        if (err) {
          console.log(err); // an error occurred
        } 
        else { // successful response
          console.log(email);
        }

      });
    }

  }

  /**
   * Save new contact
   *
   * @param {Object} contact
   * @return void
   */
  handleSaveContact(contact) {

    if (contact.email.length === 0) {
      return;
    }

    contact = {
      AttributesData: '{"Name": "'+ contact.name +'"}',
      ContactListName: this.state.list.ContactListName, // REQUIRED
      EmailAddress: contact.email, // REQUIRED
      TopicPreferences: [
        {
          SubscriptionStatus: 'OPT_IN', // REQUIRED
          TopicName: 'News' // REQUIRED
        },
        // ...
      ],
      UnsubscribeAll: false
    };

    this.props.sesv2.createContact(contact, (err, data) => {

      if (err) {
        console.log(err); // an error occurred
        this.setState({
          email: ''
        });
      } 
      else { // successful response
        this.setState({
          contacts: this.state.contacts.concat(contact),
          email: ''
        });
      }

    });
  }

  getTopicPrefs() {

    const topic_prefs = [];

    if (this.state.prefs && this.state.prefs.TopicPreferences) {

      for (const [index, value] of this.state.prefs.TopicPreferences.entries()) {

        let status = value.SubscriptionStatus == 'OPT_IN' ? 'Opt-in' : 'Opt-out';
        topic_prefs.push(<li key={index}>{value.TopicName}: <strong>{status}</strong></li>);

      }

    }

    return topic_prefs;

  }

  getDefaultTopicPrefs() {

    const topic_default_prefs = [];

    if (this.state.prefs && this.state.prefs.TopicDefaultPreferences) {

      for (const [index, value] of this.state.prefs.TopicDefaultPreferences.entries()) {

        let status = value.SubscriptionStatus == 'OPT_IN' ? 'Opt-in' : 'Opt-out';
        topic_default_prefs.push(<li key={index}>{value.TopicName}: <strong>{status}</strong></li>);

      }

    }

    return topic_default_prefs;

  }

  getAttrData() {

    let attr_data = '';

    if ( this.state.prefs && this.state.prefs.AttributesData ) {
      attr_data = (
        <div>
          <h4>Attributes</h4>
          <code>{ this.state.prefs.AttributesData }</code>
        </div>
      );
    }

    return attr_data;

  }

  getUnsubscribeAllPref() {

    let unsubscribe_all = 'False';

    if (this.state.prefs && this.state.prefs.UnsubscribeAll) {
      unsubscribe_all = 'True';
    }

    return unsubscribe_all;

  }

  getCreateDate() {

    let created = '';

    if (this.state.prefs && this.state.prefs.CreatedTimestamp) {
      created = this.state.prefs.CreatedTimestamp;
      created = created.toLocaleString('en-US');
    }

    return created;

  }

  getLastUpdateDate() {

    let last_updated = '';

    if (this.state.prefs && this.state.prefs.LastUpdatedTimestamp) {
      last_updated = this.state.prefs.LastUpdatedTimestamp;
      last_updated = last_updated.toLocaleString('en-US');
    }

    return last_updated;

  }

  isEmailSuppressed(email) {

    let is_suppressed = '';

    let suppress_reason = this.state.suppressed_emails[email];
    if (suppress_reason) {
      is_suppressed = <em className="supressed">Suppressed, Reason: {suppress_reason}</em>;
    }

    return is_suppressed;

  }

  render() {

    const items = [];

    for (const [index, item] of this.state.contacts.entries()) {

      items.push(
        <Accordion.Item as="li" eventKey={index + this.state.next_token} key={index + this.state.next_token}>
          <h5 className="accordion-header">
            <label><input type="checkbox" value={index} onChange={this.handleCheckboxClick} checked={ this.getCheckBoxState(index) != -1 } /> {item.EmailAddress}</label>
            { this.isEmailSuppressed(item.EmailAddress) }
            <Accordion.Button value={index} onClick={this.handleShowPrefsClick} />
          </h5>
          <Accordion.Body>
            <div className="row prefs">
              <div className="col">
                <h4>Topic Preferences</h4>
                <ul>
                  { this.getTopicPrefs() }
                </ul>
                <h4>Topic Default Preferences</h4>
                <ul>
                  { this.getDefaultTopicPrefs() }
                </ul>
                { this.getAttrData() }
              </div>
              <div className="col">
                <h4>Meta</h4>
                <dl>
                  <dt>UnsubscribeAll</dt>
                  <dd>{ this.getUnsubscribeAllPref() }</dd>

                  <dt>CreatedTimestamp</dt>
                  <dd>{ this.getCreateDate() }</dd>

                  <dt>LastUpdatedTimestamp</dt>
                  <dd>{ this.getLastUpdateDate() }</dd>
                </dl>
              </div>
            </div>
          </Accordion.Body>
        </Accordion.Item>
      );
    }

    let edit_list = '';
    let list_description = '';

    if (this.state.list) {
      edit_list = <EditList list={this.state.list} handleListUpdate={this.handleListUpdate} />
      list_description = this.state.list.Description;
    }

    let pagesizes = [10, 15, 25, 50, 100];

    let dropdown_items = [];

    for (let i = 0; i < pagesizes.length; i++) {
      let pagesize = pagesizes[i];

      if (pagesize == this.state.pagesize) {
        dropdown_items.push(<Dropdown.Item eventKey={pagesize} className="active"><FontAwesomeIcon icon={faCheck} />  { pagesize }</Dropdown.Item>);
      } else {
        dropdown_items.push(<Dropdown.Item eventKey={pagesize}>{ pagesize }</Dropdown.Item>);
      }

    }

    return (
      <div className="contact-list">
        <h3 className="list-name"><FontAwesomeIcon icon={faCoffee} /> {list_description}</h3>
        <div className="row filter-list">
          <div className="col-md-6">
            <ButtonGroup className="num-results">
              <DropdownButton variant="dark" id="dropdown-num-results" title="Results per page" onSelect={this.handleSetPageSize}>
                { dropdown_items }
              </DropdownButton>
              {edit_list}
            </ButtonGroup>
          </div>
          <div className="col-md-6">
            <form className="bulk-actions" onSubmit={this.handleApplyBulkAction}>
              <div className="row">
                <label className="col-3 col-form-label">Bulk actions</label>
                <div className="col">
                  <Form.Select id="bulkaction" onChange={this.handleSetBulkAction}>
                    <option value="remove">Remove</option>
                    <option value="suppress">Suppress</option>
                  </Form.Select>
                </div>
                <div className="col">
                  <button type="submit" className="btn btn-primary">Apply</button>
                </div>
              </div>
            </form>
          </div>
        </div>
        <Accordion as="ul">
          {items}
        </Accordion>
        <footer>
          <AddContact handleSaveContact={this.handleSaveContact} /> {/*<Button onClick={this.handleAddFakeContacts}>Add Fake Emails</Button>*/}
          <nav aria-label="Page navigation">
            <ul className="pagination">
              {/*<li class="page-item"><a class="page-link" href="#">Previous</a></li>*/}
              <li className="page-item"><a className="page-link" href="#" onClick={this.handleGoToFirstPageClick}>1</a></li>
              <li className="page-item"><a className="page-link" href="#" onClick={this.handleNextClick}>Next</a></li>
            </ul>
          </nav>
        </footer>
      </div>
    );
  }
}

export default ContactList;
