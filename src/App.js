import './App.css';

import { Form, ButtonGroup, Dropdown, DropdownButton } from 'react-bootstrap';

import React from 'react';
import EditList from './EditList';
import AddContact from './AddContact';
import ContactList from './ContactList';

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
          <AddContact handleSaveContact={this.handleSaveContact} />
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

  componentDidMount() {

    this.getContactList();
    this.getSuppressedDestinations();
    
  }

  handleSetPageSize(eventKey) {

    this.setState({ pagesize: eventKey, next_token: '' });
    this.getContactList();

  }

  handleGoToFirstPageClick(e) {

      e.preventDefault();

      this.setState({ selected_items: [], next_token: '' });
      this.getContactList();

  }

  handleNextClick(e) {

    e.preventDefault();

    if (this.state.next_token) {
      this.setState({ selected_items: [] });
      this.getContactList();
    }

  }

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

  handleSetBulkAction(e) {

    this.setState({ bulk_action: e.target.value });

  }

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

  handleChange(e) {

    this.setState({ email: e.target.value });

  }

  handleAddFakeContacts(e) {
    let fake_emails = `George_Stevens1067@typill.biz
Josephine_Webster6238@eirey.tech
Nicholas_Cameron7014@bretoux.com
Ryan_Button5531@bauros.biz
Chloe_Bayliss2753@deons.tech
Mark_Matthews426@gompie.com
Ally_Clayton6065@bungar.biz
Rosalie_Reading8624@nickia.com
Kurt_Carpenter5195@jiman.org
Ron_Hobbs1864@ovock.tech
Matthew_Neville9577@ovock.tech
Manuel_Bingham130@corti.com
Clint_Pickard541@eirey.tech
Tyson_Emmett7697@irrepsy.com
Barney_Allwood8846@supunk.biz
Martha_Swift12@elnee.tech
Violet_Morgan1005@sveldo.biz
Katelyn_Wilson6644@famism.biz
Mark_Farrell3777@twipet.com
Abdul_Rowlands2740@extex.org
Julian_Appleton7189@ubusive.com
Carter_Cartwright5671@nimogy.biz
Ron_Bowen5872@hourpy.biz
Nicole_Morris9525@extex.org
Chris_Coates7208@corti.com
Vivian_Long5963@grannar.com
Ivette_Umney96@nanoff.biz
Elijah_Carson7646@brety.org
Paige_Shepherd9781@nickia.com
Michael_Boyle5492@sheye.org
Rocco_Blythe2828@extex.org
Chad_Widdows2359@yahoo.com
Claire_Ellis247@tonsy.org
Amy_Selby4079@guentu.biz
Miley_Khan2210@nickia.com
Livia_Swan559@nanoff.biz
Lily_Underhill8224@iatim.tech
Nicholas_Reid242@joiniaa.com
Leroy_Fleming7431@extex.org
Gil_Isaac7857@deavo.com
Harriet_Stuart6497@irrepsy.com
Mason_Hood6222@acrit.org
Marvin_Needham609@eirey.tech
Naomi_Edwards3898@womeona.net
Kenzie_Sherwood9900@joiniaa.com
Alice_Hammond2224@typill.biz
Mavis_Addison3422@iatim.tech
Mark_Rees3612@typill.biz
Tyson_Noach6743@sheye.org
Paige_Abbey4918@yahoo.com
Ruth_Downing2581@deons.tech
Barney_Connell2325@joiniaa.com
Fiona_Spencer8094@sheye.org
Mary_Amstead4209@twipet.com
Sarah_Ellery5827@womeona.net
Chester_Nurton2185@dionrab.com
Cedrick_Archer1950@grannar.com
Harvey_Page 2619@eirey.tech
Skylar_Benson9531@elnee.tech
Joseph_Nicholls8991@guentu.biz
Clarissa_Johnson2046@acrit.org
Chad_Gray7338@zorer.org
Tyler_Page 1532@brety.org
Daron_Connell2534@sheye.org
Chadwick_Palmer1636@joiniaa.com
Penny_Miller1481@bauros.biz
Stella_Briggs3225@gmail.com
Angelina_Parker8434@muall.tech
Leanne_Thomson3898@yahoo.com
Benny_Yarwood2263@ovock.tech
John_Walker1246@hourpy.biz
Michael_Jobson7898@corti.com
John_Ventura9767@joiniaa.com
Daniel_Wilson7842@zorer.org
Ruth_Olivier6042@liret.org`;

    fake_emails = fake_emails.split('\n');

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
