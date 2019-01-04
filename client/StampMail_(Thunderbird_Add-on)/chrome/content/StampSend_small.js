//    StampSend_small coordinates changes on the Header 'stamp' 
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

const TStamp_id = '0xb7d7642a5aa1528ddbfccdd8b1ba705b8520ecd5';

// get the SenderID from the Preferences
var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
const sender_id = prefs.getCharPref("extensions.Stamp.accountID");

/**
 * Function coordinates the Sending of one Stamp
 */
function sendStamp(){

    document.getElementById("Button_StampAccount").disabled = true;

    let recipient_obj = getAdress_disableInput();
    recipent = recipient_obj.recipent
    transaction_id = recipient_obj.tx_hash
    
    addStampToHeader(recipent, transaction_id);
    
    enableInput();

    close_StampSend_panel();
}

/**
 * Function close the StampSend Panel
 */
function close_StampSend_panel(){
    document.getElementById("rec_address").value = "";
    document.getElementById("tx_hash").value = "";
    document.getElementById("StampSend_panel").hidePopup();
}

/**
 * Function returns the recipent and tx_hash from the Input
 * and Disable the Input
 */
function getAdress_disableInput(){
    document.getElementById("StampSend_btn_send").disabled = true;
    document.getElementById("StampSend_cancel").disabled = true;
    document.getElementById("rec_address").readOnly = true;
    document.getElementById("tx_hash").readOnly = true;
    
    var rec_address = document.getElementById("rec_address").value;
    var tx_hash = document.getElementById("tx_hash").value;

    var json ={"recipent":rec_address, "tx_hash":tx_hash}
    
    return json;
}

/**
 * Functon enables the Input
 */
function enableInput(){
    document.getElementById("StampSend_btn_send").disabled = false;
    document.getElementById("StampSend_cancel").disabled = false;
    document.getElementById("rec_address").readOnly = false;
    document.getElementById("tx_hash").readOnly = false;

    document.getElementById("rec_address").value = "";
    document.getElementById("tx_hash").value = "";
}

/**
 * Function add the AccountID from the User to the Header
 */
function addAccountToHeader(){

    document.getElementById("Button_StampAccount").disabled = true;

    let JSON_account = gMsgCompose.compFields.getHeader("stamp");
    if(JSON_account = "" || JSON_account == undefined){
        JSON_account = {"sender":{},"recipients":{}};;
    } else {
        JSON_account = JSON.parse(JSON_account);
    }
    JSON_account.sender = {"ID":sender_id};

    let JSON_account_String = JSON.stringify(JSON_account)
    let JSONformatted = JSON_account_String.replace(/}/g,"} \n");
    gMsgCompose.compFields.setHeader("stamp", JSONformatted)
    return

}

/**
 * Function adds the recipient and the transactionHash to the Header
 * @param {*} recipient 
 * @param {*} transactionHash 
 */
function addStampToHeader(recipient, transactionHash){
    let JSONtransacion = gMsgCompose.compFields.getHeader("stamp");
    if(JSONtransacion == '' || JSONtransacion == undefined){
        JSONtransacion = {"sender":{"ID":sender_id},"recipients":{}}; 
    } else {
        JSONtransacion = JSON.parse(JSONtransacion);
    }

    JSONtransacion.recipients[recipient] = {"transaction":transactionHash};
    
    let JSONtransacion_String = JSON.stringify(JSONtransacion)
    let JSONformatted = JSONtransacion_String.replace(/}/g,"} \n");
    gMsgCompose.compFields.setHeader("stamp", JSONformatted)
    return
}

