//    StampSort coordinates the reading of the Header 'stamp' 
//    Copyright (C) 2019  Timo Meilinger (timo@meilinger.app)
//
//    This program is free software: you can redistribute it and/or modify
//    it under the terms of the GNU Affero General Public License as published by
//    the Free Software Foundation, either version 3 of the License, or
//    (at your option) any later version.
//
//    This program is distributed in the hope that it will be useful,
//    but WITHOUT ANY WARRANTY; without even the implied warranty of
//    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//    GNU Affero General Public License for more details.
//
//    You should have received a copy of the GNU Affero General Public License
//    along with this program.  If not, see <https://www.gnu.org/licenses/>.<?xml version="1.0"?> 

var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
const sender_id = prefs.getCharPref("extensions.Stamp.accountID");

// Load the addressDB from the Preferences
var addressDB = prefs.getStringPref("extensions.Stamp.AddressDB");
if(addressDB == ""){
  addressDB = {}
} else {
  addressDB = JSON.parse(addressDB);
}


/**
 * Function creates Subfolder with the name "name" in the folder "folder"
 * @param {nsIMsgFolder} folder 
 * @param {String} name 
 */
function create_subFolder(folder, name){
  folder.createSubfolder(name, undefined);
}

/**
 * Function returns the searched subFolder;
 * if this subfolder doesnt exist it returns "null"
 * @param {Array} subFolderArray 
 * @param {String} name 
 */
function get_subFolder_byName(subFolderArray, name){
  var dontExists = true;
  var folder;
  for (i in subFolderArray){
    if(subFolderArray[i].prettyName === name){
      dontExists = false;
      folder = subFolderArray[i];
    }else{
      //do Nothing and check the Next ....
    }
  }
  if(dontExists == true){
    return null;
  }else{
    return folder;
  }
}


/**
 * Function coordinates the Sort of Mails in the Inbox to 
 * the Folders Stamps and No_Stamps
 */
function SortMails(){
  var folder_Stamp;
  var folder_NoStamp;

  // save current Folder in "folder"; get the subFolders from "folder"
  var folder = gFolderDisplay.displayedFolder;
  var subFolders = folder.subFolders;

  // create Array with all subFolders
  var subFolderArray = [];
  while (subFolders.hasMoreElements()) {
    subFolderArray.push(subFolders.getNext().QueryInterface(Components.interfaces.nsIMsgFolder));
  }

  folder_Stamp = get_subFolder_byName(subFolderArray, "Stamp");
  folder_NoStamp = get_subFolder_byName(subFolderArray, "No_Stamp");

  if(folder_Stamp == null){
    create_subFolder(folder, "Stamp");
    folder_Stamp = get_subFolder_byName(subFolderArray, "Stamp");
  }
  if(folder_NoStamp == null){
    create_subFolder(folder, "No_Stamp");
    folder_Stamp = get_subFolder_byName(subFolderArray, "No_Stamp");
  }

  var messages = folder.messages;
  var messageArray = [];
  while (messages.hasMoreElements()) {
    messageArray.push(messages.getNext().QueryInterface(Components.interfaces.nsIMsgDBHdr));
  }

  // Sort Messages in with Stamp and without Stamp 
  var messages_Stamp = [];
  var messages_NoStamp = Components.classes["@mozilla.org/array;1"].createInstance(Components.interfaces.nsIMutableArray);
  var count_msg_NoStamp = 0;

  var email;
  var stampAccount;
  var stamp;
  if(messageArray.length > 0){
    for (i in messageArray){
      email = messageArray[i].author;
      stamp = messageArray[i].getStringProperty("stamp");

      if(stamp == "" || stamp == undefined){
        // message without the Header stamp
        messages_NoStamp.appendElement(messageArray[i], false);
        count_msg_NoStamp++;
      } else {
        try{
          stamp = JSON.parse(stamp);
        }catch(e){
          // stamp is no JSON object
          stamp = {"sender":""};
        }
        if(stamp.sender != "" && stamp.sender != undefined && 
            stamp.sender.ID != "" && stamp.sender.ID != undefined){
          // get the Stored StampAccountID to the E-Mail
          stampAccount = stamp.sender.ID
          var lower = email.indexOf('<');
          var higher = email.indexOf('>');
          email = email.substring(lower+1,higher);
          email = email.toLowerCase()
          // store the StampAccountID and E-Mail in the addressDB
          addressDB[email] = stampAccount;
        }
        messages_Stamp.push(messageArray[i]);
      }
    }
  }

  // Store the current AddressDB back to the Preferences
  let JSONformatted = JSON.stringify(addressDB)
  JSONformatted = JSONformatted.replace(/,/g,",\n");
  prefs.setStringPref("extensions.Stamp.AddressDB", JSONformatted);

  // create Array to validate Stamps
  var json_validate = {}
  if(messages_Stamp.length > 0){
    for (i in messages_Stamp){
      var curr_msg = messages_Stamp[i];
      var stamp = curr_msg.getProperty("stamp");
      try{
        stamp = JSON.parse(stamp);
        stamp = stamp.recipients[sender_id].transaction
        if(stamp != undefined){
          json_validate[stamp] = null
        }else{
          messages_NoStamp.appendElement(curr_msg, false);
          count_msg_NoStamp++;
        }
      }catch(e){
        messages_NoStamp.appendElement(curr_msg, false);
        count_msg_NoStamp++;
      }
    }
  }
  
  // Move Messages in correct SubFolder if there is an msg to move
  if(count_msg_NoStamp > 0){
    folder_NoStamp.copyMessages(folder,messages_NoStamp,true,undefined,undefined,true,true);
  }

  // Print the Verification Object and change the Look of the panel
  document.getElementById("ver_object").value = JSON.stringify(json_validate);
  change_StampSort_start_to_verify_panel();

  return
}

function validate_messages(){
  // get the Object from the panel
  var valid = document.getElementById("ver_object").value;
  valid = JSON.parse(valid);

  var folder_Stamp;
  var folder_NoStamp;

  // save current Folder in "folder"; get the subFolders from "folder"
  var folder = gFolderDisplay.displayedFolder;
  var subFolders = folder.subFolders;

  // create Array with all Subfolders
  var subFolderArray = [];
  while (subFolders.hasMoreElements()) {
    subFolderArray.push(subFolders.getNext().QueryInterface(Components.interfaces.nsIMsgFolder));
  }

  // get the Subfolder to the names
  folder_Stamp = get_subFolder_byName(subFolderArray, "Stamp");
  folder_NoStamp = get_subFolder_byName(subFolderArray, "No_Stamp");

  // store all Messages in the Array "messages"
  var messages = folder.messages;
  var messageArray = [];
  while (messages.hasMoreElements()) {
    messageArray.push(messages.getNext().QueryInterface(Components.interfaces.nsIMsgDBHdr));
  }

  // Sort Messages in with Stamp and without Stamp 
  var messages_Stamp = [];
  var messages_NoStamp = Components.classes["@mozilla.org/array;1"].createInstance(Components.interfaces.nsIMutableArray);
  var count_msg_NoStamp = 0;

  if(messageArray.length > 0){
    for (i in messageArray){
      if(messageArray[i].getStringProperty("stamp") == ""){
        messages_NoStamp.appendElement(messageArray[i], false);
        count_msg_NoStamp++;
      } else {
        messages_Stamp.push(messageArray[i]);
      }
    }
  }

  // validate Messages with Stamp
  var messages_validStamp = Components.classes["@mozilla.org/array;1"].createInstance(Components.interfaces.nsIMutableArray);
  var messages_unvalidStamp = Components.classes["@mozilla.org/array;1"].createInstance(Components.interfaces.nsIMutableArray);
  var count_msg_validStamp = 0;
  var count_msg_unvalidStamp = 0; 

  if(messages_Stamp.length > 0){
    for (i in messages_Stamp){
      var curr_msg = messages_Stamp[i];
      var stamp = curr_msg.getProperty("stamp");
      try{
        stamp = JSON.parse(stamp);
        stamp = stamp.recipients[sender_id].transaction
        if(stamp != undefined){
          if (valid[stamp] == "true"){
            messages_validStamp.appendElement(curr_msg, false);
            count_msg_validStamp++;
            valid[stamp] = "false"    // Stamp is only for one message valid
          } else if(valid[stamp] == "false"){
            messages_unvalidStamp.appendElement(curr_msg, false);
            count_msg_unvalidStamp++;
          }else{
            // message is probably new and is not in the verify Object
            // do nothin
          }
        }
      }catch(e){
        messages_NoStamp.appendElement(curr_msg, false);
        count_msg_NoStamp++;
      }
    }
  }

  // Move Messages in correct SubFolder if there is an msg to move
  if(count_msg_validStamp > 0){
    folder_Stamp.copyMessages(folder,messages_validStamp,true,undefined,undefined,true,true);
  }
  if(count_msg_unvalidStamp > 0){
    folder_NoStamp.copyMessages(folder,messages_unvalidStamp,true,undefined,undefined,true,true);
  }
  if(count_msg_NoStamp > 0){
    folder_NoStamp.copyMessages(folder,messages_NoStamp,true,undefined,undefined,true,true);
  }

  // close and reset the StampSort Panel
  close_StampSort_panel()

  return
}

/**
 * Function close and resets the StampSort panel
 */
function close_StampSort_panel(){
  document.getElementById("ver_object").value = "";
  document.getElementById("StampSort_panel").hidePopup();

  document.getElementById("StampSort_div_start").hidden = false

  document.getElementById("StampSort_label_object").hidden = true
  document.getElementById("ver_object").hidden = true
  document.getElementById("StampSort_div_verify").hidden = true
  return
}

/**
 * Function change the StampSort Panel from the Start to the verify mode
 */
function change_StampSort_start_to_verify_panel(){
  document.getElementById("StampSort_div_start").hidden = true

  document.getElementById("StampSort_label_object").hidden = false
  document.getElementById("ver_object").hidden = false
  document.getElementById("StampSort_div_verify").hidden = false
  return
}

/**
 * Function close and resets the StampAddress panel
 */
function close_StampAddress_panel(){
  document.getElementById("Email_address_txt").value = "";
  document.getElementById("Stamp_address_label").hidden = true;
  document.getElementById("StampAddress_panel").hidePopup();
  return
}

/**
 * Function prints the AccountID in the Label for the given E-Mail Address
 * in the textbox
 */
function find_StampAddress(){
  // get the E-Mail from the textbox
  var email = document.getElementById("Email_address_txt").value;
  email = email.toLowerCase();
  var StampId = addressDB[email]

  // find the AccountID to the E-Mail Address
  if(StampId != undefined && StampId != ""){
    document.getElementById("Stamp_address_label").value = StampId;
  } else {
    // NO AccountID stored to the E-Mail Address
    document.getElementById("Stamp_address_label").value = "No Address for this E-Mail saved!"
  }
  document.getElementById("Stamp_address_label").hidden = false;
  return
}