"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArtnetSender = exports.ArtnetDmxPackage = exports.ArtnetPackage = exports.ArtOpCode = void 0;
const dgram_1 = require("dgram");
var ArtOpCode;
(function (ArtOpCode) {
    ArtOpCode[ArtOpCode["OpPoll"] = 8192] = "OpPoll";
    ArtOpCode[ArtOpCode["OpPollReply"] = 8448] = "OpPollReply";
    ArtOpCode[ArtOpCode["OpNzs"] = 20736] = "OpNzs";
    ArtOpCode[ArtOpCode["OpDmx"] = 20480] = "OpDmx";
})(ArtOpCode = exports.ArtOpCode || (exports.ArtOpCode = {}));
class ArtnetPackage {
    constructor() {
        this.id = 'Art-Net'.split('').map((el) => el.charCodeAt(0)).concat(0x00);
        this.opCode = ArtOpCode.OpDmx;
        this.protocolVersionHigh = 0;
        this.protocolVersionLow = 14;
        this.headerCache = this.header;
    }
    get header() {
        return this.id.concat([this.lo(this.opCode), this.hi(this.opCode), this.protocolVersionHigh, this.protocolVersionLow]);
    }
    get package() {
        return [...this.headerCache, ...this.body];
    }
    hi(bytes) {
        return (bytes >> 8) & 0xff;
    }
    lo(bytes) {
        return bytes & 0xff;
    }
}
exports.ArtnetPackage = ArtnetPackage;
class ArtnetDmxPackage extends ArtnetPackage {
    constructor() {
        super(...arguments);
        this.sequence = 0;
        this.physical = 0;
        this.universe = 0;
        this.data = [];
    }
    get body() {
        return [
            this.sequence,
            this.physical,
            this.lo(this.universe),
            this.hi(this.universe),
            this.hi(this.data.length),
            this.lo(this.data.length),
            ...this.data
        ];
    }
}
exports.ArtnetDmxPackage = ArtnetDmxPackage;
class ArtnetSender {
    constructor(config) {
        this.config = config;
        this._port = 6454;
        this._networkInterface = config.networkInterface;
        this._artDmx = new ArtnetDmxPackage();
        const socket = dgram_1.createSocket({
            type: 'udp4',
            reuseAddr: true,
        });
        socket.on('error', (err) => {
            console.error('Socket error:', err);
        });
        if (config.debug === true) {
            socket.on('connect', () => console.info('Socket connected to remote address.'));
            socket.on('close', () => console.log('Socket closed.'));
            socket.on('listening', () => console.log('Socket is listening.'));
            socket.on('message', (msg, rinfo) => {
                console.log(`New message from ${rinfo.address} (${rinfo.family}), ${rinfo.size} B`);
            });
        }
        this._socket = socket;
    }
    bind(interfaceAddress) {
        return new Promise((resolve, reject) => {
            this._socket.bind(() => {
                try {
                    console.log(`Setting multicast interface to ${interfaceAddress}`);
                    this._socket.setMulticastInterface(interfaceAddress);
                    console.log(`Done; sending over interface with address ${interfaceAddress}.`);
                    resolve();
                }
                catch (err) {
                    reject(err);
                }
            });
        });
    }
    send(host, universe, data) {
        this._artDmx.universe = universe;
        this._artDmx.data = data;
        const buf = Buffer.from(this._artDmx.package);
        this._socket.send(buf, 0, buf.length, this._port, host);
    }
    close() {
        this._socket.close();
    }
    socketAddress() {
        return this._socket.address();
    }
}
exports.ArtnetSender = ArtnetSender;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXJ0bmV0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2FydG5ldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxpQ0FBNkM7QUFHN0MsSUFBWSxTQUtYO0FBTEQsV0FBWSxTQUFTO0lBQ2pCLGdEQUFlLENBQUE7SUFDZiwwREFBb0IsQ0FBQTtJQUNwQiwrQ0FBYyxDQUFBO0lBQ2QsK0NBQWMsQ0FBQTtBQUNsQixDQUFDLEVBTFcsU0FBUyxHQUFULGlCQUFTLEtBQVQsaUJBQVMsUUFLcEI7QUFFRCxNQUFzQixhQUFhO0lBQW5DO1FBQ0ksT0FBRSxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUUsRUFBRSxDQUFFLENBQUMsR0FBRyxDQUFFLENBQUUsRUFBRSxFQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFFLENBQUMsQ0FBRSxDQUFFLENBQUMsTUFBTSxDQUFFLElBQUksQ0FBRSxDQUFDO1FBQzlFLFdBQU0sR0FBYyxTQUFTLENBQUMsS0FBSyxDQUFDO1FBQ3BDLHdCQUFtQixHQUFHLENBQUMsQ0FBQztRQUN4Qix1QkFBa0IsR0FBRyxFQUFFLENBQUM7SUFtQjVCLENBQUM7SUFqQkcsSUFBSSxNQUFNO1FBQ04sT0FBTyxJQUFJLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBRSxDQUFFLElBQUksQ0FBQyxFQUFFLENBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBRSxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBRSxFQUFFLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxJQUFJLENBQUMsa0JBQWtCLENBQUUsQ0FBRSxDQUFDO0lBQ25JLENBQUM7SUFFRCxJQUFJLE9BQU87UUFDUCxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFFLElBQUksQ0FBQyxJQUFJLENBQUUsQ0FBQztJQUMzQyxDQUFDO0lBSVMsRUFBRSxDQUFFLEtBQWE7UUFDdkIsT0FBTyxDQUFFLEtBQUssSUFBSSxDQUFD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
