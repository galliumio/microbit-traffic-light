/*******************************************************************************
 * Copyright (C) 2019 Gallium Studio LLC (Lawrence Lo). All rights reserved.
 *
 * This program is open source software: you can redistribute it and/or
 * modify it under the terms of the GNU General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * Alternatively, this program may be distributed and modified under the
 * terms of Gallium Studio LLC commercial licenses, which expressly supersede
 * the GNU General Public License and are specifically designed for licensees
 * interested in retaining the proprietary status of their code.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 * 
 * Contact information:
 * Website - https://www.galliumstudio.com
 * Source repository - https://github.com/galliumstudio
 * Email - admin@galliumstudio.com
 ******************************************************************************/

namespace wifi {
    const successList = ['OK', 'SEND OK']
    const failList = ['ERROR', 'FAIL', 'SEND FAIL', 'ALREADY CONNECTED']
    const configList: AtCmd[] = [
        { line: 'ATE0', waitMs: 200, onSuccess: null },                // Turns off echo.
        { line: 'AT+CWMODE=1', waitMs: 200, onSuccess: null },           // Station mode.
        { line: 'AT+CWAUTOCONN=0', waitMs: 200, onSuccess: null },      // Disable auto connection to AP. 
        { line: 'AT+UART_CUR=38400,8,1,0,0', waitMs: 200, 
          onSuccess: ()=>{
            serial.setBaudRate(BaudRate.BaudRate38400) 
         }},
    ]
    interface AtCmd {
        line: string,
        waitMs: number,
        onSuccess: (()=>void)
    }
    // Arrays of AT commands, command line strings to send and
    // received command line strings to process.
    let cmdList: AtCmd[] = []
    let txList : string[] = []
    let savedLine = ''
    let rxCmdLine = ''
    let rxError = false
    let txError = false
    let cmdError = false
    let initError = false
    let connectHandler: ()=>void = null
    let errorHandler: (error: string)=>void = null
    let dataHandler: (args: string[])=>void = null
    export function init(tx: SerialPin, rx: SerialPin, reset: DigitalPin) {
        pins.digitalWritePin(reset, 0)
        control.waitMicros(5000)
        pins.digitalWritePin(reset, 1)
        // Upon reset, ESP8266 sends an initial string that will
        // cause microbit to hang. Waits for 300ms before redirecting
        // serial port. Must not call pause which blocks the current fiber.
        control.waitMicros(300000)
        cmdList = []
        txList = []
        savedLine = ''
        rxCmdLine = ''
        rxError = false
        txError = false
        cmdError = false
        initError = false
        serial.redirect(tx, rx, 115200)
        serial.setRxBufferSize(2000)
        serial.setTxBufferSize(2000)
        control.inBackground(()=>{
            while(true) {
                let result = sendCmdList()
                if (result) {
                    result = transmitData()
                }
                if (result) {
                    result = poll()
                }
                if (!result) {
                    if (errorHandler) {
                        errorHandler(rxError ? 'receive' :
                                     txError ? 'transmit' : 
                                     initError ? 'init' : 'command')
                    }
                }
                // OK to block as it's running in a separate fiber.
                basic.pause(5)
            }
        })
    }
    export function reset() {
        cmdList = []
        txList = []
        savedLine = ''
        rxCmdLine = ''
        rxError = false
        txError = false
        cmdError = false
        initError = false

        serial.writeString('AT\r\n')
        const startTime = input.runningTime()
        let line = ''
        while((input.runningTime() - startTime) < 100) {
            line  += serial.readString()
        }
        /*
        if (line != '') {
            basic.showNumber(line.length)
        }  
        */
    }
    export function onConnect(handler: ()=>void) {
        connectHandler = handler
    }
    export function onError(handler: (error: string)=>void){
        errorHandler = handler
    }
    export function onData(handler: (args: string[])=>void){
        dataHandler = handler
    }
    export function config() {
        configList.forEach((curr)=>{
            cmdList.push(curr)
        })
    }
    export function join(ssid: string, pwd: string) {
        cmdList.push({ line: `AT+CWJAP="${ssid}","${pwd}"`,
                       waitMs: 15000,
                       onSuccess: null })
    }
    export function connect(ip: string, port: string) {
        cmdList.push({ line: `AT+CIPSTART="TCP","${ip}",${port}`,
                       waitMs: 5000, 
                       onSuccess: ()=>{
                           if (connectHandler) {
                               connectHandler()
                           }
                       }})
    }
    export function send(args: string[]) {
        let escArgs = []
        for (let arg of args) {
            // % must be converted first.
            escArgs.push(arg.replaceAll('%', '%25').replaceAll(' ', '%20').replaceAll('\r', '%0D').replaceAll('\n', '%A'))
        }
        txList.push(escArgs.join(' ') + '\r\n')
    }
    function sendCmdList(): boolean {
        while (cmdList.length) {
            const cmd = cmdList.shift()
            let result = sendCmd(cmd.line, cmd.waitMs)
            debugLed(result)
            if (result) {
                if (cmd.onSuccess) {
                    cmd.onSuccess()
                }
            } else {
                // Once an error has occurred, discards any outstanding commands.
                if (!rxError) {
                    if (cmd.line.includes('ATE0')) {
                        // Initialization error which is critical.
                        // This happens when it cannot communicate with the module at all.
                        initError = true
                    } else {
                        // Generic command error including join and connect.
                        cmdError = true
                    }
                }
                return false
            }
        }
        return true
    }
    function transmitData() {
        let rsp = null
        while (txList.length) {
            led.plot(3, 0)
            const cmdLine = txList.shift()
            const cmd = `AT+CIPSEND=${cmdLine.length}`
            if (sendCmd(cmd, 10000)) {
                if (readUntil('> ', 10000) != null) {
                    serial.writeString(cmdLine)
                    if (waitForRsp(10000)) {
                        led.unplot(3, 0)
                        continue
                    }
                }
            }
            // If reaches here, tx failed.
            led.unplot(3, 0)
            if (!rxError) {
                txError = true
            }
            debugLed(false)
            return false
        }
        return true
    }
    // Polls for async data ('+IPD,'). Any async AT msgs from wifi are discarded.
    function poll(): boolean {
        // '+IPD,' handled inside readUntil().
        while(readUntil('\r\n', 0) != null) {}
        return !rxError
    }
    // Receives async data from wifi.
    // Precondition is savedLine starts with "+IPD,". 
    // Postcondition is async data indicated by "+IPD," has been completely read.
    function receiveData(): boolean {
        led.plot(4, 0)
        const startTime = input.runningTime()
        while((input.runningTime() - startTime) < 100) {
            savedLine += serial.readString()
            let strs = savedLine.split(':')
            if (strs.length > 1) {
                const header = strs.shift()
                const len = parseInt(header.substr(5))
                savedLine = strs.join(':')    
                while((input.runningTime() - startTime) < 100) {
                    savedLine += serial.readString()
                    if (savedLine.length >= len) {
                        const result = handleData(savedLine.substr(0, len))
                        savedLine = savedLine.substr(len)
                        led.unplot(4, 0)
                        return result
                    }
                }
            }
        }
        // Times out, probably caused by serial data drop.
        //led.unplot(4, 0)
        return false
    }
    function handleData(data: string): boolean {
        rxCmdLine += data
        let strs = rxCmdLine.split('\r\n')
        // Need to use loop to handle multipe command lines in received data.
        let lineCnt = strs.length - 1
        while (lineCnt--) {
            let args: string[] = []
            const line = strs.shift()
            for (let arg of line.split(' ')) {
                // %25 must be converted last.
                args.push(arg.replaceAll('%20', ' ').replaceAll('%0D', '\r').replaceAll('%0A', '\n').replaceAll('%25', '%'))
            }
            if (dataHandler) {
                dataHandler(args)
            }
        } 
        rxCmdLine = strs[0]
        return true;
    }
    function debugLed(success: boolean) {
        let p = [1, 0] // Fail default.
        if (success) {
            p = [2, 0]
        }
        led.plot(p[0], p[1])
        control.waitMicros(25000)
        led.unplot(p[0], p[1])
    }
    function sendCmd(cmd: string, waitMs = 200): boolean {
        serial.writeString(cmd + '\r\n')
        return waitForRsp(waitMs)
    }
    function checkMsg(list: string[], msg: string): boolean {
        return (list.reduce((result, curr)=>{
                return result || msg.includes(curr)
            }, false))
    }
    // Own implementation of readUntil with timeout.
    function readUntil(delimit = '\r\n', waitMs = 20): string {
        const startTime = input.runningTime()
        while(true) {            
            savedLine += serial.readString()
            // First checks if async data is pending to be read.
            if (savedLine.substr(0,5) === '+IPD,') {
                if (!receiveData()) {
                    rxError = true
                    return null
                }
                continue
            }
            let strs = savedLine.split(delimit)
            if (strs.length > 1) {
                const result = strs.shift()
                savedLine = strs.join(delimit)
                return result
            }
            // Uses >= rather than > to ensure no wait if waitMs = 0.
            if ((input.runningTime() - startTime) >= waitMs) {
                return null
            }
            basic.pause(Math.min(20, waitMs))
        }
    }
    function waitForRsp(waitMs = 200): boolean {
        const startTime = input.runningTime()
        do {
            const msg = readUntil('\r\n', Math.min(20, waitMs))
            // Must explicitly check for null (no data) to distinguish from empty string.
            if (msg == null) {
                if (rxError) {
                    return false
                }
                // No data. Continues to wait until timeout.
            } else {
                if (checkMsg(successList, msg)) {
                    return true
                }
                if (checkMsg(failList, msg)) {
                    return false
                }
                // Discards message if neither success or failure.
            }
        } while((input.runningTime() - startTime) < waitMs)
        // Uses < rather than <= to ensure no wait if waitMs = 0.
        return false
    }
}

