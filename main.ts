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

let testCnt = 0
let pixelCount = 12
let strip: neopixel.Strip = neopixel.create(DigitalPin.P9, pixelCount, NeoPixelMode.RGB)
enum Src {
    INTERNAL
}
enum Timeout {
    TEST_MS = 500,
    PING_MS = 500,
}
enum Evt {
    // TIMER events
    TIMER_TEST,
    TIMER_PING,
    // INTERNAL events
    A_PRESSED,
    B_PRESSED,
    WIFI_CONNECT,
    WIFI_DATA,
    WIFI_ERROR,
    DONE,
    NEXT,
}
enum Region {
    MAIN,
}
enum MainState {
    ROOT
}

enum Lamp { //Direction traffic lamp is facing. 
    NORTH,
    SOUTH,
    EAST,
    WEST,
}

// LED functions.
function clearPixels () {
    for (let i = 0; i <= pixelCount - 1; i++) {
        strip.setPixelColor(i, 0)
    }
    strip.show()
}
function setPixels(color: number, cnt: number, intensity = 100) {
    cnt = Math.min(cnt, pixelCount)
    cnt = Math.max(cnt, 0)
    for (let j = 0; j < cnt; j++) {
       strip.setPixelColor(j, color) 
    }
    for (let j = cnt; j < pixelCount; j++) {
       strip.setPixelColor(j, 0) 
    }  
    strip.show()
}

function setTrafficLight (lamp:Lamp, r:boolean, y:boolean, g:boolean) {
    if (r) {
        if (lamp == Lamp.NORTH) { //SHORTEN
            strip.setPixelColor(0, 0xFF0000)
            strip.setPixelColor(1, 0x000000)
            strip.setPixelColor(2, 0x000000)
        }
        if (lamp == Lamp.SOUTH) {
            strip.setPixelColor(3, 0xFF0000)
            strip.setPixelColor(4, 0x000000)
            strip.setPixelColor(5, 0x000000)
        }
        if (lamp == Lamp.EAST) {
            strip.setPixelColor(6, 0xFF0000)
            strip.setPixelColor(7, 0x000000)
            strip.setPixelColor(8, 0x000000)
        }
        if (lamp == Lamp.WEST) {
            strip.setPixelColor(9, 0xFF0000)
            strip.setPixelColor(10, 0x000000)
            strip.setPixelColor(11, 0x000000)
        }
    }
    if (y) {

    }
    if (g) {

    }
}

// Enables external buttons.
input.onButtonPressed(Button.A, function () {
    event.send(Evt.A_PRESSED)
})
input.onButtonPressed(Button.B, function () {
    event.send(Evt.B_PRESSED)
})
// Wifi events.
wifi.onConnect(()=>{
    event.send(Evt.WIFI_CONNECT)  
})
wifi.onError((error: string)=>{
    event.send(Evt.WIFI_ERROR, error)
})
wifi.onData((args: string[])=>{
    //basic.showString(args[0])
    event.send(Evt.WIFI_DATA, args)
})

function connectWifi() {
    wifi.reset()
    wifi.config()
    wifi.join('your_ssid', 'your_password')
    wifi.connect('192.168.1.81', '60004')
}

// State functions
function inMainRoot () {
    return state.isIn(Region.MAIN, MainState.ROOT)
}

state.onEntry(Region.MAIN, MainState.ROOT, () => {
    // Test only.
    ili9341.fillRect(0, 0, 320, 240, color.COLOR565_CYAN)
    ili9341.print(0, 0, 'MARY', color.COLOR565_RED,   color.COLOR565_CYAN, 4)
    ili9341.print(0, 32, 'JOHN', color.COLOR565_RED, color.COLOR565_CYAN, 4)
    ili9341.print(0, 64, 'This is a test', color.COLOR565_GREEN, color.COLOR565_NAVY, 3)

    // Connect to server via Wifi.
    connectWifi()
})

state.onExit(Region.MAIN, MainState.ROOT, () => {
})

event.on(Evt.WIFI_CONNECT, () => {
    wifi.send(['SrvAuthReqMsg', 'srv', 'UNDEF', '123', 'user', 'pwd', 'Microbit'])
})

event.on(Evt.WIFI_ERROR, (error) => {
    // Stops ping timer.
    timer.stop(Evt.TIMER_PING)
    // Test only.
    // Default to init error
    let p = [1, 4]
    if (error == 'command') {
        p = [2, 4]
    } else if (error == 'transmit') {
        p = [3, 4]
    } else if (error == 'receive') {
        p = [4, 4]
    }
    led.plot(p[0], p[1])
    control.waitMicros(25000)
    led.unplot(p[0],p[1]) 
    if (error == 'receive' || error == 'init') {
        // Receive error may be caused by serial buffer overflow which is unrecoverable.
        // Init error may be caused by previous buffer overflow resulting in failure
        // to communicate with the module.
        // Test only - Commented to avoid constant resetting in simulation.
        //control.reset()
    } else {
        // Reconnect.
        //event.raise(Evt.A_PRESSED)
        connectWifi()
    }
})

event.on(Evt.WIFI_DATA, (args) => {
    // Test only.
    led.toggle(0, 4)
    let a: string[] = args
    if (a.length >= 1) {
        const type = a[0]
        if (type == 'SrvAuthCfmMsg' || type == 'SrvPingCfmMsg') {
            timer.start(Evt.TIMER_PING, Timeout.PING_MS, false)
            //timer.start(Evt.TIMER_PING, Timeout.PING_MS, true)
        }
        if (type == 'DispTickerReqMsg') {
            wifi.send(['DispTickerCfmMsg', 'Srv', a[1], /*'Microbit',*/ a[3],
                'SUCCESS', 'Microbit', 'UNSPEC'])  
            if (a[7] == '0') {
                ili9341.print(0, 96, a[4], color.COLOR565_WHITE, color.COLOR565_NAVY, 4) 
                // Test only
                // 'r', 'y', 'g' message to control traffic light.
                if (a[4] == 'r') {
                    strip.setPixelColor(0, 0xFF0000)
                    strip.setPixelColor(1, 0x000000)
                    strip.setPixelColor(2, 0x000000)
                    strip.setPixelColor(3, 0xFF0000)
                    strip.setPixelColor(4, 0x000000)
                    strip.setPixelColor(5, 0x000000)
                    strip.setPixelColor(6, 0xFF0000)
                    strip.setPixelColor(7, 0x000000)
                    strip.setPixelColor(8, 0x000000)
                    strip.setPixelColor(9, 0xFF0000)
                    strip.setPixelColor(10, 0x000000)
                    strip.setPixelColor(11, 0x000000)
                    strip.show();
                } else if (a[4] == 'y') {
                    strip.setPixelColor(0, 0x000000)
                    strip.setPixelColor(1, 0xFFFF00)
                    strip.setPixelColor(2, 0x000000)
                    strip.setPixelColor(3, 0x000000)
                    strip.setPixelColor(4, 0xFFFF00)
                    strip.setPixelColor(5, 0x000000)
                    strip.setPixelColor(6, 0x000000)
                    strip.setPixelColor(7, 0xFFFF00)
                    strip.setPixelColor(8, 0x000000)
                    strip.setPixelColor(9, 0x000000)
                    strip.setPixelColor(10, 0xFFFF00)
                    strip.setPixelColor(11, 0x000000)
                    strip.show();
                } else if (a[4] == 'g') {
                    strip.setPixelColor(0, 0x000000)
                    strip.setPixelColor(1, 0x000000)
                    strip.setPixelColor(2, 0x00FF00)
                    strip.setPixelColor(3, 0x000000)
                    strip.setPixelColor(4, 0x000000)
                    strip.setPixelColor(5, 0x00FF00)
                    strip.setPixelColor(6, 0x000000)
                    strip.setPixelColor(7, 0x000000)
                    strip.setPixelColor(8, 0x00FF00)
                    strip.setPixelColor(9, 0x000000)
                    strip.setPixelColor(10, 0x000000)
                    strip.setPixelColor(11, 0x00FF00)
                    strip.show();
                } 
            }
        }
    }
})

event.on(Evt.A_PRESSED, () => {

})
event.on(Evt.B_PRESSED, () => {

})

event.on(Evt.TIMER_PING, () => {
    wifi.send(['SrvPingReqMsg', 'Srv', 'Microbit', '123'])
})

strip.clear()
clearPixels()
strip.setPixelColor(0, 0xFF0000)
strip.setPixelColor(1, 0xFFFF00)
strip.setPixelColor(2, 0x00FF00)
strip.setPixelColor(3, 0xFF0000)
strip.setPixelColor(4, 0xFFFF00)
strip.setPixelColor(5, 0x00FF00)
strip.setPixelColor(6, 0xFF0000)
strip.setPixelColor(7, 0xFFFF00)
strip.setPixelColor(8, 0x00FF00)
strip.setPixelColor(9, 0xFF0000)
strip.setPixelColor(10, 0xFFFF00)
strip.setPixelColor(11, 0x00FF00)
strip.show()
wifi.init(SerialPin.P8, SerialPin.P12, DigitalPin.P0)
ili9341.init(DigitalPin.P15, DigitalPin.P14, DigitalPin.P13, DigitalPin.P16, DigitalPin.P2)
state.start(Region.MAIN, MainState.ROOT)
timer.run()
