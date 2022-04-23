import './App.css';

import { Form, Button, ButtonGroup, Dropdown, DropdownButton } from 'react-bootstrap';

import React from 'react';
import EditList from './EditList';
import AddContact from './AddContact';
import ContactList from './ContactList';

import fakeEmails from './fakeEmails';

const AWS = require('aws-sdk/dist/aws-sdk-react-native');

AWS.config = {
  region: 'us-west-2',
  accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY
};

const sesv2 = new AWS.SESV2({
  version: 'latest'
});

//import Aws from 'aws-sdk';

class App extends React.Component {

  constructor(props) {

    super(props);

    this.state = {
      list_name: 'KahoyCraftsMailingList', 
      list: null, 
      contacts: [], 
      suppressed_emails: {},
      items: [], 
      pagesize: 10, 
      next_token: '',
      selected_items: [],
      bulk_action: 'remove'
    };
    
    this.handleChange = this.handleChange.bind(this);
    this.handleSetPageSize = this.handleSetPageSize.bind(this);
    this.handleSaveContact = this.handleSaveContact.bind(this);
    this.handleListUpdate = this.handleListUpdate.bind(this);
    this.handleGoToFirstPageClick = this.handleGoToFirstPageClick.bind(this);
    this.handleNextClick = this.handleNextClick.bind(this);
    this.handleCheckboxClick = this.handleCheckboxClick.bind(this);
    this.handleSetBulkAction = this.handleSetBulkAction.bind(this);
    this.handleApplyBulkAction = this.handleApplyBulkAction.bind(this);

  }

  render() {

    let edit_list = '';
    let list_description = '';

    if (this.state.list) {
      edit_list = <EditList list={this.state.list} handleListUpdate={this.handleListUpdate} />
      list_description = this.state.list.Description;
    }

    return (
      <div className="container">
        <h3 className="list-name">{list_description}</h3>
        <div className="row filter-list">
          <div className="col-6">
            <ButtonGroup>
              <DropdownButton variant="dark" id="dropdown-num-results" title="Number of results" onSelect={this.handleSetPageSize}>
                <Dropdown.Item eventKey="10">10</Dropdown.Item>
                <Dropdown.Item eventKey="15">15</Dropdown.Item>
                <Dropdown.Item eventKey="25">25</Dropdown.Item>
                <Dropdown.Item eventKey="50">50</Dropdown.Item>
                <Dropdown.Item eventKey="100">100</Dropdown.Item>
              </DropdownButton>
              {edit_list}
            </ButtonGroup>
          </div>
          <div className="col-6">
            <form className="bulk-actions" onSubmit={this.handleApplyBulkAction}>
              <div className="row">
                <label className="col-2 offset-3 col-form-label">Bulk actions</label>
                <div className="col">
                  <Form.Select id="bulkaction" onChange={this.handleSetBulkAction}>
                    <option value="remove">Remove</option>
                    <option value="suppress">Suppress</option>
                  </Form.Select>
                </div>
                <div className="col">
                  <button type="submit" className="btn btn-secondary">Apply</button>
                </div>
              </div>
            </form>
          </div>
          
        </div>
        <ContactList items={this.state.contacts} suppressed_emails={this.state.suppressed_emails} next_token={this.state.next_token} list_name={this.state.list_name} sesv2={sesv2} handleCheckboxClick={this.handleCheckboxClick} />
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

  /**
   * Load contact list
   *
   * @return void
   */
  getContactList() {

    let params = {
      ContactListName: this.state.list_name /* required */
    };

    sesv2.getContactList(params, (err, data) => {

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

        sesv2.listContacts(params, (err, data) => {
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

    sesv2.listSuppressedDestinations({}, (err, data) => {
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
   * Load contact and suppression lists
   *
   * @return void
   */
  componentDidMount() {

    this.getContactList();
    this.getSuppressedDestinations();
    
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
   * Go to first page in results
   *
   * @param {Object} e
   * @return void
   */
  handleCheckboxClick(target) {

    let index = target.value,
        found = this.state.selected_items.indexOf(index);

    if (found == -1 && target.checked == true) {
      // add index
      this.state.selected_items.push(index);
      this.setState({ selected_items: this.state.selected_items });

    }
    else if (found > -1 && target.checked == false) {
      // remove index
      this.state.selected_items.splice(found, 1);
      this.setState({ selected_items: this.state.selected_items });

    }

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

        await sesv2.deleteContact(params, (err, data) => {

          if (err) {
            console.log(err); // an error occurred
          }

        });

      } else {

        let params = {
          EmailAddress: email, /* required */
          Reason: 'BOUNCE' /* BOUNCE | COMPLAINT */
        };

        const result = await sesv2.putSuppressedDestination(params, function(err, data) {
        
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

    sesv2.updateContactList(params, (err, data) => {

      if (err) {
        console.log(err); // an error occurred
      } 
      else { // successful response
        this.setState({list: this.state.list});
      }

    });

  }

  /**
   * Set email address
   *
   * @param {Object} e
   * @return void
   */
  handleChange(e) {

    this.setState({ email: e.target.value });

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

      sesv2.createContact(contact, (err, data) => {

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

    sesv2.createContact(contact, (err, data) => {

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

}

export default App;
