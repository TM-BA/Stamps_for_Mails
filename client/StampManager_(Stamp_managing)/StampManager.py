#    StampManager is a program to manage an ERC20 Token on the Ethereum network
#    Copyright (C) 2019  Timo Meilinger (timo@meilinger.app)
#
#    This program is free software: you can redistribute it and/or modify
#    it under the terms of the GNU Affero General Public License as published by
#    the Free Software Foundation, either version 3 of the License, or
#    (at your option) any later version.
#
#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU Affero General Public License for more details.
#
#    You should have received a copy of the GNU Affero General Public License
#    along with this program.  If not, see <https://www.gnu.org/licenses/>.

import json
import requests

from web3.auto import w3
from ethtoken.abi import EIP20_ABI
from web3 import Web3, HTTPProvider

import time

import pyperclip
import tkinter as tk
import tkinter.messagebox

TStamp_id = '0xb7d7642a5aa1528ddbfccdd8b1ba705b8520ecd5'

# Set the Stamp_id
Stamp_id = TStamp_id

##
# Function sends one Stamp from sender_id to recipient_id with the sender_key
#
def send(sender_id, sender_key, recipient_id):
    w3 = Web3(HTTPProvider('https://rinkeby.infura.io/cc1357bd5e1347d3b9a3433085e61ae5'))

    # check the Addresses and the Amount of the Sender
    if w3.isAddress(sender_id) == False or w3.isAddress(recipient_id) == False or w3.isAddress(Stamp_id) == False:
        return None
    if amountStamps(sender_id) < 1:
        return None

    # load the contract for the Stamp
    address_contract = w3.toChecksumAddress(Stamp_id)
    contract = w3.eth.contract(address=address_contract, abi=EIP20_ABI)

    # get the nonce for the sender
    nonce = w3.eth.getTransactionCount(sender_id)

    # build the Transaction
    stamp_txn = contract.functions.transfer(
        w3.toChecksumAddress(recipient_id),
        1,
    ).buildTransaction({
        'chainId': 4,
        'gas': 70000,
        'gasPrice': w3.toWei('1', 'gwei'),
        'nonce': nonce,
    })

    # sign the Transaction
    signed_txn = w3.eth.account.signTransaction(stamp_txn, private_key=sender_key)

    #send the Transaction
    result = w3.eth.sendRawTransaction(signed_txn.rawTransaction)
    result = w3.toHex(result)

    return result

##
# Function verify the Transaction (tx_hash) for the recipient
#
def verify(tx_hash, recipient_id):
    w3 = Web3(HTTPProvider('https://rinkeby.infura.io/cc1357bd5e1347d3b9a3433085e61ae5'))

    # check the Addresses and the Amount of the Sender
    if w3.isAddress(recipient_id) == False or w3.isAddress(Stamp_id) == False:
        return None

    # wait until the Transaction is finished
#    w3.eth.waitForTransactionReceipt(tx_hash)      # not working unvalid Transactions brings TimeOut
    # get the Transaction
    trans = w3.eth.getTransaction(tx_hash)

    # check the existing of the Transaction
    if trans == None:
        return None

    # remove the 0x from the recipient-Address and lowerCase the recipient-Address
    rec_id = recipient_id[2:]
    rec_id = rec_id.lower()
    
    # check the correct recipient of the transaction
    rec_result = False
    if rec_id in trans['input']:
        rec_result = True

    # check the correct contract of the transaction
    contr_result = False
    if Stamp_id.lower() == trans['to'].lower():
        contr_result = True

    # recipient and contract correct ?
    result = rec_result and contr_result    
    return result

##
# Function calculats the amount of Stamps for the sender
#
def amountStamps(sender_id):
    w3 = Web3(HTTPProvider('https://rinkeby.infura.io/cc1357bd5e1347d3b9a3433085e61ae5'))

    # check the Addresses and the Amount of the Sender
    if w3.isAddress(sender_id) == False or w3.isAddress(Stamp_id) == False:
        return None

    # load the contract for the Stamp
    address_contract = w3.toChecksumAddress(Stamp_id)
    contract = w3.eth.contract(address=address_contract, abi=EIP20_ABI)

    # load the amount of Stamps for the sender
    address_sender = w3.toChecksumAddress(sender_id)
    stamp_amount = contract.call().balanceOf(address_sender)
    return(stamp_amount)

##
# Main-Function shows the Main-Window
#
def main():
    root = tk.Tk()
    root.title("Stamp Functions")
    root.configure(bg='grey90')

    sender_panel = tk.PanedWindow(root)
    sender_panel.config(bg='grey90')
    sender_panel.pack()

    sender_id_label = tk.Label(sender_panel)
    sender_id_label.config(text=str("Your Account-ID:"),bg='grey90')
    sender_id_label.grid(row=0)
    sender_id_txt = tk.Text(sender_panel, width=70, height=1)
    sender_id_txt.grid(row=0, column=1)

    sender_key_label = tk.Label(sender_panel)
    sender_key_label.config(text=str("Your Private Key:"),bg='grey90')
    sender_key_label.grid(row=1)
    sender_key_txt = tk.Text(sender_panel, width=70, height=1)
    sender_key_txt.grid(row=1, column=1)

    button_panel = tk.PanedWindow(root)
    button_panel.config(bg='grey90')
    button_panel.pack()
    button_send = tk.Button(button_panel, text='Send Stamp', bg='grey90', command=lambda:send_window(sender_id_txt, sender_key_txt))
    button_send.grid(row=0)
    tk.Label(button_panel,bg='grey90', pady=50, padx = 15).grid(row=0, column=1)
    button_verify = tk.Button(button_panel, text='Verify Stamps',bg='grey90', command=lambda:verify_window(sender_id_txt))
    button_verify.grid(row=0, column=2)
    tk.Label(button_panel,bg='grey90', pady=50, padx = 15).grid(row=0, column=3)
    button_amount = tk.Button(button_panel, text='Number of my Stamps:',bg='grey90', command=lambda:set_amount(label_amount, sender_id_txt))
    button_amount.grid(row=0, column=4)
    label_amount = tk.Label(button_panel,bg='grey90', pady=50, padx = 15)
    label_amount.grid(row=0, column=5)

    root.mainloop()

##
# Function coordinates the Send Stamp Window
#    
def send_window(sender_id_txt, sender_key_txt):
    send_w = tk.Tk()
    send_w.title("Send Stamp")
    send_w.configure(bg='grey90')

    recipient_id_label = tk.Label(send_w)
    recipient_id_label.config(text=str("Send Stamp to:"),bg='grey90')
    recipient_id_label.grid(row=0)
    recipient_id_txt = tk.Text(send_w, width=50, height=1)
    recipient_id_txt.grid(row=0, column=1)

    tk.Label(send_w,bg='grey90', pady=20, padx=5).grid(row=0, column=2)

    button_send = tk.Button(send_w, text='Send', padx=15, bg='grey90', command=lambda:start_sending(sender_id_txt, sender_key_txt, recipient_id_txt, send_w))
    button_send.grid(row=0, column=3)

    tk.Label(send_w,bg='grey90', padx=5).grid(row=0, column=4)

    send_w.mainloop()
    return

##    
# Function calls the send-Funktion for the Send Stamp Window
#
def start_sending(sender_id_txt, sender_key_txt, recipient_id_txt, send_w):
    # get the Text from the Text-Fields
    recipient_id = recipient_id_txt.get(1.0,'end-1c')
    sender_id = sender_id_txt.get(1.0, 'end-1c')
    sender_key = sender_key_txt.get(1.0, 'end-1c')
    # close the send_w window
    send_w.destroy()

    # sending the Stamp
    tx_hash = send(sender_id, sender_key, recipient_id)

    # tells the User the result of the sending
    tkinter.messagebox.showinfo("Stamp Sended", "Stamp has been sended to \n" + recipient_id + "\n" + "with the tx_hash:\n" + tx_hash)
    return

##    
# Function calls the amountStamps-Funktion for the Main Window
#
def set_amount(label_amount, sender_id_txt):
    # get the Text from the Text-Field
    sender_id = sender_id_txt.get(1.0, 'end-1c')

    # getting the amount of Stamps
    amount = amountStamps(sender_id)
    
    # write the amount in the Label
    label_amount.config(text=str(amount))
    return

##
# Function coordinates the Verify Stamp Window
#  
def verify_window(sender_id_txt):
    verify_w = tk.Tk()
    verify_w.title("Verify Stamps")
    verify_w.configure(bg='grey90')

    verify_object_label = tk.Label(verify_w)
    verify_object_label.config(text=str("Object to Verify"),bg='grey90')
    verify_object_label.grid(row=0)
    verify_object_txt = tk.Text(verify_w, width=70, height=30)
    verify_object_txt.grid(row=1)

    tk.Label(verify_w,bg='grey90',width=70, pady=5, padx = 5).grid(row=2)

    verify_btn_panel = tk.PanedWindow(verify_w)
    verify_btn_panel.config(bg='grey90')
    verify_btn_panel.grid(row=3)

    button_verify = tk.Button(verify_btn_panel, text='Verify', bg='grey90', command=lambda:start_verifing(sender_id_txt, verify_object_txt, verify_w))
    button_verify.grid(row=0, column=0)
    tk.Label(verify_btn_panel,bg='grey90', padx = 15).grid(row=0, column=1)
    button_clip = tk.Button(verify_btn_panel, text='Paste Clipboard', bg='grey90', command=lambda:verify_object_txt.insert('insert', pyperclip.paste()))
    button_clip.grid(row=0, column =2)

    verify_w.mainloop()
    return

##    
# Function calls the verify-Funktion for the Verify Stamps Window
#
def start_verifing(sender_id_txt, verify_object_txt, verify_w):
    # get the Text from the Text-Fields
    recipient_id = sender_id_txt.get(1.0, 'end-1c')            # now the sender is the recipient !!!!
    verify_object = verify_object_txt.get(1.0, 'end-1c')
    # close the verify_w window
    verify_w.destroy()

    # load the JSON-Object from the Text-Fiel
    json_verify = json.loads(verify_object)
    # get the Keys (tx_hash) from the JSON-Object
    keys = json_verify.keys()

    result = {}

    # verify each tx_hash and write the result JSON-Object
    for i in keys:
        tx_hash = i
        state = verify(tx_hash, recipient_id)
        if state == True:
            result.update({str(tx_hash):'true'})
        else:
            result.update({str(tx_hash):'false'})

    # convert the result JSON-Object and copy it in the clipboard 
    result_json = json.dumps(result)
    pyperclip.copy(result_json)

    # tells the User the result of the verification
    tkinter.messagebox.showinfo("Stamps Verified", "Result has been copied to Clipboard, please insert it in Thunderbird")
    return


# Start the Main-Window
main()