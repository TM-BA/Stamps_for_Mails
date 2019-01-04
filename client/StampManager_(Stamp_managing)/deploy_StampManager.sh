#    deploy_StampManager.sh, deployes the Python programm StampManger.py in an MacOS programm
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

pyinstaller --onefile --add-binary='/System/Library/Frameworks/Tk.framework/Tk':'tk'  --add-binary='/System/Library/Frameworks/Tcl.framework/Tcl':'tcl' --hidden-import=eth_hash.backends.pycryptodome StampManager.py