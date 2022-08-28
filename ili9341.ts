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

namespace font {
    export const font5x7 = [	
        // To save code space, only upper case letters, numbers
        // and some punctuation marks are supported.
        // 0x20 space
        0x00000000,
        0x0000005F,
        0x00000007,
        0x00070014,
        0x7F147F14,

        0x242A7F2A,
        0x12231308,
        0x64623649,
        0x56205000,
        0x08070300,

        0x001C2241,
        0x00004122,
        0x1C002A1C,
        0x7F1C2A08,
        0x083E0808,

        0x00807030,
        0x00080808,
        0x08080000,
        0x60600020,
        0x10080402,

        0x3E514945,
        0x3E00427F,
        0x40007249,
        0x49494621,
        0x41494D33,

        0x1814127F,
        0x10274545,
        0x45393C4A,
        0x49493141,
        0x21110907,

        0x36494949,
        0x36464949,
        0x291E0000,
        0x14000000,
        0x40340000,

        0x00081422,
        0x41141414,
        0x14140041,
        0x22140802,
        0x01590906,

        0x3E415D59,
        0x4E7C1211,
        0x127C7F49,
        0x4949363E,
        0x41414122,

        0x7F414141,
        0x3E7F4949,
        0x49417F09,
        0x0909013E,
        0x41415173,

        0x7F080808,
        0x7F00417F,
        0x41002040,
        0x413F017F,
        0x08142241,

        0x7F404040,
        0x407F021C,
        0x027F7F04,
        0x08107F3E,
        0x4141413E,

        0x7F090909,
        0x063E4151,
        0x215E7F09,
        0x19294626,
        0x49494932,

        0x03017F01,
        0x033F4040,
        0x403F1F20,
        0x40201F3F,
        0x4038403F,

        0x63140814,
        0x63030478,
        0x04036159,
        0x494D4300,
        0x7F414141,

        0x02040810,
        0x20004141,
        0x417F0402,
        0x01020440,
        0x40404040,
        // 0x5F underscore   
    ]
}

namespace color {
    export const COLOR565_BLACK       = 0x0000      ///<   0,   0,   0
    export const COLOR565_NAVY        = 0x000F      ///<   0,   0, 128
    export const COLOR565_DARKGREEN   = 0x03E0      ///<   0, 128,   0
    export const COLOR565_DARKCYAN    = 0x03EF      ///<   0, 128, 128
    export const COLOR565_MAROON      = 0x7800      ///< 128,   0,   0
    export const COLOR565_PURPLE      = 0x780F      ///< 128,   0, 128
    export const COLOR565_OLIVE       = 0x7BE0      ///< 128, 128,   0
    export const COLOR565_LIGHTGREY   = 0xC618      ///< 192, 192, 192
    export const COLOR565_DARKGREY    = 0x7BEF      ///< 128, 128, 128
    export const COLOR565_BLUE        = 0x001F      ///<   0,   0, 255
    export const COLOR565_GREEN       = 0x07E0      ///<   0, 255,   0
    export const COLOR565_CYAN        = 0x07FF      ///<   0, 255, 255
    export const COLOR565_RED         = 0xF800      ///< 255,   0,   0
    export const COLOR565_MAGENTA     = 0xF81F      ///< 255,   0, 255
    export const COLOR565_YELLOW      = 0xFFE0      ///< 255, 255,   0
    export const COLOR565_WHITE       = 0xFFFF      ///< 255, 255, 255
    export const COLOR565_ORANGE      = 0xFD20      ///< 255, 165,   0
    export const COLOR565_GREENYELLOW = 0xAFE5      ///< 173, 255,  47
    export const COLOR565_PINK        = 0xFC18      ///< 255, 128, 192
}

namespace ili9341 {
    let csPin: DigitalPin
    let dcPin: DigitalPin
    let width: number     // Effective after screen rotation.
    let height: number    // Effective after screen rotation.
    let memBuf: number[] = []
    export function init(mosi: DigitalPin, miso: DigitalPin, sck: DigitalPin, cs: DigitalPin, dc: DigitalPin) {
        pins.spiPins(mosi, miso, sck)
        pins.spiFormat(8, 3)
        pins.spiFrequency(1000000)
        csPin = cs
        dcPin = dc
        writeCmd(0x01)
        control.waitMicros(10000)
        writeCmd(0xC0)          // ILI9341_PWCTR1
        writeData([0x23])
        writeCmd(0xC1)          // ILI9341_PWCTR2
        writeData([0x10])
        writeCmd(0xC5)          // ILI9341_VMCTR1
        writeData([0x3e, 0x28])
        writeCmd(0xC7)          // ILI9341_VMCTR2
        writeData([0x86])
        writeCmd(0x36)          // ILI9341_MADCTL
        writeData([0x28])       // Mode 0-3: 0x48, 0x28, 0x88, 0xE8
        width  = 320            // Mode 0-3: 240, 320, 240, 320
        height = 240            // Mode 0-3: 320, 240, 320, 240
        writeCmd(0x37)          // ILI9341_VSCRSADD
        writeData([0x00])
        writeCmd(0x3A)          // ILI9341_PIXFMT
        writeData([0x55])
        writeCmd(0xB1)          // ILI9341_FRMCTR1
        writeData([0x00, 0x18])
        writeCmd(0xB6)          // ILI9341_DFUNCTR
        writeData([0x08, 0x82, 0x27])
        writeCmd(0xF2)          // 3Gamma Function Disable
        writeData([0x00])
        writeCmd(0x26)          // ILI9341_GAMMASET
        writeData([0x01])
        writeCmd(0xE0)          // ILI9341_GMCTRP1
        writeData([0x0F, 0x31, 0x2B, 0x0C, 0x0E, 0x08, 0x4E, 0xF1, 0x37, 0x07, 0x10, 0x03, 0x0E, 0x09, 0x00])
        writeCmd(0xE1)          // ILI9341_GMCTRN1
        writeData([0x00, 0x0E, 0x14, 0x03, 0x11, 0x07, 0x31, 0xC1, 0x48, 0x08, 0x0F, 0x0C, 0x31, 0x36, 0x0F])
        writeCmd(0x11)         // ILI9341_SLPOUT
        control.waitMicros(120000)
        writeCmd(0x29)         // ILI9341_DISPON
    }
    export function writeCmd(cmd: number) {
        pins.digitalWritePin(dcPin, 0);
        pins.digitalWritePin(csPin, 0);
        pins.spiWrite(cmd)
        pins.digitalWritePin(csPin, 1);
    }
    export function writeData(data: number[]) {
        pins.digitalWritePin(dcPin, 1)
        pins.digitalWritePin(csPin, 0)
        let buf = pins.createBuffer(data.length)
        for (let i=0; i<data.length; i++) {
            buf.setNumber(NumberFormat.UInt8LE, i, data[i])
        }
        pins.spiTransfer(buf, null)
        pins.digitalWritePin(csPin, 1)
    }
    export function setAddrWindow(x: number, y: number, w: number, h: number) {
        let x2 = x + w - 1
        let y2 = y + h - 1
        writeCmd(0x2A)          // ILI9341_CASET
        writeData([util.getByte(x, 1), util.getByte(x, 0), util.getByte(x2, 1), util.getByte(x2, 0)])
        writeCmd(0x2B)          // ILI9341_PASET
        writeData([util.getByte(y, 1), util.getByte(y, 0), util.getByte(y2, 1), util.getByte(y2, 0)])
        writeCmd(0x2C)          // ILI9341_RAMWR
    }
    function pushColor(color: number, pixelCnt: number = 1) {
        const color1 = util.getByte(color, 1)
        const color0 = util.getByte(color, 0)
        let data: number[] = []
        let pixelLen = pixelCnt * 2
        let fillLen = Math.min(pixelLen, 256);
        let i = 0;
        while (i < fillLen) {
            data[i++] = color1;
            data[i++] = color0;
        }
        while (pixelLen){
            let writeLen = Math.min(pixelLen, 256);
            data.splice(writeLen, 256 - writeLen)
            writeData(data);
            pixelLen -= writeLen;
        }
    }
    export function writePixel(x: number, y: number, color: number) {
        if ((x < 0) || (x >= width) || (y < 0) || (y >= height)) {
            return;
        }
        setAddrWindow(x, y, 1, 1);
        pushColor(color);
    }
    export function fillScreen(color: number) { 
        fillRect(0, 0, width, height, color)
    }
    function checkWindow(x: number, y: number, w: number, h: number): boolean {
        return !((x < 0) || ((x + w) > width) ||
                 (y < 0) || ((y + h) > height))
    }
    export function fillRect(x: number, y: number, w: number, h: number, color: number) {
        if (checkWindow(x, y, w, h)) {
            setAddrWindow(x, y, w, h)
            pushColor(color, w * h)
        }
    }
    export function writeBitmap(x: number, y: number, w: number, h: number, buf: number[]) {
        if (checkWindow(x, y, w, h)) {
            setAddrWindow(x, y, w, h)
            writeData(buf)
        }
    }
    function fillMem(x: number, y: number, w: number, h: number, color: number, col: number, row: number) {
        for (let i=0; i<h; i++) {
            for (let j=0; j<w; j++) {
                memBuf[(y+i)*col*2 + (x+j)*2] = util.getByte(color, 1)
                memBuf[(y+i)*col*2 + (x+j)*2 + 1] = util.getByte(color, 0)
            }
        }
    }
    export function drawChar(x: number, y: number, c: number, color: number, bg: number, size: number = 1) {
        const col = 6*size
        const row = 8*size
        // Convert to upper case.
        if (c >= 0x61 && c <= 0x7A) {
            c = c - 0x20
        }
        if (c < 0x20 || c > 0x5f) {
            // Show '.' for unsupported characters.
            c = 0x2E
        }
        //basic.showNumber(c)
        // Adjust offset.
        c = c - 0x20
        // Width is 6 so add a vertical line after the character.
        memBuf = []
        fillMem(0, 0, col, row, bg, col, row);
        for(let i=0; i<5; i++) { // Char bitmap = 5 columns
            const wordIdx = Math.floor((c*5 + i)/4)
            const wordOff = 3 - (c*5 + i) % 4
            let line = util.getByte(font.font5x7[wordIdx], wordOff)
            for(let j=0; j<8; j++) {
                if(line & 1) {
                    fillMem(i*size, j*size, size, size, color, col, row);
                }
                line = line >> 1
            }
        }
        writeBitmap(x, y, col, row, memBuf);
    }
    export function print(x: number, y: number, text: string, color: number, bg: number, size: number = 1) {
        let charWidth = 6*size
        let charHeight = 8*size
        for (let i=0; i<text.length; i++) {
            drawChar(x, y, text.charCodeAt(i), color, bg, size)
            x += charWidth
            if (x + charWidth > width) {
                x = 0
                y += charHeight
            }
        }
    }
}